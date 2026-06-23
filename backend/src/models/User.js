const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  motDePasse: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['administrateur', 'gestionnaire', 'caissier', 'magasinier'],
    default: 'caissier'
  },
  magasins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Magasin' }],
  isActive: { type: Boolean, default: true },
  dernierConnexion: { type: Date }
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;

  this.motDePasse = await bcrypt.hash(this.motDePasse, 12);
});

// Méthode de vérification du mot de passe
userSchema.methods.verifierMotDePasse = async function (mdpSaisi) {
  return await bcrypt.compare(mdpSaisi, this.motDePasse);
};

// Ne jamais retourner le mot de passe
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.motDePasse;
  return obj;
};

module.exports = mongoose.model('User', userSchema);