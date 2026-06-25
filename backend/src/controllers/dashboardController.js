const Facture      = require('../models/Facture');
const Article      = require('../models/Article');
const Stock        = require('../models/Stock');
const Client       = require('../models/Client');
const MouvementStock = require('../models/MouvementStock');
const CommandeFournisseur = require('../models/CommandeFournisseur');
const Transfert    = require('../models/Transfert');
const mongoose     = require('mongoose');
const { success, error } = require('../utils/apiResponse');

// Helpers dates
const debutJour    = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d;
};
const debutSemaine = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0,0,0,0);
  return d;
};
const debutMois  = () =>
  new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const debutAnnee = () =>
  new Date(new Date().getFullYear(), 0, 1);

// Convertir magasinId en ObjectId proprement
const toObjectId = (id) => {
  try {
    return id && mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : null;
  } catch {
    return null;
  }
};

// @desc    KPIs principaux
// @route   GET /api/dashboard/kpis
const getKpis = async (req, res) => {
  try {
    const magasinOId = toObjectId(req.query.magasin);

    const filtreBase = { statut: { $ne: 'annulee' } };
    if (magasinOId) filtreBase.magasin = magasinOId;

    // CA du jour
    const caJour = await Facture.aggregate([
      { $match: { ...filtreBase, createdAt: { $gte: debutJour() } } },
      { $group: { _id: null, total: { $sum: '$totalTTC' },
                  count: { $sum: 1 } } }
    ]);

    // CA du mois
    const caMois = await Facture.aggregate([
      { $match: { ...filtreBase, createdAt: { $gte: debutMois() } } },
      { $group: { _id: null, total: { $sum: '$totalTTC' },
                  count: { $sum: 1 } } }
    ]);

    // CA de l'année
    const caAnnee = await Facture.aggregate([
      { $match: { ...filtreBase, createdAt: { $gte: debutAnnee() } } },
      { $group: { _id: null, total: { $sum: '$totalTTC' } } }
    ]);

    // Mois précédent
    const debutMoisPrec = new Date(
      new Date().getFullYear(), new Date().getMonth() - 1, 1
    );
    const finMoisPrec = new Date(
      new Date().getFullYear(), new Date().getMonth(), 0
    );
    const caMoisPrec = await Facture.aggregate([
      { $match: {
          ...filtreBase,
          createdAt: { $gte: debutMoisPrec, $lte: finMoisPrec }
      }},
      { $group: { _id: null, total: { $sum: '$totalTTC' } } }
    ]);

    const totalMois     = caMois[0]?.total || 0;
    const totalMoisPrec = caMoisPrec[0]?.total || 0;
    const evolutionMois = totalMoisPrec > 0
      ? Math.round(((totalMois - totalMoisPrec) / totalMoisPrec) * 100)
      : 0;

    // Impayés
    const filtreImpaye = {
      statut: { $in: ['en_attente', 'partiellement_payee'] }
    };
    if (magasinOId) filtreImpaye.magasin = magasinOId;
    const impayes = await Facture.aggregate([
      { $match: filtreImpaye },
      { $group: { _id: null, total: { $sum: '$montantRestant' },
                  count: { $sum: 1 } } }
    ]);

    // Nouveaux clients du mois
    const nouveauxClients = await Client.countDocuments({
      createdAt: { $gte: debutMois() }, isActive: true
    });

    // Stocks en alerte
    const articles = await Article.find({
      isDeleted: false, isActive: true
    });
    let stocksEnAlerte = 0;
    let stocksRupture  = 0;

    for (const art of articles) {
      const filtreStock = { article: art._id };
      if (magasinOId) filtreStock.magasin = magasinOId;
      const stocks = await Stock.find(filtreStock);
      const total  = stocks.reduce((s, st) => s + st.quantite, 0);
      if (total === 0) stocksRupture++;
      else if (total <= art.stockMinimum) stocksEnAlerte++;
    }

    // Commandes en cours
    const filtreCom = {
      statut: { $in: ['brouillon', 'validee', 'en_cours'] }
    };
    if (magasinOId) filtreCom.magasin = magasinOId;
    const commandesEnCours = await CommandeFournisseur.countDocuments(filtreCom);

    // Transferts en attente
    const filtreTransfert = {
      statut: { $in: ['en_attente', 'valide'] }
    };
    if (magasinOId) {
      filtreTransfert.$or = [
        { magasinSource: magasinOId },
        { magasinDestination: magasinOId }
      ];
    }
    const transfertsEnAttente =
      await Transfert.countDocuments(filtreTransfert);

    return success(res, {
      caJour:    { total: caJour[0]?.total  || 0,
                   count: caJour[0]?.count  || 0 },
      caMois:    { total: totalMois,
                   count: caMois[0]?.count  || 0,
                   evolution: evolutionMois },
      caAnnee:   { total: caAnnee[0]?.total || 0 },
      impayes:   { total: impayes[0]?.total || 0,
                   count: impayes[0]?.count || 0 },
      nouveauxClients,
      stocksEnAlerte,
      stocksRupture,
      commandesEnCours,
      transfertsEnAttente
    });
  } catch (err) {
    console.error('getKpis error:', err);
    return error(res, err.message);
  }
};

