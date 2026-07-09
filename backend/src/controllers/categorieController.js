const Categorie = require('../models/Categorie');
const Article = require('../models/Article');
const { success, error } = require('../utils/apiResponse');

// Générer code catégorie automatique (CAT-001, CAT-002...)
const genererCodeCategorie = async () => {
  const dernier = await Categorie.findOne(
    { code: { $regex: '^CAT-' } },
    { code: 1 },
    { sort: { code: -1 } }
  );
  let numero = 1;
  if (dernier) {
    const parts = dernier.code.split('-');
    numero = parseInt(parts[parts.length - 1]) + 1;
  }
  return `CAT-${String(numero).padStart(3, '0')}`;
};

// @desc    Créer une catégorie
// @route   POST /api/categories
const creerCategorie = async (req, res) => {
  try {
    const { nom, description } = req.body;

    if (!nom) {
      return error(res, 'Le nom de la catégorie est requis.', 400);
    }

    const code = await genererCodeCategorie();

    const categorie = await Categorie.create({ code, nom, description });
    return success(res, categorie, 'Catégorie créée.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Liste des catégories
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Categorie.find({ isActive: true }).sort({ nom: 1 });

    const categoriesAvecCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Article.countDocuments({
          categorie: cat._id,
          isDeleted: false
        });
        return { ...cat.toObject(), nombreArticles: count };
      })
    );

    return success(res, categoriesAvecCount);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Détail d'une catégorie
// @route   GET /api/categories/:id
const getCategorie = async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id);
    if (!categorie) return error(res, 'Catégorie introuvable.', 404);
    return success(res, categorie);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Modifier une catégorie
// @route   PUT /api/categories/:id
const modifierCategorie = async (req, res) => {
  try {
    // Le code n'est jamais modifiable une fois généré
    const { nom, description } = req.body;

    const categorie = await Categorie.findByIdAndUpdate(
      req.params.id,
      { nom, description },
      { new: true, runValidators: true }
    );
    if (!categorie) return error(res, 'Catégorie introuvable.', 404);
    return success(res, categorie, 'Catégorie modifiée.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Supprimer une catégorie
// @route   DELETE /api/categories/:id
const supprimerCategorie = async (req, res) => {
  try {
    const nbArticles = await Article.countDocuments({
      categorie: req.params.id,
      isDeleted: false
    });

    if (nbArticles > 0) {
      return error(
        res,
        `Impossible de supprimer : ${nbArticles} article(s) utilisent cette catégorie.`,
        400
      );
    }

    await Categorie.findByIdAndUpdate(req.params.id, { isActive: false });
    return success(res, null, 'Catégorie supprimée.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerCategorie, getCategories,
  getCategorie, modifierCategorie, supprimerCategorie
};