import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X } from 'lucide-react';
import { useCategories, useCreateArticle, useUpdateArticle }
  from '../../hooks/useArticles';
import NativeImagePicker from './NativeImagePicker'; 

const schema = z.object({
  reference:    z.string().min(1, 'Référence requise'),
  designation:  z.string().min(1, 'Désignation requise'),
  categorie:    z.string().min(1, 'Catégorie requise'),
  prixAchat:    z.coerce.number().min(0, 'Prix invalide'),
  prixVente:    z.coerce.number().min(0, 'Prix invalide'),
  tva:          z.coerce.number().min(0).max(100),
  stockMinimum: z.coerce.number().min(0),
  codeBarres:   z.string().optional(),
  marque:       z.string().optional(),
  description:  z.string().optional(),
});

export default function ArticleForm({ article, onSuccess }) {
const [imagePreview, setImagePreview] = useState(
  article?.image
    ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/${article.image}`
    : null
);
  const [imageFile, setImageFile] = useState(null);
  const fileRef = useRef();

  const { data: catData } = useCategories();
  const categories = catData?.data || [];

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const {
    register, handleSubmit, reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: article ? {
      reference:    article.reference,
      designation:  article.designation,
      categorie:    article.categorie?._id || article.categorie,
      prixAchat:    article.prixAchat,
      prixVente:    article.prixVente,
      tva:          article.tva,
      stockMinimum: article.stockMinimum,
      codeBarres:   article.codeBarres || '',
      marque:       article.marque || '',
      description:  article.description || '',
    } : { tva: 20, stockMinimum: 0 }
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== '') formData.append(k, v);
    });
    if (imageFile) formData.append('image', imageFile);

    if (article) {
      await updateMutation.mutateAsync({ id: article._id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    onSuccess();
  };

  const Field = ({ label, name, children, error }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Image */}
<div className="flex items-center gap-4">
  <NativeImagePicker
    preview={imagePreview}
    onImageSelected={(file, preview) => {
      setImageFile(file);
      setImagePreview(preview);
    }}
    onClear={() => { setImagePreview(null); setImageFile(null); }}
  />
  <div>
    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
      Photo produit
    </p>
    <p className="text-xs text-gray-400">JPG, PNG — max 2 Mo</p>
  </div>
</div>

      {/* Grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Référence *" error={errors.reference?.message}>
          <input {...register('reference')}
            className="input-field uppercase"
            placeholder="FIL-001" />
        </Field>

        <Field label="Code-barres" error={errors.codeBarres?.message}>
          <input {...register('codeBarres')}
            className="input-field"
            placeholder="1234567890" />
        </Field>

        <Field
          label="Désignation *"
          error={errors.designation?.message}
        >
          <input {...register('designation')}
            className="input-field"
            placeholder="Filtre à huile Bosch" />
        </Field>

        <Field label="Marque">
          <input {...register('marque')}
            className="input-field"
            placeholder="Bosch" />
        </Field>

        <Field label="Catégorie *" error={errors.categorie?.message}>
          <select {...register('categorie')} className="input-field">
            <option value="">Sélectionner...</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.nom}</option>
            ))}
          </select>
        </Field>

        <Field label="TVA (%)" error={errors.tva?.message}>
          <input {...register('tva')}
            type="number" className="input-field" />
        </Field>

        <Field label="Prix d'achat (Ar) *" error={errors.prixAchat?.message}>
          <input {...register('prixAchat')}
            type="number" className="input-field"
            placeholder="5000" />
        </Field>

        <Field label="Prix de vente (Ar) *" error={errors.prixVente?.message}>
          <input {...register('prixVente')}
            type="number" className="input-field"
            placeholder="8500" />
        </Field>

        <Field
          label="Stock minimum"
          error={errors.stockMinimum?.message}
        >
          <input {...register('stockMinimum')}
            type="number" className="input-field"
            placeholder="5" />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          {...register('description')}
          rows={2}
          className="input-field resize-none"
          placeholder="Description optionnelle..."
        />
      </Field>

      {/* Boutons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? 'Enregistrement...' : article ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}