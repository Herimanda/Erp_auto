const Stock = require("../models/Stock");
const Article = require("../models/Article");
const MouvementStock = require("../models/MouvementStock");
const { success, error } = require("../utils/apiResponse");
const { notifierParRole } = require("../utils/NotificationHelper");
const { filtreMagasin, peutAcceder } = require('../utils/magasinScope');

// Fonction utilitaire : mettre à jour le stock
const updateStock = async (articleId, magasinId, quantite, type) => {
  let stock = await Stock.findOne({
    article: articleId,
    magasin: magasinId,
  });

  if (!stock) {
    stock = await Stock.create({
      article: articleId,
      magasin: magasinId,
      quantite: 0,
    });
  }

  const quantiteAvant = stock.quantite;
  const entreesTypes = [
    "achat_fournisseur",
    "retour_client",
    "ajustement_positif",
    "transfert_entrant",
  ];

  if (entreesTypes.includes(type)) {
    stock.quantite += quantite;
  } else {
    if (stock.quantite < quantite) {
      throw new Error(
        `Stock insuffisant. Disponible: ${stock.quantite}, Demandé: ${quantite}`,
      );
    }
    stock.quantite -= quantite;
  }

  await stock.save();

  // Vérification du seuil de stock minimum et notification
  const article = await Article.findById(articleId);
  if (article && stock.quantite <= article.stockMinimum) {
    await notifierParRole(
      ["administrateur", "gestionnaire"],
      {
        type: "stock_minimum",
        titre: stock.quantite === 0 ? "Rupture de stock" : "Stock faible",
        message: `${article.designation} : ${stock.quantite} unité(s) restante(s) (seuil: ${article.stockMinimum})`,
        lien: "/stocks",
        entiteId: article._id,
      },
      magasinId,
    );
  }

  return { quantiteAvant, quantiteApres: stock.quantite };
};

// Entrée de stock manuelle

const entreeStock = async (req, res) => {
  try {
    const {
      articleId,
      magasinId,
      quantite,
      type,
      motif,
      reference,
      prixUnitaire,
    } = req.body;

    const entreesValides = [
      "achat_fournisseur",
      "retour_client",
      "ajustement_positif",
      "transfert_entrant",
    ];
    if (!entreesValides.includes(type)) {
      return error(res, "Type d'entrée invalide.", 400);
    }

    const article = await Article.findById(articleId);
    if (!article) return error(res, "Article introuvable.", 404);

    const { quantiteAvant, quantiteApres } = await updateStock(
      articleId,
      magasinId,
      quantite,
      type,
    );

    const mouvement = await MouvementStock.create({
      type,
      article: articleId,
      magasin: magasinId,
      quantite,
      quantiteAvant,
      quantiteApres,
      prixUnitaire: prixUnitaire || article.prixAchat,
      motif,
      reference,
      utilisateur: req.user._id,
    });

    return success(
      res,
      await mouvement.populate([
        { path: "article", select: "designation reference" },
        { path: "magasin", select: "nom code" },
        { path: "utilisateur", select: "nom prenom" },
      ]),
      "Entrée de stock enregistrée.",
      201,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

//Sortie de stock manuelle

const sortieStock = async (req, res) => {
  try {
    const { articleId, magasinId, quantite, type, motif, reference } = req.body;

    const sortiesValides = [
      "vente",
      "retour_fournisseur",
      "ajustement_negatif",
      "transfert_sortant",
    ];
    if (!sortiesValides.includes(type)) {
      return error(res, "Type de sortie invalide.", 400);
    }

    const article = await Article.findById(articleId);
    if (!article) return error(res, "Article introuvable.", 404);

    const { quantiteAvant, quantiteApres } = await updateStock(
      articleId,
      magasinId,
      quantite,
      type,
    );

    const mouvement = await MouvementStock.create({
      type,
      article: articleId,
      magasin: magasinId,
      quantite,
      quantiteAvant,
      quantiteApres,
      motif,
      reference,
      utilisateur: req.user._id,
    });

    return success(
      res,
      await mouvement.populate([
        { path: "article", select: "designation reference" },
        { path: "magasin", select: "nom code" },
        { path: "utilisateur", select: "nom prenom" },
      ]),
      "Sortie de stock enregistrée.",
      201,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

// Ajustement de stock avec motif

const ajustementStock = async (req, res) => {
  try {
    const { articleId, magasinId, nouvelleQuantite, motif } = req.body;

    const motifsValides = ["casse", "perte", "vol", "correction_erreur"];
    if (!motifsValides.includes(motif)) {
      return error(res, "Motif invalide.", 400);
    }

    let stock = await Stock.findOne({
      article: articleId,
      magasin: magasinId,
    });

    if (!stock) {
      stock = await Stock.create({
        article: articleId,
        magasin: magasinId,
        quantite: 0,
      });
    }

    const quantiteAvant = stock.quantite;
    const difference = nouvelleQuantite - quantiteAvant;
    const type = difference >= 0 ? "ajustement_positif" : "ajustement_negatif";

    stock.quantite = nouvelleQuantite;
    await stock.save();

    // Vérification du seuil de stock minimum et notification
    const article = await Article.findById(articleId);
    if (article && stock.quantite <= article.stockMinimum) {
      await notifierParRole(
        ["administrateur", "gestionnaire"],
        {
          type: "stock_minimum",
          titre: stock.quantite === 0 ? "Rupture de stock" : "Stock faible",
          message: `${article.designation} : ${stock.quantite} unité(s) restante(s) (seuil: ${article.stockMinimum})`,
          lien: "/stocks",
          entiteId: article._id,
        },
        magasinId,
      );
    }

    const mouvement = await MouvementStock.create({
      type,
      article: articleId,
      magasin: magasinId,
      quantite: Math.abs(difference),
      quantiteAvant,
      quantiteApres: nouvelleQuantite,
      motif,
      utilisateur: req.user._id,
    });

    return success(
      res,
      await mouvement.populate([
        { path: "article", select: "designation reference" },
        { path: "magasin", select: "nom code" },
      ]),
      `Stock ajusté : ${quantiteAvant} → ${nouvelleQuantite}`,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

// Historique des mouvements

const getHistorique = async (req, res) => {
  try {
    const {
      magasin,
      article,
      type,
      dateDebut,
      dateFin,
      page = 1,
      limit = 30,
    } = req.query;

    const filtre = {};
    const f = filtreMagasin(req.user, magasin);
    if (f.refuse) return error(res, "Accès refusé à ce magasin.", 403);
    if (f.valeur) filtre.magasin = f.valeur;
    if (article) filtre.article = article;
    if (type) filtre.type = type;
    if (dateDebut || dateFin) {
      filtre.createdAt = {};
      if (dateDebut) filtre.createdAt.$gte = new Date(dateDebut);
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59);
        filtre.createdAt.$lte = fin;
      }
    }

    const total = await MouvementStock.countDocuments(filtre);
    const mouvements = await MouvementStock.find(filtre)
      .populate("article", "designation reference")
      .populate("magasin", "nom code")
      .populate("utilisateur", "nom prenom")
      .populate("magasinSource", "nom code")
      .populate("magasinDestination", "nom code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      mouvements,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  entreeStock,
  sortieStock,
  ajustementStock,
  getHistorique,
};
