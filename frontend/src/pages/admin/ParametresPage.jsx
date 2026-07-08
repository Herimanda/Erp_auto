import { useState, useRef } from 'react';
import { Save, User, Lock, Bell, Palette, Camera } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

const API_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function ParametresPage() {
  const { user, setAuth } = useAuthStore();
  const [onglet, setOnglet] = useState('profil');
  const { theme, setTheme } = useThemeStore();
    const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
      const res = await api.put('/profile', profil);
      const token = localStorage.getItem('token');
      setAuth(res.data, token);
      toast.success('Profil mis à jour.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingProfil(false);
    }
  };

  // ── Photo de profil ─────────────────────────────────
  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation côté client (taille + type) avant envoi
    const typesAutorises = ['image/jpeg', 'image/png', 'image/webp'];
    if (!typesAutorises.includes(file.type)) {
      toast.error('Format non supporté (jpg, png, webp uniquement).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde (max 2 Mo).');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setUploadingPhoto(true);
    try {
      const res = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const token = localStorage.getItem('token');
      setAuth(res.data, token);
      toast.success('Photo de profil mise à jour.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = ''; // permet de re-sélectionner le même fichier si besoin
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

      <div className="settings-layout">
        {/* Navigation latérale */}
      <div className="settings-sidebar">
        <div className="settings-tabs">
            {ONGLETS.map((o) => (
              <button
                key={o.id}
                onClick={() => setOnglet(o.id)}
                className={clsx(
                  'settings-tab',
                  onglet === o.id && 'settings-tab-active'
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
              <h3 className="settings-card-title">
                Informations personnelles
              </h3>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6
                              border-b border-gray-200">
                <div className="relative group shrink-0">
<div className="w-30 h-30 rounded-full bg-primary-600
                flex items-center justify-center
                text-white text-xl font-bold overflow-hidden
                border-4 border-white shadow-lg">
  {user?.photo ? (
    <img
      src={`${API_BASE}${user.photo}`}
      alt="Photo de profil"
      className="w-full h-full object-cover"
    />
  ) : (
    <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
  )}
</div>

                  {/* Bouton overlay caméra */}
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 rounded-full bg-black/50
                              flex items-center justify-center
                              opacity-0 group-hover:opacity-100
                              transition-opacity"
                    title="Changer la photo"
                  >
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-white
                                      border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {user?.role}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    className="text-xs text-primary-600 hover:text-primary-700
                              font-medium mt-1"
                  >
                    Changer la photo
                  </button>
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
                    className="settings-block">
                    <div>
                      <p className="label-notif">
                        {n.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {n.desc}
                      </p>
                    </div>
                  <button
                    onClick={() =>
                      setNotifs({ ...notifs, [n.key]: !notifs[n.key] })
                    }
                    className={clsx(
                      'relative w-12 h-6 rounded-full shrink-0 transition-colors duration-200',
                      notifs[n.key]
                        ? 'bg-primary-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <span
                      className={clsx(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                        notifs[n.key]
                          ? 'translate-x-6'
                          : 'translate-x-0'
                      )}
                    />
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
    <h3 className="text-lg font-semibold text-gray-900
                   dark:text-gray-100 mb-5">
      Apparence
    </h3>

    {/* Thème */}
    <div className="mb-6">
      <label className="label">Thème</label>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        Choisissez l'apparence de l'application. Le mode "Auto" suit
        les préférences de votre systeme d'exploitation.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            id: 'light',
            label: 'Clair',
            icon: Sun,
            preview: 'bg-white border-gray-200'
          },
          {
            id: 'dark',
            label: 'Sombre',
            icon: Moon,
            preview: 'bg-gray-900 border-gray-700'
          },
          {
            id: 'auto',
            label: 'Auto',
            icon: Monitor,
            preview: 'bg-gradient-to-br from-white via-white to-gray-900 border-gray-300'
          },
        ].map((t) => {
          const isActive = theme === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={clsx(
                'relative border-2 rounded-xl p-3 text-center',
                'transition-all duration-150 hover:shadow-md',
                isActive
                  ? 'border-primary-600 ring-2 ring-primary-100 dark:ring-primary-900/40'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4
                                bg-primary-600 rounded-full flex
                                items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <div className={clsx(
                'h-14 rounded-lg mb-2 border flex items-center justify-center',
                t.preview
              )}>
                <Icon className={clsx(
                  'w-5 h-5',
                  t.id === 'dark' ? 'text-gray-300' : 'text-gray-500'
                )} />
              </div>
              <p className="text-sm font-medium text-gray-700
                            dark:text-gray-200">
                {t.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>

    {/* Infos système */}
    <div className="border-t border-gray-200 dark:border-gray-800 pt-5">
      <h4 className="text-sm font-semibold text-gray-700
                     dark:text-gray-300 mb-3">
        Informations système 
      </h4>
      <div className="space-y-2 text-sm">
        {[
          { label: 'Version',        value: 'ERP Auto v1.0.0' },
          { label: 'Backend',        value: 'Node.js + Express' },
          { label: 'Base de données',value: 'MongoDB' },
          { label: 'Frontend',       value: 'React + Tailwind CSS' },
        ].map((info) => (
          <div
            key={info.label}
            className="settings-info-row"
          >
            <span className="text-gray-500 dark:text-gray-400">
              {info.label}
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
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