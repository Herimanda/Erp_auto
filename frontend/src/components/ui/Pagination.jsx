import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p =>
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
    );

  return (
    <div className="pagination">
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="pagination-nav"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages */}
      {pages.map((p, i) => (
        <span key={p}>
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="pagination-ellipsis">…</span>
          )}

          <button
            onClick={() => onPageChange(p)}
            className={clsx(
              'pagination-item',
              p === page && 'pagination-item-active'
            )}
          >
            {p}
          </button>
        </span>
      ))}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="pagination-nav"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}