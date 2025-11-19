/**
 * ProfessionalSelection Component
 * Step 2: Select a professional with shift awareness
 */

import React, { useMemo } from 'react';
import { 
  hasShiftOnDate, 
  getFormattedShiftHours,
  getProfessionalsWithShifts 
} from '../../../utils/calendar/shiftUtils';

const ProfessionalSelection = ({ 
  professionals, 
  selectedProfessional, 
  onSelectProfessional, 
  onNext, 
  onBack,
  service,
  date 
}) => {
  console.log('🔍 ProfessionalSelection - professionals:', professionals);
  console.log('🔍 ProfessionalSelection - professionals count:', professionals?.length);
  console.log('🔍 ProfessionalSelection - selected date:', date);
  
  // Get shift information for ALL professionals (don't filter out those without shifts)
  const professionalsWithShiftInfo = useMemo(() => {
    if (!professionals || professionals.length === 0) return [];
    
    // If no date selected, show all professionals without shift info
    if (!date) {
      return professionals.map(prof => ({
        ...prof,
        hasShift: true, // Assume available if no date
        shiftHours: null
      }));
    }

    // Add shift information to each professional
    return professionals.map(prof => {
      const hasShift = hasShiftOnDate(prof, date);
      return {
        ...prof,
        hasShift: hasShift || !prof.workSchedule, // If no workSchedule, assume available
        shiftHours: hasShift ? getFormattedShiftHours(prof, date) : null,
        noScheduleData: !prof.workSchedule // Flag for professionals without schedule data
      };
    });
  }, [professionals, date]);

  console.log('✅ Professionals with shift info:', professionalsWithShiftInfo);
  
  const handleSelect = (professional) => {
    // Allow selection even without shift data (maybe shift data not configured yet)
    if (!professional.hasShift && professional.workSchedule) {
      console.warn('⚠️ Professional has no shift on selected date, but allowing selection');
    }
    onSelectProfessional(professional);
    onNext();
  };

  const getEmployeeName = (prof) => {
    // The employee object has a populated 'user' field with firstName and lastName
    if (prof.user) {
      const firstName = prof.user.firstName || '';
      const lastName = prof.user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    
    // Fallback: try direct fields
    if (prof.name) return prof.name;
    if (prof.fullName) return prof.fullName;
    
    const directFullName = `${prof.firstName || ''} ${prof.lastName || ''}`.trim();
    if (directFullName) return directFullName;
    
    return 'Staff Member';
  };

  // Show message if no date selected
  if (!date) {
    return (
      <div className="professional-selection">
        <div className="selection-header">
          <h2>Select a professional</h2>
          <p className="selection-subtitle">Please select a date first</p>
        </div>
        <div className="empty-state-modal">
          <i className="icon-calendar"></i>
          <p>Select a date to see available professionals</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  // Show message if no professionals available
  if (!professionals || professionals.length === 0) {
    return (
      <div className="professional-selection">
        <div className="selection-header">
          <h2>Select a professional</h2>
          <p className="selection-subtitle">Choose who will perform the service</p>
        </div>
        <div className="empty-state-modal">
          <i className="icon-users-slash"></i>
          <p>No professionals available at this time.</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  // Show message if no professionals have shifts on selected date
  if (professionalsWithShiftInfo.length === 0) {
    return (
      <div className="professional-selection">
        <div className="selection-header">
          <h2>Select a professional</h2>
          <p className="selection-subtitle">
            For {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="empty-state-modal">
          <i className="icon-calendar-x"></i>
          <p>No professionals available on this date.</p>
          <p className="hint">Please select a different date.</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-selection">
      <div className="selection-header">
        <h2>Select a professional</h2>
        <p className="selection-subtitle">
          {service?.name && `For ${service.name} • `}
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      </div>
      <div className="professional-grid">
        {professionalsWithShiftInfo.map(prof => {
          const employeeName = getEmployeeName(prof);
          const initials = employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const isSelected = selectedProfessional?._id === (prof._id || prof.id);
          
          // Determine availability display
          // Always show as available - fallback logic handles missing shifts
          let availabilityText = 'Available';
          let availabilityClass = 'available';
          
          return (
            <div
              key={prof._id || prof.id}
              className={`professional-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(prof)}
              title={prof.shiftHours ? `Shift: ${prof.shiftHours}` : employeeName}
            >
              <div className="professional-avatar">
                {prof.avatar ? (
                  <img src={prof.avatar} alt={employeeName} />
                ) : (
                  <div className="avatar-placeholder" style={{ backgroundColor: prof.avatarColor || '#6366f1' }}>
                    {initials}
                  </div>
                )}
                {prof.hasShift && prof.shiftHours && (
                  <span className="shift-indicator" title="Has shift on this date">
                    ✓
                  </span>
                )}
              </div>
              <div className="professional-info">
                <div className="professional-name">{employeeName}</div>
                <div className="professional-position">{prof.position || prof.role || 'Staff'}</div>
                {prof.shiftHours && (
                  <div className="professional-shift-hours">
                    🕐 {prof.shiftHours}
                  </div>
                )}
                {prof.noScheduleData && (
                  <div className="professional-shift-hours" style={{ color: '#94a3b8' }}>
                    No schedule data
                  </div>
                )}
              </div>
              <div className="professional-availability">
                <span className={`availability-badge ${availabilityClass}`}>
                  {availabilityText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default ProfessionalSelection;
