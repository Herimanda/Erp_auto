import { useState } from 'react';
import { Plus, Edit2, UserX, UserCheck, Key } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import { formatDateTime } from '../../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';

const ROLES = [
  { v: 'administrateur', l: 'Administrateur',
    color: 'bg-red-100 text-red-700'     },
  { v: 'gestionnaire',   l: 'Gestionnaire',
    color: 'bg-purple-100 text-purple-700'},
  { v: 'caissier',       l: 'Caissier',
    color: 'bg-blue-100 text-blue-700'   },
  { v: 'magasinier',     l: 'Magasinier',
    color: 'bg-green-100 text-green-700' },
];

const getRoleConfig = (role) =>
  ROLES.find((r) => r.v === role) || { l: role, color: 'bg-gray-100 text-gray-600' };

// ── Formulaire utilisateur ─────────────────────────────────────────────────
const schemaCreate = z.object({
  nom:        z.string().min(1, 'Nom requis'),
  prenom:     z.string().min(1, 'Prénom requis'),
  email:      z.string().email('Email invalide'),
  motDePasse: z.string().min(6, 'Min 6 caractères'),
  role:       z.enum(['administrateur','gestionnaire','caissier','magasinier']),
  magasins:   z.array(z.string()).optional(),
});

const schemaUpdate = z.object({
  nom:      z.string().min(1, 'Nom requis'),
  prenom:   z.string().min(1, 'Prénom requis'),
  email:    z.string().email('Email invalide'),
  role:     z.enum(['administrateur','gestionnaire','caissier','magasinier']),
  magasins: z.array(z.string()).optional(),
});

