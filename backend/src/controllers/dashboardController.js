const Facture      = require('../models/Facture');
const Article      = require('../models/Article');
const Stock        = require('../models/Stock');
const Client       = require('../models/Client');
const CommandeFournisseur = require('../models/CommandeFournisseur');
const Transfert    = require('../models/Transfert');
const mongoose     = require('mongoose');
const { success, error } = require('../utils/apiResponse');
const { idsAutorises, peutAcceder } = require('../utils/magasinScope');

// ── Helpers dates ───────────────────────────────────────────────────────────
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

// ── Périmètre magasin ───────────────────────────────────────────────────────
const toOid = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * Détermine les magasins que la requête a le droit de consulter.
 *  - { refuse: true }      : magasin demandé invalide ou non autorisé
 *  - { ids: null }         : administrateur sans filtre -> tous les magasins
 *  - { ids: [ObjectId..] } : liste de magasins à utiliser dans les filtres
 * Un non-administrateur sans magasin assigné obtient { ids: [] } : aucun résultat.
 */
const perimetre = (req) => {
  const demande = req.query.magasin;
  if (demande) {
    if (
      typeof demande !== 'string' ||
      !mongoose.Types.ObjectId.isValid(demande) ||
      !peutAcceder(req.user, demande)
    ) {
      return { refuse: true };
    }
    return { ids: [toOid(demande)] };
  }
  const ids = idsAutorises(req.user);
  return { ids: ids === null ? null : ids.map(toOid) };
};

// Ajoute le filtre magasin (si nécessaire) à un objet de filtre
const avecMagasin = (filtre, ids, champ = 'magasin') =>
  ids ? { ...filtre, [champ]: { $in: ids } } : filtre;

// Transferts : un magasin est concerné s'il est source OU destination
const avecMagasinTransfert = (filtre, ids) =>
  ids
    ? {
        ...filtre,
        $or: [
          { magasinSource:      { $in: ids } },
          { magasinDestination: { $in: ids } }
        ]
      }
    : filtre;

