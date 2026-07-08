import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const schema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(1, 'Mot de passe requis')
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setMagasinActif = useAuthStore((s) => s.setMagasinActif);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);

      // Définir magasin actif par défaut
      if (res.data.user.magasins?.length > 0) {
        setMagasinActif(res.data.user.magasins[0]);
      }

      toast.success(`Bienvenue, ${res.data.user.prenom} !`);
      navigate('/dashboard');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Identifiant ou mot de passe incorrect';
      setLoginError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-900
                    via-primary-800 to-sidebar flex items-center justify-center p-4">
      {/* Card login */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center
                          w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Package className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">ERP Auto</h1>
          <p className="text-primary-200 mt-1">Gestion commerciale & stocks</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Connexion
          </h2>

          {/* Alerte d'erreur */}
          {loginError && (
            <div className="mb-5 flex items-start gap-2 rounded-xl
                            bg-red-50 border border-red-200
                            px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <p>{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                {...register('email')}
                className={`input-field ${errors.email || loginError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                placeholder="admin@erp.com"
                autoComplete="email"
                onChange={() => loginError && setLoginError(null)}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('motDePasse')}
                  className={`input-field pr-10 ${errors.motDePasse || loginError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onChange={() => loginError && setLoginError(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.motDePasse && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.motDePasse.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center
                         justify-center gap-2 py-2.5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white
                                border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Aide */}
          <p className="text-center text-xs text-gray-400 mt-6">
            ERP Auto v1.0 — Gestion multi-magasins
          </p>
        </div>
      </div>
    </div>
  );
}