function UserForm({ user, onSuccess }) {
  const qc = useQueryClient();
  const isEdit = !!user;

  const { data: magasinsData } = useQuery({
    queryKey: ['magasins'],
    queryFn:  () => api.get('/magasins')
  });
  const magasins = magasinsData?.data || [];

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.put(`/users/${user._id}`, data)
        : api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries(['users']);
      toast.success(isEdit ? 'Utilisateur modifié.' : 'Utilisateur créé.');
      onSuccess();
    },
    onError: (err) => toast.error(err.message)
  });

  const {
    register, handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(isEdit ? schemaUpdate : schemaCreate),
    defaultValues: isEdit
      ? {
          nom:      user.nom,
          prenom:   user.prenom,
          email:    user.email,
          role:     user.role,
          magasins: user.magasins?.map((m) => m._id || m) || [],
        }
      : { role: 'caissier' }
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nom *</label>
          <input {...register('nom')} className="input-field"
            placeholder="Rakoto" />
          {errors.nom && (
            <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>
          )}
        </div>
        <div>
          <label className="label">Prénom *</label>
          <input {...register('prenom')} className="input-field"
            placeholder="Jean" />
          {errors.prenom && (
            <p className="text-red-500 text-xs mt-1">
              {errors.prenom.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Email *</label>
          <input {...register('email')} type="email"
            className="input-field" placeholder="jean@erp.mg" />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Rôle *</label>
          <select {...register('role')} className="input-field">
            {ROLES.map((r) => (
              <option key={r.v} value={r.v}>{r.l}</option>
            ))}
          </select>
        </div>
        {!isEdit && (
          <div className="col-span-2">
            <label className="label">Mot de passe *</label>
            <input {...register('motDePasse')} type="password"
              className="input-field" placeholder="Min. 6 caractères" />
            {errors.motDePasse && (
              <p className="text-red-500 text-xs mt-1">
                {errors.motDePasse.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Magasins */}
      <div>
        <label className="label">Magasins accessibles</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {magasins.map((m) => (
            <label key={m._id}
              className="flex items-center gap-2 p-2.5 rounded-lg
                         border border-gray-200 hover:bg-gray-50
                         cursor-pointer text-sm">
              <input
                type="checkbox"
                value={m._id}
                {...register('magasins')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium text-gray-700">{m.nom}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {m.code}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button type="submit"
        disabled={mutation.isPending}
        className="btn-primary w-full">
        {mutation.isPending
          ? 'Enregistrement...'
          : isEdit ? 'Modifier' : 'Créer l\'utilisateur'}
      </button>
    </form>
  );
}

// ── Modal reset mot de passe ───────────────────────────────────────────────
function ResetPasswordForm({ userId, onSuccess }) {
  const [mdp, setMdp]     = useState('');
  const [confirm, setConfirm] = useState('');
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mdp.length < 6) {
      return toast.error('Min. 6 caractères');
    }
    if (mdp !== confirm) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    setLoading(true);
    try {
      await api.put(`/users/${userId}`, { motDePasse: mdp });
      toast.success('Mot de passe réinitialisé.');
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nouveau mot de passe *</label>
        <input type="password" value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          className="input-field" placeholder="Min. 6 caractères" />
      </div>
      <div>
        <label className="label">Confirmer *</label>
        <input type="password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-field" placeholder="Répéter le mot de passe" />
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full">
        {loading ? 'Réinitialisation...' : 'Réinitialiser'}
      </button>
    </form>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function UtilisateursPage() {
  const [search, setSearch]         = useState('');
  const [roleFiltre, setRole]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [showReset, setShowReset]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, roleFiltre }],
    queryFn:  () => api.get('/users', {
      params: {
        role:   roleFiltre || undefined,
        limit:  50
      }
    })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      api.put(`/users/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries(['users']);
      toast.success('Statut mis à jour.');
    },
    onError: (err) => toast.error(err.message)
  });

  const users = (data?.data?.users || []).filter((u) =>
    !search ||
    `${u.nom} ${u.prenom} ${u.email}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} utilisateur(s)`}
        actions={
          <button
            onClick={() => { setSelected(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvel utilisateur
          </button>
        }
      />

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Nom, prénom, email..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setRole('')}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-medium',
                !roleFiltre
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              Tous
            </button>
            {ROLES.map((r) => (
              <button key={r.v}
                onClick={() => setRole(r.v)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium',
                  roleFiltre === r.v
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {r.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Utilisateur</Th>
                <Th>Email</Th>
                <Th>Rôle</Th>
                <Th>Magasins</Th>
                <Th>Dernière connexion</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {users.map((u) => {
                const roleCfg = getRoleConfig(u.role);
                return (
                  <Tr key={u._id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full
                                        bg-primary-600 flex items-center
                                        justify-center text-white text-xs
                                        font-bold shrink-0">
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {u.prenom} {u.nom}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm text-gray-500">{u.email}</Td>
                    <Td>
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        roleCfg.color
                      )}>
                        {roleCfg.l}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {u.magasins?.slice(0, 2).map((m) => (
                          <span key={m._id || m}
                            className="text-xs bg-gray-100 text-gray-600
                                       px-1.5 py-0.5 rounded font-mono">
                            {m.code || m}
                          </span>
                        ))}
                        {u.magasins?.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{u.magasins.length - 2}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td className="text-xs text-gray-400">
                      {u.dernierConnexion
                        ? formatDateTime(u.dernierConnexion)
                        : 'Jamais'}
                    </Td>
                    <Td>
                      <span className={u.isActive
                        ? 'badge-success' : 'badge-danger'}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelected(u); setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100
                                     text-gray-400 hover:text-blue-600"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelected(u); setShowReset(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100
                                     text-gray-400 hover:text-yellow-600"
                          title="Réinitialiser mot de passe"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate({
                            id: u._id, isActive: !u.isActive
                          })}
                          className={clsx(
                            'p-1.5 rounded-lg hover:bg-gray-100',
                            u.isActive
                              ? 'text-gray-400 hover:text-red-600'
                              : 'text-gray-400 hover:text-green-600'
                          )}
                          title={u.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {u.isActive
                            ? <UserX className="w-4 h-4" />
                            : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </div>

      <Modal isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selected ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="lg">
        <UserForm
          user={selected}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>

      <Modal isOpen={showReset}
        onClose={() => setShowReset(false)}
        title="Réinitialiser le mot de passe">
        <ResetPasswordForm
          userId={selected?._id}
          onSuccess={() => setShowReset(false)}
        />
      </Modal>
    </div>
  );
}