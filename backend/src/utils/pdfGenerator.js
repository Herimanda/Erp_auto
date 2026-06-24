const PDFDocument = require('pdfkit');

// En-tête commun à tous les PDF
const addHeader = (doc, titre, sousTitre = '') => {
  // Bandeau
  doc.rect(0, 0, doc.page.width, 80).fill('#1e2a3b');

  // Logo texte
  doc.fontSize(20).fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('ERP AUTO', 40, 25);

  doc.fontSize(9).fillColor('#93c5fd')
     .font('Helvetica')
     .text('Gestion commerciale & stocks multi-magasins', 40, 50);

  // Titre rapport
  doc.fontSize(11).fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text(titre, doc.page.width - 250, 28, { width: 210, align: 'right' });

  if (sousTitre) {
    doc.fontSize(9).fillColor('#93c5fd')
       .font('Helvetica')
       .text(sousTitre, doc.page.width - 250, 50,
             { width: 210, align: 'right' });
  }

  doc.fillColor('#000000');
  doc.y = 100;
};

// Pied de page
const addFooter = (doc) => {
  const bottom = doc.page.height - 40;
  doc.moveTo(40, bottom - 10)
     .lineTo(doc.page.width - 40, bottom - 10)
     .stroke('#e5e7eb');

  doc.fontSize(8).fillColor('#9ca3af')
     .text(
       `Généré le ${new Date().toLocaleDateString('fr-FR', {
         day: '2-digit', month: '2-digit', year: 'numeric',
         hour: '2-digit', minute: '2-digit'
       })} — ERP Auto v1.0`,
       40, bottom - 5,
       { align: 'center', width: doc.page.width - 80 }
     );
};

// Tableau générique
const addTable = (doc, headers, rows, options = {}) => {
  const {
    startX    = 40,
    colWidths = null,
    rowHeight = 24,
    headerBg  = '#1e2a3b',
    altRowBg  = '#f9fafb',
  } = options;

  const pageWidth  = doc.page.width - 80;
  const totalCols  = headers.length;
  const widths     = colWidths ||
    headers.map(() => Math.floor(pageWidth / totalCols));

  let x = startX;
  let y = doc.y;

  // En-tête tableau
  doc.rect(startX, y, pageWidth, rowHeight).fill(headerBg);
  headers.forEach((h, i) => {
    doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold')
       .text(h.label, x + 4, y + 7,
             { width: widths[i] - 8, align: h.align || 'left' });
    x += widths[i];
  });

  y += rowHeight;

  // Lignes
  rows.forEach((row, rowIdx) => {
    // Saut de page si nécessaire
    if (y + rowHeight > doc.page.height - 60) {
      addFooter(doc);
      doc.addPage();
      y = 60;
    }

    // Alternance couleur
    if (rowIdx % 2 === 0) {
      doc.rect(startX, y, pageWidth, rowHeight).fill(altRowBg);
    }

    // Bordure basse
    doc.moveTo(startX, y + rowHeight)
       .lineTo(startX + pageWidth, y + rowHeight)
       .stroke('#e5e7eb');

    x = startX;
    row.forEach((cell, i) => {
      doc.fontSize(8).fillColor('#374151').font('Helvetica')
         .text(String(cell ?? '—'), x + 4, y + 7,
               { width: widths[i] - 8,
                 align: headers[i]?.align || 'left' });
      x += widths[i];
    });

    y += rowHeight;
  });

  doc.y = y + 10;
};

// Bloc info (clé: valeur)
const addInfoBlock = (doc, infos, cols = 2) => {
  const pageWidth = doc.page.width - 80;
  const colWidth  = pageWidth / cols;
  let   col       = 0;
  const startY    = doc.y;
  let   maxY      = startY;

  infos.forEach((info, i) => {
    const x = 40 + col * colWidth;
    const y = startY + Math.floor(i / cols) * 20;

    doc.fontSize(8).fillColor('#6b7280').font('Helvetica')
       .text(info.label + ' :', x, y, { width: colWidth * 0.4 });
    doc.fontSize(8).fillColor('#111827').font('Helvetica-Bold')
       .text(info.value, x + colWidth * 0.4, y,
             { width: colWidth * 0.55 });

    maxY = Math.max(maxY, y + 15);
    col  = (col + 1) % cols;
  });

  doc.y = maxY + 10;
};

module.exports = { addHeader, addFooter, addTable, addInfoBlock };