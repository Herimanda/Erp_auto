const CommandeFournisseur = require('../models/CommandeFournisseur');
const Stock = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const Article = require('../models/Article');
const generateNumero = require('../utils/generateNumero');
const { success, error } = require('../utils/apiResponse');

// Calculer les totaux d'une commande
const calculerTotaux = (lignes) => {
  return lignes.reduce((total, ligne) => {
    const montantHT = ligne.quantiteCommandee * (ligne.prixUnitaire || 0);
    ligne.montantHT = montantHT;
    return total + montantHT;
  }, 0);
};


const creerCommande = async (req, res) => {
  try {
    const {
      fournisseur, magasin, lignes,
      dateLivraisonPrevue, notes
    } = req.body;

    // Enrichir les lignes avec désignations articles
    const lignesEnrichies = await Promise.all(
      lignes.map(async (ligne) => {
        const article = await Article.findById(ligne.article);
        return {
          ...ligne,
          designation: article?.designation || '',
          prixUnitaire: ligne.prixUnitaire || article?.prixAchat || 0
        };
      })
    );

    const totalHT = calculerTotaux(lignesEnrichies);
    const numero = await generateNumero(CommandeFournisseur, 'CMD');

    const commande = await CommandeFournisseur.create({
      numero, fournisseur, magasin,
      lignes: lignesEnrichies,
      totalHT, dateLivraisonPrevue,
      notes, creePar: req.user._id
    });

    return success(
      res,
      await commande.populate([
        { path: 'fournisseur', select: 'raisonSociale reference' },
        { path: 'magasin', select: 'nom code' },
        { path: 'lignes.article', select: 'designation reference' }
      ]),
      'Commande fournisseur créée.',
      201
    );
  } catch (err) {
    return error(res, err.message);
  }
};


const validerCommande = async (req, res) => {
  try {
    const commande = await CommandeFournisseur.findById(req.params.id);
    if (!commande) return error(res, 'Commande introuvable.', 404);

    if (commande.statut !== 'brouillon') {
      return error(res, 'Seul un brouillon peut être validé.', 400);
    }

    commande.statut = 'validee';
    await commande.save();

    return success(res, commande, 'Commande validée.');
  } catch (err) {
    return error(res, err.message);
  }
};


const receptionnerCommande = async (req, res) => {
  try {
    const { lignesRecues } = req.body;
    // lignesRecues: [{ articleId, quantiteRecue, prixUnitaire }]

    const commande = await CommandeFournisseur.findById(req.params.id);
    if (!commande) return error(res, 'Commande introuvable.', 404);

    if (!['validee', 'en_cours'].includes(commande.statut)) {
      return error(res, 'La commande doit être validée pour réception.', 400);
    }

    let toutRecu = true;

    for (const ligneRecue of lignesRecues) {
      const ligneCom = commande.lignes.find(
        l => l.article.toString() === ligneRecue.articleId
      );
      if (!ligneCom) continue;

      ligneCom.quantiteRecue += ligneRecue.quantiteRecue;
      if (ligneRecue.prixUnitaire) {
        ligneCom.prixUnitaire = ligneRecue.prixUnitaire;
      }

      if (ligneCom.quantiteRecue < ligneCom.quantiteCommandee) {
        toutRecu = false;
      }

      // Entrée de stock
      let stock = await Stock.findOne({
        article: ligneRecue.articleId,
        magasin: commande.magasin
      });

      if (!stock) {
        stock = await Stock.create({
          article: ligneRecue.articleId,
          magasin: commande.magasin,
          quantite: 0
        });
      }

      const quantiteAvant = stock.quantite;
      stock.quantite += ligneRecue.quantiteRecue;
      await stock.save();

      // Mettre à jour prix achat article
      if (ligneRecue.prixUnitaire) {
        await Article.findByIdAndUpdate(
          ligneRecue.articleId,
          { prixAchat: ligneRecue.prixUnitaire }
        );
      }

      await MouvementStock.create({
        type: 'achat_fournisseur',
        article: ligneRecue.articleId,
        magasin: commande.magasin,
        quantite: ligneRecue.quantiteRecue,
        quantiteAvant,
        quantiteApres: stock.quantite,
        prixUnitaire: ligneRecue.prixUnitaire || ligneCom.prixUnitaire,
        reference: commande.numero,
        utilisateur: req.user._id
      });
    }

    commande.statut = toutRecu ? 'recue' : 'en_cours';
    commande.dateLivraisonReelle = toutRecu ? new Date() : undefined;
    await commande.save();

    return success(
      res,
      await commande.populate([
        { path: 'fournisseur', select: 'raisonSociale' },
        { path: 'magasin', select: 'nom code' },
        { path: 'lignes.article', select: 'designation reference' }
      ]),
      `Réception enregistrée. Statut : ${commande.statut}`
    );
  } catch (err) {
    return error(res, err.message);
  }
};


