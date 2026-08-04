import { useArticle } from '../../hooks/useArticles';
import { formatMontant } from '../../utils/format';
import { Package, AlertTriangle } from 'lucide-react';

export default function ArticleDetail({ articleId }) {
  const { data, isLoading } = useArticle(articleId);
  const article = data?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-600
                        border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="space-y-6">
      {/* Infos article */}
      <div className="flex gap-4">
        {article.image ? (
      <img
        src={`${import.meta.env.VITE_API_URL.replace("/api", "")}/${article.image}`}
        alt={article.designation}
        className="w-20 h-20 rounded-xl object-cover shrink-0"
      />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gray-100
                          flex items-center justify-center shrink-0">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {article.designation}
          </h3>
          <p className="text-sm text-gray-500">{article.reference}</p>
          <p className="text-sm text-gray-500">{article.marque}</p>
          <div className="flex gap-4 mt-2">
            <div>
              <p className="text-xs text-gray-400">Prix achat</p>
              <p className="font-semibold text-gray-900">
                {formatMontant(article.prixAchat)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Prix vente</p>
              <p className="font-semibold text-primary-600">
                {formatMontant(article.prixVente)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Marge</p>
              <p className="font-semibold text-green-600">
                {article.prixAchat > 0
                  ? Math.round(
                    ((article.prixVente - article.prixAchat)
                      / article.prixAchat) * 100
                  ) + '%'
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock total */}
      <div className={`rounded-xl p-4 ${
        article.stockTotal <= article.stockMinimum
          ? 'bg-red-50 border border-red-200'
          : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Stock total</p>
            <p className="text-3xl font-bold text-gray-900">
              {article.stockTotal}
            </p>
          </div>
          {article.stockTotal <= article.stockMinimum && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Stock faible</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Seuil minimum : {article.stockMinimum}
        </p>
      </div>

      {/* Stock par magasin */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Répartition par magasin
        </h4>
        <div className="space-y-2">
          {article.stocks?.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between
                         p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {s.magasin?.nom}
                </p>
                <p className="text-xs text-gray-500">{s.magasin?.code}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  s.quantite <= article.stockMinimum
                    ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {s.quantite}
                </p>
                <p className="text-xs text-gray-400">unités</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}