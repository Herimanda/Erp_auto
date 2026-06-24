const PDFDocument  = require('pdfkit');
const ExcelJS      = require('exceljs');
const Facture      = require('../models/Facture');
const Article      = require('../models/Article');
const Stock        = require('../models/Stock');
const Client       = require('../models/Client');
const MouvementStock = require('../models/MouvementStock');
const CommandeFournisseur = require('../models/CommandeFournisseur');
const Magasin      = require('../models/Magasin');
const {
  addHeader, addFooter, addTable, addInfoBlock
} = require('../utils/pdfGenerator');

const fmt = (n) =>
  new Intl.NumberFormat('fr-MG').format(n || 0) + ' Ar';
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const fmtNum  = (n) =>
  new Intl.NumberFormat('fr-MG').format(n || 0);

// ── VENTES ─────────────────────────────────────────────────────────────────

// @route GET /api/rapports/ventes/pdf
const rapportVentesPDF = async (req, res) => {
  try {
    const {
      dateDebut, dateFin, magasin,
      type, statut
    } = req.query;

    const filtre = { statut: { $ne: 'annulee' } };
    if (magasin)   filtre.magasin = magasin;
    if (type)      filtre.type    = type;
    if (statut)    filtre.statut  = statut;
    if (dateDebut || dateFin) {
      filtre.createdAt = {};
      if (dateDebut) filtre.createdAt.$gte = new Date(dateDebut);
      if (dateFin)   filtre.createdAt.$lte = new Date(dateFin + 'T23:59:59');
    }

    const factures = await Facture.find(filtre)
      .populate('client',  'nom prenom numeroClient')
      .populate('magasin', 'nom code')
      .sort({ createdAt: -1 });

    const totalTTC     = factures.reduce((s, f) => s + f.totalTTC, 0);
    const totalPaye    = factures.reduce((s, f) => s + f.montantPaye, 0);
    const totalRestant = factures.reduce((s, f) => s + f.montantRestant, 0);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapport-ventes-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    addHeader(doc, 'RAPPORT DES VENTES',
      `${fmtDate(dateDebut)} — ${fmtDate(dateFin) || 'Aujourd\'hui'}`);

    // Résumé
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e2a3b')
       .text('Résumé', 40, doc.y);
    doc.moveDown(0.3);

    addInfoBlock(doc, [
      { label: 'Période',       value: `${fmtDate(dateDebut)} au ${fmtDate(dateFin) || 'aujourd\'hui'}` },
      { label: 'Nb factures',   value: fmtNum(factures.length) },
      { label: 'Total facturé', value: fmt(totalTTC) },
      { label: 'Total encaissé',value: fmt(totalPaye) },
      { label: 'Reste à payer', value: fmt(totalRestant) },
      { label: 'Magasin',       value: magasin || 'Tous' },
    ]);

    // Séparateur
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e5e7eb');
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e2a3b')
       .text('Détail des factures');
    doc.moveDown(0.5);

    addTable(doc,
      [
        { label: 'N° Facture',  align: 'left'  },
        { label: 'Date',        align: 'center'},
        { label: 'Client',      align: 'left'  },
        { label: 'Magasin',     align: 'left'  },
        { label: 'Type',        align: 'center'},
        { label: 'Total TTC',   align: 'right' },
        { label: 'Payé',        align: 'right' },
        { label: 'Statut',      align: 'center'},
      ],
      factures.map((f) => [
        f.numero,
        fmtDate(f.createdAt),
        `${f.client?.nom || ''} ${f.client?.prenom || ''}`.trim(),
        f.magasin?.nom || '—',
        f.type,
        fmt(f.totalTTC),
        fmt(f.montantPaye),
        f.statut,
      ]),
      { colWidths: [80, 55, 90, 65, 50, 60, 60, 55] }
    );

    // Total
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e2a3b')
       .text(`Total TTC : ${fmt(totalTTC)}`, { align: 'right' });
    doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
       .text(`Encaissé : ${fmt(totalPaye)} | Restant : ${fmt(totalRestant)}`,
             { align: 'right' });

    addFooter(doc);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/rapports/ventes/excel
const rapportVentesExcel = async (req, res) => {
  try {
    const { dateDebut, dateFin, magasin, type, statut } = req.query;

    const filtre = { statut: { $ne: 'annulee' } };
    if (magasin) filtre.magasin = magasin;
    if (type)    filtre.type    = type;
    if (statut)  filtre.statut  = statut;
    if (dateDebut || dateFin) {
      filtre.createdAt = {};
      if (dateDebut) filtre.createdAt.$gte = new Date(dateDebut);
      if (dateFin)   filtre.createdAt.$lte = new Date(dateFin + 'T23:59:59');
    }

    const factures = await Facture.find(filtre)
      .populate('client',  'nom prenom numeroClient')
      .populate('magasin', 'nom code')
      .sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ERP Auto';
    const ws   = wb.addWorksheet('Ventes');

    // Style en-tête
    const headerStyle = {
      font:      { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 },
      fill:      { type: 'pattern', pattern: 'solid',
                   fgColor: { argb: 'FF1e2a3b' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        bottom: { style: 'thin', color: { argb: 'FF000000' } }
      }
    };

    ws.columns = [
      { header: 'N° Facture',   key: 'numero',    width: 18 },
      { header: 'Date',         key: 'date',       width: 14 },
      { header: 'Client',       key: 'client',     width: 25 },
      { header: 'N° Client',    key: 'numClient',  width: 14 },
      { header: 'Magasin',      key: 'magasin',    width: 18 },
      { header: 'Type',         key: 'type',       width: 12 },
      { header: 'Total HT',     key: 'totalHT',    width: 16 },
      { header: 'TVA',          key: 'totalTVA',   width: 14 },
      { header: 'Total TTC',    key: 'totalTTC',   width: 16 },
      { header: 'Payé',         key: 'paye',       width: 16 },
      { header: 'Restant',      key: 'restant',    width: 16 },
      { header: 'Statut',       key: 'statut',     width: 16 },
    ];

    // Appliquer style en-tête
    ws.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });
    ws.getRow(1).height = 28;

    // Données
    factures.forEach((f, i) => {
      const row = ws.addRow({
        numero:    f.numero,
        date:      new Date(f.createdAt).toLocaleDateString('fr-FR'),
        client:    `${f.client?.nom || ''} ${f.client?.prenom || ''}`.trim(),
        numClient: f.client?.numeroClient,
        magasin:   f.magasin?.nom,
        type:      f.type,
        totalHT:   f.totalHT,
        totalTVA:  f.totalTVA,
        totalTTC:  f.totalTTC,
        paye:      f.montantPaye,
        restant:   f.montantRestant,
        statut:    f.statut,
      });

      // Alternance couleur
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        });
      }

      // Format monétaire
      ['totalHT','totalTVA','totalTTC','paye','restant'].forEach((k) => {
        row.getCell(k).numFmt = '#,##0 "Ar"';
      });

      row.height = 22;
    });

    // Ligne totaux
    const lastRow = factures.length + 2;
    const totRow  = ws.addRow({
      numero:   'TOTAL',
      totalHT:  factures.reduce((s, f) => s + f.totalHT,  0),
      totalTVA: factures.reduce((s, f) => s + f.totalTVA, 0),
      totalTTC: factures.reduce((s, f) => s + f.totalTTC, 0),
      paye:     factures.reduce((s, f) => s + f.montantPaye,     0),
      restant:  factures.reduce((s, f) => s + f.montantRestant,  0),
    });
    totRow.font  = { bold: true };
    totRow.height = 24;

    // Feuille résumé
    const wsSummary = wb.addWorksheet('Résumé');
    wsSummary.addRow(['Rapport des Ventes']);
    wsSummary.addRow([]);
    wsSummary.addRow(['Période', `${dateDebut || '—'} au ${dateFin || 'aujourd\'hui'}`]);
    wsSummary.addRow(['Nb factures', factures.length]);
    wsSummary.addRow(['Total TTC', factures.reduce((s,f) => s + f.totalTTC, 0)]);
    wsSummary.addRow(['Total encaissé', factures.reduce((s,f) => s + f.montantPaye, 0)]);
    wsSummary.addRow(['Reste à payer', factures.reduce((s,f) => s + f.montantRestant, 0)]);

    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',
      `attachment; filename="rapport-ventes-${Date.now()}.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── STOCKS ─────────────────────────────────────────────────────────────────

// @route GET /api/rapports/stocks/pdf
const rapportStocksPDF = async (req, res) => {
  try {
    const { magasin, categorie } = req.query;

    const filtreArt = { isDeleted: false };
    if (categorie) filtreArt.categorie = categorie;

    const articles = await Article.find(filtreArt)
      .populate('categorie', 'nom');
    const magasins = await Magasin.find({ isActive: true });

    // Construire données stocks
    const lignes = await Promise.all(
      articles.map(async (art) => {
        const filtreStock = { article: art._id };
        if (magasin) filtreStock.magasin = magasin;
        const stocks = await Stock.find(filtreStock);
        const total  = stocks.reduce((s, st) => s + st.quantite, 0);
        return {
          reference:   art.reference,
          designation: art.designation,
          categorie:   art.categorie?.nom || '—',
          marque:      art.marque || '—',
          stockTotal:  total,
          stockMin:    art.stockMinimum,
          prixAchat:   art.prixAchat,
          valeur:      total * art.prixAchat,
          alerte:      total <= art.stockMinimum
        };
      })
    );

    const valeurTotale  = lignes.reduce((s, l) => s + l.valeur, 0);
    const nbAlertes     = lignes.filter((l) => l.alerte).length;
    const nbRuptures    = lignes.filter((l) => l.stockTotal === 0).length;

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="rapport-stocks-${Date.now()}.pdf"`);
    doc.pipe(res);

    addHeader(doc, 'RAPPORT DES STOCKS',
      `Au ${new Date().toLocaleDateString('fr-FR')}`);

    addInfoBlock(doc, [
      { label: 'Total articles',  value: fmtNum(lignes.length) },
      { label: 'Valeur du stock', value: fmt(valeurTotale) },
      { label: 'En alerte',       value: fmtNum(nbAlertes) },
      { label: 'Ruptures',        value: fmtNum(nbRuptures) },
    ]);

    doc.moveTo(40, doc.y).lineTo(752, doc.y).stroke('#e5e7eb');
    doc.moveDown(0.5);

    addTable(doc,
      [
        { label: 'Référence',   align: 'left'  },
        { label: 'Désignation', align: 'left'  },
        { label: 'Catégorie',   align: 'left'  },
        { label: 'Marque',      align: 'left'  },
        { label: 'Stock',       align: 'right' },
        { label: 'Min.',        align: 'right' },
        { label: 'Prix achat',  align: 'right' },
        { label: 'Valeur',      align: 'right' },
        { label: 'Statut',      align: 'center'},
      ],
      lignes.map((l) => [
        l.reference,
        l.designation,
        l.categorie,
        l.marque,
        l.stockTotal,
        l.stockMin,
        fmt(l.prixAchat),
        fmt(l.valeur),
        l.stockTotal === 0
          ? 'RUPTURE'
          : l.alerte ? 'ALERTE' : 'OK',
      ]),
      {
        colWidths: [70, 140, 80, 70, 45, 40, 70, 80, 55],
        startX: 40
      }
    );

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e2a3b')
       .text(`Valeur totale du stock : ${fmt(valeurTotale)}`,
             { align: 'right' });

    addFooter(doc);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/rapports/stocks/excel
