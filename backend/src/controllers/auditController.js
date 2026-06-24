const AuditLog = require('../models/AuditLog');
const { success, error } = require('../utils/apiResponse');

// @route GET /api/audit
const getAuditLogs = async (req, res) => {
  try {
    const {
      utilisateur, action, entite,
      dateDebut, dateFin,
      page = 1, limit = 30
    } = req.query;

    const filtre = {};
    if (utilisateur) filtre.utilisateur = utilisateur;
    if (action)      filtre.action      = action;
    if (entite)      filtre.entite      = entite;
    if (dateDebut || dateFin) {
      filtre.createdAt = {};
      if (dateDebut) filtre.createdAt.$gte = new Date(dateDebut);
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59);
        filtre.createdAt.$lte = fin;
      }
    }

    const total = await AuditLog.countDocuments(filtre);
    const logs  = await AuditLog.find(filtre)
      .populate('utilisateur', 'nom prenom email role')
      .populate('magasin',     'nom code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      logs,
      pagination: {
        total, page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// @route GET /api/audit/stats
const getAuditStats = async (req, res) => {
  try {
    const debut = new Date();
    debut.setDate(debut.getDate() - 30);

    const stats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: debut } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const parUtilisateur = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: debut } } },
      { $group: { _id: '$utilisateur', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
      }},
      { $unwind: { path: '$user', preserveNullAndEmpty: true } }
    ]);

    return success(res, { parAction: stats, parUtilisateur });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getAuditLogs, getAuditStats };