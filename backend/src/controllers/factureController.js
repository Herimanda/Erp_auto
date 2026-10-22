const Facture = require("../models/Facture");
const Stock = require("../models/Stock");
const MouvementStock = require("../models/MouvementStock");
const Client = require("../models/Client");
const Article = require("../models/Article");
const Avoir = require("../models/Avoir");
const generateNumero = require("../utils/generateNumero");
const { calculerTotaux } = require("../utils/calculLignes");
const { success, error } = require("../utils/apiResponse");
const { notifierParRole } = require("../utils/NotificationHelper");

const { filtreMagasin, peutAcceder } = require("../utils/magasinScope");

// Petit utilitaire de formatage monétaire (Ariary, sans décimales)
const formatMontant = (montant) => {
  return new Intl.NumberFormat("fr-FR").format(montant) + " Ar";
};

const creerFacture = async (req, res) => {
  try {
    const {
      type = "comptoir",
      client,
      magasin,
      lignes,
      remiseGlobale = 0,
      notes,
      paiementInitial,
    } = req.body;

    // Enrichir et calculer lignes
    const lignesEnrichies = await Promise.all(
      lignes.map(async (ligne) => {
        const article = await Article.findById(ligne.article);
        if (!article) throw new Error(`Article ${ligne.article} introuvable.`);

        // Vérifier stock
        const stock = await Stock.findOne({
          article: ligne.article,
          magasin,
        });
        const qteDisponible = stock?.quantite || 0;
        if (qteDisponible < ligne.quantite) {
          throw new Error(
            `Stock insuffisant pour "${article.designation}". 
             Disponible: ${qteDisponible}, Demandé: ${ligne.quantite}`,
          );
        }

        return {
          article: ligne.article,
          designation: article.designation,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire || article.prixVente,
          tva: ligne.tva || article.tva,
          remise: ligne.remise || 0,
        };
      }),
    );

    const {
      lignes: lignesCalc,
      totalHT,
      totalTVA,
      totalTTC,
    } = calculerTotaux(lignesEnrichies, remiseGlobale);

    // Paiement initial si comptoir
    const paiements = [];
    let montantPaye = 0;

    if (paiementInitial && paiementInitial.montant > 0) {
      // Si le paiement initial se fait par avoir, on valide le crédit ici aussi
      if (paiementInitial.mode === "avoir") {
        if (!paiementInitial.avoirId) {
          throw new Error("avoirId requis pour un paiement initial par avoir.");
        }
        const avoir = await Avoir.findById(paiementInitial.avoirId);
        if (!avoir) throw new Error("Avoir introuvable.");
        if (avoir.statut !== "valide") throw new Error("Avoir non validé.");
        if (avoir.client.toString() !== client.toString()) {
          throw new Error("Cet avoir n'appartient pas à ce client.");
        }
        if (avoir.soldeRestant < paiementInitial.montant) {
          throw new Error(`Crédit avoir insuffisant (${avoir.soldeRestant}).`);
        }

        avoir.soldeRestant -= paiementInitial.montant;
        avoir.statut = avoir.soldeRestant === 0 ? "consomme" : "valide";
        await avoir.save();
      }

      paiements.push({
        date: new Date(),
        montant: paiementInitial.montant,
        mode: paiementInitial.mode || "especes",
        reference: paiementInitial.reference,
        avoir:
          paiementInitial.mode === "avoir"
            ? paiementInitial.avoirId
            : undefined,
      });
      montantPaye = paiementInitial.montant;
    }

    const montantRestant = totalTTC - montantPaye;
    const statut =
      montantPaye >= totalTTC
        ? "payee"
        : montantPaye > 0
          ? "partiellement_payee"
          : "en_attente";

    const numero = await generateNumero(Facture, "FAC");

    const facture = await Facture.create({
      numero,
      type,
      client,
      magasin,
      lignes: lignesCalc,
      totalHT,
      totalTVA,
      totalTTC,
      remiseGlobale,
      montantPaye,
      montantRestant,
      paiements,
      statut,
      notes,
      creePar: req.user._id,
    });

    // Déduire stocks + mouvements
    for (const ligne of lignesCalc) {
      const stock = await Stock.findOne({
        article: ligne.article,
        magasin,
      });
      const quantiteAvant = stock.quantite;
      stock.quantite -= ligne.quantite;
      await stock.save();

      await MouvementStock.create({
        type: "vente",
        article: ligne.article,
        magasin,
        quantite: ligne.quantite,
        quantiteAvant,
        quantiteApres: stock.quantite,
        prixUnitaire: ligne.prixUnitaire,
        reference: facture.numero,
        utilisateur: req.user._id,
      });
    }

    // Mettre à jour solde client si crédit restant
    if (montantRestant > 0) {
      await notifierParRole(
        ["administrateur", "gestionnaire"],
        {
          type: "facture_impayee",
          titre: "Nouvelle facture à crédit",
          message: `Facture ${facture.numero} — ${formatMontant(montantRestant)} restant`,
          lien: "/factures",
          entiteId: facture._id,
        },
        magasin,
      );
    }

    return success(
      res,
      await facture.populate([
        { path: "client", select: "nom prenom societe numeroClient" },
        { path: "magasin", select: "nom code" },
        { path: "creePar", select: "nom prenom" },
      ]),
      "Facture créée avec succès.",
      201,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

const getFactures = async (req, res) => {
  try {
    const {
      client,
      magasin,
      type,
      statut,
      dateDebut,
      dateFin,
      page = 1,
      limit = 20,
    } = req.query;

    const filtre = { statut: { $ne: "annulee" } };
    if (client) filtre.client = client;

    const f = filtreMagasin(req.user, magasin);
    if (f.refuse) return error(res, "Accès refusé à ce magasin.", 403);
    if (f.valeur) filtre.magasin = f.valeur;
    if (type) filtre.type = type;
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

    const total = await Facture.countDocuments(filtre);
    const factures = await Facture.find(filtre)
      .populate("client", "nom prenom societe numeroClient")
      .populate("magasin", "nom code")
      .populate("creePar", "nom prenom")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Totaux globaux
    const totaux = await Facture.aggregate([
      { $match: filtre },
      {
        $group: {
          _id: null,
          totalTTC: { $sum: "$totalTTC" },
          totalPaye: { $sum: "$montantPaye" },
          totalRestant: { $sum: "$montantRestant" },
        },
      },
    ]);

    return success(res, {
      factures,
      totaux: totaux[0] || { totalTTC: 0, totalPaye: 0, totalRestant: 0 },
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

const getFacture = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)

      .populate("client")
      .populate("magasin")
      .populate("lignes.article", "designation reference")
      .populate("creePar", "nom prenom")
      .populate("devisOrigine", "numero")
      .populate("avoirs", "numero statut totalTTC soldeRestant");

    if (!facture) return error(res, "Facture introuvable.", 404);
    if (!peutAcceder(req.user, facture.magasin)) {
      return error(res, "Facture introuvable.", 404); // 404 pour ne pas révéler l'existence
    }
    return success(res, facture);
  } catch (err) {
    return error(res, err.message);
  }
};

const enregistrerPaiement = async (req, res) => {
  try {
    const { montant, mode, reference, avoirId } = req.body;

    const facture = await Facture.findById(req.params.id);
    if (!facture) return error(res, "Facture introuvable.", 404);
    if (!peutAcceder(req.user, facture.magasin)) {
      return error(res, "Facture introuvable.", 404); // 404 pour ne pas révéler l'existence
    }

    if (facture.statut === "payee") {
      return error(res, "Facture déjà entièrement payée.", 400);
    }
    if (facture.statut === "annulee") {
      return error(res, "Facture annulée.", 400);
    }
    if (montant > facture.montantRestant) {
      return error(
        res,
        `Montant supérieur au restant dû (${facture.montantRestant}).`,
        400,
      );
    }

    let avoir = null;

    // ── Paiement par avoir ────────────────────────────────────────────
    if (mode === "avoir") {
      if (!avoirId) {
        return error(res, "avoirId requis pour un paiement par avoir.", 400);
      }

      avoir = await Avoir.findById(avoirId);
      if (!avoir) return error(res, "Avoir introuvable.", 404);
      if (avoir.statut !== "valide") {
        return error(res, "Avoir non validé ou déjà consommé/annulé.", 400);
      }
      if (avoir.client.toString() !== facture.client.toString()) {
        return error(
          res,
          "Cet avoir n'appartient pas au client de cette facture.",
          400,
        );
      }
      if (avoir.soldeRestant < montant) {
        return error(
          res,
          `Crédit avoir insuffisant. Disponible: ${avoir.soldeRestant}.`,
          400,
        );
      }

      // Consommer le crédit de l'avoir
      avoir.soldeRestant -= montant;
      avoir.statut = avoir.soldeRestant === 0 ? "consomme" : "valide";
      await avoir.save();
    }
    // ─────────────────────────────────────────────────────────────────

    facture.paiements.push({
      date: new Date(),
      montant,
      mode,
      reference,
      avoir: mode === "avoir" ? avoirId : undefined,
    });

    facture.montantPaye += montant;
    facture.montantRestant -= montant;

    facture.statut =
      facture.montantRestant <= 0 ? "payee" : "partiellement_payee";

    await facture.save();

    // Mettre à jour le solde client.
    // Pour un paiement classique, le client doit moins (solde -= montant).
    // Pour un paiement par avoir, le solde a déjà été ajusté lors de la
    // validation de l'avoir (crédit accordé) — on ne le touche donc pas
    // une seconde fois ici pour éviter de compter le crédit deux fois.
    if (mode !== "avoir") {
      await Client.findByIdAndUpdate(facture.client, {
        $inc: { solde: -montant },
      });
    }

    return success(
      res,
      await facture.populate([
        { path: "client", select: "nom prenom societe numeroClient" },
        { path: "magasin", select: "nom code" },
      ]),
      "Paiement enregistré.",
    );
  } catch (err) {
    return error(res, err.message);
  }
};

const annulerFacture = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id);
    if (!facture) return error(res, "Facture introuvable.", 404);
    if (!peutAcceder(req.user, facture.magasin)) {
      return error(res, "Facture introuvable.", 404); // 404 pour ne pas révéler l'existence
    }

    if (facture.statut === "annulee") {
      return error(res, "Facture déjà annulée.", 400);
    }

    // Empêcher l'annulation si des avoirs actifs existent sur cette facture
    const avoirsActifs = await Avoir.countDocuments({
      factureOrigine: facture._id,
      statut: { $in: ["en_attente", "valide", "consomme"] },
    });
    if (avoirsActifs > 0) {
      return error(
        res,
        "Impossible d'annuler : des avoirs existent sur cette facture. Annulez-les d'abord.",
        400,
      );
    }

    // Remettre les stocks
    for (const ligne of facture.lignes) {
      const stock = await Stock.findOne({
        article: ligne.article,
        magasin: facture.magasin,
      });
      if (stock) {
        const quantiteAvant = stock.quantite;
        stock.quantite += ligne.quantite;
        await stock.save();

        await MouvementStock.create({
          type: "retour_client",
          article: ligne.article,
          magasin: facture.magasin,
          quantite: ligne.quantite,
          quantiteAvant,
          quantiteApres: stock.quantite,
          motif: "correction_erreur",
          reference: `ANN-${facture.numero}`,
          utilisateur: req.user._id,
        });
      }
    }

    // Remettre solde client (seulement la part due, pas déjà payée)
    if (facture.montantRestant > 0) {
      await Client.findByIdAndUpdate(facture.client, {
        $inc: { solde: -facture.montantRestant },
      });
    }

    facture.statut = "annulee";
    await facture.save();

    return success(res, facture, "Facture annulée. Stocks remis.");
  } catch (err) {
    return error(res, err.message);
  }
};

const getFacturesImpayees = async (req, res) => {
  try {
    const { magasin } = req.query;
    const filtre = {
      statut: { $in: ["en_attente", "partiellement_payee"] },
    };
    if (magasin) filtre.magasin = magasin;

    const factures = await Facture.find(filtre)
      .populate("client", "nom prenom societe telephone")
      .populate("magasin", "nom code")
      .sort({ createdAt: 1 }); // Plus anciennes en premier

    const totalImpaye = factures.reduce((s, f) => s + f.montantRestant, 0);

    return success(res, { factures, totalImpaye });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerFacture,
  getFactures,
  getFacture,
  enregistrerPaiement,
  annulerFacture,
  getFacturesImpayees,
};
