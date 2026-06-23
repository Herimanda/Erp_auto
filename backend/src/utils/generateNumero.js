// Génère des numéros automatiques : FAC-2024-0001, DEV-2024-0001...
const generateNumero = async (model, prefix, champ = 'numero') => {
  const annee = new Date().getFullYear();
  const prefixAnnee = `${prefix}-${annee}-`;

  const dernier = await model.findOne(
    { [champ]: { $regex: `^${prefixAnnee}` } },
    { [champ]: 1 },
    { sort: { [champ]: -1 } }
  );

  let numero = 1;
  if (dernier) {
    const parts = dernier[champ].split('-');
    numero = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefixAnnee}${String(numero).padStart(4, '0')}`;
};

module.exports = generateNumero;