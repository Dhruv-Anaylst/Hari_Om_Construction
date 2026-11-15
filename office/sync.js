(function () {
  "use strict";
  var META_KEY = "hariom-office-sync-meta-v1";
  var sections = {
    workspace: "hariom-office-workspace-v1",
    operations: "hariom-office-operations-v1",
    business: "hariom-office-business-v1"
  };
  var versions = {};
  var pending = {};
  var queues = {};
  var online = /^https?:$/.test(location.protocol);
  var statusNode = document.getElementById("sync-status");

  function showStatus(message, state) {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.className = "sync-status" + (state ? " sync-status-" + state : "");
    statusNode.setAttribute("role", "status");
  }

  function readJson(value, fallback) {
    try { return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; }
  }

  function readMeta() { return readJson(localStorage.getItem(META_KEY), { pending: {} }); }
  function writeMeta(meta) {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (_) {}
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  async function getRemote() {
    var response = await fetch("/api/state", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Workspace sync is unavailable.");
    return response.json();
  }

  async function sendSection(section, key, data) {
    var response = await fetch("/api/state", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: section, data: data })
    });
    if (!response.ok) throw new Error("Could not sync this section.");
    var saved = await response.json();
    versions[section] = saved.version;
    var meta = readMeta();
    meta.pending = meta.pending || {};
    meta.pending[section] = false;
    writeMeta(meta);
    pending[section] = false;
    showStatus("Cloud data synced", "ok");
  }

  function save(section, data) {
    var key = sections[section];
    if (!key) return Promise.reject(new Error("Unknown workspace section."));
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
    if (!online) {
      showStatus("Local preview — cloud sync starts on the live site", "offline");
      return Promise.resolve();
    }
    pending[section] = true;
    var meta = readMeta();
    meta.pending = meta.pending || {};
    meta.pending[section] = true;
    writeMeta(meta);
    showStatus("Syncing to your private workspace…", "busy");
    queues[section] = (queues[section] || Promise.resolve()).catch(function () {}).then(function () {
      var latest = readJson(localStorage.getItem(key), data);
      return sendSection(section, key, latest);
    }).catch(function () {
      showStatus("Offline — changes are saved here and will retry", "offline");
      window.setTimeout(function () { retrySection(section); }, 5000);
    });
    return queues[section];
  }

  function retrySection(section) {
    var key = sections[section];
    if (!key || !pending[section]) return;
    var data = readJson(localStorage.getItem(key), null);
    if (data) save(section, data);
  }

  async function hydrate() {
    if (!online) {
      showStatus("Local preview — cloud sync starts on the live site", "offline");
      return;
    }
    showStatus("Connecting to your private workspace…", "busy");
    try {
      var remote = await getRemote();
      var meta = readMeta();
      meta.pending = meta.pending || {};
      for (var section of Object.keys(sections)) {
        var key = sections[section];
        var local = readJson(localStorage.getItem(key), null);
        var saved = remote.sections && remote.sections[section];
        if (meta.pending[section] && local) {
          pending[section] = true;
          await sendSection(section, key, local);
        } else if (saved && saved.data && typeof saved.data === "object") {
          versions[section] = saved.version;
          pending[section] = false;
          try { localStorage.setItem(key, JSON.stringify(saved.data)); } catch (_) {}
        } else if (local) {
          pending[section] = true;
          await sendSection(section, key, local);
        } else {
          pending[section] = false;
        }
      }
      showStatus("Cloud data synced", "ok");
      emit("office-sync-ready", {});
    } catch (_) {
      showStatus("Offline — changes are saved here and will retry", "offline");
      emit("office-sync-ready", { offline: true });
    }
  }

  async function poll() {
    if (!online || document.hidden || Object.values(pending).some(Boolean)) return;
    try {
      var remote = await getRemote();
      for (var section of Object.keys(sections)) {
        var saved = remote.sections && remote.sections[section];
        if (!saved || Number(saved.version) <= Number(versions[section] || 0) || pending[section]) continue;
        versions[section] = saved.version;
        localStorage.setItem(sections[section], JSON.stringify(saved.data));
        emit("office-sync-section", { section: section, data: saved.data });
      }
    } catch (_) {
      showStatus("Reconnecting to cloud data…", "offline");
    }
  }

  async function compressPhoto(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
    if (!window.createImageBitmap) {
      if (file.size <= 350000) return file;
      throw new Error("This browser cannot resize large photos. Choose a smaller file.");
    }
    var bitmap = await createImageBitmap(file);
    var scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
    var canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    var quality = 0.76;
    var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, "image/webp", quality); });
    while (blob && blob.size > 350000 && quality > 0.4) {
      quality -= 0.1;
      blob = await new Promise(function (resolve) { canvas.toBlob(resolve, "image/webp", quality); });
    }
    if (!blob || blob.size > 350000) throw new Error("This photo is too large to store. Choose another image.");
    return new File([blob], (file.name || "site-photo").replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  }

  async function uploadPhoto(file, reportId) {
    var compressed = await compressPhoto(file);
    var form = new FormData();
    form.append("photo", compressed);
    form.append("reportId", reportId);
    var response = await fetch("/api/photos", { method: "POST", credentials: "same-origin", body: form });
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || "Photo upload failed.");
    return result;
  }

  window.OfficeSync = {
    ready: hydrate(),
    save: save,
    uploadPhoto: uploadPhoto,
    photoUrl: function (id) { return "/api/photos?id=" + encodeURIComponent(id); },
    getStatus: function () { return { versions: versions, pending: pending }; }
  };
  if (online) window.setInterval(poll, 20000);
})();

