import { useState } from 'react';
import { Plus, Edit2, Building2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';

const schema = z.object({
  code:      z.string().min(1, 'Code requis'),
  nom:       z.string().min(1, 'Nom requis'),
  adresse:   z.string().optional(),
  telephone: z.string().optional(),
  email:     z.string().email('Email invalide')
               .optional().or(z.literal('')),
});

function MagasinForm({ magasin, onSuccess }) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: magasin
      ? {
          code:      magasin.code,
          nom:       magasin.nom,
          adresse:   magasin.adresse   || '',
          telephone: magasin.telephone || '',
          email:     magasin.email     || '',
        }
      : {}
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      magasin
        ? api.put(`/magasins/${magasin._id}`, data)
        : api.post('/magasins', data),
    onSuccess: () => {
      qc.invalidateQueries(['magasins']);
      toast.success(magasin ? 'Magasin modifié.' : 'Magasin créé.');
      onSuccess();
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input
            {...register('code')}
            className="input-field uppercase"
            placeholder="MAG-A"
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
            placeholder="Magasin Principal"
          />
          {errors.nom && (
            <p className="text-red-500 text-xs mt-1">
              {errors.nom.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input
            {...register('telephone')}
            className="input-field"
            placeholder="034 00 000 00"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            {...register('email')}
            type="email"
            className="input-field"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="label">Adresse</label>
        <textarea
          {...register('adresse')}
          rows={2}
          className="input-field resize-none"
          placeholder="Adresse complète..."
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary w-full"
      >
        {mutation.isPending
          ? 'Enregistrement...'
          : magasin ? 'Modifier' : 'Créer le magasin'}
      </button>
    </form>
  );
}

export default function MagasinsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['magasins'],
    queryFn:  () => api.get('/magasins')
  });
  const magasins = data?.data || [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      api.put(`/magasins/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries(['magasins']);
      toast.success('Statut mis à jour.');
    },
    onError: (err) => toast.error(err.message)
  });

  if (queryError) {
    return (
      <div>
        <PageHeader title="Magasins" />
        <div className="card text-center py-12">
          <p className="text-red-500 font-medium">
            Erreur : {queryError.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Magasins"
        subtitle={`${magasins.length} magasin(s)`}
        actions={
          <button
            onClick={() => { setSelected(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau magasin
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i}
              className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : magasins.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucun magasin</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Créer le premier magasin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {magasins.map((m) => (
            <div
              key={m._id}
              className={clsx(
                'bg-white rounded-2xl border p-5 shadow-sm',
                'hover:shadow-md transition-shadow',
                m.isActive
                  ? 'border-gray-200'
                  : 'border-red-200 opacity-70'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100
                                  flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{m.nom}</p>
                    <span className="font-mono text-xs bg-gray-100
                                     px-1.5 py-0.5 rounded text-gray-600">
                      {m.code}
                    </span>
                  </div>
                </div>
                <span className={
                  m.isActive ? 'badge-success' : 'badge-danger'
                }>
                  {m.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                {m.telephone && (
                  <p className="flex items-center gap-2">
                    <span>📞</span> {m.telephone}
                  </p>
                )}
                {m.email && (
                  <p className="flex items-center gap-2">
                    <span>✉️</span> {m.email}
                  </p>
                )}
                {m.adresse && (
                  <p className="flex items-center gap-2">
                    <span>📍</span> {m.adresse}
                  </p>
                )}
                {!m.telephone && !m.email && !m.adresse && (
                  <p className="text-gray-300 italic text-xs">
                    Aucune information de contact
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelected(m);
                    setShowForm(true);
                  }}
                  className="flex-1 btn-secondary text-sm
                             flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Modifier
                </button>
                <button
                  onClick={() => toggleMutation.mutate({
                    id:       m._id,
                    isActive: !m.isActive
                  })}
                  className={clsx(
                    'flex-1 text-sm rounded-lg px-3 py-2',
                    'font-medium transition-colors',
                    m.isActive
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  )}
                >
                  {m.isActive ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelected(null); }}
        title={selected ? 'Modifier le magasin' : 'Nouveau magasin'}
      >
        <MagasinForm
          magasin={selected}
          onSuccess={() => { setShowForm(false); setSelected(null); }}
        />
      </Modal>
    </div>
  );
}