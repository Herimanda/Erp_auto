const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'stock_minimum', 'facture_impayee',
      'nouvelle_commande', 'transfert_attente',
      'transfert_recu', 'commande_recue',
      'systeme'
    ],
    required: true
  },
  titre:   { type: String, required: true },
  message: { type: String, required: true },
  lien:    { type: String },           // ex: /factures, /stocks
  entiteId:{ type: mongoose.Schema.Types.ObjectId },
  magasin: { type: mongoose.Schema.Types.ObjectId, ref: 'Magasin' },
  lu:      { type: Boolean, default: false },
  dateLu:  { type: Date }
}, { timestamps: true });

notificationSchema.index({ destinataire: 1, lu: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);