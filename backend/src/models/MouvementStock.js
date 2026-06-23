const mongoose = require('mongoose');

const mouvementStockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      // Entrées
      'achat_fournisseur', 'retour_client', 'ajustement_positif', 'transfert_entrant',
      // Sorties
      'vente', 'retour_fournisseur', 'ajustement_negatif', 'transfert_sortant'
    ],
    required: true
  },
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  magasin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magasin',
    required: true
  },
  quantite: { type: Number, required: true },
  quantiteAvant: { type: Number, required: true },
  quantiteApres: { type: Number, required: true },
  prixUnitaire: { type: Number },
  motif: { type: String }, // pour ajustements
  reference: { type: String }, // numéro facture, BL, transfert...
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Pour les transferts inter-magasins
  magasinSource: { type: mongoose.Schema.Types.ObjectId, ref: 'Magasin' },
  magasinDestination: { type: mongoose.Schema.Types.ObjectId, ref: 'Magasin' }
}, { timestamps: true });

module.exports = mongoose.model('MouvementStock', mouvementStockSchema);