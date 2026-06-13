/* ============================================================
   DOCX Export – PVCS DMS
   Uses docx.js (UMD build)
   ============================================================ */

async function exportLetterToDOCX(letter) {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } = docx;

    const senderInfo = SENDER_MAP[letter.sender] || { name: letter.sender || '', title: '' };
    const dateStr = formatDate(letter.letterDate);

    const headerParagraphs = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड',
            bold: true, size: 26, color: '1a3a5c',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED',
            bold: true, size: 20, color: '1a3a5c',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'E-8, Chitrakut Vihar Colony, Bhagwat Nagar, P.O. Bahadurpur Colony, Patna Sadar, Patna – 800026',
            size: 16, color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Reg. No.: 26/HQR/2018', size: 16, color: '666666', bold: true }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ children: [new TextRun({ text: '' })], border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '1a3a5c' } } }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
    ];

    const metaParagraphs = [
      new Paragraph({
        children: [
          new TextRun({ text: `Ref. No.: ${letter.refNumber || ''}`, bold: true, size: 18 }),
          new TextRun({ text: `\t\t\t\tDate: ${dateStr}`, bold: true, size: 18 }),
        ],
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({ children: [new TextRun({ text: 'To,', bold: true, size: 18 })] }),
      new Paragraph({ children: [new TextRun({ text: letter.recipient || '', bold: true, size: 18 })] }),
      new Paragraph({ children: [new TextRun({ text: '[Designation / Department / Address]', italics: true, size: 17, color: '666666' })] }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Subject: ', bold: true, size: 18 }),
          new TextRun({ text: letter.subject || '', bold: true, size: 18 }),
        ],
        shading: { type: ShadingType.SOLID, color: 'EEF2F7', fill: 'EEF2F7' },
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
    ];

    // Body paragraphs from English draft
    const draftLines = String(letter.draftEn || '').split('\n');
    const bodyParagraphs = [];
    let skipHeader = true;

    for (const line of draftLines) {
      const trimmed = line.trim();
      if (skipHeader && (trimmed.startsWith('Respected') || trimmed.startsWith('With due') || trimmed.startsWith('We here') || trimmed.startsWith('With utmost') || trimmed.startsWith('NOTICE') || trimmed.startsWith('TENDER'))) {
        skipHeader = false;
      }
      if (skipHeader) continue;

      const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60 && trimmed !== '';
      bodyParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: isHeading,
              size: isHeading ? 18 : 17,
              color: isHeading ? '1a3a5c' : '000000',
            }),
          ],
          spacing: { after: trimmed === '' ? 100 : 40 },
        })
      );
    }

    // Footer
    const footerParagraphs = [
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({
        children: [
          new TextRun({ text: `Document ID: ${letter.did || ''}`, size: 15, color: '888888' }),
          new TextRun({ text: `  |  Priority: ${letter.priority || 'Normal'}`, size: 15, color: '888888' }),
          new TextRun({ text: `  |  Ref: ${letter.refNumber || ''}`, size: 15, color: '888888' }),
        ],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } },
      }),
    ];

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [...headerParagraphs, ...metaParagraphs, ...bodyParagraphs, ...footerParagraphs],
      }],
    });

    const buffer = await Packer.toBlob(doc);
    const filename = refToFilename(letter.refNumber || letter.did) + '.docx';
    downloadBlob(buffer, filename);
    showToast('DOCX file downloaded', 'success');
  } catch (err) {
    console.error('DOCX export error:', err);
    showToast('DOCX export failed. Try PDF instead.', 'error');
  }
}
