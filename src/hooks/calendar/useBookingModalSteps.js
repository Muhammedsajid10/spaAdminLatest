import { useState, useCallback } from 'react';

export const useBookingModalSteps = () => {
  const [step, setStep] = useState(1);

  const goToStep = useCallback((value) => setStep(value), []);
  const nextStep = useCallback(() => setStep(prev => prev + 1), []);
  const prevStep = useCallback(() => setStep(prev => Math.max(1, prev - 1)), []);

  return { step, goToStep, nextStep, prevStep };
};
