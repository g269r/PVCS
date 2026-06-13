/* ============================================================
   PDF Export – PVCS DMS
   Uses pdf-lib for professional government-style PDF generation
   ============================================================ */

async function exportLetterToPDF(letter) {
  const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;

  const pdfDoc = await PDFDocument.create();

  // Set PDF metadata
  pdfDoc.setTitle(`${letter.subject} – ${letter.refNumber}`);
  pdfDoc.setAuthor(letter.senderName || 'PVCS');
  pdfDoc.setSubject(letter.subject || '');
  pdfDoc.setKeywords([letter.did, letter.refNumber, 'PVCS', 'Cooperative Society']);
  pdfDoc.setCreationDate(new Date(letter.letterDate || new Date()));

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.1, 0.227, 0.361);     // #1a3a5c
  const gold = rgb(0.784, 0.659, 0.294);   // #c8a84b
  const black = rgb(0, 0, 0);
  const gray = rgb(0.42, 0.46, 0.50);
  const white = rgb(1, 1, 1);
  const lightGray = rgb(0.95, 0.96, 0.97);

  // ---- Helper: add page ----
  function addPage(doc) {
    const page = doc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    return { page, width, height };
  }

  // ---- Helper: draw wrapped text ----
  function drawWrappedText(page, text, x, y, maxWidth, font, size, color) {
    const words = String(text || '').split(' ');
    let line = '';
    let lineY = y;
    const lineHeight = size * 1.6;

    for (const word of words) {
      const testLine = line ? line + ' ' + word : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && line) {
        page.drawText(line, { x, y: lineY, size, font, color });
        lineY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x, y: lineY, size, font, color });
      lineY -= lineHeight;
    }
    return lineY;
  }

  // ---- Render English page ----
  async function renderEnglishPage(draft, pageNum, totalPages) {
    const { page, width, height } = addPage(pdfDoc);
    const margin = 50;
    const contentWidth = width - margin * 2;
    let y = height - margin;

    // Header bar
    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: navy });

    // Society name in header
    page.drawText('PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS', {
      x: 60, y: height - 32, size: 9.5, font: helveticaBold, color: white,
    });
    page.drawText('COOPERATIVE SOCIETY LIMITED', {
      x: 60, y: height - 46, size: 9.5, font: helveticaBold, color: white,
    });
    page.drawText('Reg. No.: 26/HQR/2018', {
      x: 60, y: height - 59, size: 7.5, font: helvetica, color: rgb(0.8, 0.85, 0.9),
    });

    // Gold stripe under header
    page.drawRectangle({ x: 0, y: height - 75, width, height: 5, color: gold });

    y = height - 100;

    // Ref + Date
    page.drawText(`Ref. No.: ${letter.refNumber}`, { x: margin, y, size: 8.5, font: helveticaBold, color: navy });
    const dateStr = formatDate(letter.letterDate);
    const dateW = helveticaBold.widthOfTextAtSize(`Date: ${dateStr}`, 8.5);
    page.drawText(`Date: ${dateStr}`, { x: width - margin - dateW, y, size: 8.5, font: helveticaBold, color: navy });

    // Horizontal rule
    y -= 12;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: navy, opacity: 0.3 });
    y -= 16;

    // Recipient block
    page.drawText('To,', { x: margin, y, size: 9, font: helveticaBold, color: black });
    y -= 14;
    page.drawText(String(letter.recipient || ''), { x: margin, y, size: 9, font: helveticaBold, color: black });
    y -= 13;
    page.drawText('[Designation / Department / Address]', { x: margin, y, size: 8.5, font: helveticaOblique, color: gray });
    y -= 22;

    // Subject
    page.drawRectangle({ x: margin - 4, y: y - 4, width: contentWidth + 8, height: 18, color: lightGray });
    page.drawText('Subject: ', { x: margin, y, size: 9, font: helveticaBold, color: navy });
    const subjX = margin + helveticaBold.widthOfTextAtSize('Subject: ', 9);
    page.drawText(String(letter.subject || ''), { x: subjX, y, size: 9, font: helveticaBold, color: black });
    y -= 22;

    // Body text (from draft – strip the letterhead portion for cleaner display)
    const bodyLines = String(draft || '').split('\n');
    let inBody = false;
    for (const rawLine of bodyLines) {
      const line = rawLine.trim();
      if (!inBody && (line.startsWith('Respected') || line.startsWith('With due') || line.startsWith('We here') || line.startsWith('With utmost') || line.startsWith('This is to') || line.startsWith('NOTICE') || line.startsWith('TENDER'))) {
        inBody = true;
      }
      if (!inBody) continue;

      if (y < margin + 80) {
        // Footer then new page
        drawFooter(page, width, height, margin, pageNum, totalPages, letter);
        const np = addPage(pdfDoc);
        y = np.height - margin - 20;
        // Continue on new page reference
      }

      if (line === '') { y -= 8; continue; }

      // Signature block detection
      if (line.startsWith('(Signature)') || line.startsWith('____')) {
        y -= 16;
        page.drawLine({ start: { x: margin, y }, end: { x: margin + 140, y }, thickness: 0.5, color: black });
        y -= 13;
        continue;
      }

      const isHeading = line === line.toUpperCase() && line.length > 3 && line.length < 60;
      const f = isHeading ? helveticaBold : helvetica;
      const sz = isHeading ? 9 : 9;
      const c = isHeading ? navy : black;

      y = drawWrappedText(page, line, margin, y, contentWidth, f, sz, c);
      y -= 2;
    }

    // Footer
    drawFooter(page, width, height, margin, pageNum, totalPages, letter);

    // DID watermark (light, diagonal)
    page.drawText(letter.did || 'PVCS', {
      x: 120, y: 300,
      size: 52, font: helveticaBold,
      color: rgb(0.9, 0.92, 0.94),
      opacity: 0.25,
      rotate: degrees(35),
    });
  }

  function drawFooter(page, width, height, margin, pageNum, totalPages, letter) {
    const fY = 35;
    page.drawLine({ start: { x: margin, y: fY + 18 }, end: { x: width - margin, y: fY + 18 }, thickness: 0.4, color: gray, opacity: 0.4 });
    page.drawText('E-8, Chitrakut Vihar Colony, Bhagwat Nagar, Bahadurpur Colony, Patna Sadar, Patna – 800026', {
      x: margin, y: fY + 6, size: 7, font: helvetica, color: gray,
    });
    page.drawText(`DID: ${letter.did || ''} | Priority: ${letter.priority || 'Normal'}`, {
      x: margin, y: fY - 6, size: 6.5, font: helvetica, color: gray,
    });
    const pgTxt = `Page ${pageNum} of ${totalPages}`;
    const pgW = helvetica.widthOfTextAtSize(pgTxt, 7);
    page.drawText(pgTxt, { x: width - margin - pgW, y: fY - 6, size: 7, font: helvetica, color: gray });
  }

  // Render both pages (English + Hindi note)
  await renderEnglishPage(letter.draftEn, 1, letter.draftHi ? 2 : 1);

  // Hindi draft as page 2 (rendered as text since pdf-lib doesn't support Devanagari natively – we render it as a note)
  if (letter.draftHi) {
    const { page, width, height } = addPage(pdfDoc);
    const margin = 50;
    let y = height - 60;

    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: rgb(0.48, 0.204, 0.118) });
    page.drawText('HINDI DRAFT (हिंदी प्रारूप)', { x: margin, y: height - 40, size: 11, font: helveticaBold, color: white });
    page.drawRectangle({ x: 0, y: height - 75, width, height: 5, color: gold });
    y = height - 100;

    page.drawText('Note: Hindi text is stored in the system archive. The text below is the romanized reference.', {
      x: margin, y, size: 8, font: helveticaOblique, color: gray,
    });
    y -= 20;

    // Print Hindi lines (will show as boxes for Devanagari but the content is preserved in metadata)
    const hiLines = String(letter.draftHi || '').split('\n').slice(0, 60);
    for (const line of hiLines) {
      if (y < 60) break;
      if (line.trim() === '') { y -= 8; continue; }
      // Encode as UTF-8 display note
      page.drawText(`[${line.slice(0, 80)}]`, { x: margin, y, size: 7.5, font: helvetica, color: black });
      y -= 13;
    }

    // Footer
    const fY = 35;
    page.drawLine({ start: { x: margin, y: fY + 18 }, end: { x: width - margin, y: fY + 18 }, thickness: 0.4, color: gray, opacity: 0.4 });
    page.drawText(`DID: ${letter.did || ''} | ${letter.refNumber || ''}`, { x: margin, y: fY - 6, size: 6.5, font: helvetica, color: gray });
    const pgTxt = `Page 2 of 2`;
    const pgW = helvetica.widthOfTextAtSize(pgTxt, 7);
    page.drawText(pgTxt, { x: width - margin - pgW, y: fY - 6, size: 7, font: helvetica, color: gray });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = refToFilename(letter.refNumber || letter.did) + '.pdf';
  downloadBlob(blob, filename);
  showToast('PDF downloaded successfully', 'success');
}

