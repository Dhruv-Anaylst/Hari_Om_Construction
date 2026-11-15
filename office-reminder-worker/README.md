# Hari Om office reminders

The scheduled Worker checks task due dates, purchase order deliveries, invoice payments, equipment servicing and compliance renewals once daily at 9:00 AM India time. It sends one daily digest per enabled channel and records successful sends in D1 so a retry does not duplicate that day's digest.

The Worker is safe to deploy before delivery providers are connected: it sends nothing until the relevant provider credentials and saved recipient preference are present.

## Provider secrets

Set secrets on the `hari-om-office-reminders` Worker in Cloudflare:

- Email: `RESEND_API_KEY` and `REMINDER_FROM_EMAIL` (the From address must be verified with Resend).
- WhatsApp: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`. Optional: `WHATSAPP_LANGUAGE` (defaults to `en_US`) and `WHATSAPP_API_VERSION` (defaults to `v27.0`). The approved utility template must contain one body text variable for the digest.

The recipient and enabled channels are saved in the private office workspace. API credentials belong in Worker secrets only, never in a browser field or office record.

