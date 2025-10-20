/**
 * TeamPopup Component
 * 
 * This component displays a popup for managing team members and their visibility
 * in the calendar view. It provides filtering, searching, and selection capabilities.
 * 
 * Features:
 * - Search team members by name
 * - Filter between all employees and scheduled employees
 * - Toggle between list and grid view modes
 * - Select/deselect individual employees for calendar filtering
 * - Clear all selections or select all employees
 * 
 * Business Logic:
 * - All state management is handled through Redux
 * - Employee data comes from the employees Redux slice
 * - UI state (popup visibility, filters, etc.) managed by teamPopup Redux slice
 */

import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './TeamPopup.css';
import {
  X,
  Search,
  Grid,
  List,
  Users,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  hideTeamPopup,
  setTeamFilter,
  setTeamSearchQuery,
  setTeamViewMode,
  toggleEmployeeSelection,
  clearEmployeeSelection,
  selectAllEmployees,
  selectTeamPopupState,
  selectSelectedEmployees,
  selectSelectedEmployeesSet
} from '../../../../store/teamPopupSlice';
import { fetchCalendarThunk } from '../../../store/thunks';
import { selectCurrentDate, selectCurrentView } from '../../../store/datePickerSlice';

/**
 * TeamPopup Component
 * Renders the team management popup with employee filtering and selection
 */
