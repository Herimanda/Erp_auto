const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');


const creerUser = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, magasins } = req.body;

    const existant = await User.findOne({ email });
    if (existant) {
      return error(res, 'Cet email est déjà utilisé.', 400);
    }

    const user = await User.create({
      nom, prenom, email, motDePasse, role, magasins
    });

    return success(res, user, 'Utilisateur créé avec succès.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};


const getUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    const filtre = {};
    if (role) filtre.role = role;
    if (isActive !== undefined) filtre.isActive = isActive === 'true';

    const total = await User.countDocuments(filtre);
    const users = await User.find(filtre)
      .populate('magasins', 'nom code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      users,
      pagination: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    return error(res, err.message);
  }
};


const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('magasins');
    if (!user) return error(res, 'Utilisateur introuvable.', 404);
    return success(res, user);
  } catch (err) {
    return error(res, err.message);
  }
};


const modifierUser = async (req, res) => {
  try {
    const { nom, prenom, email, role, magasins, isActive, motDePasse } = req.body;

    // Si on reçoit un nouveau mot de passe
    if (motDePasse) {
      const user = await User.findById(req.params.id);
      if (!user) return error(res, 'Utilisateur introuvable.', 404);
      user.motDePasse = motDePasse; // sera hashé par le pre-save hook
      if (nom)      user.nom      = nom;
      if (prenom)   user.prenom   = prenom;
      if (email)    user.email    = email;
      if (role)     user.role     = role;
      if (magasins) user.magasins = magasins;
      if (isActive !== undefined) user.isActive = isActive;
      await user.save();
      return success(res, user, 'Utilisateur modifié.');
    }

    // Mise à jour normale sans mot de passe
    const updateData = {};
    if (nom      !== undefined) updateData.nom      = nom;
    if (prenom   !== undefined) updateData.prenom   = prenom;
    if (email    !== undefined) updateData.email    = email;
    if (role     !== undefined) updateData.role     = role;
    if (magasins !== undefined) updateData.magasins = magasins;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('magasins');

    if (!user) return error(res, 'Utilisateur introuvable.', 404);
    return success(res, user, 'Utilisateur modifié.');
  } catch (err) {
    return error(res, err.message);
  }
};

const supprimerUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return error(res, 'Utilisateur introuvable.', 404);
    return success(res, null, 'Utilisateur désactivé.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { creerUser, getUsers, getUser, modifierUser, supprimerUser };