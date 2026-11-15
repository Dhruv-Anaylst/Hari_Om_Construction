(function () {
  "use strict";
  var KEY = "hariom-office-business-v1";
  var content = document.getElementById("office-content");
  var modal = document.getElementById("modal-root");
  var label = document.getElementById("view-label");
  var topAction = document.getElementById("top-action");
  var activeView = "";
  var state = load();

  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) {}
    return {
      suppliers: Array.isArray(saved.suppliers) ? saved.suppliers : [],
      purchaseOrders: Array.isArray(saved.purchaseOrders) ? saved.purchaseOrders : [],
      invoices: Array.isArray(saved.invoices) ? saved.invoices : [],
      timesheets: Array.isArray(saved.timesheets) ? saved.timesheets : [],
      equipment: Array.isArray(saved.equipment) ? saved.equipment : [],
      compliance: Array.isArray(saved.compliance) ? saved.compliance : [],
      reminders: saved.reminders && typeof saved.reminders === "object" ? saved.reminders : { emailEnabled: false, email: "", whatsappEnabled: false, phone: "", daysAhead: 3 }
    };
  }

  function persist(message) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
    if (window.OfficeSync) window.OfficeSync.save("business", state);
    render();
    if (message) notify(message);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
  }
  function money(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dateText(value) { if (!value) return "—"; var d = new Date(value + "T00:00:00"); return isNaN(d.getTime()) ? esc(value) : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d); }
  function id() { return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function notify(message) { var old = document.querySelector(".toast"); if (old) old.remove(); var node = document.createElement("div"); node.className = "toast"; node.textContent = message; document.body.appendChild(node); setTimeout(function () { node.remove(); }, 2800); }
  function projects() { try { var x = JSON.parse(localStorage.getItem("hariom-office-workspace-v1") || "{}"); return Array.isArray(x.projects) ? x.projects : []; } catch (_) { return []; } }
  function projectSelect() { return "<option value=''>General / unassigned</option>" + projects().map(function (p) { return "<option value='" + esc(p.id) + "'>" + esc(p.name) + "</option>"; }).join(""); }
  function projectName(value) { var p = projects().find(function (x) { return x.id === value; }); return p ? p.name : "General / unassigned"; }
  function heading(kicker, title, subtitle, action, text) { return "<div class='page-heading'><div><p class='overline'>" + esc(kicker) + "</p><h1>" + esc(title) + "</h1><p>" + esc(subtitle) + "</p></div>" + (action ? "<button class='primary-button' data-business-action='" + esc(action) + "'>" + esc(text) + "</button>" : "") + "</div>"; }
  function summary(title, value, note, icon) { return "<article class='summary-card'><div class='summary-top'><span>" + esc(title) + "</span><span class='summary-icon'>" + icon + "</span></div><div class='summary-value'>" + esc(value) + "</div><div class='summary-note'>" + esc(note) + "</div></article>"; }
  function csv(rows, filename) { var blob = new Blob([rows.map(function (row) { return row.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n")], { type: "text/csv;charset=utf-8" }); var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }

  function renderProcurement() {
    var supplierRows = state.suppliers.map(function (s) { return "<tr><td><strong>" + esc(s.name) + "</strong><small>" + esc(s.contact || "Contact not set") + " · " + esc(s.gstin || "No GSTIN") + "</small></td><td>" + esc(s.phone || "—") + "</td><td>" + esc(s.email || "—") + "</td><td>" + esc(s.terms || "—") + "</td><td><button class='row-action' data-business-action='delete-supplier' data-id='" + esc(s.id) + "' aria-label='Remove supplier'>×</button></td></tr>"; }).join("");
    var orders = state.purchaseOrders.slice().sort(function (a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); }).map(function (po) { return "<tr><td><strong>" + esc(po.number) + "</strong><small>" + esc(po.item) + " · " + esc(projectName(po.projectId)) + "</small></td><td>" + esc(po.supplierName) + "</td><td>" + dateText(po.orderDate) + "</td><td>" + dateText(po.deliveryDate) + "</td><td>" + money(po.total) + "</td><td><span class='task-state task-state-" + (po.status === "Received" ? "done" : "open") + "'>" + esc(po.status) + "</span></td><td><button class='quiet-button' data-business-action='toggle-po' data-id='" + esc(po.id) + "'>" + (po.status === "Received" ? "Reopen" : "Mark received") + "</button></td></tr>"; }).join("");
    var open = state.purchaseOrders.filter(function (p) { return p.status !== "Received"; }).length;
    return heading("PROCUREMENT", "Suppliers & purchase orders", "Keep supplier details, delivery dates and committed material costs together.", "add-po", "＋ New purchase order") +
      "<div class='summary-grid ops-summary-grid'>" + summary("Suppliers", state.suppliers.length, "Approved contacts", "♙") + summary("Open orders", open, "Awaiting receipt", "▤") + summary("Order value", money(state.purchaseOrders.filter(function (p) { return p.status !== "Received"; }).reduce(function (n, p) { return n + Number(p.total || 0); }, 0)), "Open commitments", "₹") + "</div>" +
      "<section class='panel business-panel'><div class='panel-head'><h2>Supplier directory</h2><button data-business-action='add-supplier'>＋ Add supplier</button></div><div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>Supplier / tax ID</th><th>Phone</th><th>Email</th><th>Payment terms</th><th></th></tr></thead><tbody>" + (supplierRows || "<tr><td colspan='5' class='ops-empty'>Add suppliers to link purchase orders to your regular vendors.</td></tr>") + "</tbody></table></div></section>" +
      "<section class='panel business-panel'><div class='panel-head'><h2>Purchase orders</h2><button data-business-action='export-pos'>EXPORT CSV</button></div><div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>PO / item</th><th>Supplier</th><th>Order date</th><th>Due</th><th>Value</th><th>Status</th><th></th></tr></thead><tbody>" + (orders || "<tr><td colspan='7' class='ops-empty'>No purchase orders yet.</td></tr>") + "</tbody></table></div></section>";
  }

  function renderInvoices() {
    var rows = state.invoices.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }).map(function (inv) {
      var payment = inv.status === "Paid" ? "<small>Paid " + dateText(inv.paidAt) + (inv.paymentMethod ? " · " + esc(inv.paymentMethod) : "") + (inv.paymentReference ? " · Ref " + esc(inv.paymentReference) : "") + "</small>" : "";
      return "<tr><td><strong>" + esc(inv.number) + "</strong><small>" + esc(inv.description) + " · " + esc(inv.gstMode) + " GST</small></td><td>" + esc(inv.client) + "</td><td>" + dateText(inv.date) + "</td><td>" + dateText(inv.dueDate) + "</td><td>" + money(inv.total) + "</td><td><span class='task-state task-state-" + (inv.status === "Paid" ? "done" : "open") + "'>" + esc(inv.status) + "</span>" + payment + "</td><td><button class='quiet-button' data-business-action='print-invoice' data-id='" + esc(inv.id) + "'>Print / PDF</button> <button class='quiet-button' data-business-action='" + (inv.status === "Paid" ? "undo-payment" : "record-payment") + "' data-id='" + esc(inv.id) + "'>" + (inv.status === "Paid" ? "Undo payment" : "Record payment") + "</button></td></tr>";
    }).join("");
    var outstanding = state.invoices.filter(function (i) { return i.status !== "Paid"; }).reduce(function (n, i) { return n + Number(i.total || 0); }, 0);
    return heading("ACCOUNTS RECEIVABLE", "Invoices & payments", "Issue GST-calculated bills, monitor due dates and record payments.", "add-invoice", "＋ Create invoice") +
      "<div class='summary-grid ops-summary-grid'>" + summary("Invoices", state.invoices.length, "Issued in this workspace", "▤") + summary("Outstanding", money(outstanding), "Awaiting payment", "₹") + summary("Paid", state.invoices.filter(function (i) { return i.status === "Paid"; }).length, "Payment recorded", "✓") + "</div>" +
      "<div class='calc-notice'>GST totals are calculated from the rate you enter. Confirm the correct tax treatment and GSTIN details with your accountant before issuing an invoice.</div>" +
      "<div class='ops-table-wrap'><table class='ops-table invoice-table'><thead><tr><th>Invoice / scope</th><th>Client</th><th>Issued</th><th>Due</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>" + (rows || "<tr><td colspan='7' class='ops-empty'>Create an invoice to start tracking receivables.</td></tr>") + "</tbody></table></div>";
  }

  function renderTimesheets() {
    var month = today().slice(0, 7);
    var current = state.timesheets.filter(function (t) { return (t.date || "").slice(0, 7) === month; });
    var wages = current.reduce(function (n, t) { return n + Number(t.wage || 0); }, 0);
    var people = new Set(current.map(function (t) { return t.name; })).size;
    var rows = state.timesheets.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }).map(function (t) { return "<tr><td><strong>" + esc(t.name) + "</strong><small>" + esc(t.role || "Role not set") + " · " + esc(projectName(t.projectId)) + "</small></td><td>" + dateText(t.date) + "</td><td>" + esc(t.hours) + " h</td><td>" + esc(t.overtime || 0) + " h</td><td>" + money(t.rate) + "/h</td><td><strong>" + money(t.wage) + "</strong></td><td><button class='row-action' data-business-action='delete-timesheet' data-id='" + esc(t.id) + "' aria-label='Remove timesheet'>×</button></td></tr>"; }).join("");
    return heading("PEOPLE & PAY", "Labour timesheets", "Record hours by worker and project, then review estimated wages by month.", "add-timesheet", "＋ Add shift") +
      "<div class='summary-grid ops-summary-grid'>" + summary("Hours this month", current.reduce(function (n, t) { return n + Number(t.hours || 0) + Number(t.overtime || 0); }, 0).toFixed(1), "Regular plus overtime", "◷") + summary("Estimated wages", money(wages), "Based on entered hourly rates", "₹") + summary("Workers", people, "With recorded shifts", "♙") + "</div>" +
      "<div class='calc-notice'>Wage amounts are planning totals from the hours and rates entered. They do not calculate statutory deductions, benefits or payroll filings.</div>" +
      "<div class='toolbar'><span class='filter-count'>" + state.timesheets.length + " shift records</span><button class='quiet-button' data-business-action='export-timesheets'>↓ Export CSV</button></div>" +
      "<div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>Worker / project</th><th>Date</th><th>Regular</th><th>Overtime</th><th>Rate</th><th>Estimated wages</th><th></th></tr></thead><tbody>" + (rows || "<tr><td colspan='7' class='ops-empty'>Add shifts to begin the wage summary.</td></tr>") + "</tbody></table></div>";
  }

  function dueTag(date) {
    if (!date) return "<span class='task-date-muted'>Not scheduled</span>";
    if (date < today()) return "<span class='task-date-overdue'>Overdue · " + dateText(date) + "</span>";
    var ahead = new Date(); ahead.setDate(ahead.getDate() + 30);
    var cutoff = ahead.getFullYear() + "-" + String(ahead.getMonth() + 1).padStart(2, "0") + "-" + String(ahead.getDate()).padStart(2, "0");
    return date <= cutoff ? "<span class='task-date-today'>Due " + dateText(date) + "</span>" : dateText(date);
  }

  function renderAssets() {
    var equipmentRows = state.equipment.map(function (e) { return "<tr><td><strong>" + esc(e.name) + "</strong><small>" + esc(e.serial || "No asset ID") + " · " + esc(projectName(e.projectId)) + "</small></td><td>" + dueTag(e.nextService) + "</td><td>" + esc(e.intervalDays || "—") + " days</td><td>" + esc(e.notes || "—") + "</td><td><button class='row-action' data-business-action='delete-equipment' data-id='" + esc(e.id) + "' aria-label='Remove equipment'>×</button></td></tr>"; }).join("");
    var complianceRows = state.compliance.map(function (c) { return "<tr><td><strong>" + esc(c.name) + "</strong><small>" + esc(c.type) + " · " + esc(projectName(c.projectId)) + "</small></td><td>" + dueTag(c.expiryDate) + "</td><td>" + (c.url ? "<a class='document-open' target='_blank' rel='noopener noreferrer' href='" + esc(/^https?:\/\//i.test(c.url) ? c.url : "#") + "'>Open record ↗</a>" : "—") + "</td><td><button class='row-action' data-business-action='delete-compliance' data-id='" + esc(c.id) + "' aria-label='Remove compliance record'>×</button></td></tr>"; }).join("");
    var todayDate = today(), cutoffDate = new Date(); cutoffDate.setDate(cutoffDate.getDate() + 30); var cutoff = cutoffDate.getFullYear() + "-" + String(cutoffDate.getMonth() + 1).padStart(2, "0") + "-" + String(cutoffDate.getDate()).padStart(2, "0");
    var due = state.equipment.filter(function (e) { return e.nextService && e.nextService <= cutoff; }).length + state.compliance.filter(function (c) { return c.expiryDate && c.expiryDate <= cutoff; }).length;
    var overdue = state.equipment.filter(function (e) { return e.nextService && e.nextService < todayDate; }).length + state.compliance.filter(function (c) { return c.expiryDate && c.expiryDate < todayDate; }).length;
    return heading("ASSETS & ASSURANCE", "Equipment & compliance", "Track planned maintenance and renewals for permits, insurance and certificates.", "add-equipment", "＋ Add equipment") +
      "<div class='summary-grid ops-summary-grid'>" + summary("Equipment", state.equipment.length, "Tracked assets", "⚙") + summary("Due within 30 days", due, "Service and renewal dates", "◷") + summary("Overdue", overdue, "Needs review", "!") + "</div>" +
      "<section class='panel business-panel'><div class='panel-head'><h2>Equipment maintenance</h2><button data-business-action='add-equipment'>＋ Add asset</button></div><div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>Asset / project</th><th>Next service</th><th>Service interval</th><th>Notes</th><th></th></tr></thead><tbody>" + (equipmentRows || "<tr><td colspan='5' class='ops-empty'>Add equipment and its next service date.</td></tr>") + "</tbody></table></div></section>" +
      "<section class='panel business-panel'><div class='panel-head'><h2>Permits, insurance & certificates</h2><button data-business-action='add-compliance'>＋ Add record</button></div><div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>Record / project</th><th>Expiry / review</th><th>File</th><th></th></tr></thead><tbody>" + (complianceRows || "<tr><td colspan='4' class='ops-empty'>Add compliance dates to track upcoming renewals.</td></tr>") + "</tbody></table></div></section>";
  }

  function reminderItems() {
    var ops = {}; try { ops = JSON.parse(localStorage.getItem("hariom-office-operations-v1") || "{}"); } catch (_) {}
    var items = [];
    (Array.isArray(ops.tasks) ? ops.tasks : []).forEach(function (t) { if (t.status !== "Done" && t.dueDate) items.push({ type: "Task", name: t.title, date: t.dueDate, detail: t.assignee || "Unassigned" }); });
    state.purchaseOrders.filter(function (p) { return p.status !== "Received" && p.deliveryDate; }).forEach(function (p) { items.push({ type: "Purchase order", name: p.number + " · " + p.item, date: p.deliveryDate, detail: p.supplierName || "Supplier not set" }); });
    state.equipment.forEach(function (e) { if (e.nextService) items.push({ type: "Maintenance", name: e.name, date: e.nextService, detail: "Equipment service" }); });
    state.compliance.forEach(function (c) { if (c.expiryDate) items.push({ type: "Renewal", name: c.name, date: c.expiryDate, detail: c.type }); });
    state.invoices.filter(function (i) { return i.status !== "Paid" && i.dueDate; }).forEach(function (i) { items.push({ type: "Invoice", name: i.number + " · " + i.client, date: i.dueDate, detail: money(i.total) }); });
    return items.filter(function (i) { return i.date <= addDays(today(), 30); }).sort(function (a, b) { return a.date.localeCompare(b.date); });
  }
  function addDays(value, days) { var date = new Date(value + "T00:00:00"); date.setDate(date.getDate() + days); return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0"); }

  function renderReminders() {
    var prefs = state.reminders;
    var due = reminderItems();
    var rows = due.map(function (x) { return "<tr><td><span class='stock-tag'>" + esc(x.type) + "</span></td><td><strong>" + esc(x.name) + "</strong><small>" + esc(x.detail) + "</small></td><td>" + dueTag(x.date) + "</td></tr>"; }).join("");
    return heading("FOLLOW-UPS", "Reminders", "See upcoming work, maintenance, renewals and receivables in one place.", "", "") +
      "<div class='summary-grid ops-summary-grid'>" + summary("Due in 30 days", due.length, "Across your office registers", "◷") + summary("Email recipient", prefs.emailEnabled && prefs.email ? "Set" : "Not set", "Sender connection pending", "✉") + summary("WhatsApp recipient", prefs.whatsappEnabled && prefs.phone ? "Set" : "Not set", "Business sender pending", "◉") + "</div>" +
      "<div class='reminder-setup panel'><div class='panel-head'><h2>Reminder preferences</h2><span class='stock-tag'>Daily schedule · India time</span></div><form class='modal-form reminder-form' data-business-form='reminders'><div class='form-grid'>" +
      "<div class='field full'><label class='check-field'><input type='checkbox' name='emailEnabled' " + (prefs.emailEnabled ? "checked" : "") + "> Email reminders</label><input type='email' name='email' value='" + esc(prefs.email || "") + "' placeholder='name@example.com'></div>" +
      "<div class='field full'><label class='check-field'><input type='checkbox' name='whatsappEnabled' " + (prefs.whatsappEnabled ? "checked" : "") + "> WhatsApp reminders</label><input type='tel' name='phone' value='" + esc(prefs.phone || "") + "' placeholder='+91 98765 43210'><small class='field-hint'>Use an international phone format. The WhatsApp sender must be enabled by Meta or your provider.</small></div>" +
      "<div class='field'><label for='reminder-ahead'>Send reminders this many days ahead</label><select id='reminder-ahead' name='daysAhead'><option value='1' " + (Number(prefs.daysAhead) === 1 ? "selected" : "") + ">1 day</option><option value='3' " + (Number(prefs.daysAhead) === 3 ? "selected" : "") + ">3 days</option><option value='7' " + (Number(prefs.daysAhead) === 7 ? "selected" : "") + ">7 days</option><option value='14' " + (Number(prefs.daysAhead) === 14 ? "selected" : "") + ">14 days</option></select></div>" +
      "<div class='field'><label>Delivery connection</label><span class='connection-state'>Credentials not configured · Scheduled reminders will start after a sender is connected.</span></div></div><div class='form-actions'><button class='primary-button' type='submit'>Save reminder settings</button></div></form><p class='provider-note'>Email uses Resend secrets <code>RESEND_API_KEY</code> and <code>REMINDER_FROM_EMAIL</code>. WhatsApp uses Meta Cloud API secrets <code>WHATSAPP_API_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code> and an approved template name. Add them as Cloudflare Worker secrets; the app never stores API keys in browser data.</p></div>" +
      "<section class='panel business-panel'><div class='panel-head'><h2>Upcoming reminders</h2><button data-business-action='export-reminders'>EXPORT CSV</button></div><div class='ops-table-wrap'><table class='ops-table'><thead><tr><th>Type</th><th>Action</th><th>Due</th></tr></thead><tbody>" + (rows || "<tr><td colspan='3' class='ops-empty'>Nothing is due in the next 30 days.</td></tr>") + "</tbody></table></div></section>";
  }

  var reportMonth = today().slice(0, 7);
  function reportData() {
    var ops = {}; try { ops = JSON.parse(localStorage.getItem("hariom-office-operations-v1") || "{}"); } catch (_) {}
    var buckets = Object.create(null), totals = { invoiced: 0, collected: 0, receivable: 0, expenses: 0, wages: 0, orders: 0 };
    function bucket(key, name, budget) {
      var idKey = key || "general";
      if (!buckets[idKey]) buckets[idKey] = { id: idKey, name: name || "General / unassigned", budget: Number(budget) || 0, invoiced: 0, collected: 0, receivable: 0, expenses: 0, wages: 0, orders: 0 };
      if (budget) buckets[idKey].budget = Number(budget) || 0;
      return buckets[idKey];
    }
    projects().forEach(function (project) { bucket(project.id, project.name, project.budget); });
    state.invoices.forEach(function (invoice) {
      var row = bucket(invoice.projectId, projectName(invoice.projectId));
      if ((invoice.date || "").slice(0, 7) === reportMonth) { row.invoiced += Number(invoice.total) || 0; totals.invoiced += Number(invoice.total) || 0; }
      if (invoice.status === "Paid" && (invoice.paidAt || "").slice(0, 7) === reportMonth) { row.collected += Number(invoice.total) || 0; totals.collected += Number(invoice.total) || 0; }
      if (invoice.status !== "Paid") { row.receivable += Number(invoice.total) || 0; totals.receivable += Number(invoice.total) || 0; }
    });
    (Array.isArray(ops.expenses) ? ops.expenses : []).forEach(function (expense) {
      if ((expense.date || "").slice(0, 7) !== reportMonth) return;
      var project = projects().find(function (item) { return item.name === expense.project; });
      var row = bucket(project && project.id, expense.project || "General / unassigned", project && project.budget);
      row.expenses += Number(expense.amount) || 0; totals.expenses += Number(expense.amount) || 0;
    });
    state.timesheets.forEach(function (shift) {
      if ((shift.date || "").slice(0, 7) !== reportMonth) return;
      var row = bucket(shift.projectId, projectName(shift.projectId));
      row.wages += Number(shift.wage) || 0; totals.wages += Number(shift.wage) || 0;
    });
    state.purchaseOrders.forEach(function (order) {
      if ((order.orderDate || "").slice(0, 7) !== reportMonth) return;
      var row = bucket(order.projectId, projectName(order.projectId));
      row.orders += Number(order.total) || 0; totals.orders += Number(order.total) || 0;
    });
    return { rows: Object.keys(buckets).map(function (key) { return buckets[key]; }).filter(function (row) { return row.budget || row.invoiced || row.collected || row.receivable || row.expenses || row.wages || row.orders; }).sort(function (a, b) { return a.name.localeCompare(b.name); }), totals: totals };
  }
  function renderCashflow() {
    var data = reportData(), rows = data.rows.map(function (row) {
      return "<tr><td><strong>" + esc(row.name) + "</strong></td><td>" + (row.budget ? money(row.budget) : "—") + "</td><td>" + money(row.invoiced) + "</td><td>" + money(row.collected) + "</td><td>" + money(row.receivable) + "</td><td>" + money(row.expenses) + "</td><td>" + money(row.wages) + "</td><td>" + money(row.orders) + "</td></tr>";
    }).join("");
    var totals = data.totals;
    return heading("FINANCE", "Project cost & cash report", "Review project billings, collections, receivables and tracked costs by month.", "", "") +
      "<div class='toolbar report-toolbar'><label for='cash-report-month'>Reporting month</label><input id='cash-report-month' type='month' value='" + esc(reportMonth) + "'><button class='quiet-button' data-business-action='export-cashflow'>↓ Export CSV</button></div>" +
      "<div class='summary-grid ops-summary-grid'>" + summary("Invoiced this month", money(totals.invoiced), "Invoices dated in period", "▤") + summary("Collected this month", money(totals.collected), "Payments recorded in period", "₹") + summary("Outstanding receivables", money(totals.receivable), "All unpaid invoices", "◷") + summary("Tracked spend", money(totals.expenses + totals.wages), "Expenses plus wage estimates", "↓") + "</div>" +
      "<div class='calc-notice'>Amounts come from saved workspace records. Labour uses entered hourly rates. Purchase orders are shown separately and may also appear in expenses if entered there; this report is for office monitoring, not statutory accounts.</div>" +
      "<section class='panel business-panel'><div class='panel-head'><h2>Project breakdown</h2><span class='stock-tag'>" + esc(reportMonth) + "</span></div><div class='ops-table-wrap'><table class='ops-table cashflow-table'><thead><tr><th>Project / site</th><th>Agreed budget</th><th>Invoiced</th><th>Collected</th><th>Outstanding</th><th>Expenses</th><th>Labour estimate</th><th>PO value</th></tr></thead><tbody>" + (rows || "<tr><td colspan='8' class='ops-empty'>No financial records for this month yet. Add invoices, expenses, timesheets or purchase orders to build the report.</td></tr>") + "</tbody></table></div></section>";
  }

  function render() {
    if (!activeView) return;
    var views = { procurement: renderProcurement, invoices: renderInvoices, timesheets: renderTimesheets, assets: renderAssets, reminders: renderReminders, cashflow: renderCashflow };
    content.innerHTML = views[activeView]();
  }
  function setView(name) {
    activeView = name;
    window.officeActiveModule = "business";
    document.querySelectorAll(".side-link").forEach(function (node) { node.classList.toggle("active", node.getAttribute("data-business-view") === name); });
    label.textContent = { procurement: "Suppliers & purchase orders", invoices: "Invoices & payments", timesheets: "Labour timesheets", assets: "Equipment & compliance", reminders: "Reminders", cashflow: "Project cost reports" }[name];
    topAction.hidden = true;
    render();
  }
  function openModal(title, body) {
    modal.innerHTML = "<div class='modal-backdrop'><section class='modal wide' role='dialog' aria-modal='true' aria-label='" + esc(title) + "'><header class='modal-head'><h2>" + esc(title) + "</h2><button class='close-button' data-business-action='close-modal' aria-label='Close'>×</button></header>" + body + "</section></div>";
    var input = modal.querySelector("input,select,textarea"); if (input) input.focus();
  }
  function field(labelText, name, type, placeholder, required, value) { return "<div class='field'><label for='biz-" + esc(name) + "'>" + esc(labelText) + "</label><input id='biz-" + esc(name) + "' name='" + esc(name) + "' type='" + type + "' placeholder='" + esc(placeholder || "") + "'" + (required ? " required" : "") + (value != null ? " value='" + esc(value) + "'" : "") + "></div>"; }
  function projectField() { return "<div class='field'><label for='biz-projectId'>Project / site</label><select id='biz-projectId' name='projectId'>" + projectSelect() + "</select></div>"; }
  function form(title, kind, fields, saveText) { openModal(title, "<form class='modal-form' data-business-form='" + kind + "'><div class='form-grid'>" + fields + "</div><div class='form-actions'><button type='button' class='quiet-button' data-business-action='close-modal'>Cancel</button><button class='primary-button' type='submit'>" + esc(saveText) + "</button></div></form>"); }
  function recordPayment(invoice) {
    form("Record invoice payment · " + invoice.number, "payment", "<input type='hidden' name='invoiceId' value='" + esc(invoice.id) + "'>" + field("Payment date", "paidAt", "date", "", true, today()) + "<div class='field'><label for='biz-paymentMethod'>Payment method</label><select id='biz-paymentMethod' name='paymentMethod'><option>Bank transfer</option><option>UPI</option><option>Cheque</option><option>Cash</option><option>Other</option></select></div>" + field("Reference / transaction ID", "paymentReference", "text", "Optional reference", false), "Save payment");
  }
  function addSupplier() {
    form("Add supplier", "supplier", field("Supplier / company name", "name", "text", "Company name", true) + field("Contact person", "contact", "text", "Name", false) + field("Phone", "phone", "tel", "+91", false) + field("Email", "email", "email", "accounts@example.com", false) + field("GSTIN", "gstin", "text", "15-character GSTIN", false) + field("Payment terms", "terms", "text", "e.g. Net 30 days", false), "Save supplier");
  }
  function addPo() {
    var options = "<option value=''>Choose supplier</option>" + state.suppliers.map(function (s) { return "<option value='" + esc(s.id) + "'>" + esc(s.name) + "</option>"; }).join("");
    form("New purchase order", "po", "<div class='field'><label for='biz-supplierId'>Supplier</label><select id='biz-supplierId' name='supplierId' required>" + options + "</select></div>" + projectField() + field("Item / scope", "item", "text", "Material or service", true) + field("Quantity", "quantity", "number", "0", true, "1") + field("Rate (₹)", "rate", "number", "0.00", true) + field("Order date", "orderDate", "date", "", true, today()) + field("Expected delivery", "deliveryDate", "date", "", false) + "<div class='field'><label for='biz-notes'>Notes</label><textarea id='biz-notes' name='notes' placeholder='Reference or delivery instructions'></textarea></div>", "Save purchase order");
  }
  function addInvoice() {
    form("Create GST invoice", "invoice", field("Client / bill to", "client", "text", "Client name", true) + field("Invoice title / work", "description", "text", "Work description", true) + projectField() + field("Invoice date", "date", "date", "", true, today()) + field("Payment due date", "dueDate", "date", "", true, addDays(today(), 30)) + field("Taxable amount (₹)", "subtotal", "number", "0.00", true) + "<div class='field'><label for='biz-gst'>GST rate</label><select id='biz-gst' name='gst'><option value='0'>0%</option><option value='5'>5%</option><option value='12'>12%</option><option selected value='18'>18%</option><option value='28'>28%</option></select></div><div class='field'><label for='biz-gstMode'>GST treatment</label><select id='biz-gstMode' name='gstMode'><option>CGST + SGST</option><option>IGST</option></select></div>" + field("GSTIN (optional)", "gstin", "text", "Client GSTIN", false) + "<div class='field full'><label for='biz-terms'>Payment terms / bank reference</label><textarea id='biz-terms' name='terms' placeholder='Payment instructions or terms'></textarea></div>", "Save invoice");
  }
  function addTimesheet() {
    form("Add labour shift", "timesheet", field("Worker name", "name", "text", "Full name", true) + field("Role / trade", "role", "text", "e.g. fitter, driver", false) + projectField() + field("Shift date", "date", "date", "", true, today()) + field("Regular hours", "hours", "number", "0", true, "8") + field("Overtime hours", "overtime", "number", "0", false, "0") + field("Hourly rate (₹)", "rate", "number", "0.00", true) + field("Overtime multiplier", "multiplier", "number", "1.5", false, "1.5"), "Save shift");
  }
  function addEquipment() {
    form("Add equipment", "equipment", field("Equipment / vehicle", "name", "text", "e.g. Excavator 20T", true) + field("Asset or serial number", "serial", "text", "Fleet ID or serial", false) + projectField() + field("Next service date", "nextService", "date", "", false) + field("Service interval (days)", "intervalDays", "number", "90", false) + "<div class='field full'><label for='biz-notes'>Maintenance notes</label><textarea id='biz-notes' name='notes' placeholder='Last service, supplier or checks'></textarea></div>", "Save equipment");
  }
  function addCompliance() {
    form("Add compliance record", "compliance", field("Record / certificate", "name", "text", "e.g. Vehicle insurance", true) + "<div class='field'><label for='biz-type'>Type</label><select id='biz-type' name='type'><option>Permit / licence</option><option>Insurance</option><option>Test certificate</option><option>Contract</option><option>Other</option></select></div>" + projectField() + field("Expiry / review date", "expiryDate", "date", "", false) + field("Document link", "url", "url", "https://...", false) + "<div class='field full'><label for='biz-notes'>Notes</label><textarea id='biz-notes' name='notes'></textarea></div>", "Save record");
  }

  function saveForm(formNode, kind) {
    var data = new FormData(formNode);
    function val(key) { return String(data.get(key) || "").trim(); }
    if (kind === "supplier") state.suppliers.unshift({ id: id(), name: val("name"), contact: val("contact"), phone: val("phone"), email: val("email"), gstin: val("gstin").toUpperCase(), terms: val("terms") });
    if (kind === "po") {
      var supplier = state.suppliers.find(function (s) { return s.id === val("supplierId"); });
      if (!supplier) { notify("Add a supplier before creating a purchase order."); return; }
      var total = (Number(val("quantity")) || 0) * (Number(val("rate")) || 0);
      state.purchaseOrders.unshift({ id: id(), number: "HOC-PO-" + new Date().getFullYear() + "-" + String(state.purchaseOrders.length + 1).padStart(3, "0"), supplierId: supplier.id, supplierName: supplier.name, projectId: val("projectId"), item: val("item"), quantity: Number(val("quantity")) || 0, rate: Number(val("rate")) || 0, total: total, orderDate: val("orderDate"), deliveryDate: val("deliveryDate"), notes: val("notes"), status: "Open", createdAt: new Date().toISOString() });
    }
    if (kind === "invoice") {
      var subtotal = Number(val("subtotal")) || 0, gst = Number(val("gst")) || 0, tax = subtotal * gst / 100;
      state.invoices.unshift({ id: id(), number: "HOC-INV-" + new Date().getFullYear() + "-" + String(state.invoices.length + 1).padStart(3, "0"), client: val("client"), description: val("description"), projectId: val("projectId"), date: val("date"), dueDate: val("dueDate"), subtotal: subtotal, gst: gst, gstMode: val("gstMode"), cgst: val("gstMode") === "IGST" ? 0 : tax / 2, sgst: val("gstMode") === "IGST" ? 0 : tax / 2, igst: val("gstMode") === "IGST" ? tax : 0, total: subtotal + tax, gstin: val("gstin").toUpperCase(), terms: val("terms"), status: "Unpaid" });
    }
    if (kind === "payment") {
      var invoice = state.invoices.find(function (item) { return item.id === val("invoiceId"); });
      if (!invoice) { notify("This invoice could not be found."); return; }
      invoice.status = "Paid"; invoice.paidAt = val("paidAt"); invoice.paymentMethod = val("paymentMethod"); invoice.paymentReference = val("paymentReference");
    }
    if (kind === "timesheet") {
      var hours = Number(val("hours")) || 0, overtime = Number(val("overtime")) || 0, rate = Number(val("rate")) || 0, multiplier = Number(val("multiplier")) || 1.5;
      state.timesheets.unshift({ id: id(), name: val("name"), role: val("role"), projectId: val("projectId"), date: val("date"), hours: hours, overtime: overtime, rate: rate, multiplier: multiplier, wage: hours * rate + overtime * rate * multiplier });
    }
    if (kind === "equipment") state.equipment.unshift({ id: id(), name: val("name"), serial: val("serial"), projectId: val("projectId"), nextService: val("nextService"), intervalDays: val("intervalDays"), notes: val("notes") });
    if (kind === "compliance") state.compliance.unshift({ id: id(), name: val("name"), type: val("type"), projectId: val("projectId"), expiryDate: val("expiryDate"), url: val("url"), notes: val("notes") });
    modal.innerHTML = "";
    persist(kind === "invoice" ? "Invoice saved." : kind === "po" ? "Purchase order saved." : kind === "timesheet" ? "Shift saved." : kind === "payment" ? "Payment recorded." : "Record saved.");
  }

  function handleAction(action, target) {
    var itemId = target.getAttribute("data-id");
    if (action === "close-modal") modal.innerHTML = "";
    else if (action === "add-supplier") addSupplier(); else if (action === "add-po") addPo(); else if (action === "add-invoice") addInvoice(); else if (action === "add-timesheet") addTimesheet(); else if (action === "add-equipment") addEquipment(); else if (action === "add-compliance") addCompliance();
    else if (action === "toggle-po") { var po = state.purchaseOrders.find(function (p) { return p.id === itemId; }); if (po) { po.status = po.status === "Received" ? "Open" : "Received"; persist("Purchase order updated."); } }
    else if (action === "record-payment") { var invoiceToPay = state.invoices.find(function (i) { return i.id === itemId; }); if (invoiceToPay) recordPayment(invoiceToPay); }
    else if (action === "undo-payment") { var paidInvoice = state.invoices.find(function (i) { return i.id === itemId; }); if (paidInvoice) { paidInvoice.status = "Unpaid"; paidInvoice.paidAt = ""; paidInvoice.paymentMethod = ""; paidInvoice.paymentReference = ""; persist("Payment status reversed."); } }
    else if (action === "delete-supplier" && window.confirm("Remove this supplier record?")) { state.suppliers = state.suppliers.filter(function (s) { return s.id !== itemId; }); persist("Supplier removed."); }
    else if (action === "delete-timesheet" && window.confirm("Remove this shift record?")) { state.timesheets = state.timesheets.filter(function (s) { return s.id !== itemId; }); persist("Shift removed."); }
    else if (action === "delete-equipment" && window.confirm("Remove this equipment record?")) { state.equipment = state.equipment.filter(function (s) { return s.id !== itemId; }); persist("Equipment record removed."); }
    else if (action === "delete-compliance" && window.confirm("Remove this compliance record?")) { state.compliance = state.compliance.filter(function (s) { return s.id !== itemId; }); persist("Compliance record removed."); }
    else if (action === "export-pos") csv([["PO","Supplier","Item","Project","Quantity","Rate INR","Total INR","Order date","Delivery date","Status"]].concat(state.purchaseOrders.map(function (p) { return [p.number, p.supplierName, p.item, projectName(p.projectId), p.quantity, p.rate, p.total, p.orderDate, p.deliveryDate, p.status]; })), "hari-om-purchase-orders.csv");
    else if (action === "export-timesheets") csv([["Worker","Role","Project","Date","Hours","Overtime","Rate INR/hr","Estimated wage INR"]].concat(state.timesheets.map(function (t) { return [t.name, t.role, projectName(t.projectId), t.date, t.hours, t.overtime, t.rate, t.wage]; })), "hari-om-labour-timesheets.csv");
    else if (action === "export-reminders") csv([["Type","Action","Due date","Details"]].concat(reminderItems().map(function (x) { return [x.type, x.name, x.date, x.detail]; })), "hari-om-reminders.csv");
    else if (action === "export-cashflow") { var report = reportData(); csv([["Project","Agreed budget INR","Invoiced INR","Collected INR","Outstanding INR","Expenses INR","Labour estimate INR","Purchase orders INR"]].concat(report.rows.map(function (r) { return [r.name, r.budget, r.invoiced, r.collected, r.receivable, r.expenses, r.wages, r.orders]; })), "hari-om-project-cost-report-" + reportMonth + ".csv"); }
    else if (action === "print-invoice") printInvoice(state.invoices.find(function (i) { return i.id === itemId; }));
  }

  function printInvoice(inv) {
    if (!inv) return;
    var popup = window.open("", "_blank");
    if (!popup) { notify("Allow pop-ups to print the invoice."); return; }
    popup.document.write("<!doctype html><html><head><meta charset='utf-8'><title>" + esc(inv.number) + "</title><style>body{font:14px Arial,sans-serif;max-width:800px;margin:45px auto;color:#172925}h1{font-size:24px}.muted{color:#65736a}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}.total{font-size:20px;font-weight:bold}</style></head><body><p class='muted'>HARI OM CONSTRUCTION</p><h1>Tax invoice</h1><div class='row'><b>Invoice</b><span>" + esc(inv.number) + "</span></div><div class='row'><b>Bill to</b><span>" + esc(inv.client) + "</span></div><div class='row'><b>Scope</b><span>" + esc(inv.description) + "</span></div><div class='row'><b>Invoice date</b><span>" + esc(dateText(inv.date)) + "</span></div><div class='row'><b>Due date</b><span>" + esc(dateText(inv.dueDate)) + "</span></div><div class='row'><b>Taxable amount</b><span>" + esc(money(inv.subtotal)) + "</span></div><div class='row'><b>GST (" + esc(inv.gst) + "%) · " + esc(inv.gstMode) + "</b><span>" + esc(money(inv.total - inv.subtotal)) + "</span></div><div class='row total'><b>Total due</b><span>" + esc(money(inv.total)) + "</span></div><p>" + esc(inv.terms || "") + "</p><p class='muted'>Confirm required statutory invoice details before issue.</p><script>window.onload=function(){window.print()}</script></body></html>");
    popup.document.close();
  }

  document.addEventListener("click", function (event) {
    var nav = event.target.closest("[data-business-view]");
    if (nav) { event.preventDefault(); setView(nav.getAttribute("data-business-view")); return; }
    var button = event.target.closest("[data-business-action]");
    if (button) handleAction(button.getAttribute("data-business-action"), button);
  });
  document.addEventListener("submit", function (event) {
    var kind = event.target.getAttribute("data-business-form");
    if (!kind) return;
    event.preventDefault();
    if (kind === "reminders") {
      var f = new FormData(event.target);
      state.reminders = { emailEnabled: f.has("emailEnabled"), email: String(f.get("email") || "").trim(), whatsappEnabled: f.has("whatsappEnabled"), phone: String(f.get("phone") || "").trim(), daysAhead: Number(f.get("daysAhead")) || 3 };
      persist("Reminder preferences saved.");
    } else saveForm(event.target, kind);
  });
  content.addEventListener("change", function (event) { if (event.target.id === "cash-report-month" && event.target.value) { reportMonth = event.target.value; render(); } });
  window.addEventListener("office-sync-section", function (event) {
    if (event.detail && ["business", "workspace", "operations"].includes(event.detail.section)) { state = load(); if (activeView && window.officeActiveModule === "business" && (event.detail.section === "business" || activeView === "cashflow")) render(); }
  });
  if (window.OfficeSync) window.OfficeSync.ready.then(function () { state = load(); if (activeView && window.officeActiveModule === "business") render(); });
})();
