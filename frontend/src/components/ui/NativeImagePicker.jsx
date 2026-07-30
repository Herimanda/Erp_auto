import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Upload, X, Image as ImageIcon, CameraIcon } from 'lucide-react';

export default function NativeImagePicker({ preview, onImageSelected, onClear }) {
  const [showOptions, setShowOptions] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const dataUrlToFile = (dataUrl, filename) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const takePhoto = async (source) => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source // CameraSource.Camera ou CameraSource.Photos
      });

      const file = dataUrlToFile(photo.dataUrl, `article-${Date.now()}.jpeg`);
      onImageSelected(file, photo.dataUrl);
    } catch (err) {
      // L'utilisateur a annulé — pas d'erreur à afficher
      console.log('Sélection annulée');
    } finally {
      setShowOptions(false);
    }
  };

  const handleWebInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageSelected(file, URL.createObjectURL(file));
    }
  };

  return (
    <div>
      <div
        onClick={() => isNative ? setShowOptions(true) : document.getElementById('web-file-input')?.click()}
        className="w-24 h-24 rounded-xl border-2 border-dashed
                   border-gray-300 dark:border-gray-700 flex items-center
                   justify-center cursor-pointer hover:border-primary-400
                   hover:bg-primary-50 dark:hover:bg-primary-900/20
                   transition-colors flex-shrink-0 overflow-hidden relative"
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <Upload className="w-6 h-6 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-400 mt-1">Photo</p>
          </div>
        )}
      </div>

      {preview && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700 mt-1
                     flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Supprimer
        </button>
      )}

      {/* Input web classique (fallback navigateur) */}
      {!isNative && (
        <input
          id="web-file-input"
          type="file"
          accept="image/*"
          onChange={handleWebInput}
          className="hidden"
        />
      )}

      {/* Menu de choix natif Android : Caméra ou Galerie */}
      {showOptions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center
                        justify-center bg-black/50" onClick={() => setShowOptions(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl
                       w-full sm:w-80 p-4 space-y-2"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100
                          text-center pb-2 border-b border-gray-100 dark:border-gray-800">
              Ajouter une photo
            </p>
            <button
              onClick={() => takePhoto(CameraSource.Camera)}
              className="w-full flex items-center gap-3 p-3 rounded-xl
                         hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <CameraIcon className="w-5 h-5 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Prendre une photo
              </span>
            </button>
            <button
              onClick={() => takePhoto(CameraSource.Photos)}
              className="w-full flex items-center gap-3 p-3 rounded-xl
                         hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ImageIcon className="w-5 h-5 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Choisir dans la galerie
              </span>
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="w-full p-3 text-sm text-gray-400 text-center"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}