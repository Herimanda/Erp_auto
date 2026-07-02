import { useState } from 'react';
import { AlertTriangle, BarChart2, Warehouse } from 'lucide-react';
import { useStockGlobal } from '../../hooks/useStocks';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import { formatMontant } from '../../utils/format';
import { clsx } from 'clsx';

export default function StocksPage() {
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const { data, isLoading } = useStockGlobal();

  const { stocks = [], resume = {}, magasins = [] } = data?.data || {};

  const stocksFiltres = stocks.filter((s) => {
    const matchSearch =
      !search ||
      s.article.designation.toLowerCase().includes(search.toLowerCase()) ||
      s.article.reference.toLowerCase().includes(search.toLowerCase());
    const matchFiltre =
      filtre === 'tous' ||
      (filtre === 'alerte' && s.enAlerte) ||
      (filtre === 'rupture' && s.stockTotal === 0);
    return matchSearch && matchFiltre;
  });

  return (
    <div>
      <PageHeader
        title="État des stocks"
        subtitle="Vue globale multi-magasins"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total articles',
            value: resume.totalArticles || 0,
            color: 'blue',
            icon: BarChart2
          },
          {
            label: 'Valeur du stock',
            value: formatMontant(resume.valeurTotaleStock || 0),
            color: 'green',
            icon: Warehouse
          },
          {
            label: 'En alerte',
            value: resume.articlesEnAlerte || 0,
            color: 'yellow',
            icon: AlertTriangle
          },
          {
            label: 'Ruptures',
            value: resume.articlesRupture || 0,
            color: 'red',
            icon: AlertTriangle
          }
        ].map((kpi) => (
          <div key={kpi.label} className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {kpi.label}
          </p>

          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {kpi.value}
          </p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Référence ou désignation..."
            />
          </div>
          <div className="flex gap-2">
            {['tous', 'alerte', 'rupture'].map((f) => (
              <button
                key={f}
                onClick={() => setFiltre(f)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium capitalize',
                  filtre === f
                    ? 'bg-primary-600 text-white'
                    : `
                      bg-gray-100 dark:bg-gray-800
                      text-gray-600 dark:text-gray-300
                      hover:bg-gray-200 dark:hover:bg-gray-700
                    `
                )}
              >
                {f === 'tous' ? 'Tous' :
                  f === 'alerte' ? '⚠ Alerte' : '🔴 Rupture'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau multi-magasins */}
      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
          <div
            className="
              w-8 h-8
              border-4
              border-primary-600
              dark:border-primary-400
              border-t-transparent
              rounded-full
              animate-spin
            "
          />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="table-header">Article</th>
                <th className="table-header">Catégorie</th>
                {magasins.map((mag) => (
                  <th key={mag._id} className="table-header text-center">
                    {mag.nom}
                  </th>
                ))}
                <th className="table-header text-center font-bold">
                  Total
                </th>
                <th className="table-header">Valeur</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody>
              {stocksFiltres.map((s) => (
                <tr key={s.article._id}
                  className="table-row">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {s.article.designation}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {s.article.reference}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge-info">
                      {s.article.categorie?.nom}
                    </span>
                  </td>
                  {magasins.map((mag) => (
                    <td key={mag._id}
                      className="table-cell text-center font-medium">
                      <span className={clsx(
                        'w-10 h-10 inline-flex items-center justify-center',
                        'rounded-lg text-sm font-bold',
                    s.parMagasin[mag.code] === 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : s.parMagasin[mag.code] <= s.article.stockMinimum
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      )}>
                        {s.parMagasin[mag.code] ?? 0}
                      </span>
                    </td>
                  ))}
                  <td className="table-cell text-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {s.stockTotal}
                    </span>
                  </td>
                  <td className="table-cell font-medium text-gray-600 dark:text-gray-300">
                    {formatMontant(s.valeurTotale)}
                  </td>
                  <td className="table-cell">
                    {s.stockTotal === 0 ? (
                      <span className="badge-danger">Rupture</span>
                    ) : s.enAlerte ? (
                      <span className="badge-warning">Alerte</span>
                    ) : (
                      <span className="badge-success">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}