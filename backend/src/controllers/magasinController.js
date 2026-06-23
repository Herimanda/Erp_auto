const Magasin = require('../models/Magasin');
const { success, error } = require('../utils/apiResponse');

const creerMagasin = async (req, res) => {
  try {
    const magasin = await Magasin.create(req.body);
    return success(res, magasin, 'Magasin créé.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getMagasins = async (req, res) => {
  try {
    const magasins = await Magasin.find({ isActive: true }).sort({ nom: 1 });
    return success(res, magasins);
  } catch (err) {
    return error(res, err.message);
  }
};

const getMagasin = async (req, res) => {
  try {
    const magasin = await Magasin.findById(req.params.id);
    if (!magasin) return error(res, 'Magasin introuvable.', 404);
    return success(res, magasin);
  } catch (err) {
    return error(res, err.message);
  }
};

const modifierMagasin = async (req, res) => {
  try {
    const magasin = await Magasin.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!magasin) return error(res, 'Magasin introuvable.', 404);
    return success(res, magasin, 'Magasin modifié.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { creerMagasin, getMagasins, getMagasin, modifierMagasin };