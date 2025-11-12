/**
 * useTeamManagement Hook
 * Manages team view and employee filtering
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useTeamManagement = () => {
  const employees = useSelector(state => state.employees.employees);
  
  const [teamMode, setTeamMode] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle team mode
  const toggleTeamMode = useCallback(() => {
    setTeamMode(prev => !prev);
    if (teamMode) {
      // Exiting team mode, clear selections
      setSelectedTeamMembers([]);
    }
  }, [teamMode]);

  // Enable team mode
  const enableTeamMode = useCallback(() => {
    setTeamMode(true);
  }, []);

  // Disable team mode
  const disableTeamMode = useCallback(() => {
    setTeamMode(false);
    setSelectedTeamMembers([]);
  }, []);

  // Toggle team member selection
  const toggleTeamMember = useCallback((employeeId) => {
    setSelectedTeamMembers(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      }
      return [...prev, employeeId];
    });
  }, []);

  // Add team member
  const addTeamMember = useCallback((employeeId) => {
    setSelectedTeamMembers(prev => {
      if (!prev.includes(employeeId)) {
        return [...prev, employeeId];
      }
      return prev;
    });
  }, []);

  // Remove team member
  const removeTeamMember = useCallback((employeeId) => {
    setSelectedTeamMembers(prev => prev.filter(id => id !== employeeId));
  }, []);

  // Clear all team members
  const clearTeamSelection = useCallback(() => {
    setSelectedTeamMembers([]);
  }, []);

  // Select all team members
  const selectAllTeamMembers = useCallback(() => {
    setSelectedTeamMembers(employees.map(emp => emp.id || emp._id));
  }, [employees]);

  // Toggle team selector modal
  const toggleTeamSelector = useCallback(() => {
    setShowTeamSelector(prev => !prev);
  }, []);

  const openTeamSelector = useCallback(() => {
    setShowTeamSelector(true);
  }, []);

  const closeTeamSelector = useCallback(() => {
    setShowTeamSelector(false);
  }, []);

  // Search functionality
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Filter employees by search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => {
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const position = (emp.position || '').toLowerCase();
      
      return name.includes(query) || email.includes(query) || position.includes(query);
    });
  }, [employees, searchQuery]);

  // Get selected employees data
  const selectedEmployees = useMemo(() => {
    return employees.filter(emp => 
      selectedTeamMembers.includes(emp.id || emp._id)
    );
  }, [employees, selectedTeamMembers]);

  // Check if employee is selected
  const isEmployeeSelected = useCallback((employeeId) => {
    return selectedTeamMembers.includes(employeeId);
  }, [selectedTeamMembers]);

  // Computed values
  const hasTeamSelection = selectedTeamMembers.length > 0;
  const teamMemberCount = selectedTeamMembers.length;
  const allEmployeesSelected = selectedTeamMembers.length === employees.length;
  const isSearching = searchQuery.trim().length > 0;

  return {
    // State
    teamMode,
    selectedTeamMembers,
    showTeamSelector,
    searchQuery,
    filteredEmployees,
    selectedEmployees,

    // Computed
    hasTeamSelection,
    teamMemberCount,
    allEmployeesSelected,
    isSearching,

    // Team mode actions
    toggleTeamMode,
    enableTeamMode,
    disableTeamMode,

    // Selection actions
    toggleTeamMember,
    addTeamMember,
    removeTeamMember,
    clearTeamSelection,
    selectAllTeamMembers,
    isEmployeeSelected,

    // Modal actions
    toggleTeamSelector,
    openTeamSelector,
    closeTeamSelector,

    // Search actions
    updateSearchQuery,
    clearSearch
  };
};
