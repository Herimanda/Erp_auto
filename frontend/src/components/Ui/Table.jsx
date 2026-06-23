import { clsx } from 'clsx';

export function Table({ children, className }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full">{children}</table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      {children}
    </thead>
  );
}

export function Th({ children, className }) {
  return (
    <th className={clsx('table-header', className)}>{children}</th>
  );
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function Tr({ children, onClick, className }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'table-row',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className }) {
  return (
    <td className={clsx('table-cell', className)}>{children}</td>
  );
}