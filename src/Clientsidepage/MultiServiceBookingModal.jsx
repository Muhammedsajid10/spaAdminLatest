import React, { useState } from 'react';
import dayjs from 'dayjs';
import './MultiServiceBookingModal.css';

export default function MultiServiceBookingModal({
  availableServices,
  availableProfessionals,
  currentDate,
  onClose,
  onSubmit,
  loading,
  error,
  success
}) {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]); // Array of service objects
  const [serviceAssignments, setServiceAssignments] = useState({}); // {serviceId: {professional, time}}
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Service selection logic (checkbox style)
  const toggleServiceSelection = (service) => {
    setSelectedServices(prev => {
      if (prev.some(s => s._id === service._id)) {
        // Remove service and its assignment
        const updated = prev.filter(s => s._id !== service._id);
        setServiceAssignments(assignments => {
          const copy = { ...assignments };
          delete copy[service._id];
          return copy;
        });
        return updated;
      } else {
        return [...prev, service];
      }
    });
  };
  const assignProfessional = (serviceId, professionalId) => {
    setServiceAssignments(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        professional: professionalId
      }
    }));
  };
  const assignTime = (serviceId, time) => {
    setServiceAssignments(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        time
      }
    }));
  };

  // Booking payload construction
  const handleSubmit = async () => {
    // Validate all assignments
    for (const service of selectedServices) {
      const assign = serviceAssignments[service._id];
      if (!assign || !assign.professional || !assign.time) {
        alert('Please assign a professional and time for each service.');
        return;
      }
    }
    if (!clientInfo.name.trim() || !clientInfo.email.trim() || !clientInfo.phone.trim()) {
      alert('Please fill in all client info fields.');
      return;
    }
    // Construct payload and call onSubmit
    const servicesPayload = selectedServices.map(service => {
      const assign = serviceAssignments[service._id];
      return {
        service: service._id,
        professional: assign.professional,
        time: assign.time
      };
    });
    const payload = {
      date: currentDate,
      client: clientInfo,
      services: servicesPayload,
      paymentMethod
    };
    if (onSubmit) await onSubmit(payload);
  };
}
