/**
 * CalendarToolbar Component
 * Employee filter and quick actions
 */

import React, { useState } from 'react';
import { Search, Users, Plus } from 'lucide-react';
import styles from './CalendarToolbar.module.css';

/**
 * Calendar Toolbar Component
 * @param {Object} props - Component props
 */
const CalendarToolbar = ({
  employees,
  selectedEmployees,
  searchQuery,
  onSearchChange,
  onToggleEmployee,
  onSelectAll,
  onDeselectAll,
  allSelected,
}) => {
  const [showEmployeeFilter, setShowEmployeeFilter] = useState(false);

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        {/* Employee filter dropdown */}
        <div className={styles.employeeFilter}>
          <button
            className={styles.filterButton}
            onClick={() => setShowEmployeeFilter(!showEmployeeFilter)}
          >
            <Users size={18} />
            <span>
              {selectedEmployees.length === 0
                ? 'All Staff'
                : `${selectedEmployees.length} Selected`}
            </span>
          </button>

          {showEmployeeFilter && (
            <div className={styles.filterDropdown}>
              <div className={styles.filterHeader}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                <div className={styles.filterActions}>
                  <button onClick={onSelectAll} className={styles.linkButton}>
                    Select All
                  </button>
                  <button onClick={onDeselectAll} className={styles.linkButton}>
                    Clear
                  </button>
                </div>
              </div>

              <div className={styles.employeeList}>
                {employees.map((employee) => {
                  const employeeId = employee._id || employee.id;
                  const isSelected = selectedEmployees.some(
                    (emp) => (emp._id || emp.id) === employeeId
                  );

                  return (
                    <label key={employeeId} className={styles.employeeItem}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleEmployee(employeeId)}
                      />
                      <span className={styles.employeeName}>
                        {employee.user?.firstName} {employee.user?.lastName}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.toolbarRight}>
        <button className={styles.addButton}>
          <Plus size={18} />
          New Appointment
        </button>
      </div>
    </div>
  );
};

export default CalendarToolbar;
