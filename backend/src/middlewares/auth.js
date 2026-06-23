const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/apiResponse');

// Vérifie que le token JWT est valide
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return error(res, 'Accès non autorisé. Token manquant.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('magasins');

    if (!user || !user.isActive) {
      return error(res, 'Utilisateur introuvable ou désactivé.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Token invalide ou expiré.', 401);
  }
};

// Vérifie les rôles autorisés
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(
        res,
        `Accès refusé. Rôle '${req.user.role}' non autorisé.`,
        403
      );
    }
    next();
  };
};

module.exports = { protect, authorize };