// @desc    CA par jour (30 derniers jours)
const getCaJournalier = async (req, res) => {
  try {
    const magasinOId = toObjectId(req.query.magasin);
    const debut = new Date();
    debut.setDate(debut.getDate() - 29);
    debut.setHours(0, 0, 0, 0);

    const filtre = {
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debut }
    };
    if (magasinOId) filtre.magasin = magasinOId;

    const data = await Facture.aggregate([
      { $match: filtre },
      { $group: {
          _id: {
            jour:  { $dayOfMonth: '$createdAt' },
            mois:  { $month: '$createdAt' },
            annee: { $year: '$createdAt' }
          },
          totalTTC:   { $sum: '$totalTTC' },
          totalPaye:  { $sum: '$montantPaye' },
          nbFactures: { $sum: 1 }
      }},
      { $sort: { '_id.annee': 1, '_id.mois': 1, '_id.jour': 1 } }
    ]);

    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date  = new Date();
      date.setDate(date.getDate() - i);
      const jour  = date.getDate();
      const mois  = date.getMonth() + 1;
      const annee = date.getFullYear();
      const found = data.find(
        (d) => d._id.jour === jour &&
               d._id.mois === mois &&
               d._id.annee === annee
      );
      result.push({
        date: `${String(jour).padStart(2,'0')}/${String(mois).padStart(2,'0')}`,
        dateComplete: date.toISOString().split('T')[0],
        totalTTC:   found?.totalTTC   || 0,
        totalPaye:  found?.totalPaye  || 0,
        nbFactures: found?.nbFactures || 0
      });
    }

    return success(res, result);
  } catch (err) {
    console.error('getCaJournalier error:', err);
    return error(res, err.message);
  }
};

// @desc    CA par mois (12 derniers mois)
const getCaMensuel = async (req, res) => {
  try {
    const magasinOId = toObjectId(req.query.magasin);
    const debut = new Date();
    debut.setMonth(debut.getMonth() - 11);
    debut.setDate(1);
    debut.setHours(0, 0, 0, 0);

    const filtre = {
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debut }
    };
    if (magasinOId) filtre.magasin = magasinOId;

    const data = await Facture.aggregate([
      { $match: filtre },
      { $group: {
          _id: {
            mois:  { $month: '$createdAt' },
            annee: { $year: '$createdAt' }
          },
          totalTTC:   { $sum: '$totalTTC' },
          totalPaye:  { $sum: '$montantPaye' },
          nbFactures: { $sum: 1 }
      }},
      { $sort: { '_id.annee': 1, '_id.mois': 1 } }
    ]);

    const moisLabels = [
      'Jan','Fév','Mar','Avr','Mai','Jun',
      'Jul','Aoû','Sep','Oct','Nov','Déc'
    ];
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const date  = new Date();
      date.setMonth(date.getMonth() - i);
      const mois  = date.getMonth() + 1;
      const annee = date.getFullYear();
      const found = data.find(
        (d) => d._id.mois === mois && d._id.annee === annee
      );
      result.push({
        mois:       moisLabels[mois - 1],
        annee,
        totalTTC:   found?.totalTTC   || 0,
        totalPaye:  found?.totalPaye  || 0,
        nbFactures: found?.nbFactures || 0
      });
    }

    return success(res, result);
  } catch (err) {
    console.error('getCaMensuel error:', err);
    return error(res, err.message);
  }
};

