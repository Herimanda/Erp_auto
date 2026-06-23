const mongoose = require('mongoose');

const transfertSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  magasinSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magasin',
    required: true
  },
  magasinDestination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magasin',
    required: true
  },
  lignes: [{
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    quantiteDemandee: { type: Number, required: true },
    quantiteRecue: { type: Number, default: 0 }
  }],
  statut: {
    type: String,
    enum: ['en_attente', 'valide', 'expedie', 'recu', 'annule'],
    default: 'en_attente'
  },
  demandePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receptionPar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateValidation: { type: Date },
  dateReception: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transfert', transfertSchema);