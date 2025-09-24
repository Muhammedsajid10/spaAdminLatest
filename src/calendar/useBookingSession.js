import { useState, useCallback } from 'react';
import { toMinutes } from './timeUtils';

export const useBookingSession = () => {
  const [multipleAppointments, setMultipleAppointments] = useState([]);
  const [currentAppointmentIndex, setCurrentAppointmentIndex] = useState(0);
  const [showServiceCatalog, setShowServiceCatalog] = useState(false);
  const [isAddingAdditionalService, setIsAddingAdditionalService] = useState(false);

  const addAppointmentToSession = useCallback((apt)=>{
    setMultipleAppointments(prev=> [...prev, { ...apt, id: apt.id || `sess_${prev.length+1}` }]);
  },[]);

  const removeAppointmentFromSession = useCallback((id)=>{
    setMultipleAppointments(prev=> prev.filter(a=> a.id!==id));
  },[]);

  const clearSession = useCallback(()=>{
    setMultipleAppointments([]);
    setCurrentAppointmentIndex(0);
    setShowServiceCatalog(false);
    setIsAddingAdditionalService(false);
  },[]);

  const getTotalSessionPrice = useCallback(()=>
    multipleAppointments.reduce((sum,a)=> sum + (a.service?.price||0),0)
  ,[multipleAppointments]);

  return {
    multipleAppointments, currentAppointmentIndex, showServiceCatalog, isAddingAdditionalService,
    setCurrentAppointmentIndex, setShowServiceCatalog, setIsAddingAdditionalService,
    addAppointmentToSession, removeAppointmentFromSession, clearSession, getTotalSessionPrice
  };
};
