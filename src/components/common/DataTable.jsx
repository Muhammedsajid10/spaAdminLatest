import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Inbox,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from './LoadingSpinner';
import './DataTable.css';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  selectable = false,
  sortable = true,
  paginated = true,
  className = '',
  emptyMessage = 'No data available',
  onRowClick = null,
  renderCell = null,
}) => {
  // Local state instead of Redux
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return rows;
    return [...rows].sort((a, b) => {
      const aValue = a?.[sortConfig.key];
      const bValue = b?.[sortConfig.key];
      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
    });
  }, [rows, sortConfig, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, paginated]);

  // Pagination info
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, sortedData.length);

  const handleSort = (columnKey) => {
    if (!sortable) return;

    setSortConfig({
      key: columnKey,
      direction: sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(paginatedData.map(row => row.id).filter(id => id !== undefined));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (rowId, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, rowId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== rowId));
    }
  };

  const isRowSelected = (rowId) => selectedRows.includes(rowId);
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => row.id && isRowSelected(row.id));
  const isIndeterminate = selectedRows.length > 0 && !isAllSelected;

  const formatCellValue = (value, column) => {
    if (column.type === 'currency') {
      // Always show AED
      return `AED ${Number(value || 0).toLocaleString('en-US')}`;
    }
    
    if (column.type === 'number') {
      return new Intl.NumberFormat('en-US').format(value || 0);
    }

    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '-';
    }

    if (column.type === 'percentage') {
      return `${(value || 0).toFixed(1)}%`;
    }
    
    return value ?? '-';
  };

 if (loading) {
  return (
    <div className={`data-table ${className}`}>
      {/* Keep header */}
      <div className="data-table__container">
        <table className="data-table__table">
          <thead className="data-table__header">
            <tr>
              {selectable && <th className="data-table__header-cell data-table__header-cell--checkbox"></th>}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`data-table__header-cell ${
                    column.align ? `data-table__header-cell--${column.align}` : ''
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Loading row in table body */}
          <tbody className="data-table__body">
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="data-table__loading-row"
              >
                <div className="data-table__loading-inline">
                  <LoadingSpinner label="Loading data…" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Keep footer/pagination visible during loading */}
      <div className="data-table__footer">
        <div className="data-table__info">
          <span>Loading...</span>
          <select
            disabled
            className="data-table__items-per-page"
          >
            <option>10 per page</option>
          </select>
        </div>
        <div className="data-table__pagination">
          <Button variant="ghost" size="sm" icon={<ChevronLeft />} disabled />
          <div className="data-table__page-numbers">
            <button className="data-table__page-number data-table__page-number--active">1</button>
          </div>
          <Button variant="ghost" size="sm" icon={<ChevronRight />} disabled />
        </div>
      </div>
    </div>
  );
}


  if (error) {
    return (
      <div className="data-table-error">
        <div className="data-table-state-icon data-table-state-icon--error">
          <AlertCircle size={40} strokeWidth={1.5} />
        </div>
        <h3 className="data-table-state-title">Something went wrong</h3>
        <p className="data-table-state-msg">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-table-empty">
        <div className="data-table-state-icon data-table-state-icon--empty">
          <Inbox size={40} strokeWidth={1.5} />
        </div>
        <h3 className="data-table-state-title">No data available</h3>
        <p className="data-table-state-msg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`data-table ${className}`}>
      {/* Table */}
      <div className="data-table__container">
        <table className="data-table__table">
          <thead className="data-table__header">
            <tr>
              {selectable && (
                <th className="data-table__header-cell data-table__header-cell--checkbox">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="data-table__checkbox"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`data-table__header-cell ${
                    sortable && column.sortable !== false ? 'data-table__header-cell--sortable' : ''
                  } ${
                    column.align ? `data-table__header-cell--${column.align}` : ''
                  }`}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                >
                  <div className="data-table__header-content">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && (
                      <div className="data-table__sort-icons">
                        <ChevronUp 
                          className={`data-table__sort-icon ${
                            sortConfig.key === column.key && sortConfig.direction === 'asc' 
                              ? 'data-table__sort-icon--active' 
                              : ''
                          }`} 
                        />
                        <ChevronDown 
                          className={`data-table__sort-icon ${
                            sortConfig.key === column.key && sortConfig.direction === 'desc' 
                              ? 'data-table__sort-icon--active' 
                              : ''
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="data-table__body">
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  className="data-table__empty"
                >
                  {emptyMessage}
                </td>
              </tr> 
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`data-table__row ${
                    row.id && isRowSelected(row.id) ? 'data-table__row--selected' : ''
                  } ${
                    onRowClick ? 'data-table__row--clickable' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <td className="data-table__cell data-table__cell--checkbox">
                      <input
                        type="checkbox"
                        checked={row.id ? isRowSelected(row.id) : false}
                        onChange={(e) => row.id && handleRowSelect(row.id, e.target.checked)}
                        className="data-table__checkbox"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`data-table__cell ${
                        column.align ? `data-table__cell--${column.align}` : ''
                      }`}
                    >
                      {renderCell ? 
                        renderCell(row, column) || formatCellValue(row[column.key], column) :
                        formatCellValue(row[column.key], column)
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && sortedData.length > 0 && (
        <div className="data-table__footer">
          <div className="data-table__info">
            <span>
              Showing {startItem} to {endItem} of {sortedData.length} results
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="data-table__items-per-page"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          
          <div className="data-table__pagination">
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronLeft />}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            />
            
            {/* Page numbers */}
            <div className="data-table__page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    className={`data-table__page-number ${
                      currentPage === pageNumber ? 'data-table__page-number--active' : ''
                    }`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronRight />}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;