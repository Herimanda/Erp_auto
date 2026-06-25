import { useState, useMemo } from 'react';
import {
  ClipboardList, Play, CheckCircle,
  AlertTriangle, RotateCcw, Download,
  Search, Filter, ChevronDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFeuille, useValiderInventaire } from '../../hooks/useInventaire';
import { useCategories } from '../../hooks/useArticles';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Modal from '../../components/ui/Modal';
import { formatMontant } from '../../utils/format';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ── Composant ligne inventaire ─────────────────────────────────────────────
function LigneInventaire({ ligne, index, onChange, readOnly }) {
  const ecart = ligne.stockPhysique !== null && ligne.stockPhysique !== ''
    ? Number(ligne.stockPhysique) - ligne.stockTheorique
    : null;

  return (
    <tr className={clsx(
      'border-b border-gray-100 last:border-0 transition-colors',
      ecart !== null && ecart !== 0
        ? ecart > 0 ? 'bg-green-50' : 'bg-red-50'
        : 'hover:bg-gray-50'
    )}>
      <td className="table-cell">
        <span className="text-xs text-gray-400 font-mono">
          {index + 1}
        </span>
      </td>
      <td className="table-cell">
        <span className="font-mono text-xs bg-gray-100
                         px-2 py-0.5 rounded">
          {ligne.article.reference}
        </span>
      </td>
      <td className="table-cell">
        <p className="font-medium text-gray-900 text-sm">
          {ligne.article.designation}
        </p>
        {ligne.article.marque && (
          <p className="text-xs text-gray-400">{ligne.article.marque}</p>
        )}
      </td>
      <td className="table-cell">
        <span className="badge-info text-xs">
          {ligne.article.categorie?.nom}
        </span>
      </td>
      <td className="table-cell text-center">
        <span className="text-lg font-bold text-gray-700">
          {ligne.stockTheorique}
        </span>
      </td>
      <td className="table-cell text-center">
        {readOnly ? (
          <span className={clsx(
            'text-lg font-bold',
            ligne.stockPhysique === null ? 'text-gray-300'
              : 'text-gray-900'
          )}>
            {ligne.stockPhysique ?? '—'}
          </span>
        ) : (
          <input
            type="number"
            min="0"
            value={ligne.stockPhysique ?? ''}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder="Saisir"
            className={clsx(
              'w-20 text-center text-sm font-bold px-2 py-1.5',
              'border-2 rounded-lg focus:outline-none transition-colors',
              ecart !== null && ecart !== 0
                ? ecart > 0
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-red-400 bg-red-50 text-red-700'
                : 'border-gray-300 focus:border-primary-500'
            )}
          />
        )}
      </td>
      <td className="table-cell text-center">
        {ecart !== null ? (
          <span className={clsx(
            'text-sm font-bold px-2 py-0.5 rounded-full',
            ecart === 0
              ? 'bg-green-100 text-green-700'
              : ecart > 0
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
          )}>
            {ecart > 0 ? `+${ecart}` : ecart}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>
      <td className="table-cell text-center">
        {ecart !== null && ecart !== 0 ? (
          <span className={clsx(
            'text-xs font-medium',
            ecart > 0 ? 'text-blue-600' : 'text-red-600'
          )}>
            {ecart > 0 ? '↑ Excédent' : '↓ Manquant'}
          </span>
        ) : ecart === 0 ? (
          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
        ) : null}
      </td>
    </tr>
  );
}

// ── Modal confirmation validation ──────────────────────────────────────────
function ConfirmationModal({ isOpen, onClose, resume, onConfirm, loading }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title="Confirmer la validation">
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200
                        rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600
                                       flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                Attention — Action irréversible
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Cette action va mettre à jour définitivement les stocks
                selon les quantités physiques saisies.
              </p>
            </div>
          </div>
        </div>

        {/* Résumé écarts */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Total lignes',
              value: resume.total,
              color: 'bg-gray-50 text-gray-700'
            },
            {
              label: 'Sans écart',
              value: resume.sansEcart,
              color: 'bg-green-50 text-green-700'
            },
            {
              label: 'Avec écart',
              value: resume.avecEcart,
              color: resume.avecEcart > 0
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            },
          ].map((s) => (
            <div key={s.label}
              className={`rounded-xl p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="btn-secondary flex-1">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary flex-1 flex items-center
                       justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin"/>
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {loading ? 'Validation...' : 'Valider l\'inventaire'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function InventairePage() {
  const { user, magasinActif } = useAuthStore();
  const canValider = ['administrateur', 'gestionnaire'].includes(user?.role);

  // Étapes : selection → saisie → confirmation → résultat
  const [etape, setEtape]           = useState('selection');
  const [magasinId, setMagasinId]   = useState(magasinActif?._id || '');
  const [categorieId, setCategorie] = useState('');
  const [search, setSearch]         = useState('');
  const [lignes, setLignes]         = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultat, setResultat]     = useState(null);

  const { data: magasinsData } = useQuery({
    queryKey: ['magasins'],
    queryFn:  () => api.get('/magasins')
  });
  const { data: catData }      = useCategories();
  const magasins   = magasinsData?.data || [];
  const categories = catData?.data     || [];

  const { data: feuilleData, isLoading: feuilleLoading } =
    useFeuille(magasinId, {
      categorie: categorieId || undefined
    });

  const validerMutation = useValiderInventaire();

  // Initialiser lignes quand la feuille est chargée
  const initLignes = () => {
    const data = feuilleData?.data?.lignes || [];
    setLignes(data.map((l) => ({
      ...l,
      stockPhysique: null
    })));
    setEtape('saisie');
  };

  // Mettre à jour quantité physique
  const updateLigne = (index, value) => {
    setLignes((prev) => prev.map((l, i) =>
      i === index
        ? { ...l, stockPhysique: value === '' ? null : Number(value) }
        : l
    ));
  };

  // Lignes filtrées par recherche
  const lignesFiltrees = useMemo(() => {
    if (!search) return lignes;
    return lignes.filter((l) =>
      l.article.designation.toLowerCase().includes(search.toLowerCase()) ||
      l.article.reference.toLowerCase().includes(search.toLowerCase())
    );
  }, [lignes, search]);

  // Statistiques saisie
  const stats = useMemo(() => {
    const saisies   = lignes.filter((l) => l.stockPhysique !== null);
    const avecEcart = saisies.filter(
      (l) => l.stockPhysique !== l.stockTheorique
    );
    const manquants = avecEcart.filter(
      (l) => l.stockPhysique < l.stockTheorique
    );
    const excedents = avecEcart.filter(
      (l) => l.stockPhysique > l.stockTheorique
    );
    return {
      total:       lignes.length,
      saisies:     saisies.length,
      avecEcart:   avecEcart.length,
      sansEcart:   saisies.length - avecEcart.length,
      manquants:   manquants.length,
      excedents:   excedents.length,
      progression: lignes.length > 0
        ? Math.round((saisies.length / lignes.length) * 100)
        : 0
    };
  }, [lignes]);

  // Réinitialiser tout
  const reset = () => {
    setEtape('selection');
    setLignes([]);
    setResultat(null);
    setSearch('');
  };

  // Valider l'inventaire
  const handleValider = async () => {
    const lignesAValider = lignes
      .filter((l) => l.stockPhysique !== null)
      .map((l) => ({
        articleId:     l.article._id,
        stockPhysique: l.stockPhysique
      }));

    if (lignesAValider.length === 0) {
      return toast.error('Aucune quantité saisie.');
    }

    try {
      const res = await validerMutation.mutateAsync({
        magasinId,
        lignes: lignesAValider
      });
      setResultat(res?.data);
      setShowConfirm(false);
      setEtape('resultat');
    } catch (err) {
      setShowConfirm(false);
    }
  };

  // Exporter feuille vierge
  const exporterFeuille = () => {
    const csvContent = [
      ['N°', 'Référence', 'Désignation', 'Catégorie',
       'Marque', 'Stock théorique', 'Stock physique', 'Écart'],
      ...lignes.map((l, i) => [
        i + 1,
        l.article.reference,
        l.article.designation,
        l.article.categorie?.nom || '',
        l.article.marque || '',
        l.stockTheorique,
        '',
        ''
      ])
    ].map((r) => r.join(';')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent],
      { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `inventaire-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Feuille exportée en CSV.');
  };

  const magasinNom = magasins.find(
    (m) => m._id === magasinId
  )?.nom || '';

  return (
    <div>
      <PageHeader
        title="Inventaire"
        subtitle="Comptage physique et correction des stocks"
      />

      {/* ── ÉTAPE 1 : Sélection ── */}
      {etape === 'selection' && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl
                              flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Démarrer un inventaire
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Sélectionnez le magasin et les articles à inventorier
              </p>
            </div>

            <div className="space-y-4">
              {/* Magasin */}
              <div>
                <label className="label">Magasin *</label>
                <select
                  value={magasinId}
                  onChange={(e) => setMagasinId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Sélectionner un magasin...</option>
                  {magasins.map((m) => (
                    <option key={m._id} value={m._id}>{m.nom}</option>
                  ))}
                </select>
              </div>

              {/* Catégorie */}
              <div>
                <label className="label">
                  Catégorie{' '}
                  <span className="text-gray-400 font-normal">
                    (optionnel — inventaire tournant)
                  </span>
                </label>
                <select
                  value={categorieId}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="input-field"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              {/* Info nombre articles */}
              {magasinId && feuilleData && (
                <div className="flex items-center gap-3 p-3
                                bg-blue-50 border border-blue-200
                                rounded-xl">
                  <ClipboardList className="w-5 h-5 text-blue-600
                                             flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    <span className="font-bold">
                      {feuilleData.data?.nombreArticles || 0}
                    </span>
                    {' '}article(s) à inventorier
                  </p>
                </div>
              )}

              <button
                onClick={initLignes}
                disabled={!magasinId || feuilleLoading ||
                  !feuilleData?.data?.lignes?.length}
                className="btn-primary w-full py-3 flex items-center
                           justify-center gap-2 text-base font-semibold"
              >
                {feuilleLoading ? (
                  <div className="w-5 h-5 border-2 border-white
                                  border-t-transparent rounded-full
                                  animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {feuilleLoading
                  ? 'Chargement...'
                  : 'Démarrer l\'inventaire'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 2 : Saisie ── */}
      {etape === 'saisie' && (
        <div>
          {/* Barre progression */}
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">
                  Inventaire — {magasinNom}
                </p>
                <p className="text-sm text-gray-500">
                  {stats.saisies} / {stats.total} articles saisis
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary-600">
                  {stats.progression}%
                </span>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all"
                style={{ width: `${stats.progression}%` }}
              />
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  label: 'Total',
                  value: stats.total,
                  color: 'text-gray-900'
                },
                {
                  label: 'Saisis',
                  value: stats.saisies,
                  color: 'text-primary-600'
                },
                {
                  label: 'Sans écart',
                  value: stats.sansEcart,
                  color: 'text-green-600'
                },
                {
                  label: 'Manquants',
                  value: stats.manquants,
                  color: 'text-red-600'
                },
                {
                  label: 'Excédents',
                  value: stats.excedents,
                  color: 'text-blue-600'
                },
              ].map((s) => (
                <div key={s.label}
                  className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filtres + Actions */}
          <div className="card mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Rechercher un article..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exporterFeuille}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
                <button
                  onClick={reset}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </button>
                {canValider && (
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={stats.saisies === 0}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Valider ({stats.saisies})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tableau de saisie */}
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header w-10">#</th>
                  <th className="table-header">Référence</th>
                  <th className="table-header">Désignation</th>
                  <th className="table-header">Catégorie</th>
                  <th className="table-header text-center">
                    Stock théorique
                  </th>
                  <th className="table-header text-center">
                    Stock physique
                  </th>
                  <th className="table-header text-center">Écart</th>
                  <th className="table-header text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {lignesFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={8}
                      className="text-center py-12 text-gray-400">
                      Aucun article trouvé
                    </td>
                  </tr>
                ) : (
                  lignesFiltrees.map((ligne, i) => (
                    <LigneInventaire
                      key={ligne.article._id}
                      ligne={ligne}
                      index={lignes.indexOf(ligne)}
                      onChange={updateLigne}
                      readOnly={false}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer sticky */}
          <div className="fixed bottom-0 left-0 right-0 bg-white
                          border-t border-gray-200 shadow-lg p-4 z-20
                          lg:pl-72">
            <div className="max-w-7xl mx-auto flex items-center
                            justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-primary-600">
                  {stats.saisies}
                </span>
                /{stats.total} articles saisis —
                <span className="text-red-600 font-medium ml-1">
                  {stats.avecEcart} écart(s)
                </span>
              </p>
              {canValider && (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={stats.saisies === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Valider l'inventaire
                </button>
              )}
            </div>
          </div>

          {/* Espace pour le footer sticky */}
          <div className="h-20" />
        </div>
      )}

      {/* ── ÉTAPE 3 : Résultat ── */}
      {etape === 'resultat' && resultat && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Succès */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full
                            flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Inventaire validé avec succès !
            </h3>
            <p className="text-gray-500 mt-2">
              Les stocks ont été mis à jour selon les quantités physiques
            </p>
          </div>

          {/* Résumé */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Total lignes',
                value: resultat.resume?.totalLignes || 0,
                color: 'bg-gray-50 text-gray-700',
                icon: ClipboardList
              },
              {
                label: 'Écarts corrigés',
                value: resultat.resume?.nbEcarts || 0,
                color: resultat.resume?.nbEcarts > 0
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-green-50 text-green-700',
                icon: AlertTriangle
              },
              {
                label: 'Sans écart',
                value: resultat.resume?.nbSansEcart || 0,
                color: 'bg-green-50 text-green-700',
                icon: CheckCircle
              },
            ].map((s) => (
              <div key={s.label}
                className={`rounded-2xl p-5 text-center ${s.color}`}>
                <s.icon className="w-6 h-6 mx-auto mb-2 opacity-70" />
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Détail des écarts */}
          {resultat.resultats?.filter((r) => r.ecart !== 0).length > 0 && (
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3">
                Détail des corrections
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="table-header">Article</th>
                      <th className="table-header text-center">Avant</th>
                      <th className="table-header text-center">Après</th>
                      <th className="table-header text-center">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultat.resultats
                      ?.filter((r) => r.ecart !== 0)
                      .map((r, i) => (
                        <tr key={i}
                          className="border-b border-gray-100
                                     last:border-0">
                          <td className="table-cell">
                            <p className="text-sm font-medium
                                          text-gray-900">
                              {r.articleId}
                            </p>
                          </td>
                          <td className="table-cell text-center font-medium">
                            {r.stockTheorique}
                          </td>
                          <td className="table-cell text-center font-bold">
                            {r.stockPhysique}
                          </td>
                          <td className="table-cell text-center">
                            <span className={clsx(
                              'font-bold text-sm px-2 py-0.5 rounded-full',
                              r.ecart > 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            )}>
                              {r.ecart > 0 ? `+${r.ecart}` : r.ecart}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="btn-secondary flex-1 flex items-center
                         justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Nouvel inventaire
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmation */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        resume={{
          total:      stats.total,
          sansEcart:  stats.sansEcart,
          avecEcart:  stats.avecEcart
        }}
        onConfirm={handleValider}
        loading={validerMutation.isPending}
      />
    </div>
  );
}