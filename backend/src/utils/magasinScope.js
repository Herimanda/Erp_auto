const { error } = require('./apiResponse');

// null = administrateur (accès à tous les magasins)
const idsAutorises = (user) =>
  user.role === 'administrateur'
    ? null
    : (user.magasins || []).map((m) => String(m._id || m));

const peutAcceder = (user, magasinId) => {
  const ids = idsAutorises(user);
  if (ids === null) return true;
  return ids.includes(String(magasinId?._id || magasinId));
};

// Filtre pour les listes : { refuse: true } | { valeur: ... } | {}
const filtreMagasin = (user, magasinDemande) => {
  const ids = idsAutorises(user);
  if (magasinDemande) {
    return peutAcceder(user, magasinDemande)
      ? { valeur: magasinDemande }
      : { refuse: true };
  }
  return ids === null ? {} : { valeur: { $in: ids } };
};

// Middleware : vérifie un ou plusieurs champs magasin de la requête
// usage : exigerMagasin(['body', 'magasin'], ['params', 'magasinId'])
const exigerMagasin = (...sources) => (req, res, next) => {
  for (const [objet, champ] of sources) {
    const valeur = req[objet]?.[champ];
    if (valeur && !peutAcceder(req.user, valeur)) {
      return error(res, 'Accès refusé à ce magasin.', 403);
    }
  }
  next();
};

module.exports = { idsAutorises, peutAcceder, filtreMagasin, exigerMagasin };