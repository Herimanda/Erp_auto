import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages ||
      (p >= page - 1 && p <= page + 1));

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-gray-100
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) => (
        <span key={p}>
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="px-2 text-gray-400">…</span>
          )}
          <button
            onClick={() => onPageChange(p)}
            className={clsx(
              'w-9 h-9 rounded-lg text-sm font-medium',
              p === page
                ? 'bg-primary-600 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg hover:bg-gray-100
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}