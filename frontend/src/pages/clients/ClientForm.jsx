import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateClient, useUpdateClient } from '../../hooks/useClients';

const schema = z.object({
  nom:       z.string().min(1, 'Nom requis'),
  prenom:    z.string().optional(),
  societe:   z.string().optional(),
  categorie: z.enum(['particulier', 'garage', 'revendeur']),
  telephone: z.string().optional(),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
  adresse:   z.string().optional(),
  nif:       z.string().optional(),
});

export default function ClientForm({ client, onSuccess }) {
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const isLoading =
    createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: client
      ? {
          nom:       client.nom,
          prenom:    client.prenom || '',
          societe:   client.societe || '',
          categorie: client.categorie,
          telephone: client.telephone || '',
          email:     client.email || '',
          adresse:   client.adresse || '',
          nif:       client.nif || '',
        }
      : { categorie: 'particulier' }
  });

  const onSubmit = async (data) => {
    // Nettoyer champs vides
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== '')
    );
    if (client) {
      await updateMutation.mutateAsync({ id: client._id, data: cleaned });
    } else {
      await createMutation.mutateAsync(cleaned);
    }
    onSuccess();
  };

  const Field = ({ label, error, children }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nom *" error={errors.nom?.message}>
          <input {...register('nom')} className="input-field"
            placeholder="Rakoto" />
        </Field>
        <Field label="Prénom">
          <input {...register('prenom')} className="input-field"
            placeholder="Jean" />
        </Field>
        <Field label="Société">
          <input {...register('societe')} className="input-field"
            placeholder="Garage Rakoto" />
        </Field>
        <Field label="Catégorie *" error={errors.categorie?.message}>
          <select {...register('categorie')} className="input-field">
            <option value="particulier">Particulier</option>
            <option value="garage">Garage</option>
            <option value="revendeur">Revendeur</option>
          </select>
        </Field>
        <Field label="Téléphone">
          <input {...register('telephone')} className="input-field"
            placeholder="034 00 000 00" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register('email')} type="email"
            className="input-field" placeholder="email@exemple.mg" />
        </Field>
        <Field label="NIF">
          <input {...register('nif')} className="input-field"
            placeholder="NIF optionnel" />
        </Field>
      </div>
      <Field label="Adresse">
        <textarea {...register('adresse')} rows={2}
          className="input-field resize-none"
          placeholder="Adresse complète..." />
      </Field>
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading
          ? 'Enregistrement...'
          : client ? 'Modifier' : 'Créer le client'}
      </button>
    </form>
  );
}