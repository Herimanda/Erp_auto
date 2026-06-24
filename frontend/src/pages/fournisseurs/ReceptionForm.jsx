import { useState } from 'react';
import { useActionCommande } from '../../hooks/useFournisseurs';
import { formatMontant } from '../../utils/format';

export default function ReceptionForm({ commande, onSuccess }) {
  const [lignes, setLignes] = useState(
    commande?.lignes?.map((l) => ({
      articleId: l.article?._id || l.article,
      designation: l.article?.designation || l.designation,
      reference: l.article?.reference,
      quantiteCommandee: l.quantiteCommandee,
      quantiteRecue: l.quantiteCommandee - (l.quantiteRecue || 0),
      prixUnitaire: l.prixUnitaire || ''
    })) || []
  );

  const actionMutation = useActionCommande();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await actionMutation.mutateAsync({
      id: commande._id,
      action: 'receptionner',
      data: {
        lignesRecues: lignes
          .filter((l) => l.quantiteRecue > 0)
          .map((l) => ({
            articleId:    l.articleId,
            quantiteRecue: Number(l.quantiteRecue),
            prixUnitaire: l.prixUnitaire
              ? Number(l.prixUnitaire) : undefined
          }))
      }
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-sm text-blue-700 font-medium">
          Commande {commande?.numero} — {commande?.fournisseur?.raisonSociale}
        </p>
        <p className="text-xs text-blue-500 mt-0.5">
          Saisissez les quantités reçues pour chaque article.
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold
                        text-gray-500 uppercase px-1">
          <span className="col-span-5">Article</span>
          <span className="col-span-2 text-center">Commandé</span>
          <span className="col-span-2 text-center">À recevoir</span>
          <span className="col-span-3 text-right">Prix achat</span>
        </div>

        {lignes.map((l, i) => (
          <div key={i}
            className="grid grid-cols-12 gap-2 items-center
                       p-3 bg-gray-50 rounded-lg">
            <div className="col-span-5">
              <p className="text-sm font-medium">{l.designation}</p>
              <p className="text-xs text-gray-400 font-mono">
                {l.reference}
              </p>
            </div>
            <div className="col-span-2 text-center text-sm font-medium
                            text-gray-600">
              {l.quantiteCommandee}
            </div>
            <input
              type="number" min="0"
              max={l.quantiteCommandee}
              value={l.quantiteRecue}
              onChange={(e) => {
                const copy = [...lignes];
                copy[i].quantiteRecue = e.target.value;
                setLignes(copy);
              }}
              className="input-field col-span-2 text-center text-sm"
            />
            <input
              type="number" min="0"
              value={l.prixUnitaire}
              placeholder="Prix"
              onChange={(e) => {
                const copy = [...lignes];
                copy[i].prixUnitaire = e.target.value;
                setLignes(copy);
              }}
              className="input-field col-span-3 text-right text-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={actionMutation.isPending}
        className="btn-primary w-full"
      >
        {actionMutation.isPending
          ? 'Enregistrement...'
          : 'Valider la réception'}
      </button>
    </form>
  );
}