const mongoose = require('mongoose');

const ligneFactureSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  designation: { type: String, required: true },
  quantite: { type: Number, required: true, min: 1 },
  prixUnitaire: { type: Number, required: true },
  tva: { type: Number, default: 20 },
  remise: { type: Number, default: 0 },
  montantHT: { type: Number },
  montantTTC: { type: Number }
}, { _id: false });

const paiementSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  montant: { type: Number, required: true },
  mode: {
    type: String,
    enum: ['especes', 'cheque', 'virement', 'carte', 'avoir'],
    required: true
  },
  reference: { type: String },
  avoir: { type: mongoose.Schema.Types.ObjectId, ref: 'Avoir' }
}, { _id: false });
const factureSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['comptoir', 'credit', 'proforma'],
    default: 'comptoir'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  magasin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magasin',
    required: true
  },
  lignes: [ligneFactureSchema],
  totalHT: { type: Number, default: 0 },
  totalTVA: { type: Number, default: 0 },
  totalTTC: { type: Number, default: 0 },
  remiseGlobale: { type: Number, default: 0 },
  montantPaye: { type: Number, default: 0 },
  montantRestant: { type: Number, default: 0 },
  paiements: [paiementSchema],
  statut: {
    type: String,
    enum: ['en_attente', 'partiellement_payee', 'payee', 'annulee'],
    default: 'en_attente'
  },
  devisOrigine: { type: mongoose.Schema.Types.ObjectId, ref: 'Devis' },
  notes: { type: String },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

factureSchema.virtual('avoirs', {
  ref: 'Avoir',
  localField: '_id',
  foreignField: 'factureOrigine'
});

factureSchema.set('toJSON', { virtuals: true });
factureSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Facture', factureSchema);