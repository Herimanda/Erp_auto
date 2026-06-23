const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

// @desc    Créer un utilisateur
// @route   POST /api/users
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

// @desc    Liste des utilisateurs
// @route   GET /api/users
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

// @desc    Détail d'un utilisateur
// @route   GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('magasins');
    if (!user) return error(res, 'Utilisateur introuvable.', 404);
    return success(res, user);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Modifier un utilisateur
// @route   PUT /api/users/:id
const modifierUser = async (req, res) => {
  try {
    const { nom, prenom, email, role, magasins, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nom, prenom, email, role, magasins, isActive },
      { new: true, runValidators: true }
    ).populate('magasins');

    if (!user) return error(res, 'Utilisateur introuvable.', 404);
    return success(res, user, 'Utilisateur modifié avec succès.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Désactiver un utilisateur
// @route   DELETE /api/users/:id
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