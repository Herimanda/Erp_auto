import { useState, useEffect } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { formatMontant } from '../../utils/format';

export default function LignesDocument({
  lignes, onChange, magasinId, readOnly = false
}) {
  const { data: articlesData } = useQuery({
    queryKey: ['articles', 'select'],
    queryFn: () => api.get('/articles', { params: { limit: 200 } })
  });
  const articles = articlesData?.data?.articles || [];

  const calculerLigne = (l) => {
    const ht = (l.quantite * l.prixUnitaire) * (1 - (l.remise || 0) / 100);
    const ttc = ht * (1 + (l.tva || 20) / 100);
    return { ...l, montantHT: Math.round(ht), montantTTC: Math.round(ttc) };
  };

  const addLigne = () => {
    onChange([
      ...lignes,
      {
        article: '', designation: '', quantite: 1,
        prixUnitaire: 0, tva: 20, remise: 0,
        montantHT: 0, montantTTC: 0
      }
    ]);
  };

  const removeLigne = (i) => {
    onChange(lignes.filter((_, idx) => idx !== i));
  };

  const updateLigne = (i, field, value) => {
    const copy = lignes.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: value };
      if (field === 'article') {
        const art = articles.find((a) => a._id === value);
        if (art) {
          updated.designation  = art.designation;
          updated.prixUnitaire = art.prixVente;
          updated.tva          = art.tva;
        }
      }
      return calculerLigne(updated);
    });
    onChange(copy);
  };

  const totalHT  = lignes.reduce((s, l) => s + (l.montantHT  || 0), 0);
  const totalTTC = lignes.reduce((s, l) => s + (l.montantTTC || 0), 0);
  const totalTVA = totalTTC - totalHT;

  return (
    <div className="space-y-3">
      {/* En-tête colonnes */}
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold
                      text-gray-500 uppercase px-1">
        <span className="col-span-4">Article</span>
        <span className="col-span-1 text-center">Qté</span>
        <span className="col-span-2 text-right">P.U. HT</span>
        <span className="col-span-1 text-center">Remise%</span>
        <span className="col-span-1 text-center">TVA%</span>
        <span className="col-span-2 text-right">Montant TTC</span>
        {!readOnly && <span className="col-span-1" />}
      </div>

      {/* Lignes */}
      {lignes.map((l, i) => (
        <div key={i}
          className="grid grid-cols-12 gap-2 items-center
                     bg-gray-50 rounded-lg p-2">
          <div className="col-span-4">
            {readOnly ? (
              <div>
                <p className="text-sm font-medium">{l.designation}</p>
              </div>
            ) : (
              <select
                value={l.article}
                onChange={(e) => updateLigne(i, 'article', e.target.value)}
                className="input-field text-sm w-full" required
              >
                <option value="">Article...</option>
                {articles.map((a) => (
                  <option key={a._id} value={a._id}>
                    [{a.reference}] {a.designation}
                  </option>
                ))}
              </select>
            )}
          </div>

          <input
            type="number" min="1"
            value={l.quantite}
            onChange={(e) => updateLigne(i, 'quantite', Number(e.target.value))}
            className="input-field col-span-1 text-center text-sm"
            readOnly={readOnly}
          />
          <input
            type="number" min="0"
            value={l.prixUnitaire}
            onChange={(e) =>
              updateLigne(i, 'prixUnitaire', Number(e.target.value))}
            className="input-field col-span-2 text-right text-sm"
            readOnly={readOnly}
          />
          <input
            type="number" min="0" max="100"
            value={l.remise || 0}
            onChange={(e) =>
              updateLigne(i, 'remise', Number(e.target.value))}
            className="input-field col-span-1 text-center text-sm"
            readOnly={readOnly}
          />
          <input
            type="number" min="0" max="100"
            value={l.tva || 20}
            onChange={(e) =>
              updateLigne(i, 'tva', Number(e.target.value))}
            className="input-field col-span-1 text-center text-sm"
            readOnly={readOnly}
          />
          <div className="col-span-2 text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatMontant(l.montantTTC)}
            </p>
            <p className="text-xs text-gray-400">
              HT: {formatMontant(l.montantHT)}
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => removeLigne(i)}
              className="col-span-1 flex justify-center
                         text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {/* Ajouter ligne */}
      {!readOnly && (
        <button
          type="button"
          onClick={addLigne}
          className="w-full py-2 border-2 border-dashed border-gray-300
                     rounded-lg text-sm text-gray-500 hover:border-primary-400
                     hover:text-primary-600 transition-colors
                     flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Ajouter un article
        </button>
      )}

      {/* Totaux */}
      <div className="border-t border-gray-200 pt-3 space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Total HT</span>
          <span className="font-medium">{formatMontant(totalHT)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>TVA</span>
          <span className="font-medium">{formatMontant(totalTVA)}</span>
        </div>
        <div className="flex justify-between text-base font-bold
                        text-gray-900 pt-1 border-t border-gray-200">
          <span>Total TTC</span>
          <span className="text-primary-600">{formatMontant(totalTTC)}</span>
        </div>
      </div>
    </div>
  );
}