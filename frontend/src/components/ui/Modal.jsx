import { X } from 'lucide-react';
import { useEffect } from 'react';
import { clsx } from 'clsx';
import useUiStore from '../../store/uiStore';

export default function Modal({
  isOpen, onClose, title,
  children, size = 'md'
}) {
  const sizes = {
    sm: 'max-w-md', md: 'max-w-lg',
    lg: 'max-w-2xl', xl: 'max-w-4xl'
  };

  const registerModalClose = useUiStore((s) => s.registerModalClose);
  const clearModalClose    = useUiStore((s) => s.clearModalClose);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      registerModalClose(onClose); // ← le bouton retour appellera ceci
    } else {
      document.body.style.overflow = '';
      clearModalClose();
    }
    return () => {
      document.body.style.overflow = '';
      clearModalClose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
        'flex flex-col max-h-[90vh]', sizes[size]
      )}>
        <div className="flex items-center justify-between p-6 border-b
                        border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                       text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}