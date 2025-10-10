import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Download
} from 'lucide-react';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import { 
  setSortConfig, 
  setCurrentPage, 
  setItemsPerPage,
  selectRow,
  deselectRow,
  selectAllRows,
  clearSelectedRows
} from '../../store/slices/uiSlice';
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
  const dispatch = useDispatch();
  const { sortConfig, currentPage, itemsPerPage, selectedRows } = useSelector(state => state.ui);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
    });
  }, [data, sortConfig, sortable]);

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

    dispatch(setSortConfig({
      key: columnKey,
      direction: sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    dispatch(setItemsPerPage(newItemsPerPage));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      dispatch(selectAllRows(paginatedData.map(row => row.id)));
    } else {
      dispatch(clearSelectedRows());
    }
  };

  const handleRowSelect = (rowId, checked) => {
    if (checked) {
      dispatch(selectRow({ id: rowId }));
    } else {
      dispatch(deselectRow({ id: rowId }));
    }
  };

  const isRowSelected = (rowId) => selectedRows.includes(rowId);
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => isRowSelected(row.id));
  const isIndeterminate = selectedRows.length > 0 && !isAllSelected;

  const renderCellContent = (row, column) => {
    if (renderCell) {
      const customContent = renderCell(row, column);
      if (customContent !== undefined) return customContent;
    }

    const value = row[column.key];

    // Handle different data types
    switch (column.type) {
      case 'status':
        return <StatusBadge status={value} />;
      case 'currency':
        return new Intl.NumberFormat('en-AE', {
          style: 'currency',
          currency: 'AED'
        }).format(value || 0);
      case 'percentage':
        return `${(value || 0).toFixed(1)}%`;
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'datetime':
        return value ? new Date(value).toLocaleString() : '-';
      default:
        return value || '-';
    }
  };

  if (loading) {
    return (
      <div className="data-table__loading">
        <LoadingSpinner size="lg" />
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-table__error">
        <p>Error loading data: {error}</p>
        <Button variant="secondary" size="sm">
          Retry
        </Button>
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
                    isRowSelected(row.id) ? 'data-table__row--selected' : ''
                  } ${
                    onRowClick ? 'data-table__row--clickable' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <td className="data-table__cell data-table__cell--checkbox">
                      <input
                        type="checkbox"
                        checked={isRowSelected(row.id)}
                        onChange={(e) => handleRowSelect(row.id, e.target.checked)}
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
                      {renderCellContent(row, column)}
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