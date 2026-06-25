import { useState } from 'react';
import { Plus, Edit2, Building2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';

const schema = z.object({
  code:      z.string().min(1, 'Code requis').toUpperCase(),
  nom:       z.string().min(1, 'Nom requis'),
  adresse:   z.string().optional(),
  telephone: z.string().optional(),
  email:     z.string().email('Email invalide').optional()
               .or(z.literal('')),
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

  const onSubmit = (data) => mutation.mutate(data);

  const Field = ({ label, error, children }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Code *" error={errors.code?.message}>
          <input {...register('code')}
            className="input-field uppercase"
            placeholder="MAG-A" />
        </Field>
        <Field label="Nom *" error={errors.nom?.message}>
          <input {...register('nom')}
            className="input-field"
            placeholder="Magasin Principal" />
        </Field>
        <Field label="Téléphone">
          <input {...register('telephone')}
            className="input-field"
            placeholder="034 00 000 00" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register('email')} type="email"
            className="input-field" />
        </Field>
      </div>
      <Field label="Adresse">
        <textarea {...register('adresse')} rows={2}
          className="input-field resize-none"
          placeholder="Adresse complète..." />
      </Field>
      <button type="submit"
        disabled={mutation.isPending}
        className="btn-primary w-full">
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

  const { data, isLoading } = useQuery({
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

      {/* Cartes magasins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {isLoading
          ? [...Array(3)].map((_, i) => (
              <div key={i}
                className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          : magasins.map((m) => (
              <div key={m._id}
                className={clsx(
                  'bg-white rounded-2xl border p-5 shadow-sm',
                  'hover:shadow-md transition-shadow',
                  m.isActive ? 'border-gray-200' : 'border-red-200 opacity-70'
                )}>
                <div className="flex items-start justify-between">
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
                  <span className={m.isActive
                    ? 'badge-success' : 'badge-danger'}>
                    {m.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm text-gray-500">
                  {m.telephone && <p>📞 {m.telephone}</p>}
                  {m.email     && <p>✉ {m.email}</p>}
                  {m.adresse   && <p>📍 {m.adresse}</p>}
                </div>

                <div className="flex gap-2 mt-4 pt-4
                                border-t border-gray-100">
                  <button
                    onClick={() => { setSelected(m); setShowForm(true); }}
                    className="flex-1 btn-secondary text-sm
                               flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({
                      id: m._id, isActive: !m.isActive
                    })}
                    className={clsx(
                      'flex-1 text-sm rounded-lg px-3 py-2 font-medium',
                      'transition-colors',
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

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selected ? 'Modifier le magasin' : 'Nouveau magasin'}
      >
        <MagasinForm
          magasin={selected}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}