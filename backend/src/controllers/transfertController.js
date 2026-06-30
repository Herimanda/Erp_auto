const Transfert = require('../models/Transfert');
const Stock = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const generateNumero = require('../utils/generateNumero');
const { success, error } = require('../utils/apiResponse');
const { notifierParRole } = require('../utils/NotificationHelper');


const creerTransfert = async (req, res) => {
  try {
    const {
      magasinSource, magasinDestination,
      lignes, notes
    } = req.body;

    if (magasinSource === magasinDestination) {
      return error(res, 'Source et destination identiques.', 400);
    }

    // Vérifier stocks disponibles
    for (const ligne of lignes) {
      const stock = await Stock.findOne({
        article: ligne.article,
        magasin: magasinSource
      });
      if (!stock || stock.quantite < ligne.quantiteDemandee) {
        return error(
          res,
          `Stock insuffisant pour l'article ${ligne.article}. 
           Disponible: ${stock?.quantite || 0}`,
          400
        );
      }
    }

    const numero = await generateNumero(Transfert, 'TRF');

    const transfert = await Transfert.create({
      numero,
      magasinSource,
      magasinDestination,
      lignes,
      notes,
      demandePar: req.user._id,
      statut: 'en_attente'
    });

    return success(
      res,
      await transfert.populate([
        { path: 'magasinSource', select: 'nom code' },
        { path: 'magasinDestination', select: 'nom code' },
        { path: 'lignes.article', select: 'designation reference' },
        { path: 'demandePar', select: 'nom prenom' }
      ]),
      'Demande de transfert créée.',
      201
    );
  } catch (err) {
    return error(res, err.message);
  }
  await notifierParRole(
  ['administrateur', 'gestionnaire', 'magasinier'],
  {
    type: 'transfert_attente',
    titre: 'Nouveau transfert à valider',
    message: `Transfert ${numero} en attente de validation`,
    lien: '/transferts',
    entiteId: transfert._id
  },
  magasinDestination
);
};


const validerTransfert = async (req, res) => {
  try {
    const transfert = await Transfert.findById(req.params.id);
    if (!transfert) return error(res, 'Transfert introuvable.', 404);

    if (transfert.statut !== 'en_attente') {
      return error(res, `Transfert déjà ${transfert.statut}.`, 400);
    }

    transfert.statut = 'valide';
    transfert.validePar = req.user._id;
    transfert.dateValidation = new Date();
    await transfert.save();

    return success(res, transfert, 'Transfert validé.');
  } catch (err) {
    return error(res, err.message);
  }
};


const expedierTransfert = async (req, res) => {
  try {
    const transfert = await Transfert.findById(req.params.id);
    if (!transfert) return error(res, 'Transfert introuvable.', 404);

    if (transfert.statut !== 'valide') {
      return error(res, 'Le transfert doit être validé avant expédition.', 400);
    }

    // Déduire stock source + créer mouvements
    for (const ligne of transfert.lignes) {
      const stock = await Stock.findOne({
        article: ligne.article,
        magasin: transfert.magasinSource
      });

      if (!stock || stock.quantite < ligne.quantiteDemandee) {
        return error(
          res,
          `Stock insuffisant pour expédition. Article: ${ligne.article}`,
          400
        );
      }

      const quantiteAvant = stock.quantite;
      stock.quantite -= ligne.quantiteDemandee;
      await stock.save();

      await MouvementStock.create({
        type: 'transfert_sortant',
        article: ligne.article,
        magasin: transfert.magasinSource,
        quantite: ligne.quantiteDemandee,
        quantiteAvant,
        quantiteApres: stock.quantite,
        reference: transfert.numero,
        magasinSource: transfert.magasinSource,
        magasinDestination: transfert.magasinDestination,
        utilisateur: req.user._id
      });
    }

    transfert.statut = 'expedie';
    await transfert.save();

    return success(res, transfert, 'Transfert expédié. Stock source mis à jour.');
  } catch (err) {
    return error(res, err.message);
  }
};