const annulerCommande = async (req, res) => {
  try {
    const commande = await CommandeFournisseur.findById(req.params.id);
    if (!commande) return error(res, 'Commande introuvable.', 404);

    if (['recue', 'annulee'].includes(commande.statut)) {
      return error(res, `Impossible d'annuler une commande ${commande.statut}.`, 400);
    }

    commande.statut = 'annulee';
    await commande.save();

    return success(res, commande, 'Commande annulée.');
  } catch (err) {
    return error(res, err.message);
  }
};


const modifierCommande = async (req, res) => {
  try {
    const commande = await CommandeFournisseur.findById(req.params.id);
    if (!commande) return error(res, 'Commande introuvable.', 404);

    if (commande.statut !== 'brouillon') {
      return error(res, 'Seul un brouillon peut être modifié.', 400);
    }

    const { lignes, dateLivraisonPrevue, notes } = req.body;

    if (lignes) {
      const lignesEnrichies = await Promise.all(
        lignes.map(async (ligne) => {
          const article = await Article.findById(ligne.article);
          return {
            ...ligne,
            designation: article?.designation || '',
            prixUnitaire: ligne.prixUnitaire || article?.prixAchat || 0
          };
        })
      );
      commande.lignes = lignesEnrichies;
      commande.totalHT = calculerTotaux(lignesEnrichies);
    }

    if (dateLivraisonPrevue) commande.dateLivraisonPrevue = dateLivraisonPrevue;
    if (notes !== undefined) commande.notes = notes;

    await commande.save();

    return success(res, commande, 'Commande modifiée.');
  } catch (err) {
    return error(res, err.message);
  }
};


const getCommandes = async (req, res) => {
  try {
    const {
      fournisseur, magasin, statut,
      dateDebut, dateFin,
      page = 1, limit = 20
    } = req.query;

    const filtre = {};
    if (fournisseur) filtre.fournisseur = fournisseur;
    if (magasin) filtre.magasin = magasin;
    if (statut) filtre.statut = statut;
    if (dateDebut || dateFin) {
      filtre.createdAt = {};
      if (dateDebut) filtre.createdAt.$gte = new Date(dateDebut);
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59);
        filtre.createdAt.$lte = fin;
      }
    }

    const total = await CommandeFournisseur.countDocuments(filtre);
    const commandes = await CommandeFournisseur.find(filtre)
      .populate('fournisseur', 'raisonSociale reference')
      .populate('magasin', 'nom code')
      .populate('creePar', 'nom prenom')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      commandes,
      pagination: {
        total, page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, err.message);
  }
};


const getCommande = async (req, res) => {
  try {
    const commande = await CommandeFournisseur.findById(req.params.id)
      .populate('fournisseur')
      .populate('magasin', 'nom code adresse')
      .populate('lignes.article', 'designation reference prixAchat')
      .populate('creePar', 'nom prenom');

    if (!commande) return error(res, 'Commande introuvable.', 404);
    return success(res, commande);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerCommande, validerCommande,
  receptionnerCommande, annulerCommande,
  modifierCommande, getCommandes, getCommande
};