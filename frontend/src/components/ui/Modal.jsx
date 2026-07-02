import { X } from 'lucide-react';
import { useEffect } from 'react';
import { clsx } from 'clsx';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="modal-overlay"
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        className={clsx(
          "modal relative w-full flex flex-col max-h-[90vh]",
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}