const rapportStocksExcel = async (req, res) => {
  try {
    const { magasin, categorie } = req.query;

    const filtreArt = { isDeleted: false };
    if (categorie) filtreArt.categorie = categorie;

    const articles = await Article.find(filtreArt)
      .populate('categorie', 'nom');
    const magasins = await Magasin.find({ isActive: true });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stocks');

    // Colonnes de base
    const cols = [
      { header: 'Référence',    key: 'reference',    width: 15 },
      { header: 'Désignation',  key: 'designation',  width: 35 },
      { header: 'Catégorie',    key: 'categorie',    width: 18 },
      { header: 'Marque',       key: 'marque',       width: 15 },
    ];

    // Colonnes dynamiques par magasin
    if (!magasin) {
      magasins.forEach((m) => {
        cols.push({ header: m.nom, key: `mag_${m._id}`, width: 14 });
      });
    }

    cols.push(
      { header: 'Stock Total',  key: 'stockTotal', width: 14 },
      { header: 'Stock Min.',   key: 'stockMin',   width: 12 },
      { header: 'Prix Achat',   key: 'prixAchat',  width: 16 },
      { header: 'Valeur Stock', key: 'valeur',     width: 18 },
      { header: 'Statut',       key: 'statut',     width: 12 },
    );

    ws.columns = cols;

    // Style en-tête
    ws.getRow(1).eachCell((cell) => {
      cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill  = { type: 'pattern', pattern: 'solid',
                     fgColor: { argb: 'FF1e2a3b' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    ws.getRow(1).height = 28;

    for (const art of articles) {
      const filtreStock = { article: art._id };
      if (magasin) filtreStock.magasin = magasin;
      const stocks = await Stock.find(filtreStock)
        .populate('magasin', 'nom code');
      const total = stocks.reduce((s, st) => s + st.quantite, 0);

      const rowData = {
        reference:   art.reference,
        designation: art.designation,
        categorie:   art.categorie?.nom || '—',
        marque:      art.marque || '—',
        stockTotal:  total,
        stockMin:    art.stockMinimum,
        prixAchat:   art.prixAchat,
        valeur:      total * art.prixAchat,
        statut:      total === 0 ? 'RUPTURE'
                    : total <= art.stockMinimum ? 'ALERTE' : 'OK',
      };

      if (!magasin) {
        magasins.forEach((m) => {
          const s = stocks.find(
            (st) => st.magasin._id.toString() === m._id.toString()
          );
          rowData[`mag_${m._id}`] = s?.quantite || 0;
        });
      }

      const row = ws.addRow(rowData);

      // Coloration statut
      const statutCell = row.getCell('statut');
      if (rowData.statut === 'RUPTURE') {
        statutCell.font = { bold: true, color: { argb: 'FFEF4444' } };
      } else if (rowData.statut === 'ALERTE') {
        statutCell.font = { bold: true, color: { argb: 'FFF59E0B' } };
      } else {
        statutCell.font = { bold: true, color: { argb: 'FF22C55E' } };
      }

      row.getCell('prixAchat').numFmt = '#,##0 "Ar"';
      row.getCell('valeur').numFmt    = '#,##0 "Ar"';
      row.height = 20;
    }

    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',
      `attachment; filename="rapport-stocks-${Date.now()}.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── CLIENTS ────────────────────────────────────────────────────────────────

// @route GET /api/rapports/clients/excel
const rapportClientsExcel = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true })
      .sort({ nom: 1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Clients');

    ws.columns = [
      { header: 'N° Client',  key: 'numero',    width: 14 },
      { header: 'Nom',        key: 'nom',        width: 20 },
      { header: 'Prénom',     key: 'prenom',     width: 18 },
      { header: 'Société',    key: 'societe',    width: 25 },
      { header: 'Catégorie',  key: 'categorie',  width: 14 },
      { header: 'Téléphone',  key: 'telephone',  width: 16 },
      { header: 'Email',      key: 'email',      width: 28 },
      { header: 'Adresse',    key: 'adresse',    width: 35 },
      { header: 'NIF',        key: 'nif',        width: 16 },
      { header: 'Solde (Ar)', key: 'solde',      width: 16 },
    ];

    ws.getRow(1).eachCell((cell) => {
      cell.font  = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill  = { type: 'pattern', pattern: 'solid',
                     fgColor: { argb: 'FF1e2a3b' } };
      cell.alignment = { horizontal: 'center' };
    });

    clients.forEach((c, i) => {
      const row = ws.addRow({
        numero:    c.numeroClient,
        nom:       c.nom,
        prenom:    c.prenom || '',
        societe:   c.societe || '',
        categorie: c.categorie,
        telephone: c.telephone || '',
        email:     c.email || '',
        adresse:   c.adresse || '',
        nif:       c.nif || '',
        solde:     c.solde || 0,
      });
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid',
                        fgColor: { argb: 'FFF9FAFB' } };
        });
      }
      row.getCell('solde').numFmt = '#,##0 "Ar"';
    });

    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',
      `attachment; filename="rapport-clients-${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── FACTURE INDIVIDUELLE ───────────────────────────────────────────────────

// @route GET /api/rapports/facture/:id/pdf
const factureIndividuellePDF = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('client')
      .populate('magasin')
      .populate('lignes.article', 'reference')
      .populate('creePar', 'nom prenom');

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable.' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `inline; filename="${facture.numero}.pdf"`);
    doc.pipe(res);

    addHeader(doc, facture.numero.toUpperCase(),
      facture.type === 'proforma' ? 'FACTURE PROFORMA' : 'FACTURE');

    // Infos entreprise & client
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e2a3b')
       .text('VENDU PAR', 40, doc.y);
    doc.fontSize(9).font('Helvetica').fillColor('#374151')
       .text(facture.magasin?.nom || 'ERP Auto')
       .text(facture.magasin?.adresse || '')
       .text(facture.magasin?.telephone || '');

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e2a3b')
       .text('CLIENT', 300, doc.y - 48);
    doc.fontSize(9).font('Helvetica').fillColor('#374151')
       .text(`${facture.client?.nom} ${facture.client?.prenom || ''}`, 300)
       .text(facture.client?.societe || '', 300)
       .text(facture.client?.telephone || '', 300)
       .text(facture.client?.adresse || '', 300);

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e5e7eb');
    doc.moveDown(0.5);

    // Infos facture
    addInfoBlock(doc, [
      { label: 'N° Facture',  value: facture.numero },
      { label: 'Date',        value: fmtDate(facture.createdAt) },
      { label: 'N° Client',   value: facture.client?.numeroClient || '—' },
      { label: 'Créé par',    value: `${facture.creePar?.prenom || ''} ${facture.creePar?.nom || ''}` },
    ]);

    doc.moveDown(0.5);

    // Lignes
    addTable(doc,
      [
        { label: 'Désignation',  align: 'left'  },
        { label: 'Réf.',         align: 'center'},
        { label: 'Qté',          align: 'right' },
        { label: 'P.U. HT',      align: 'right' },
        { label: 'Remise',       align: 'right' },
        { label: 'TVA',          align: 'right' },
        { label: 'Montant TTC',  align: 'right' },
      ],
      facture.lignes.map((l) => [
        l.designation,
        l.article?.reference || '—',
        l.quantite,
        fmt(l.prixUnitaire),
        l.remise ? `${l.remise}%` : '—',
        `${l.tva}%`,
        fmt(l.montantTTC),
      ]),
      { colWidths: [175, 60, 40, 70, 50, 40, 80] }
    );

    doc.moveDown(0.5);

    // Totaux
    const totX = 355;
    const lignesTotal = [
      { label: 'Total HT',    value: fmt(facture.totalHT) },
      { label: 'TVA',         value: fmt(facture.totalTVA) },
    ];
    if (facture.remiseGlobale > 0) {
      lignesTotal.push({
        label: `Remise (${facture.remiseGlobale}%)`,
        value: `— ${fmt(facture.totalHT * facture.remiseGlobale / 100)}`
      });
    }

    lignesTotal.forEach(({ label, value }) => {
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
         .text(label + ' :', totX, doc.y, { width: 100 });
      doc.text(value, totX + 100, doc.y - 11, { width: 100, align: 'right' });
    });

    // Total TTC encadré
    doc.moveDown(0.3);
    doc.rect(totX - 5, doc.y, 210, 26).fill('#1e2a3b');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff')
       .text('TOTAL TTC', totX, doc.y + 7, { width: 100 });
    doc.text(fmt(facture.totalTTC), totX + 100, doc.y - 11,
             { width: 100, align: 'right' });
    doc.fillColor('#000000');

    doc.moveDown(2);

    // Paiements
    if (facture.paiements?.length > 0) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e2a3b')
         .text('Paiements reçus :');
      facture.paiements.forEach((p) => {
        doc.fontSize(8).font('Helvetica').fillColor('#374151')
           .text(`  • ${fmtDate(p.date)} — ${p.mode} : ${fmt(p.montant)}`);
      });
    }

    if (facture.montantRestant > 0) {
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ef4444')
         .text(`Reste à payer : ${fmt(facture.montantRestant)}`);
    }

    // Notes
    if (facture.notes) {
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
         .text(`Notes : ${facture.notes}`);
    }

    addFooter(doc);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  rapportVentesPDF, rapportVentesExcel,
  rapportStocksPDF, rapportStocksExcel,
  rapportClientsExcel, factureIndividuellePDF
};