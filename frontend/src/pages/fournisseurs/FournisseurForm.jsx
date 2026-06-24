import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateFournisseur, useUpdateFournisseur
} from '../../hooks/useFournisseurs';

const schema = z.object({
  reference:    z.string().min(1, 'Référence requise'),
  raisonSociale:z.string().min(1, 'Raison sociale requise'),
  contact:      z.string().optional(),
  telephone:    z.string().optional(),
  email:        z.string().email('Email invalide').optional()
                  .or(z.literal('')),
  adresse:      z.string().optional(),
  nif:          z.string().optional(),
});

export default function FournisseurForm({ fournisseur, onSuccess }) {
  const createMutation = useCreateFournisseur();
  const updateMutation = useUpdateFournisseur();
  const isLoading =
    createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: fournisseur
      ? {
          reference:     fournisseur.reference,
          raisonSociale: fournisseur.raisonSociale,
          contact:       fournisseur.contact || '',
          telephone:     fournisseur.telephone || '',
          email:         fournisseur.email || '',
          adresse:       fournisseur.adresse || '',
          nif:           fournisseur.nif || '',
        }
      : {}
  });

  const onSubmit = async (data) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== '')
    );
    if (fournisseur) {
      await updateMutation.mutateAsync({
        id: fournisseur._id, data: cleaned
      });
    } else {
      await createMutation.mutateAsync(cleaned);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Référence *</label>
          <input {...register('reference')}
            className="input-field uppercase"
            placeholder="FOUR-001" />
          {errors.reference && (
            <p className="text-red-500 text-xs mt-1">
              {errors.reference.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Raison sociale *</label>
          <input {...register('raisonSociale')} className="input-field"
            placeholder="Bosch Madagascar" />
          {errors.raisonSociale && (
            <p className="text-red-500 text-xs mt-1">
              {errors.raisonSociale.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Contact</label>
          <input {...register('contact')} className="input-field"
            placeholder="Nom du contact" />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input {...register('telephone')} className="input-field"
            placeholder="034 00 000 00" />
        </div>
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email"
            className="input-field" />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">NIF</label>
          <input {...register('nif')} className="input-field" />
        </div>
      </div>
      <div>
        <label className="label">Adresse</label>
        <textarea {...register('adresse')} rows={2}
          className="input-field resize-none" />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading
          ? 'Enregistrement...'
          : fournisseur ? 'Modifier' : 'Créer'}
      </button>
    </form>
  );
}