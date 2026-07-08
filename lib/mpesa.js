// Shared Daraja (M-Pesa) helper — auth token + STK push request builder.
// Works for sandbox now; switching MPESA_ENV to "production" later
// just changes the base URL and shortcode/passkey in .env.

const BASE_URL =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

// Generates a Base64 password from shortcode + passkey + timestamp,
// as required by the Daraja STK push spec.
function generatePassword(timestamp) {
  const raw = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

// Timestamp format Safaricom expects: YYYYMMDDHHmmss
function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

// Fetches an OAuth access token using Consumer Key/Secret.
// Token is short-lived (~1hr) — we fetch a fresh one per request
// rather than caching, to keep this simple and stateless on Vercel.
async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get M-Pesa access token: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Normalizes a Kenyan phone number to the 2547XXXXXXXX format
// Daraja requires (accepts 07..., +2547..., 2547... as input).
function normalizePhone(phone) {
  let cleaned = phone.replace(/\s+/g, '').replace('+', '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

// Initiates an STK push prompt to the customer's phone.
// callbackUrl must be a public HTTPS endpoint (not localhost).
async function initiateSTKPush({
  phone,
  amount,
  accountReference,
  transactionDesc,
  callbackUrl,
}) {
  const accessToken = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);
  const normalizedPhone = normalizePhone(phone);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(Number(amount)), // Daraja requires whole numbers
    PartyA: normalizedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: normalizedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference || 'ConsoleLounge',
    TransactionDesc: transactionDesc || 'Console Lounge Payment',
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.errorMessage || 'STK push request failed');
  }

  return data; // contains MerchantRequestID, CheckoutRequestID, ResponseCode
}

module.exports = { initiateSTKPush, normalizePhone };