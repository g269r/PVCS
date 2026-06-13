/* ============================================================
   Reference Number & Document ID Generator – PVCS DMS
   ============================================================
   Format:  YYYY / SENDER-PVCS / MM / RECIPIENT-SEGMENT / DD / TYPE / SERIAL
   Example: 2026/CP-PVCS/06/DCO-PATNA/13/REQ/001
            2026/SEC-PVCS/06/CEO-HU-PATNA/13/PRP/002

   RECIPIENT-SEGMENT is built from:
     Designation abbr + Organization abbr (if distinct) + Location abbr
   "CUSTOM" never appears anywhere.
   ============================================================ */

/**
 * Generate a full reference number.
 *
 * @param {string} sender       – key from SENDER_MAP
 * @param {string} designation  – e.g. "Chief Executive Officer"
 * @param {string} organization – e.g. "Harit Union"   (may be empty)
 * @param {string} location     – e.g. "Patna"
 * @param {string} letterType   – key from TYPE_CODE_MAP
 * @param {string} date         – ISO date string
 * @returns {Promise<string>}
 */
async function generateRefNumber(sender, designation, organization, location, letterType, date) {
  const d = new Date(date || new Date());
  const year     = d.getFullYear();
  const month    = String(d.getMonth() + 1).padStart(2, '0');
  const day      = String(d.getDate()).padStart(2, '0');
  const dateKey  = `${year}${month}${day}`;

  const senderInfo  = SENDER_MAP[sender] || { code: 'OFF' };
  const senderCode  = senderInfo.code;
  const typeCode    = TYPE_CODE_MAP[letterType] || 'GEN';
  const recipientSeg = await RecipientMaster.buildRefSegment(designation, organization, location);

  const serial    = await Counters.incDailySeq(dateKey);
  const serialStr = String(serial).padStart(3, '0');

  return `${year}/${senderCode}-PVCS/${month}/${recipientSeg}/${day}/${typeCode}/${serialStr}`;
}

/**
 * Legacy overload: accepts a flat recipient string (old letters / manual override).
 * Converts it to a clean slug – never emits "CUSTOM".
 */
async function generateRefNumberLegacy(sender, recipientStr, letterType, date) {
  const d = new Date(date || new Date());
  const year     = d.getFullYear();
  const month    = String(d.getMonth() + 1).padStart(2, '0');
  const day      = String(d.getDate()).padStart(2, '0');
  const dateKey  = `${year}${month}${day}`;

  const senderInfo   = SENDER_MAP[sender] || { code: 'OFF' };
  const senderCode   = senderInfo.code;
  const typeCode     = TYPE_CODE_MAP[letterType] || 'GEN';
  const recipientSeg = RecipientMaster.legacyToRefSegment(recipientStr);

  const serial    = await Counters.incDailySeq(dateKey);
  const serialStr = String(serial).padStart(3, '0');

  return `${year}/${senderCode}-PVCS/${month}/${recipientSeg}/${day}/${typeCode}/${serialStr}`;
}

// ---- Filename-safe version of a ref number ----
function refToFilename(ref) {
  return (ref || 'PVCS-LETTER').replace(/\//g, '-');
}

// ---- Permanent Document ID:  PVCS-YYYY-000001-PS ----
async function generateDID(date) {
  const d    = new Date(date || new Date());
  const year = d.getFullYear();
  const seq  = await Counters.incDIDSeq();
  return `PVCS-${year}-${padNum(seq, 6)}-PS`;
}

// ---- Parse a ref number back into its components ----
function parseRefNumber(ref) {
  if (!ref) return null;
  const parts = ref.split('/');
  if (parts.length < 7) return null;
  return {
    year:          parts[0],
    senderCode:    parts[1],
    month:         parts[2],
    recipientCode: parts[3],
    day:           parts[4],
    typeCode:      parts[5],
    serial:        parts[6],
  };
}

// ---- Check uniqueness ----
async function isRefUnique(refNumber) {
  const all = await Letters.getAll();
  return !all.some(l => l.refNumber === refNumber);
}
