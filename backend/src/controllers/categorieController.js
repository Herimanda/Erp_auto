const Categorie = require('../models/Categorie');
const Article = require('../models/Article');
const { success, error } = require('../utils/apiResponse');


const creerCategorie = async (req, res) => {
  try {
    const { code, nom, description } = req.body;

    const existante = await Categorie.findOne({ code: code.toUpperCase() });
    if (existante) return error(res, 'Ce code catégorie existe déjà.', 400);

    const categorie = await Categorie.create({ code, nom, description });
    return success(res, categorie, 'Catégorie créée.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};


const getCategories = async (req, res) => {
  try {
    const categories = await Categorie.find({ isActive: true }).sort({ nom: 1 });

    // Compter les articles par catégorie
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


const getCategorie = async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id);
    if (!categorie) return error(res, 'Catégorie introuvable.', 404);
    return success(res, categorie);
  } catch (err) {
    return error(res, err.message);
  }
};


const modifierCategorie = async (req, res) => {
  try {
    const categorie = await Categorie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!categorie) return error(res, 'Catégorie introuvable.', 404);
    return success(res, categorie, 'Catégorie modifiée.');
  } catch (err) {
    return error(res, err.message);
  }
};

const supprimerCategorie = async (req, res) => {
  try {
    // Vérifier si des articles utilisent cette catégorie
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