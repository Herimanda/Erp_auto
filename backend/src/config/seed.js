const mongoose = require('mongoose');
const User = require('../models/User');
const Magasin = require('../models/Magasin');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  // Créer magasin principal
  let magasin = await Magasin.findOne({ code: 'MAG-A' });
  if (!magasin) {
    magasin = await Magasin.create({
      code: 'MAG-A',
      nom: 'Magasin Principal',
      adresse: 'Antananarivo',
      telephone: '034 00 000 00'
    });
    console.log('✅ Magasin principal créé');
  }

  // Créer administrateur
  const adminExistant = await User.findOne({ email: 'admin@erp.com' });
  if (!adminExistant) {
    await User.create({
      nom: 'Admin',
      prenom: 'Système',
      email: 'admin@erp.com',
      motDePasse: 'Admin@1234',
      role: 'administrateur',
      magasins: [magasin._id]
    });
    console.log('✅ Administrateur créé : admin@erp.com / Admin@1234');
  }

  console.log('🎉 Seed terminé !');
  process.exit();
};

seed().catch(console.error);