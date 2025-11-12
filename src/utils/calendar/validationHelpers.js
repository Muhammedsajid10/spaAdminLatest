/**
 * Validation Helper Functions
 * Pure functions for validation logic
 */

export const validateBookingData = (bookingData) => {
  const errors = [];

  if (!bookingData.date) {
    errors.push('Date is required');
  }

  if (!bookingData.time) {
    errors.push('Time is required');
  }

  if (!bookingData.customerId) {
    errors.push('Customer is required');
  }

  if (!bookingData.services || bookingData.services.length === 0) {
    errors.push('At least one service is required');
  }

  if (bookingData.services && bookingData.services.some(s => !s.employeeId)) {
    errors.push('Employee must be selected for all services');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateServiceSelection = (service) => {
  if (!service) return { isValid: false, error: 'Service is required' };
  if (!service.id) return { isValid: false, error: 'Service ID is required' };
  if (!service.duration) return { isValid: false, error: 'Service duration is required' };
  if (!service.price && service.price !== 0) return { isValid: false, error: 'Service price is required' };
  
  return { isValid: true, error: null };
};

export const validateEmployeeAvailability = (employee, date, time, duration) => {
  if (!employee || !employee.shifts) {
    return { isValid: false, error: 'Employee has no shifts defined' };
  }

  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const shift = employee.shifts.find(s => s.day === dayOfWeek);

  if (!shift) {
    return { isValid: false, error: `Employee is not working on ${dayOfWeek}` };
  }

  // Add more complex availability checks here if needed
  
  return { isValid: true, error: null };
};

export const validateTimeSlot = (timeSlot, appointments) => {
  if (!timeSlot) {
    return { isValid: false, error: 'Time slot is required' };
  }

  // Check if slot is in the past
  const now = new Date();
  const slotDate = new Date(timeSlot.date);
  if (slotDate < now) {
    return { isValid: false, error: 'Cannot book time slots in the past' };
  }

  // Check for conflicts with existing appointments
  const hasConflict = appointments.some(apt => {
    return apt.date === timeSlot.date && 
           apt.time === timeSlot.time && 
           apt.employeeId === timeSlot.employeeId;
  });

  if (hasConflict) {
    return { isValid: false, error: 'This time slot is already booked' };
  }

  return { isValid: true, error: null };
};

export const validatePriceEdit = (originalPrice, newPrice) => {
  if (newPrice === null || newPrice === undefined || newPrice === '') {
    return { isValid: false, error: 'Price is required' };
  }

  const numericPrice = parseFloat(newPrice);
  
  if (isNaN(numericPrice)) {
    return { isValid: false, error: 'Price must be a valid number' };
  }

  if (numericPrice < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }

  if (numericPrice > originalPrice * 2) {
    return { isValid: false, error: 'Price cannot be more than double the original price' };
  }

  return { isValid: true, error: null };
};
