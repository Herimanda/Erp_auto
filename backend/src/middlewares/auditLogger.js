const AuditLog = require('../models/AuditLog');

const auditLogger = (action, entite) => {
  return async (req, res, next) => {
    // On surcharge res.json pour capturer la réponse
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      if (body.success && req.user) {
        try {
          await AuditLog.create({
            utilisateur: req.user._id,
            action,
            entite,
            entiteId: body.data?._id || req.params.id,
            details: {
              body: req.body,
              result: body.data
            },
            ip: req.ip,
            magasin: req.body.magasin || req.user.magasins?.[0]
          });
        } catch (err) {
          console.error('Erreur audit log:', err);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = auditLogger;