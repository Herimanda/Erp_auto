const Notification = require('../models/Notification');
const User = require('../models/User');

// Crée une notification pour un utilisateur précis
const notifierUser = async (userId, data) => {
  return Notification.create({ destinataire: userId, ...data });
};

// Crée une notification pour tous les utilisateurs d'un rôle donné
// (optionnellement filtré par magasin)
const notifierParRole = async (roles, data, magasinId = null) => {
  const filtre = { role: { $in: roles }, isActive: true };
  if (magasinId) filtre.magasins = magasinId;

  const users = await User.find(filtre).select('_id');
  if (users.length === 0) return [];

  const notifications = users.map((u) => ({
    destinataire: u._id,
    magasin: magasinId || undefined,
    ...data
  }));

  return Notification.insertMany(notifications);
};

module.exports = { notifierUser, notifierParRole };