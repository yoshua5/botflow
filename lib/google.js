/**
 * google.js — Google API helpers (no npm package needed)
 * Uses service account JWT auth + direct REST calls to
 * Calendar and Sheets APIs.
 */
import crypto from "crypto";

// ── JWT / Auth ─────────────────────────────────────────────
function b64url(input) {
  let buf;
  if (Buffer.isBuffer(input)) {
    buf = input;
  } else if (typeof input === "string") {
    buf = Buffer.from(input);
  } else {
    buf = Buffer.from(JSON.stringify(input));
  }
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function signRS256(data, privateKey) {
  return b64url(
    crypto.sign("sha256", Buffer.from(data), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    })
  );
}

export function parseCredentials(credString) {
  if (!credString) throw new Error("No Google credentials provided");
  try {
    return typeof credString === "string" ? JSON.parse(credString) : credString;
  } catch {
    throw new Error("Invalid Google credentials JSON. Paste the full service account JSON key.");
  }
}

export async function getGoogleToken(credString, scopes) {
  const creds = parseCredentials(credString);
  const now   = Math.floor(Date.now() / 1000);
  const header  = b64url({ alg: "RS256", typ: "JWT" });
  const payload = b64url({
    iss: creds.client_email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  const sigInput = `${header}.${payload}`;
  const sig      = signRS256(sigInput, creds.private_key);
  const jwt      = `${sigInput}.${sig}`;

  const res  = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Google auth failed: ${data.error_description || JSON.stringify(data)}`);
  return data.access_token;
}

// ═══════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════
const CAL_SCOPES = ["https://www.googleapis.com/auth/calendar"];

export async function getCalendarBusy(credString, calendarId, timeMin, timeMax) {
  const token = await getGoogleToken(credString, CAL_SCOPES);
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }),
  });
  const data = await res.json();
  return data.calendars?.[calendarId]?.busy || [];
}

export async function createCalendarEvent(credString, calendarId, event) {
  const token = await getGoogleToken(credString, CAL_SCOPES);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(event),
    }
  );
  return res.json();
}

// ═══════════════════════════════════════════════════════════
// SHEETS
// ═══════════════════════════════════════════════════════════
const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export async function appendToSheet(credString, spreadsheetId, sheetTab, values) {
  const token = await getGoogleToken(credString, SHEETS_SCOPES);
  const range = `${sheetTab || "Citas"}!A1`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ values: [values] }),
    }
  );
  return res.json();
}

// ── Ensure header row exists in the sheet ────────────────
export async function ensureSheetHeader(credString, spreadsheetId, sheetTab, headers) {
  const token = await getGoogleToken(credString, SHEETS_SCOPES);
  const range = `${sheetTab || "Citas"}!A1:Z1`;
  // Read first row
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const firstRow = data.values?.[0];

  // If empty or first cell isn't our header, prepend header row
  if (!firstRow || firstRow[0] !== headers[0]) {
    await appendToSheet(credString, spreadsheetId, sheetTab, headers);
  }
}

// ═══════════════════════════════════════════════════════════
// AVAILABLE SLOTS
// ═══════════════════════════════════════════════════════════
// In-memory cache (works fine for serverless short-lived instances)
let _slotsCache = { data: null, ts: 0 };
const CACHE_TTL  = 20 * 60 * 1000; // 20 min

const ES_WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const ES_MONTHS   = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function fmtDate(d) {
  return `${ES_WEEKDAYS[d.getDay()]} ${d.getDate()} de ${ES_MONTHS[d.getMonth()]}`;
}

export async function getAvailableSlots(appointments) {
  const {
    googleCredentials, calendarId,
    workDays     = [1, 2, 3, 4, 5],
    startHour    = "09:00",
    endHour      = "18:00",
    slotDuration = 60,
  } = appointments || {};

  if (!googleCredentials || !calendarId) return null;

  // Serve from cache if fresh
  if (_slotsCache.data && Date.now() - _slotsCache.ts < CACHE_TTL) return _slotsCache.data;

  try {
    const [sh, sm] = startHour.split(":").map(Number);
    const [eh, em] = endHour.split(":").map(Number);
    const slots    = [];

    for (let d = 1; d <= 14 && slots.length < 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);

      if (!workDays.includes(date.getDay())) continue;

      const dayStart = new Date(date); dayStart.setHours(sh, sm, 0, 0);
      const dayEnd   = new Date(date); dayEnd.setHours(eh, em, 0, 0);

      const busy = await getCalendarBusy(
        googleCredentials, calendarId,
        dayStart.toISOString(), dayEnd.toISOString()
      );

      const free = [];
      const cur  = new Date(dayStart);
      while (cur < dayEnd) {
        const slotEnd = new Date(cur);
        slotEnd.setMinutes(slotEnd.getMinutes() + Number(slotDuration));
        if (slotEnd > dayEnd) break;

        const isBusy = busy.some(b => cur < new Date(b.end) && slotEnd > new Date(b.start));
        if (!isBusy) {
          free.push(`${String(cur.getHours()).padStart(2,"0")}:${String(cur.getMinutes()).padStart(2,"0")}`);
        }
        cur.setMinutes(cur.getMinutes() + Number(slotDuration));
      }

      if (free.length > 0) {
        slots.push(`• ${fmtDate(date)}: ${free.slice(0, 5).join(", ")}`);
      }
    }

    const result = slots.length > 0 ? slots.join("\n") : null;
    _slotsCache = { data: result, ts: Date.now() };
    return result;
  } catch (err) {
    console.error("⚠️ getAvailableSlots error:", err.message);
    return null;
  }
}

// Invalidate cache (call after a booking)
export function invalidateSlotsCache() {
  _slotsCache = { data: null, ts: 0 };
}

// ═══════════════════════════════════════════════════════════
// READ SHEET ROWS
// ═══════════════════════════════════════════════════════════
export async function getSheetRows(credString, spreadsheetId, sheetTab) {
  const token = await getGoogleToken(credString, SHEETS_SCOPES);
  const range = `${sheetTab || "Citas"}!A1:Z1000`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const rows = data.values || [];
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers  = rows[0];
  const dataRows = rows.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, j) => { obj[h] = row[j] || ""; });
    return obj;
  });
  // Filter out rows that are exact duplicates of the header (mis-appended headers)
  const filtered = dataRows.filter(row => {
    const vals = headers.map(h => row[h] || "");
    return !vals.every((v, i) => v === headers[i]);
  });
  return { headers, rows: filtered };
}

// ═══════════════════════════════════════════════════════════
// MUTATE SHEET ROWS
// ═══════════════════════════════════════════════════════════

// Get internal numeric sheetId for a tab name (needed for batchUpdate)
async function getSheetTabId(token, spreadsheetId, sheetTab) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const sheet = data.sheets?.find(s => s.properties.title === (sheetTab || "Citas"));
  return sheet?.properties?.sheetId ?? 0;
}

// Delete a row by its 1-based spreadsheet row index
export async function deleteSheetRow(credString, spreadsheetId, sheetTab, rowIndex) {
  const token   = await getGoogleToken(credString, SHEETS_SCOPES);
  const sheetId = await getSheetTabId(token, spreadsheetId, sheetTab);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: rowIndex - 1, endIndex: rowIndex },
          },
        }],
      }),
    }
  );
  const result = await res.json();
  if (result.error) throw new Error(result.error.message);
  return result;
}

// Update a specific cell by 1-based rowIndex and 0-based colIndex
export async function updateSheetCell(credString, spreadsheetId, sheetTab, rowIndex, colIndex, value) {
  const token     = await getGoogleToken(credString, SHEETS_SCOPES);
  const colLetter = colIndex < 26
    ? String.fromCharCode(65 + colIndex)
    : String.fromCharCode(64 + Math.floor(colIndex / 26)) + String.fromCharCode(65 + (colIndex % 26));
  const range = `${sheetTab || "Citas"}!${colLetter}${rowIndex}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ values: [[value]] }),
    }
  );
  const result = await res.json();
  if (result.error) throw new Error(result.error.message);
  return result;
}

// Insert a header row at the very top of the sheet (row 1), shifting data down
export async function setupSheetHeaders(credString, spreadsheetId, sheetTab, headers) {
  const token   = await getGoogleToken(credString, SHEETS_SCOPES);
  const sheetId = await getSheetTabId(token, spreadsheetId, sheetTab);
  // Insert a blank row at position 0
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      requests: [{ insertDimension: { range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 }, inheritFromBefore: false } }],
    }),
  });
  // Write header values to the new row 1
  const range = `${sheetTab || "Citas"}!A1`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ values: [headers] }),
    }
  );
  return res.json();
}
