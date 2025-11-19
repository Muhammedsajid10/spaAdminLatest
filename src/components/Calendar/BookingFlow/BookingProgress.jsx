/**
 * BookingProgress Component
 * Progress indicator for booking steps
 * Dynamically adjusts to show only relevant steps
 */

import React from 'react';
import { Check } from 'lucide-react';

const BookingProgress = ({ currentStep, totalSteps, hasPreSelectedTimeAndEmployee = false }) => {
  // If time and employee are pre-selected (grid booking), show simplified 3-step flow
  const steps = hasPreSelectedTimeAndEmployee
    ? [
        { number: 1, label: 'Service' },
        { number: 2, label: 'Client' },
        { number: 3, label: 'Confirm' }
      ]
    : [
        { number: 1, label: 'Service' },
        { number: 2, label: 'Professional' },
        { number: 3, label: 'Time' },
        { number: 4, label: 'Client' },
        { number: 5, label: 'Confirm' }
      ];

  return (
    <div className="booking-progress">
      {steps.map((step, index) => {
        const isActive = currentStep >= step.number;
        const isCompleted = currentStep > step.number;
        
        return (
          <React.Fragment key={step.number}>
            <div className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="step-circle">
                {isCompleted ? (
                  <Check size={16} />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`progress-line ${isCompleted ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BookingProgress;
