const Notification = require('../models/Notification');
const { success, error } = require('../utils/apiResponse');

// @desc    Liste des notifications de l'utilisateur connecté
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { lu, page = 1, limit = 20 } = req.query;

    const filtre = { destinataire: req.user._id };
    if (lu !== undefined) filtre.lu = lu === 'true';

    const total = await Notification.countDocuments(filtre);
    const nonLues = await Notification.countDocuments({
      destinataire: req.user._id, lu: false
    });

    const notifications = await Notification.find(filtre)
      .populate('magasin', 'nom code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      notifications,
      nonLues,
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

// @desc    Compteur non lues (pour badge)
// @route   GET /api/notifications/compteur
const getCompteur = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      destinataire: req.user._id, lu: false
    });
    return success(res, { count });
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Marquer une notification comme lue
// @route   PUT /api/notifications/:id/lu
const marquerLue = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, destinataire: req.user._id },
      { lu: true, dateLu: new Date() },
      { new: true }
    );
    if (!notif) return error(res, 'Notification introuvable.', 404);
    return success(res, notif);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Marquer toutes comme lues
// @route   PUT /api/notifications/tout-lire
const toutMarquerLu = async (req, res) => {
  try {
    await Notification.updateMany(
      { destinataire: req.user._id, lu: false },
      { lu: true, dateLu: new Date() }
    );
    return success(res, null, 'Toutes les notifications ont été lues.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Supprimer une notification
// @route   DELETE /api/notifications/:id
const supprimerNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id, destinataire: req.user._id
    });
    return success(res, null, 'Notification supprimée.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Vider toutes les notifications lues
// @route   DELETE /api/notifications/lues
const viderLues = async (req, res) => {
  try {
    await Notification.deleteMany({
      destinataire: req.user._id, lu: true
    });
    return success(res, null, 'Notifications lues supprimées.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getNotifications, getCompteur, marquerLue,
  toutMarquerLu, supprimerNotification, viderLues
};