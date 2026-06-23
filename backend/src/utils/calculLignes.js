// Calcule les montants d'une ligne et les totaux d'un document
const calculerLigne = (ligne) => {
  const quantite = ligne.quantite || 0;
  const prixUnitaire = ligne.prixUnitaire || 0;
  const remise = ligne.remise || 0;
  const tva = ligne.tva || 20;

  const montantBrut = quantite * prixUnitaire;
  const montantRemise = montantBrut * (remise / 100);
  const montantHT = montantBrut - montantRemise;
  const montantTVA = montantHT * (tva / 100);
  const montantTTC = montantHT + montantTVA;

  return {
    ...ligne,
    montantHT: Math.round(montantHT),
    montantTTC: Math.round(montantTTC)
  };
};

const calculerTotaux = (lignes, remiseGlobale = 0) => {
  const lignesCalculées = lignes.map(calculerLigne);

  const totalHT = lignesCalculées.reduce((s, l) => s + l.montantHT, 0);
  const remiseGlobaleMontant = totalHT * (remiseGlobale / 100);
  const totalHTApresRemise = totalHT - remiseGlobaleMontant;

  const totalTVA = lignesCalculées.reduce((s, l) => {
    const ht = l.montantHT * (1 - remiseGlobale / 100);
    return s + ht * (l.tva / 100);
  }, 0);

  const totalTTC = totalHTApresRemise + totalTVA;

  return {
    lignes: lignesCalculées,
    totalHT: Math.round(totalHTApresRemise),
    totalTVA: Math.round(totalTVA),
    totalTTC: Math.round(totalTTC)
  };
};

module.exports = { calculerLigne, calculerTotaux };