const receptionnerTransfert = async (req, res) => {
  try {
    const { quantitesRecues } = req.body;
    // quantitesRecues : [{ articleId, quantite }]

    const transfert = await Transfert.findById(req.params.id);
    if (!transfert) return error(res, 'Transfert introuvable.', 404);

    if (transfert.statut !== 'expedie') {
      return error(res, 'Le transfert doit être expédié avant réception.', 400);
    }

    // Ajouter stock destination
    for (const ligne of transfert.lignes) {
      const qteRecue = quantitesRecues
        ? quantitesRecues.find(
            q => q.articleId === ligne.article.toString()
          )?.quantite || ligne.quantiteDemandee
        : ligne.quantiteDemandee;

      ligne.quantiteRecue = qteRecue;

      let stockDest = await Stock.findOne({
        article: ligne.article,
        magasin: transfert.magasinDestination
      });

      if (!stockDest) {
        stockDest = await Stock.create({
          article: ligne.article,
          magasin: transfert.magasinDestination,
          quantite: 0
        });
      }

      const quantiteAvant = stockDest.quantite;
      stockDest.quantite += qteRecue;
      await stockDest.save();

      await MouvementStock.create({
        type: 'transfert_entrant',
        article: ligne.article,
        magasin: transfert.magasinDestination,
        quantite: qteRecue,
        quantiteAvant,
        quantiteApres: stockDest.quantite,
        reference: transfert.numero,
        magasinSource: transfert.magasinSource,
        magasinDestination: transfert.magasinDestination,
        utilisateur: req.user._id
      });
    }

    transfert.statut = 'recu';
    transfert.receptionPar = req.user._id;
    transfert.dateReception = new Date();
    await transfert.save();

    return success(res, transfert, 'Transfert réceptionné. Stock destination mis à jour.');
  } catch (err) {
    return error(res, err.message);
  }
  await notifierParRole(
  ['administrateur', 'gestionnaire'],
  {
    type: 'transfert_recu',
    titre: 'Transfert réceptionné',
    message: `Transfert ${transfert.numero} reçu avec succès`,
    lien: '/transferts',
    entiteId: transfert._id
  },
  transfert.magasinSource
);
};



const annulerTransfert = async (req, res) => {
  try {
    const transfert = await Transfert.findById(req.params.id);
    if (!transfert) return error(res, 'Transfert introuvable.', 404);

    if (['recu', 'annule'].includes(transfert.statut)) {
      return error(res, `Impossible d'annuler un transfert ${transfert.statut}.`, 400);
    }

    // Si déjà expédié, remettre le stock source
    if (transfert.statut === 'expedie') {
      for (const ligne of transfert.lignes) {
        const stock = await Stock.findOne({
          article: ligne.article,
          magasin: transfert.magasinSource
        });
        if (stock) {
          stock.quantite += ligne.quantiteDemandee;
          await stock.save();
        }
      }
    }

    transfert.statut = 'annule';
    await transfert.save();

    return success(res, transfert, 'Transfert annulé.');
  } catch (err) {
    return error(res, err.message);
  }
};


const getTransferts = async (req, res) => {
  try {
    const {
      statut, magasinSource,
      magasinDestination, page = 1, limit = 20
    } = req.query;

    const filtre = {};
    if (statut) filtre.statut = statut;
    if (magasinSource) filtre.magasinSource = magasinSource;
    if (magasinDestination) filtre.magasinDestination = magasinDestination;

    const total = await Transfert.countDocuments(filtre);
    const transferts = await Transfert.find(filtre)
      .populate('magasinSource', 'nom code')
      .populate('magasinDestination', 'nom code')
      .populate('lignes.article', 'designation reference')
      .populate('demandePar', 'nom prenom')
      .populate('validePar', 'nom prenom')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      transferts,
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

module.exports = {
  creerTransfert, validerTransfert, expedierTransfert,
  receptionnerTransfert, annulerTransfert, getTransferts
};