const limiter = (valeur, defaut, max = 50) => {
  const n = parseInt(valeur, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : defaut;
};

const refuserMagasin = (res) =>
  error(res, 'Accès refusé à ce magasin.', 403);

// Stock total par article (une seule requête au lieu d'une par article)
const totauxStock = async (ids) => {
  const lignes = await Stock.aggregate([
    { $match: ids ? { magasin: { $in: ids } } : {} },
    { $group: { _id: '$article', total: { $sum: '$quantite' } } }
  ]);
  return new Map(lignes.map((l) => [String(l._id), l.total]));
};

const erreurServeur = (res, nom, err) => {
  console.error(`${nom} error:`, err);
  return error(res, 'Erreur serveur.');
};

// ── KPIs ────────────────────────────────────────────────────────────────────
const getKpis = async (req, res) => {
  try {
    const p = perimetre(req);
    if (p.refuse) return refuserMagasin(res);
    const { ids } = p;

    const filtreBase = avecMagasin({ statut: { $ne: 'annulee' } }, ids);

    const debutMoisPrec = new Date(
      new Date().getFullYear(), new Date().getMonth() - 1, 1
    );
    const finMoisPrec = new Date(
      new Date().getFullYear(), new Date().getMonth(), 0
    );
    finMoisPrec.setHours(23, 59, 59, 999);

    const somme = (debut, fin) => Facture.aggregate([
      { $match: {
          ...filtreBase,
          createdAt: fin ? { $gte: debut, $lte: fin } : { $gte: debut }
      }},
      { $group: { _id: null, total: { $sum: '$totalTTC' },
                  count: { $sum: 1 } } }
    ]);

    const filtreImpaye = avecMagasin(
      { statut: { $in: ['en_attente', 'partiellement_payee'] } }, ids
    );
    const filtreCom = avecMagasin(
      { statut: { $in: ['brouillon', 'validee', 'en_cours'] } }, ids
    );
    const filtreTransfert = avecMagasinTransfert(
      { statut: { $in: ['en_attente', 'valide'] } }, ids
    );

    const [
      caJour, caMois, caAnnee, caMoisPrec, impayes,
      nouveauxClients, articles, totaux,
      commandesEnCours, transfertsEnAttente
    ] = await Promise.all([
      somme(debutJour()),
      somme(debutMois()),
      somme(debutAnnee()),
      somme(debutMoisPrec, finMoisPrec),
      Facture.aggregate([
        { $match: filtreImpaye },
        { $group: { _id: null, total: { $sum: '$montantRestant' },
                    count: { $sum: 1 } } }
      ]),
      Client.countDocuments({ createdAt: { $gte: debutMois() }, isActive: true }),
      Article.find({ isDeleted: false, isActive: true })
        .select('_id stockMinimum').lean(),
      totauxStock(ids),
      CommandeFournisseur.countDocuments(filtreCom),
      Transfert.countDocuments(filtreTransfert)
    ]);

    const totalMois     = caMois[0]?.total || 0;
    const totalMoisPrec = caMoisPrec[0]?.total || 0;
    const evolutionMois = totalMoisPrec > 0
      ? Math.round(((totalMois - totalMoisPrec) / totalMoisPrec) * 100)
      : 0;

    let stocksEnAlerte = 0;
    let stocksRupture  = 0;
    for (const art of articles) {
      const total = totaux.get(String(art._id)) || 0;
      if (total === 0) stocksRupture++;
      else if (total <= art.stockMinimum) stocksEnAlerte++;
    }

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
    return erreurServeur(res, 'getKpis', err);
  }
};

// ── CA par jour (30 derniers jours) ─────────────────────────────────────────
const getCaJournalier = async (req, res) => {
  try {
    const p = perimetre(req);
    if (p.refuse) return refuserMagasin(res);

    const debut = new Date();
    debut.setDate(debut.getDate() - 29);
    debut.setHours(0, 0, 0, 0);

    const filtre = avecMagasin({
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debut }
    }, p.ids);

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
    return erreurServeur(res, 'getCaJournalier', err);
  }
};

// ── CA par mois (12 derniers mois) ──────────────────────────────────────────
const getCaMensuel = async (req, res) => {
  try {
    const p = perimetre(req);
    if (p.refuse) return refuserMagasin(res);

    const debut = new Date();
    debut.setDate(1);                       // d'abord le jour 1 : évite le
    debut.setMonth(debut.getMonth() - 11);  // débordement (ex. 31 -> mois court)
    debut.setHours(0, 0, 0, 0);

    const filtre = avecMagasin({
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debut }
    }, p.ids);

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
    const maintenant = new Date();
    for (let i = 11; i >= 0; i--) {
      // Date construite au 1er du mois : pas de débordement possible
      const date  = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
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
    return erreurServeur(res, 'getCaMensuel', err);
  }
};

// ── Top produits vendus ─────────────────────────────────────────────────────
const getTopProduits = async (req, res) => {
  try {
    const p = perimetre(req);
    if (p.refuse) return refuserMagasin(res);

    const { periode = 'mois' } = req.query;
    const limit = limiter(req.query.limit, 10);

    const debut = periode === 'jour'    ? debutJour()
                : periode === 'semaine' ? debutSemaine()
                : periode === 'mois'    ? debutMois()
                : debutAnnee();

    const filtre = avecMagasin({
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debut }
    }, p.ids);

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
      { $limit: limit },
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
      },
      // Le dashboard est lisible par tous les rôles : ne pas exposer le prix d'achat
      { $project: { 'article.prixAchat': 0 } }
    ]);

    return success(res, topVentes);
  } catch (err) {
    return erreurServeur(res, 'getTopProduits', err);
  }
};