function TeamPopup() {
  const dispatch = useDispatch();
  const popupRef = useRef(null);

  // Get team popup state from Redux
  const teamPopupState = useSelector(selectTeamPopupState);
  const {
    showTeamPopup,
    teamFilter,
    teamSearchQuery,
    teamViewMode
  } = teamPopupState;

  // Get selected employees as both array and Set for different use cases
  const selectedEmployees = useSelector(selectSelectedEmployees); // Array for counting, etc.
  const selectedEmployeesSet = useSelector(selectSelectedEmployeesSet); // Set for fast lookup

  // Get employees data and loading state from Redux
  const employees = useSelector(state => state.employees.list);
  const employeesLoading = useSelector(state => state.employees.loading);
  const employeesError = useSelector(state => state.employees.error);

  /**
   * TeamPopup now relies on employee data fetched by the main calendar component
   * via fetchCalendarThunk. This prevents duplicate API calls and ensures consistency.
   * The calendar component is responsible for fetching and maintaining employee data.
   */

  /**
   * Filter and search employees based on current criteria
   * @returns {Array} Filtered array of employees
   */
  const getFilteredAndSearchedEmployees = () => {
    let filteredEmployees = employees || [];

    // Apply team filter (all vs scheduled only)
    if (teamFilter === 'scheduled') {
      // Filter to show only employees who have appointments/shifts today
      // For now, we'll show all employees - this can be enhanced with actual scheduling logic
      filteredEmployees = filteredEmployees.filter(emp => {
        // TODO: Add logic to check if employee has shifts/appointments
        // For now, return all employees
        return true;
      });
    }

    // Apply search filter
    if (teamSearchQuery.trim()) {
      const searchLower = teamSearchQuery.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp => {
        const name = emp.name || `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim();
        const position = emp.position || '';
        return name.toLowerCase().includes(searchLower) || 
               position.toLowerCase().includes(searchLower);
      });
    }

    return filteredEmployees;
  };

  /**
   * Get count of appointments for an employee (placeholder for future enhancement)
   * @param {string} employeeId - The employee ID
   * @returns {number} Number of appointments
   */
  const getEmployeeAppointmentCount = (employeeId) => {
    // TODO: Implement actual appointment counting logic
    // This would require accessing appointments state and counting appointments for this employee
    return 0;
  };

  /**
   * Handle team filter change (all/scheduled)
   * @param {string} filter - The new filter value
   */
  const handleTeamFilterChange = (filter) => {
    dispatch(setTeamFilter(filter));

    // Auto-update employee selection based on filter
    if (filter === 'scheduled') {
      // When switching to scheduled, keep only scheduled employees in selection
      const scheduledEmployees = getFilteredAndSearchedEmployees();
      const scheduledIds = scheduledEmployees.map(emp => emp._id || emp.id);
      const filteredSelection = selectedEmployees.filter(id => scheduledIds.includes(id));
      
      // Update selection to only include scheduled employees
      dispatch(clearEmployeeSelection());
      filteredSelection.forEach(id => {
        dispatch(toggleEmployeeSelection(id));
      });
    }
  };

  /**
   * Handle employee selection toggle
   * @param {string} employeeId - The employee ID to toggle
   */
  const handleEmployeeToggle = (employeeId) => {
    dispatch(toggleEmployeeSelection(employeeId));
  };

  /**
   * Handle clear all selections
   */
  const handleClearSelection = () => {
    dispatch(clearEmployeeSelection());
  };

  /**
   * Handle select all employees (based on current filter)
   */
  const handleSelectAll = () => {
    const filteredEmployees = getFilteredAndSearchedEmployees();
    const allIds = filteredEmployees.map(emp => emp._id || emp.id);
    dispatch(selectAllEmployees(allIds));
  };

  /**
   * Handle search input change
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    dispatch(setTeamSearchQuery(e.target.value));
  };

  /**
   * Handle view mode change (list/grid)
   * @param {string} mode - The new view mode
   */
  const handleViewModeChange = (mode) => {
    dispatch(setTeamViewMode(mode));
  };

  /**
   * Handle manual refresh of employee data by triggering calendar refresh
   * This ensures consistency with the main calendar component's data fetching
   */
  const handleRefreshEmployees = () => {
    console.log('🔄 TeamPopup: Requesting calendar refresh to update employee data...');
    // Trigger a calendar refresh which will fetch fresh employee data
    // Use current Redux state values to maintain consistency
    const currentReduxDate = useSelector(selectCurrentDate);
    const currentReduxView = useSelector(selectCurrentView);
    
    dispatch(fetchCalendarThunk({ 
      currentDate: currentReduxDate,
      currentView: currentReduxView
    }));
  };

  /**
   * Handle click outside popup to close it
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        dispatch(hideTeamPopup());
      }
    };

    if (showTeamPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showTeamPopup, dispatch]);

  /**
   * Handle escape key to close popup
   */
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showTeamPopup) {
        dispatch(hideTeamPopup());
      }
    };

    if (showTeamPopup) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showTeamPopup, dispatch]);

  // Don't render if popup is not shown
  if (!showTeamPopup) {
    return null;
  }

  const filteredEmployees = getFilteredAndSearchedEmployees();

  return (
    <div className="team-popup-overlay">
      <div className="team-popup" ref={popupRef}>
        {/* Header */}
        <div className="team-popup__header">
          <div className="team-popup__title">
            <Users size={18} />
            <h3>Team Management</h3>
          </div>
          <div className="team-popup__header-actions">
            <button 
              className="team-popup__refresh-btn"
              onClick={handleRefreshEmployees}
              disabled={employeesLoading}
              aria-label="Refresh team members"
              title="Refresh team members"
            >
              <RefreshCw size={16} className={employeesLoading ? 'spinning' : ''} />
            </button>
            <button 
              className="team-popup__close-btn"
              onClick={() => dispatch(hideTeamPopup())}
              aria-label="Close team popup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="team-popup__controls">
          {/* Search Bar */}
          <div className="team-popup__search">
            <Search size={16} className="team-popup__search-icon" />
            <input
              type="text"
              placeholder="Search team members..."
              value={teamSearchQuery}
              onChange={handleSearchChange}
              className="team-popup__search-input"
            />
          </div>

          {/* Filter and View Controls */}
          <div className="team-popup__filters">
            {/* Team Filter */}
            <div className="team-popup__filter-group">
              <Filter size={14} />
              <select
                value={teamFilter}
                onChange={(e) => handleTeamFilterChange(e.target.value)}
                className="team-popup__filter-select"
              >
                <option value="all">All Team</option>
                <option value="scheduled">Scheduled Only</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="team-popup__view-toggle">
              <button
                className={`team-popup__view-btn ${teamViewMode === 'list' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('list')}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                className={`team-popup__view-btn ${teamViewMode === 'grid' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('grid')}
                title="Grid View"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="team-popup__selection-controls">
          <div className="team-popup__selection-info">
            <span>{selectedEmployees.length} of {filteredEmployees.length} selected</span>
          </div>
          <div className="team-popup__selection-actions">
            <button
              className="team-popup__selection-btn"
              onClick={handleSelectAll}
              disabled={filteredEmployees.length === 0}
            >
              Select All
            </button>
            <button
              className="team-popup__selection-btn"
              onClick={handleClearSelection}
              disabled={selectedEmployees.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Employee List/Grid */}
        <div className={`team-popup__employees team-popup__employees--${teamViewMode}`}>
          {employeesLoading ? (
            <div className="team-popup__loading">
              <Users size={48} className="team-popup__loading-icon" />
              <p>Loading team members...</p>
            </div>
          ) : employeesError ? (
            <div className="team-popup__error">
              <Users size={48} className="team-popup__error-icon" />
              <p>Failed to load team members</p>
              <p className="team-popup__error-message">{employeesError}</p>
              <button 
                className="team-popup__retry-btn"
                onClick={handleRefreshEmployees}
                disabled={employeesLoading}
              >
                {employeesLoading ? 'Loading...' : 'Retry'}
              </button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="team-popup__empty">
              <Users size={48} className="team-popup__empty-icon" />
              <p>No team members found</p>
              {teamSearchQuery && (
                <p className="team-popup__empty-subtitle">
                  Try adjusting your search or filter criteria
                </p>
              )}
            </div>
          ) : (
            filteredEmployees.map((employee) => {
              const employeeId = employee._id || employee.id;
              const isSelected = selectedEmployeesSet.has(employeeId);
              const employeeName = employee.name || 
                `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim();
              const appointmentCount = getEmployeeAppointmentCount(employeeId);

              return (
                <div
                  key={employeeId}
                  className={`team-popup__employee ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleEmployeeToggle(employeeId)}
                >
                  {/* Employee Avatar */}
                  <div className="team-popup__employee-avatar">
                    {employee.avatar ? (
                      <img src={employee.avatar} alt={employeeName} />
                    ) : (
                      <div 
                        className="team-popup__employee-avatar-placeholder"
                        style={{ backgroundColor: employee.avatarColor || '#6b7280' }}
                      >
                        {employeeName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Selection Indicator */}
                    <div className={`team-popup__employee-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span>✓</span>}
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="team-popup__employee-info">
                    <div className="team-popup__employee-name">{employeeName}</div>
                    <div className="team-popup__employee-position">
                      {employee.position || 'Team Member'}
                    </div>
                    
                    {/* Appointment Count (if scheduled filter is active) */}
                    {teamFilter === 'scheduled' && (
                      <div className="team-popup__employee-appointments">
                        <Calendar size={12} />
                        <span>{appointmentCount} appointments</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="team-popup__footer">
          <div className="team-popup__footer-info">
            Showing {filteredEmployees.length} team member{filteredEmployees.length !== 1 ? 's' : ''}
          </div>
          <button
            className="team-popup__apply-btn"
            onClick={() => dispatch(hideTeamPopup())}
          >
            Apply Selection
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeamPopup;