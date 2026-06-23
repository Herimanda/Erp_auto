const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    enum: [
      'connexion', 'deconnexion',
      'creation', 'modification', 'suppression',
      'vente', 'ajustement_stock', 'transfert'
    ],
    required: true
  },
  entite: { type: String }, // 'Article', 'Facture', 'Stock'...
  entiteId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed }, // données avant/après
  ip: { type: String },
  magasin: { type: mongoose.Schema.Types.ObjectId, ref: 'Magasin' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);