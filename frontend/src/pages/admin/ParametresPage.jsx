import { useState } from 'react';
import { Save, User, Lock, Bell, Palette } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function ParametresPage() {
  const { user, setAuth } = useAuthStore();
  const [onglet, setOnglet] = useState('profil');

  // ── Profil ──────────────────────────────────────────
  const [profil, setProfil] = useState({
    nom:       user?.nom    || '',
    prenom:    user?.prenom || '',
    email:     user?.email  || '',
  });
  const [loadingProfil, setLoadingProfil] = useState(false);

  const saveProfil = async (e) => {
    e.preventDefault();
    setLoadingProfil(true);
    try {
      const res = await api.put(`/users/${user._id}`, profil);
      const token = localStorage.getItem('token');
      setAuth(res.data, token);
      toast.success('Profil mis à jour.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingProfil(false);
    }
  };

  // ── Mot de passe ────────────────────────────────────
  const [mdp, setMdp] = useState({
    ancien: '', nouveau: '', confirmer: ''
  });
  const [loadingMdp, setLoadingMdp] = useState(false);

  const saveMdp = async (e) => {
    e.preventDefault();
    if (mdp.nouveau.length < 6) {
      return toast.error('Min. 6 caractères.');
    }
    if (mdp.nouveau !== mdp.confirmer) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    setLoadingMdp(true);
    try {
      await api.put('/auth/change-password', {
        ancienMdp:  mdp.ancien,
        nouveauMdp: mdp.nouveau
      });
      toast.success('Mot de passe modifié.');
      setMdp({ ancien: '', nouveau: '', confirmer: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingMdp(false);
    }
  };

  // ── Notifications ───────────────────────────────────
  const [notifs, setNotifs] = useState({
    stockFaible:       true,
    factureImpayee:    true,
    nouvelleCommande:  false,
    transfertAttente:  true,
  });

  const ONGLETS = [
    { id: 'profil',       label: 'Mon profil',    icon: User  },
    { id: 'securite',     label: 'Sécurité',      icon: Lock  },
    { id: 'notifications',label: 'Notifications', icon: Bell  },
    { id: 'apparence',    label: 'Apparence',     icon: Palette},
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-gray-500 mt-1">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation latérale */}
        <div className="lg:w-56 shrink-0">
          <div className="card p-2 space-y-1">
            {ONGLETS.map((o) => (
              <button
                key={o.id}
                onClick={() => setOnglet(o.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5',
                  'rounded-lg text-sm font-medium transition-colors',
                  onglet === o.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <o.icon className="w-4 h-4" />
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1">

          {/* Profil */}
          {onglet === 'profil' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                Informations personnelles
              </h3>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6
                              border-b border-gray-200">
                <div className="w-16 h-16 rounded-full bg-primary-600
                                flex items-center justify-center
                                text-white text-xl font-bold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {user?.role}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={saveProfil} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nom</label>
                    <input
                      value={profil.nom}
                      onChange={(e) =>
                        setProfil({ ...profil, nom: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Prénom</label>
                    <input
                      value={profil.prenom}
                      onChange={(e) =>
                        setProfil({ ...profil, prenom: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={profil.email}
                      onChange={(e) =>
                        setProfil({ ...profil, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit"
                    disabled={loadingProfil}
                    className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loadingProfil ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sécurité */}
          {onglet === 'securite' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                Changer le mot de passe
              </h3>
              <form onSubmit={saveMdp} className="space-y-4 max-w-sm">
                <div>
                  <label className="label">Mot de passe actuel</label>
                  <input type="password"
                    value={mdp.ancien}
                    onChange={(e) =>
                      setMdp({ ...mdp, ancien: e.target.value })}
                    className="input-field" required />
                </div>
                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <input type="password"
                    value={mdp.nouveau}
                    onChange={(e) =>
                      setMdp({ ...mdp, nouveau: e.target.value })}
                    className="input-field"
                    placeholder="Min. 6 caractères" required />
                </div>
                <div>
                  <label className="label">Confirmer</label>
                  <input type="password"
                    value={mdp.confirmer}
                    onChange={(e) =>
                      setMdp({ ...mdp, confirmer: e.target.value })}
                    className="input-field"
                    placeholder="Répéter le mot de passe" required />
                </div>

                {/* Indicateur force */}
                {mdp.nouveau && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Force du mot de passe
                    </p>
                    <div className="flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i}
                          className={clsx(
                            'h-1.5 flex-1 rounded-full',
                            mdp.nouveau.length >= i * 3
                              ? i <= 1 ? 'bg-red-500'
                                : i <= 2 ? 'bg-yellow-500'
                                : i <= 3 ? 'bg-blue-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button type="submit"
                    disabled={loadingMdp}
                    className="btn-primary flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {loadingMdp ? 'Modification...' : 'Modifier'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications */}
          {onglet === 'notifications' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                Préférences de notifications
              </h3>
              <div className="space-y-4">
                {[
                  {
                    key:   'stockFaible',
                    label: 'Stock minimum atteint',
                    desc:  'Alerte quand un article passe sous le seuil minimum'
                  },
                  {
                    key:   'factureImpayee',
                    label: 'Facture impayée',
                    desc:  'Rappel pour les factures à crédit non réglées'
                  },
                  {
                    key:   'nouvelleCommande',
                    label: 'Nouvelle commande fournisseur',
                    desc:  'Notification à la création d\'une commande'
                  },
                  {
                    key:   'transfertAttente',
                    label: 'Transfert en attente',
                    desc:  'Alerte pour les transferts à valider ou réceptionner'
                  },
                ].map((n) => (
                  <div key={n.key}
                    className="flex items-center justify-between
                               p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {n.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {n.desc}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifs({ ...notifs, [n.key]: !notifs[n.key] })}
                      className={clsx(
                        'w-11 h-6 rounded-full transition-colors',
                        'relative shrink-0',
                        notifs[n.key]
                          ? 'bg-primary-600' : 'bg-gray-300'
                      )}
                    >
                      <span className={clsx(
                        'absolute top-0.5 w-5 h-5 bg-white rounded-full',
                        'shadow transition-transform',
                        notifs[n.key]
                          ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => toast.success('Préférences sauvegardées.')}
                  className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> Sauvegarder
                </button>
              </div>
            </div>
          )}

          {/* Apparence */}
          {onglet === 'apparence' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                Apparence
              </h3>

              {/* Thème */}
              <div className="mb-6">
                <label className="label">Thème</label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { id: 'light', label: 'Clair',   bg: 'bg-white'    },
                    { id: 'dark',  label: 'Sombre',  bg: 'bg-gray-900' },
                    { id: 'auto',  label: 'Auto',    bg: 'bg-gradient-to-r from-white to-gray-900' },
                  ].map((t) => (
                    <div key={t.id}
                      className="border-2 border-primary-600 rounded-xl
                                 p-3 text-center cursor-pointer
                                 hover:shadow-md transition-shadow">
                      <div className={`h-12 rounded-lg mb-2 ${t.bg} border border-gray-200`}/>
                      <p className="text-sm font-medium text-gray-700">
                        {t.label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Le mode sombre sera disponible dans une prochaine version.
                </p>
              </div>

              {/* Infos système */}
              <div className="border-t border-gray-200 pt-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Informations système
                </h4>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Version',   value: 'ERP Auto v1.0.0'     },
                    { label: 'Backend',   value: 'Node.js + Express'   },
                    { label: 'Base de données', value: 'MongoDB'       },
                    { label: 'Frontend',  value: 'React + Tailwind CSS' },
                  ].map((info) => (
                    <div key={info.label}
                      className="flex justify-between items-center
                                 p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">{info.label}</span>
                      <span className="font-medium text-gray-700">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}