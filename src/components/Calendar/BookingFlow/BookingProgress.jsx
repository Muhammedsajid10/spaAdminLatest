/**
 * BookingProgress Component
 * Progress indicator for booking steps
 */

import React from 'react';
import { Check } from 'lucide-react';

const BookingProgress = ({ currentStep, totalSteps }) => {
  const steps = [
    { number: 1, label: 'Service' },
    { number: 2, label: 'Professional' },
    { number: 3, label: 'Time' },
    { number: 4, label: 'Client' },
    { number: 5, label: 'Confirm' }
  ];

  return (
    <div className="booking-progress">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > step.number ? (
                <Check size={16} />
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
          {index < steps.length - 1 && (
            <div className={`progress-line ${currentStep > step.number ? 'completed' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default BookingProgress;
