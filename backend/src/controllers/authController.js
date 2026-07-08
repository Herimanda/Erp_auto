const User = require('../models/User');
const Magasin = require('../models/Magasin');
const generateToken = require('../utils/generateToken');
const AuditLog = require('../models/AuditLog');
const { success, error } = require('../utils/apiResponse');


const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return error(res, 'Email et mot de passe requis.', 400);
    }

    const user = await User.findOne({ email }).populate('magasins');

    if (!user || !user.isActive) {
      return error(res, 'Identifiants incorrects.', 401);
    }

    const mdpValide = await user.verifierMotDePasse(motDePasse);
    if (!mdpValide) {
      return error(res, 'Identifiants incorrects.', 401);
    }

    // Mise à jour dernière connexion
    user.dernierConnexion = new Date();
    await user.save({ validateBeforeSave: false });

    // Journal d'audit
    await AuditLog.create({
      utilisateur: user._id,
      action: 'connexion',
      entite: 'User',
      entiteId: user._id,
      ip: req.ip
    });

 const token = generateToken(user._id);
return success(res, {
  token,
  user: {
    _id: user._id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    photo: user.photo,
    role: user.role,
    magasins: user.magasins
  }
}, 'Connexion réussie');

  } catch (err) {
    return error(res, err.message);
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('magasins');
    return success(res, user);
  } catch (err) {
    return error(res, err.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { ancienMdp, nouveauMdp } = req.body;

    const user = await User.findById(req.user._id);
    const valide = await user.verifierMotDePasse(ancienMdp);

    if (!valide) {
      return error(res, 'Ancien mot de passe incorrect.', 400);
    }

    user.motDePasse = nouveauMdp;
    await user.save();

    return success(res, null, 'Mot de passe modifié avec succès.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { login, getMe, changePassword };