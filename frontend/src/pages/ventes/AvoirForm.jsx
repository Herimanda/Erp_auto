import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCreateAvoir } from '../../hooks/useVentes';
import { formatMontant } from '../../utils/format';
import api from '../../services/api';

export default function AvoirForm({ onSuccess }) {
  const [factureId, setFactureId] = useState('');
  const [type, setType]           = useState('retour_produit');
  const [lignes, setLignes]       = useState([]);
  const createMutation            = useCreateAvoir();

  const { data: factureData } = useQuery({
    queryKey: ['factures', factureId],
    queryFn: () => api.get(`/factures/${factureId}`),
    enabled: !!factureId
  });
  const facture = factureData?.data;

  const { data: facturesData } = useQuery({
    queryKey: ['factures', 'select'],
    queryFn: () => api.get('/factures', {
      params: { statut: 'payee', limit: 100 }
    })
  });
  const factures = facturesData?.data?.factures || [];

  const handleFactureChange = (id) => {
    setFactureId(id);
    setLignes([]);
  };

  const toggleLigne = (ligne) => {
    const exists = lignes.find(
      (l) => l.article === (ligne.article?._id || ligne.article)
    );
    if (exists) {
      setLignes(lignes.filter(
        (l) => l.article !== (ligne.article?._id || ligne.article)
      ));
    } else {
      setLignes([
        ...lignes,
        {
          article:  ligne.article?._id || ligne.article,
          quantite: ligne.quantite
        }
      ]);
    }
  };

  const updateQte = (articleId, qte) => {
    setLignes(lignes.map((l) =>
      l.article === articleId ? { ...l, quantite: Number(qte) } : l
    ));
  };

  // Total dynamique de l'avoir, recalculé au prorata des quantités
  // sélectionnées par rapport aux quantités facturées.
  const totalAvoir = useMemo(() => {
    if (!facture) return 0;
    return lignes.reduce((sum, l) => {
      const ligneFacture = facture.lignes.find(
        (lf) => (lf.article?._id || lf.article) === l.article
      );
      if (!ligneFacture || !ligneFacture.quantite) return sum;
      return sum + ligneFacture.montantTTC * (l.quantite / ligneFacture.quantite);
    }, 0);
  }, [lignes, facture]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!factureId || lignes.length === 0) return;
    await createMutation.mutateAsync({ factureId, type, lignes });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Facture origine *</label>
        <select
          value={factureId}
          onChange={(e) => handleFactureChange(e.target.value)}
          className="input-field" required>
          <option value="">Sélectionner une facture payée...</option>
          {factures.map((f) => (
            <option key={f._id} value={f._id}>
              {f.numero} — {f.client?.nom} — {formatMontant(f.totalTTC)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Type d'avoir *</label>
        <select value={type}
          onChange={(e) => setType(e.target.value)}
          className="input-field">
          <option value="retour_produit">Retour produit</option>
          <option value="annulation_partielle">Annulation partielle</option>
          <option value="annulation_totale">Annulation totale</option>
        </select>
      </div>

      {/* Articles de la facture */}
      {facture && (
        <div>
          <label className="label">Articles à retourner *</label>
          <div className="space-y-2 border border-gray-200
                          rounded-xl overflow-hidden">
            {facture.lignes?.map((l, i) => {
              const articleId = l.article?._id || l.article;
              const selected  = lignes.find(
                (li) => li.article === articleId
              );
              return (
                <div key={i}
                  className={`flex items-center gap-3 p-3
                    border-b border-gray-100 last:border-0
                    transition-colors ${
                      selected ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}>
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleLigne(l)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {l.designation}
                    </p>
                    <p className="text-xs text-gray-400">
                      Facturé : {l.quantite} ×{' '}
                      {formatMontant(l.prixUnitaire)}
                    </p>
                  </div>
                  {selected && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Qté :</span>
                      <input
                        type="number" min="1" max={l.quantite}
                        value={selected.quantite}
                        onChange={(e) =>
                          updateQte(articleId, e.target.value)}
                        className="input-field w-16 text-center text-sm"
                      />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-orange-600
                                w-24 text-right">
                    — {formatMontant(
                      l.montantTTC * (
                        selected ? selected.quantite / l.quantite : 1
                      )
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Récapitulatif du total avoir */}
      {lignes.length > 0 && (
        <div className="flex justify-between items-center font-bold
                        text-orange-700 bg-orange-50 rounded-xl p-3">
          <span>Total avoir</span>
          <span className="text-lg">— {formatMontant(totalAvoir)}</span>
        </div>
      )}

      <button type="submit"
        disabled={createMutation.isPending ||
          !factureId || lignes.length === 0}
        className="btn-primary w-full">
        {createMutation.isPending ? 'Création...' : 'Créer l\'avoir'}
      </button>
    </form>
  );
}