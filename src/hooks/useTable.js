import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import {
  setSortConfig,
  setCurrentPage,
  setItemsPerPage,
  selectRow,
  deselectRow,
  selectAllRows,
  clearSelectedRows,
} from '../store/slices/uiSlice';

export const useTable = (data = []) => {
  const dispatch = useDispatch();
  const { sortConfig, currentPage, itemsPerPage, selectedRows } = useSelector(state => state.ui);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
    });
  }, [data, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, sortedData.length);

  // Actions
  const handleSort = useCallback((columnKey) => {
    dispatch(setSortConfig({
      key: columnKey,
      direction: sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, [dispatch, sortConfig]);

  const handlePageChange = useCallback((page) => {
    dispatch(setCurrentPage(page));
  }, [dispatch]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    dispatch(setItemsPerPage(newItemsPerPage));
  }, [dispatch]);

  const handleRowSelect = useCallback((rowId, checked) => {
    if (checked) {
      dispatch(selectRow({ id: rowId }));
    } else {
      dispatch(deselectRow({ id: rowId }));
    }
  }, [dispatch]);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      dispatch(selectAllRows(paginatedData.map(row => row.id)));
    } else {
      dispatch(clearSelectedRows());
    }
  }, [dispatch, paginatedData]);

  const isRowSelected = useCallback((rowId) => {
    return selectedRows.includes(rowId);
  }, [selectedRows]);

  const isAllSelected = useMemo(() => {
    return paginatedData.length > 0 && paginatedData.every(row => isRowSelected(row.id));
  }, [paginatedData, isRowSelected]);

  const isIndeterminate = useMemo(() => {
    return selectedRows.length > 0 && !isAllSelected;
  }, [selectedRows.length, isAllSelected]);

  return {
    // Data
    data: paginatedData,
    sortedData,
    totalItems: sortedData.length,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    startItem,
    endItem,
    
    // Sorting
    sortConfig,
    
    // Selection
    selectedRows,
    isAllSelected,
    isIndeterminate,
    
    // Actions
    handleSort,
    handlePageChange,
    handleItemsPerPageChange,
    handleRowSelect,
    handleSelectAll,
    isRowSelected,
  };
};
