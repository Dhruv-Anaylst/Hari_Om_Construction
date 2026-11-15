const OFFICE_EMAIL = "dhruvagnihotri21@gmail.com";
const GRAPH_VERSION = "v27.0";

function istDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date, count) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + count)).toISOString().slice(0, 10);
}

function parsePayload(row) {
  try { return JSON.parse(row.payload); } catch { return {}; }
}

function collectItems(operations, business, cutoff) {
  const items = [];
  for (const task of Array.isArray(operations.tasks) ? operations.tasks : []) {
    if (task.status !== "Done" && task.dueDate && task.dueDate <= cutoff) {
      items.push({ type: "Task", name: task.title || "Follow-up", date: task.dueDate, detail: task.assignee || "Unassigned" });
    }
  }
  for (const po of Array.isArray(business.purchaseOrders) ? business.purchaseOrders : []) {
    if (po.status !== "Received" && po.deliveryDate && po.deliveryDate <= cutoff) {
      items.push({ type: "Purchase order", name: `${po.number || "PO"} · ${po.item || "Delivery"}`, date: po.deliveryDate, detail: po.supplierName || "Supplier not set" });
    }
  }
  for (const item of Array.isArray(business.equipment) ? business.equipment : []) {
    if (item.nextService && item.nextService <= cutoff) {
      items.push({ type: "Maintenance", name: item.name || "Equipment", date: item.nextService, detail: item.serial || "Scheduled service" });
    }
  }
  for (const item of Array.isArray(business.compliance) ? business.compliance : []) {
    if (item.expiryDate && item.expiryDate <= cutoff) {
      items.push({ type: "Renewal", name: item.name || "Compliance record", date: item.expiryDate, detail: item.type || "Review" });
    }
  }
  for (const invoice of Array.isArray(business.invoices) ? business.invoices : []) {
    if (invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate <= cutoff) {
      items.push({ type: "Invoice", name: `${invoice.number || "Invoice"} · ${invoice.client || "Client"}`, date: invoice.dueDate, detail: `Outstanding ₹${Number(invoice.total || 0).toLocaleString("en-IN")}` });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

async function wasSent(db, channel, date) {
  return db.prepare(
    "SELECT 1 AS sent FROM office_reminder_log WHERE user_email = ? AND reminder_key = ? AND channel = ?"
  ).bind(OFFICE_EMAIL, `daily:${date}`, channel).first();
}

async function markSent(db, channel, date) {
  await db.prepare(
    "INSERT OR IGNORE INTO office_reminder_log (user_email, reminder_key, channel) VALUES (?, ?, ?)"
  ).bind(OFFICE_EMAIL, `daily:${date}`, channel).run();
}

function digestText(date, items) {
  return [
    `Hari Om Construction office reminders for ${date}`,
    ...items.map((item) => `• ${item.type}: ${item.name} — due ${item.date}${item.detail ? ` · ${item.detail}` : ""}`),
    "Open https://tools.hariomconstruction.in to review your office workspace."
  ].join("\n");
}

async function sendEmail(env, to, date, text) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.REMINDER_FROM_EMAIL, to: [to], subject: `Hari Om office reminders · ${date}`, text })
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}.`);
}

async function sendWhatsApp(env, to, text) {
  const version = env.WHATSAPP_API_VERSION || GRAPH_VERSION;
  const templateName = env.WHATSAPP_TEMPLATE_NAME;
  const language = env.WHATSAPP_LANGUAGE || "en_US";
  const response = await fetch(`https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: [{ type: "body", parameters: [{ type: "text", text: text.slice(0, 950) }] }]
      }
    })
  });
  if (!response.ok) throw new Error(`WhatsApp Cloud API returned ${response.status}.`);
}

async function runDailyReminders(env) {
  if (!env.DB) return;
  const rows = await env.DB.prepare(
    "SELECT section, payload FROM office_state WHERE user_email = ? AND section IN ('operations', 'business')"
  ).bind(OFFICE_EMAIL).all();
  const payloads = Object.fromEntries((rows.results || []).map((row) => [row.section, parsePayload(row)]));
  const business = payloads.business || {};
  const operations = payloads.operations || {};
  const preferences = business.reminders || {};
  const today = istDate();
  const ahead = Math.min(14, Math.max(1, Number(preferences.daysAhead) || 3));
  const items = collectItems(operations, business, addDays(today, ahead));
  if (!items.length) return;
  const text = digestText(today, items);

  if (preferences.emailEnabled && preferences.email && env.RESEND_API_KEY && env.REMINDER_FROM_EMAIL) {
    try {
      if (!(await wasSent(env.DB, "email", today))) {
        await sendEmail(env, preferences.email, today, text);
        await markSent(env.DB, "email", today);
      }
    } catch (error) {
      console.error("Email reminder delivery failed:", error.message);
    }
  }

  const canSendWhatsApp = preferences.whatsappEnabled && preferences.phone && env.WHATSAPP_API_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_TEMPLATE_NAME;
  if (canSendWhatsApp) {
    try {
      if (!(await wasSent(env.DB, "whatsapp", today))) {
        await sendWhatsApp(env, preferences.phone.replace(/[\s()-]/g, ""), text);
        await markSent(env.DB, "whatsapp", today);
      }
    } catch (error) {
      console.error("WhatsApp reminder delivery failed:", error.message);
    }
  }
}

export default {
  async fetch() {
    return new Response("Hari Om office reminder worker", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  },
  async scheduled(_controller, env, context) {
    context.waitUntil(runDailyReminders(env));
  }
};

