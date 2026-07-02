import { clsx } from 'clsx';

export function Table({ children, className }) {
  return (
    <div className={clsx('table-wrapper', className)}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="table-head">
      {children}
    </thead>
  );
}

export function Th({ children, className }) {
  return (
    <th className={clsx('table-header', className)}>
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return (
    <tbody className="table-body">
      {children}
    </tbody>
  );
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
    <td className={clsx('table-cell', className)}>
      {children}
    </td>
  );
}