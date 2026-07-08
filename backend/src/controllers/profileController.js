const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

// Modifier son propre profil (nom, prénom, email)
const modifierMonProfil = async (req, res) => {
  try {
    const { nom, prenom, email } = req.body;
    const updateData = {};
    if (nom !== undefined)    updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (email !== undefined)  updateData.email = email;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('magasins');

    if (!user) return error(res, 'Utilisateur introuvable.', 404);
    return success(res, user, 'Profil mis à jour.');
  } catch (err) {
    return error(res, err.message);
  }
};

// Upload / remplacement de la photo de profil
const uploadMaPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'Aucun fichier reçu.', 400);
    }

    const user = await User.findById(req.user.id);
    if (!user) return error(res, 'Utilisateur introuvable.', 404);

    if (user.photo) {
      const ancienChemin = path.join(__dirname, '..', user.photo);
      fs.unlink(ancienChemin, () => {});
    }

    user.photo = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    await user.populate('magasins'); // ← ajouté

    return success(res, user, 'Photo de profil mise à jour.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { modifierMonProfil, uploadMaPhoto };