// ── CA par catégorie ────────────────────────────────────────────────────────
const getCaParCategorie = async (req, res) => {
  try {
    const p = perimetre(req);
    if (p.refuse) return refuserMagasin(res);

    const filtre = avecMagasin({
      statut: { $ne: 'annulee' },
      createdAt: { $gte: debutMois() }
    }, p.ids);

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
    return erreurServeur(res, 'getCaParCategorie', err);
  }
};

// ── Dernières ventes ────────────────────────────────────────────────────────
const getDernieresVentes = async (req, res) => {
  try {
    const p = perimetre(req);
    if (p.refuse) return refuserMagasin(res);

    const limit = limiter(req.query.limit, 8);
    const filtre = avecMagasin({ statut: { $ne: 'annulee' } }, p.ids);

    const factures = await Facture.find(filtre)
      .populate('client',  'nom prenom numeroClient')
      .populate('magasin', 'nom code')
      .sort({ createdAt: -1 })
      .limit(limit);

    return success(res, factures);
  } catch (err) {
    return erreurServeur(res, 'getDernieresVentes', err);
  }
};

// ── Alertes groupées ────────────────────────────────────────────────────────
const getAlertes = async (req, res) => {
  try {
    const p = perimetre(req);
    if (p.refuse) return refuserMagasin(res);
    const { ids } = p;

    // Stocks faibles : 2 requêtes au lieu d'une par article
    const [articles, totaux] = await Promise.all([
      Article.find({ isDeleted: false, isActive: true })
        .select('_id designation reference stockMinimum').lean(),
      totauxStock(ids)
    ]);

    const faibles = [];
    for (const art of articles) {
      const total = totaux.get(String(art._id)) || 0;
      if (total <= art.stockMinimum) faibles.push({ art, total });
    }
    const nbRuptures = faibles.filter((f) => f.total === 0).length;

    // Détail par magasin uniquement pour les 10 articles affichés
    const affiches = faibles.slice(0, 10);
    const stocksAffiches = affiches.length
      ? await Stock.find(avecMagasin(
          { article: { $in: affiches.map((f) => f.art._id) } }, ids
        )).populate('magasin', 'nom code')
      : [];

    const stocksFaibles = affiches.map(({ art, total }) => ({
      article: {
        _id:         art._id,
        designation: art.designation,
        reference:   art.reference
      },
      stockTotal:   total,
      stockMinimum: art.stockMinimum,
      rupture:      total === 0,
      stocks: stocksAffiches.filter(
        (s) => String(s.article) === String(art._id)
      )
    }));

    // Factures impayées
    const filtreImpaye = avecMagasin(
      { statut: { $in: ['en_attente', 'partiellement_payee'] } }, ids
    );
    const impayes = await Facture.find(filtreImpaye)
      .populate('client', 'nom prenom telephone')
      .sort({ createdAt: 1 })
      .limit(5);

    // Commandes à réceptionner
    const filtreCom = avecMagasin(
      { statut: { $in: ['validee', 'en_cours'] } }, ids
    );
    const commandesAttente = await CommandeFournisseur.find(filtreCom)
      .populate('fournisseur', 'raisonSociale')
      .sort({ dateLivraisonPrevue: 1 })
      .limit(5);

    // Transferts en attente
    const filtreTransfert = avecMagasinTransfert({ statut: 'en_attente' }, ids);
    const transfertsAttente = await Transfert.find(filtreTransfert)
      .populate('magasinSource',      'nom')
      .populate('magasinDestination', 'nom')
      .limit(5);

    return success(res, {
      stocksFaibles,
      impayes,
      commandesAttente,
      transfertsAttente,
      resume: {
        nbStocksFaibles:     faibles.length,
        nbRuptures,
        nbImpayes:           impayes.length,
        nbCommandesAttente:  commandesAttente.length,
        nbTransfertsAttente: transfertsAttente.length
      }
    });
  } catch (err) {
    return erreurServeur(res, 'getAlertes', err);
  }
};

module.exports = {
  getKpis, getCaJournalier, getCaMensuel,
  getTopProduits, getCaParCategorie,
  getDernieresVentes, getAlertes
};