// ---- Printable HTML Export ----
function exportLetterToHTML(letter) {
  const senderInfo = SENDER_MAP[letter.sender] || { name: letter.sender, title: '' };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escHtml(letter.subject)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; color: #000; margin: 0; padding: 0; }
  @media print { .no-print { display: none; } }
  .page { max-width: 720px; margin: 0 auto; padding: 28mm 25mm; }
  .header { border-bottom: 3px double #1a3a5c; padding-bottom: 12pt; margin-bottom: 16pt; }
  .society-hi { font-size: 13pt; font-weight: bold; color: #1a3a5c; font-family: 'Noto Sans Devanagari', Arial; }
  .society-en { font-size: 10pt; color: #2a5a8c; font-weight: bold; }
  .addr { font-size: 8pt; color: #666; margin-top: 3pt; }
  .ref-date { display: flex; justify-content: space-between; margin: 14pt 0 10pt; font-size: 10pt; }
  .subject-line { background: #f0f4f8; padding: 6pt 10pt; font-weight: bold; margin: 12pt 0; font-size: 10pt; }
  .body { line-height: 1.8; font-size: 10.5pt; white-space: pre-wrap; }
  .footer { border-top: 1px solid #ccc; margin-top: 20pt; padding-top: 8pt; font-size: 7.5pt; color: #888; display: flex; justify-content: space-between; }
  .no-print { background: #1a3a5c; color: #fff; padding: 8pt 16pt; cursor: pointer; border: none; font-size: 11pt; margin: 10pt; border-radius: 4pt; }
</style>
</head>
<body>
<div class="no-print" style="display:flex;gap:10pt;padding:10pt">
  <button class="no-print" onclick="window.print()">🖨 Print</button>
</div>
<div class="page">
  <div class="header">
    <div class="society-hi">पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड</div>
    <div class="society-en">PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED</div>
    <div class="addr">E-8, Chitrakut Vihar Colony, Bhagwat Nagar, P.O. Bahadurpur Colony, Patna Sadar, Patna – 800026 | Reg. No.: 26/HQR/2018</div>
  </div>
  <div class="ref-date">
    <span><strong>Ref. No.:</strong> ${escHtml(letter.refNumber)}</span>
    <span><strong>Date:</strong> ${formatDate(letter.letterDate)}</span>
  </div>
  <div><strong>To,</strong><br>${escHtml(letter.recipient)}</div>
  <div class="subject-line">Subject: ${escHtml(letter.subject)}</div>
  <div class="body">${escHtml(letter.draftEn || '')}</div>
  <div class="footer">
    <span>DID: ${escHtml(letter.did || '')}</span>
    <span>Priority: ${escHtml(letter.priority || 'Normal')}</span>
    <span>Page 1</span>
  </div>
</div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, refToFilename(letter.refNumber || letter.did) + '.html');
  showToast('HTML file downloaded', 'success');
}
