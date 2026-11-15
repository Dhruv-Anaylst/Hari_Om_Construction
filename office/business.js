Warning: truncated output (original token count: 9230)
Total output lines: 246

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
    var overdue = state.equipment.filter(function (e) { return e.nextService && e.nextService < todayDate; }).length + state.compliance.filter(function (c) { return c.expiryDate && c.expiryDate < todayDat…2230 tokens truncated… "<div class='field'><label for='biz-paymentMethod'>Payment method</label><select id='biz-paymentMethod' name='paymentMethod'><option>Bank transfer</option><option>UPI</option><option>Cheque</option><option>Cash</option><option>Other</option></select></div>" + field("Reference / transaction ID", "paymentReference", "text", "Optional reference", false), "Save payment");
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
  window.addEventListener("office-sync-section", function (event) {
    if (event.detail && event.detail.section === "business") { state = load(); if (activeView && window.officeActiveModule === "business") render(); }
  });
  if (window.OfficeSync) window.OfficeSync.ready.then(function () { state = load(); if (activeView && window.officeActiveModule === "business") render(); });
})();

