/* ============================================================
   Reference Number & Document ID Generator – PVCS DMS
   ============================================================ */

// Format: YYYY/CP-PVCS/MM/RECIPIENT/DD/TYPE/SERIAL
// Example: 2026/CP-PVCS/06/DCO-PATNA/13/REQ/001

async function generateRefNumber(sender, recipient, letterType, date) {
  const d = new Date(date || new Date());
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateKey = `${year}${month}${day}`;

  const senderInfo = SENDER_MAP[sender] || { code: 'OFF' };
  const senderCode = senderInfo.code;
  const recipientCode = recipientSlug(recipient || 'RECIPIENT');
  const typeCode = TYPE_CODE_MAP[letterType] || 'GEN';

  const serial = await Counters.incDailySeq(dateKey);
  const serialStr = String(serial).padStart(3, '0');

  return `${year}/${senderCode}-PVCS/${month}/${recipientCode}/${day}/${typeCode}/${serialStr}`;
}

// For display as filename:
function refToFilename(ref) {
  return ref.replace(/\//g, '-');
}

// Permanent Document ID: PVCS-YYYY-000001-PS
async function generateDID(date) {
  const d = new Date(date || new Date());
  const year = d.getFullYear();
  const seq = await Counters.incDIDSeq();
  return `PVCS-${year}-${padNum(seq, 6)}-PS`;
}

// Parse ref number components
function parseRefNumber(ref) {
  if (!ref) return null;
  const parts = ref.split('/');
  if (parts.length < 7) return null;
  return {
    year: parts[0],
    senderCode: parts[1],
    month: parts[2],
    recipientCode: parts[3],
    day: parts[4],
    typeCode: parts[5],
    serial: parts[6],
  };
}

// Validate no duplicate ref
async function isRefUnique(refNumber) {
  const all = await Letters.getAll();
  return !all.some(l => l.refNumber === refNumber);
}

// Manual override: parse and regenerate with new serial
async function regenerateSerial(sender, recipient, letterType, date) {
  const d = new Date(date || new Date());
  const dateKey = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const current = await Counters.getDailySeq(dateKey);
  return current + 1;
}
