/**
 * useBookingSubmission Hook
 * Handles the API call and logic for creating a booking
 */

import { useState } from 'react';
import { Base_url } from '../../../Service/Base_url';

export const useBookingSubmission = ({ onSuccess, onError }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitBooking = async (bookingData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      // 1. Prepare Client Data
      const clientData = {
        firstName: bookingData.client.firstName,
        lastName: bookingData.client.lastName || '',
        email: bookingData.client.email || '',
        phone: bookingData.client.phone || ''
      };

      // 2. Prepare Service/Appointment Data
      // Construct UTC date from selected date and time slot
      const dateStr = bookingData.date.toISOString().split('T')[0];
      const [hours, minutes] = bookingData.timeSlot.split(':').map(Number);
      
      // Create UTC date for the appointment start
      const startTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`);
      const endTime = new Date(startTime);
      endTime.setUTCMinutes(endTime.getUTCMinutes() + bookingData.service.duration);

      const serviceItem = {
        service: bookingData.service._id,
        employee: bookingData.professional._id || bookingData.professional.id,
        duration: bookingData.service.duration,
        price: bookingData.service.price,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      // 3. Prepare Payment Data
      const totalAmount = bookingData.service.price;
      const finalAmount = totalAmount; // Add discount logic here if needed

      const payload = {
        services: [serviceItem],
        client: clientData,
        appointmentDate: startTime.toISOString(),
        totalDuration: bookingData.service.duration,
        totalAmount,
        finalAmount,
        paymentMethod: bookingData.payment, // 'cash', 'card', 'upi', 'giftcard'
        paymentDetails: {}, // Add details if needed
        bookingSource: 'admin',
        notes: bookingData.notes || ''
      };

      console.log('🚀 Submitting booking:', payload);

      const response = await fetch(`${Base_url}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Booking failed');
      }

      if (onSuccess) onSuccess(data);
      return data;

    } catch (err) {
      console.error('Booking submission error:', err);
      setError(err.message);
      if (onError) onError(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBooking,
    isSubmitting,
    error
  };
};
