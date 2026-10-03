const PDFDocument = require('pdfkit');

const GREEN = '#2e8b57';
const INK = '#1f2937';
const GREY = '#6b7280';
const PAGE_W = 595.28;
const MARGIN = 40;
const COLORS = { red: '#e53935', blue: '#1e88e5', yellow: '#fdd835', green: '#43a047' };
const FACE = { happy: '#a5e8a5', sad: '#a9d6f0', angry: '#f5b5c3' };

const latin = (s = '') => String(s).replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '').trim();

function star(doc, cx, cy, r, fill) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  doc.polygon(...points).lineWidth(1.5).fillAndStroke(fill, INK);
}

function apple(doc, cx, cy, r) {
  doc.circle(cx - r * 0.3, cy + r * 0.1, r * 0.6).lineWidth(1.5).fillAndStroke('#e53935', INK);
  doc.circle(cx + r * 0.3, cy + r * 0.1, r * 0.6).lineWidth(1.5).fillAndStroke('#e53935', INK);
  doc.ellipse(cx + r * 0.1, cy - r * 0.6, r * 0.25, r * 0.12).fillAndStroke('#43a047', INK);
}

function ball(doc, cx, cy, r) {
  doc.circle(cx, cy, r).lineWidth(1.5).fillAndStroke('#ffb74d', INK);
  doc.moveTo(cx - r, cy).lineTo(cx + r, cy).lineWidth(1.5).stroke(INK);
  doc.moveTo(cx, cy - r).lineTo(cx, cy + r).lineWidth(1.5).stroke(INK);
}

function dots(doc, count, cx, cy, size) {
  const patterns = { 1: [[0, 0]], 2: [[-1, 0], [1, 0]], 3: [[-1, 0.8], [1, 0.8], [0, -0.8]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]] };
  (patterns[count] || []).forEach(([x, y]) => doc.circle(cx + x * size * 0.2, cy + y * size * 0.2, size * 0.1).fill('#3949ab'));
}

function face(doc, mood, cx, cy, r) {
  doc.circle(cx, cy, r).lineWidth(1.5).fillAndStroke(FACE[mood] || FACE.happy, INK);
  const eyeY = cy - r * 0.2;
  doc.circle(cx - r * 0.35, eyeY, r * 0.07).fill(INK);
  doc.circle(cx + r * 0.35, eyeY, r * 0.07).fill(INK);
  doc.lineWidth(1.8).strokeColor(INK);
  if (mood === 'happy') doc.moveTo(cx - r * 0.4, cy + r * 0.2).quadraticCurveTo(cx, cy + r * 0.7, cx + r * 0.4, cy + r * 0.2).stroke();
  else doc.moveTo(cx - r * 0.4, cy + r * 0.45).quadraticCurveTo(cx, cy + r * 0.1, cx + r * 0.4, cy + r * 0.45).stroke();
}

function drawArt(doc, kind, value, cx, cy, size) {
  const r = size * 0.32;
  if (kind === 'color') doc.roundedRect(cx - r, cy - r, r * 2, r * 2, 8).lineWidth(1.5).fillAndStroke(COLORS[value] || '#ddd', INK);
  else if (kind === 'shape' && value === 'circle') doc.circle(cx, cy, r).fillAndStroke('#8ecae6', INK);
  else if (kind === 'shape' && value === 'square') doc.rect(cx - r, cy - r, r * 2, r * 2).fillAndStroke('#ffb4a2', INK);
  else if (kind === 'shape') doc.polygon([cx, cy - r], [cx + r * 1.1, cy + r * 0.85], [cx - r * 1.1, cy + r * 0.85]).fillAndStroke('#b5e48c', INK);
  else if (kind === 'count') dots(doc, value, cx, cy, size);
  else if (kind === 'object' && value === 'apple') apple(doc, cx, cy, r);
  else if (kind === 'object' && value === 'ball') ball(doc, cx, cy, r);
  else if (kind === 'object') star(doc, cx, cy, r, '#fdd835');
  else if (kind === 'face') face(doc, value, cx, cy, r);
  else if (kind === 'routine' && value === 'sleep') doc.circle(cx, cy, r).fillAndStroke('#bfe3f5', INK);
  else if (kind === 'routine' && value === 'eat') apple(doc, cx, cy, r);
  else if (kind === 'routine') doc.circle(cx, cy, r).fillAndStroke(value === 'wake up' ? '#ffee00' : '#3949ab', INK);
}

function header(doc, chapter) {
  doc.rect(0, 0, PAGE_W, 44).fill(GREEN);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(18).text('MODULE 1', MARGIN, 14, { lineBreak: false });
  doc.fontSize(10).text(`CHAPTER ${chapter}`, MARGIN, 18, { width: PAGE_W - MARGIN * 2, align: 'right', lineBreak: false });
}

function footer(doc, text, page) {
  doc.fillColor(GREY).font('Helvetica').fontSize(8).text(text, MARGIN, 806, { lineBreak: false });
  doc.text(`Page ${page}`, MARGIN, 806, { width: PAGE_W - MARGIN * 2, align: 'right', lineBreak: false });
}