// @desc    Top produits vendus
const getTopProduits = async (req, res) => {
  try {
    const magasinOId = toObjectId(req.query.magasin);
    const { limit = 10, periode = 'mois' } = req.query;

    const debut = periode === 'jour'    ? debutJour()
                : periode === 'semaine' ? debutSemaine()
                : periode === 'mois'    ? debutMois()
                : debutAnnee();

    const filtre = {
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debut }
    };
    if (magasinOId) filtre.magasin = magasinOId;

    const topVentes = await Facture.aggregate([
      { $match: filtre },
      { $unwind: '$lignes' },
      { $group: {
          _id:           '$lignes.article',
          designation:   { $first: '$lignes.designation' },
          quantiteTotal: { $sum: '$lignes.quantite' },
          caTotal:       { $sum: '$lignes.montantTTC' }
      }},
      { $sort: { quantiteTotal: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from:         'articles',
          localField:   '_id',
          foreignField: '_id',
          as:           'article'
        }
      },
      {
        $unwind: {
          path: '$article',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    return success(res, topVentes);
  } catch (err) {
    console.error('getTopProduits error:', err);
    return error(res, err.message);
  }
};

// @desc    CA par catégorie
const getCaParCategorie = async (req, res) => {
  try {
    const magasinOId = toObjectId(req.query.magasin);

    const filtre = {
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debutMois() }
    };
    if (magasinOId) filtre.magasin = magasinOId;

    const data = await Facture.aggregate([
      { $match: filtre },
      { $unwind: '$lignes' },
      {
        $lookup: {
          from:         'articles',
          localField:   'lignes.article',
          foreignField: '_id',
          as:           'articleInfo'
        }
      },
      {
        $unwind: {
          path: '$articleInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from:         'categories',
          localField:   'articleInfo.categorie',
          foreignField: '_id',
          as:           'categorieInfo'
        }
      },
      {
        $unwind: {
          path: '$categorieInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id:   '$categorieInfo._id',
          nom:   { $first: '$categorieInfo.nom' },
          total: { $sum: '$lignes.montantTTC' }
        }
      },
      { $match: { nom: { $ne: null } } },
      { $sort: { total: -1 } }
    ]);

    return success(res, data);
  } catch (err) {
    console.error('getCaParCategorie error:', err);
    return error(res, err.message);
  }
};

// @desc    Dernières ventes
const getDernieresVentes = async (req, res) => {
  try {
    const magasinOId = toObjectId(req.query.magasin);
    const { limit = 8 } = req.query;

    const filtre = { statut: { $ne: 'annulee' } };
    if (magasinOId) filtre.magasin = magasinOId;

    const factures = await Facture.find(filtre)
      .populate('client',  'nom prenom numeroClient')
      .populate('magasin', 'nom code')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return success(res, factures);
  } catch (err) {
    console.error('getDernieresVentes error:', err);
    return error(res, err.message);
  }
};

// @desc    Alertes groupées
const getAlertes = async (req, res) => {
  try {
    const magasinOId = toObjectId(req.query.magasin);

    // Stocks faibles
    const articles = await Article.find({
      isDeleted: false, isActive: true
    });
    const stocksFaibles = [];

    for (const art of articles) {
      const filtreStock = { article: art._id };
      if (magasinOId) filtreStock.magasin = magasinOId;
      const stocks = await Stock.find(filtreStock)
        .populate('magasin', 'nom code');
      const total = stocks.reduce((s, st) => s + st.quantite, 0);
      if (total <= art.stockMinimum) {
        stocksFaibles.push({
          article: {
            _id:         art._id,
            designation: art.designation,
            reference:   art.reference
          },
          stockTotal:   total,
          stockMinimum: art.stockMinimum,
          rupture:      total === 0,
          stocks
        });
      }
    }

    // Factures impayées
    const filtreImpaye = {
      statut: { $in: ['en_attente', 'partiellement_payee'] }
    };
    if (magasinOId) filtreImpaye.magasin = magasinOId;
    const impayes = await Facture.find(filtreImpaye)
      .populate('client', 'nom prenom telephone')
      .sort({ createdAt: 1 })
      .limit(5);

    // Commandes à réceptionner
    const filtreCom = { statut: { $in: ['validee', 'en_cours'] } };
    if (magasinOId) filtreCom.magasin = magasinOId;
    const commandesAttente = await CommandeFournisseur.find(filtreCom)
      .populate('fournisseur', 'raisonSociale')
      .sort({ dateLivraisonPrevue: 1 })
      .limit(5);

    // Transferts en attente
    const filtreTransfert = { statut: 'en_attente' };
    if (magasinOId) {
      filtreTransfert.$or = [
        { magasinSource:      magasinOId },
        { magasinDestination: magasinOId }
      ];
    }
    const transfertsAttente = await Transfert.find(filtreTransfert)
      .populate('magasinSource',      'nom')
      .populate('magasinDestination', 'nom')
      .limit(5);

    return success(res, {
      stocksFaibles:     stocksFaibles.slice(0, 10),
      impayes,
      commandesAttente,
      transfertsAttente,
      resume: {
        nbStocksFaibles:     stocksFaibles.length,
        nbRuptures:          stocksFaibles.filter((s) => s.rupture).length,
        nbImpayes:           impayes.length,
        nbCommandesAttente:  commandesAttente.length,
        nbTransfertsAttente: transfertsAttente.length
      }
    });
  } catch (err) {
    console.error('getAlertes error:', err);
    return error(res, err.message);
  }
};

module.exports = {
  getKpis, getCaJournalier, getCaMensuel,
  getTopProduits, getCaParCategorie,
  getDernieresVentes, getAlertes
};