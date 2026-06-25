import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import {
  useCategories,
  useCreateCategorie,
  useUpdateCategorie,
  useDeleteCategorie
} from '../../hooks/useArticles';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '../../store/authStore';
import { clsx } from 'clsx';

// ── Formulaire ─────────────────────────────────────────────────────────────
const schema = z.object({
  code:        z.string().min(1, 'Code requis'),
  nom:         z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
});

function CategorieForm({ categorie, onSuccess }) {
  const createMutation = useCreateCategorie();
  const updateMutation = useUpdateCategorie();
  const isLoading =
    createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: categorie
      ? {
          code:        categorie.code,
          nom:         categorie.nom,
          description: categorie.description || ''
        }
      : {}
  });

  const onSubmit = async (data) => {
    if (categorie) {
      await updateMutation.mutateAsync({
        id: categorie._id, data
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input
            {...register('code')}
            className="input-field uppercase"
            placeholder="FILTRE"
          />
          {errors.code && (
            <p className="text-red-500 text-xs mt-1">
              {errors.code.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Nom *</label>
          <input
            {...register('nom')}
            className="input-field"
            placeholder="Filtres moteur"
          />
          {errors.nom && (
            <p className="text-red-500 text-xs mt-1">
              {errors.nom.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="input-field resize-none"
          placeholder="Description optionnelle..."
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading
          ? 'Enregistrement...'
          : categorie ? 'Modifier' : 'Créer'}
      </button>
    </form>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { user }     = useAuthStore();
  const canEdit      = ['administrateur', 'gestionnaire'].includes(user?.role);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCategories();
  const deleteMutation      = useDeleteCategorie();
  const categories          = data?.data || [];

  const COULEURS = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
    'bg-teal-100 text-teal-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
  ];

  return (
    <div>
      <PageHeader
        title="Catégories"
        subtitle={`${categories.length} catégorie(s) d'articles`}
        actions={canEdit && (
          <button
            onClick={() => { setSelected(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle catégorie
          </button>
        )}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucune catégorie</p>
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4 mx-auto"
            >
              Créer la première catégorie
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const couleur = COULEURS[i % COULEURS.length];
            return (
              <div
                key={cat._id}
                className="bg-white rounded-2xl border border-gray-200
                           p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-bold font-mono',
                    couleur
                  )}>
                    {cat.code}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelected(cat);
                          setShowForm(true);
                        }}
                        className="p-1 rounded text-gray-400
                                   hover:text-blue-600 hover:bg-blue-50"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer "${cat.nom}" ?`)) {
                            deleteMutation.mutate(cat._id);
                          }
                        }}
                        className="p-1 rounded text-gray-400
                                   hover:text-red-600 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="font-semibold text-gray-900 text-sm">
                  {cat.nom}
                </p>
                {cat.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  {cat.nombreArticles || 0} article(s)
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selected
          ? 'Modifier la catégorie'
          : 'Nouvelle catégorie'}
      >
        <CategorieForm
          categorie={selected}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}