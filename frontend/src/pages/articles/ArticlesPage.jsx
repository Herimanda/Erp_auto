import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, AlertTriangle } from 'lucide-react';
import {
  useArticles, useCategories, useDeleteArticle
} from '../../hooks/useArticles';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ArticleForm from './ArticleForm';
import ArticleDetail from './ArticleDetail';
import {
  Table, Thead, Th, Tbody, Tr, Td
} from '../../components/ui/Table';
import { formatMontant } from '../../utils/format';
import useAuthStore from '../../store/authStore';

export default function ArticlesPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire'].includes(user?.role);

  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useArticles({
    search, categorie, page, limit: 15
  });
  const { data: catData } = useCategories();
  const deleteMutation = useDeleteArticle();

  const articles = data?.data?.articles || [];
  const pagination = data?.data?.pagination;
  const categories = catData?.data || [];

  const handleEdit = (article) => {
    setSelected(article);
    setShowForm(true);
  };

  const handleView = (article) => {
    setSelected(article);
    setShowDetail(true);
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer cet article ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Articles"
        subtitle={`${pagination?.total || 0} article(s) au catalogue`}
        actions={canEdit && (
          <button
            onClick={() => { setSelected(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel article
          </button>
        )}
      />

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Référence, désignation, marque, code-barres..."
            />
          </div>
          <select
            value={categorie}
            onChange={(e) => { setCategorie(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-48"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Aucun article trouvé</p>
            <p className="text-sm mt-1">
              Modifiez vos critères de recherche
            </p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Référence</Th>
                <Th>Désignation</Th>
                <Th>Marque</Th>
                <Th>Catégorie</Th>
                <Th>Prix vente</Th>
                <Th>Stock min.</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {articles.map((art) => (
                <Tr key={art._id}>
                  <Td>
                    <span className="font-mono text-xs bg-gray-100
                                     px-2 py-0.5 rounded">
                      {art.reference}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      {art.image ? (
                        <img
                          src={`http://localhost:5000/${art.image}`}
                          alt={art.designation}
                          className="w-8 h-8 rounded-lg object-cover
                                     shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100
                                        shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {art.designation}
                        </p>
                        {art.codeBarres && (
                          <p className="text-xs text-gray-400">
                            {art.codeBarres}
                          </p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>{art.marque || '—'}</Td>
                  <Td>
                    <span className="badge-info">
                      {art.categorie?.nom}
                    </span>
                  </Td>
                  <Td className="font-medium">
                    {formatMontant(art.prixVente)}
                  </Td>
                  <Td>{art.stockMinimum}</Td>
                  <Td>
                    <span className={art.isActive
                      ? 'badge-success' : 'badge-danger'}>
                      {art.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleView(art)}
                        className="p-1.5 rounded-lg hover:bg-gray-100
                                   text-gray-400 hover:text-primary-600"
                        title="Voir les stocks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleEdit(art)}
                            className="p-1.5 rounded-lg hover:bg-gray-100
                                       text-gray-400 hover:text-blue-600"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(art._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100
                                       text-gray-400 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {pagination && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selected ? 'Modifier l\'article' : 'Nouvel article'}
        size="lg"
      >
        <ArticleForm
          article={selected}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>

      {/* Modal détail */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Détail article & stocks"
        size="lg"
      >
        <ArticleDetail articleId={selected?._id} />
      </Modal>
    </div>
  );
}