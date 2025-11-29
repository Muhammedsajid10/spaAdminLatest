/**
 * useEmployeeFilter Hook
 * Manages employee selection and filtering
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Custom hook for managing employee filter state
 * @returns {Object} Employee filter state and functions
 */
export const useEmployeeFilter = () => {
  const employees = useSelector(state => state.employees?.data || []);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Toggle employee selection
   * @param {string} employeeId - Employee ID to toggle
   */
  const toggleEmployee = useCallback((employeeId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      }
      return [...prev, employeeId];
    });
  }, []);

  /**
   * Select all employees
   */
  const selectAll = useCallback(() => {
    setSelectedEmployeeIds(employees.map(emp => emp._id || emp.id));
  }, [employees]);

  /**
   * Deselect all employees
   */
  const deselectAll = useCallback(() => {
    setSelectedEmployeeIds([]);
  }, []);

  /**
   * Check if employee is selected
   * @param {string} employeeId - Employee ID to check
   * @returns {boolean}
   */
  const isEmployeeSelected = useCallback((employeeId) => {
    return selectedEmployeeIds.includes(employeeId);
  }, [selectedEmployeeIds]);

  /**
   * Get filtered employees based on search query
   */
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;

    const query = searchQuery.toLowerCase();
    return employees.filter(emp => {
      const name = `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.toLowerCase();
      return name.includes(query);
    });
  }, [employees, searchQuery]);

  /**
   * Get selected employees
   */
  const selectedEmployees = useMemo(() => {
    if (selectedEmployeeIds.length === 0) return employees;
    return employees.filter(emp => 
      selectedEmployeeIds.includes(emp._id || emp.id)
    );
  }, [employees, selectedEmployeeIds]);

  /**
   * Check if all employees are selected
   */
  const allSelected = useMemo(() => {
    return selectedEmployeeIds.length === employees.length && employees.length > 0;
  }, [selectedEmployeeIds, employees]);

  return {
    employees,
    filteredEmployees,
    selectedEmployees,
    selectedEmployeeIds,
    searchQuery,
    setSearchQuery,
    toggleEmployee,
    selectAll,
    deselectAll,
    isEmployeeSelected,
    allSelected,
  };
};