function childPage(doc, worksheet, childName, dateStr) {
  header(doc, worksheet.sheet.chapter);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(24).text(worksheet.title, MARGIN, 62, { lineBreak: false });
  doc.roundedRect(MARGIN, 104, PAGE_W - MARGIN * 2, 40, 8).lineWidth(1).strokeColor('#9ca3af').stroke();
  doc.font('Helvetica').fontSize(11).fillColor(GREY).text('Name:', MARGIN + 12, 118, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(14).fillColor(INK).text(latin(childName), MARGIN + 52, 115, { lineBreak: false });
  doc.font('Helvetica').fontSize(11).fillColor(GREY).text('Date:', 360, 118, { lineBreak: false });
  doc.fillColor(INK).text(dateStr || '', 396, 118, { lineBreak: false });
  const rows = worksheet.sheet.rows;
  const columns = rows[0].choices.length + 1;
  const gap = 14;
  const usable = PAGE_W - MARGIN * 2;
  const top = 170;
  let cell = Math.min(100, (usable - gap * (columns - 1)) / columns);
  const pitch = cell + 30;
  while (rows.length * pitch > 595) cell -= 2;
  const width = columns * cell + (columns - 1) * gap;
  const x0 = MARGIN + (usable - width) / 2;
  rows.forEach((row, ri) => {
    const y = top + ri * (cell + 30);
    [row.target, ...row.choices].forEach((value, ci) => {
      const x = x0 + ci * (cell + gap);
      doc.roundedRect(x, y, cell, cell, 10).lineWidth(ci === 0 ? 1 : 2.4).strokeColor(ci === 0 ? '#9ca3af' : INK).stroke();
      drawArt(doc, worksheet.sheet.kind, value, x + cell / 2, y + cell / 2, cell);
      if (worksheet.sheet.kind === 'count' && ci === 0) doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text(String(value), x, y + cell - 24, { width: cell, align: 'center', lineBreak: false });
      else if (worksheet.sheet.kind !== 'count') doc.fillColor(INK).font('Helvetica-Bold').fontSize(8).text(String(value).toUpperCase(), x, y + cell + 6, { width: cell, align: 'center', lineBreak: false });
    });
  });
  footer(doc, 'NeuroAI - Early Learning Foundations - Ages 3-6', 1);
}

function stripMd(s = '') {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/^> /gm, '').replace(/^- /gm, '• ');
}

function parentPage(doc, worksheet, childName) {
  doc.addPage();
  header(doc, worksheet.sheet.chapter);
  const width = PAGE_W - MARGIN * 2;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text('Parent / Teacher guide', MARGIN, 62);
  doc.font('Helvetica').fontSize(10).fillColor(GREY).text(`${worksheet.title} - ${latin(childName)} - about ${worksheet.minutes} minutes`, MARGIN, 88);
  doc.moveDown(1).font('Helvetica-Bold').fontSize(11).fillColor(INK).text('Goal');
  doc.font('Helvetica').fontSize(10).text(worksheet.goal, { width });
  doc.moveDown(0.5).font('Helvetica-Bold').text('You will need');
  doc.font('Helvetica').text(worksheet.materials.join(', '), { width });
  doc.moveDown(0.5).font('Helvetica-Bold').text('How to teach it');
  doc.font('Helvetica').fontSize(10).text(stripMd(worksheet.teach), { width, lineGap: 1.5 });
  if (worksheet.takeaway) doc.moveDown(0.5).font('Helvetica-Bold').fillColor(GREEN).text(`Key point: ${worksheet.takeaway}`, { width });
  doc.moveDown(0.8).fillColor(INK).font('Helvetica-Bold').fontSize(11).text('Answers and marking');
  doc.font('Helvetica').fontSize(8.5).fillColor(GREY).text('Mark each task: 2 = on their own, 1 = with help, 0 = not yet.', { width });
  let y = doc.y + 8;
  worksheet.items.forEach((item, i) => {
    const row = worksheet.sheet.rows[i];
    const answer = worksheet.sheet.kind === 'count' ? `${row.target} ${row.target === 1 ? 'dot' : 'dots'}` : String(row.target).toUpperCase();
    doc.fillColor(INK).font('Helvetica').fontSize(9).text(`${i + 1}. ${item.prompt.split(' (')[0]}`, MARGIN, y, { width: 250, lineBreak: false });
    doc.font('Helvetica-Bold').text(`Box ${row.answer + 1} (${answer})`, MARGIN + 280, y, { width: 110, lineBreak: false });
    [0, 1, 2].forEach((offset) => doc.rect(MARGIN + 405 + offset * 35, y, 11, 11).stroke(INK));
    y += 20;
  });
  footer(doc, 'NeuroAI - Parent / Teacher page - do not give this page to the child', 2);
}

function buildWorksheetPdf(worksheet, childName, dateStr) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `${worksheet.title} - ${latin(childName)}`, Author: 'NeuroAI' } });
  childPage(doc, worksheet, childName, dateStr);
  parentPage(doc, worksheet, childName);
  doc.end();
  return doc;
}

module.exports = { buildWorksheetPdf, latin };
