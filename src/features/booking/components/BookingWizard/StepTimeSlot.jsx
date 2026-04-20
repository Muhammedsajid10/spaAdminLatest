import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedTimeSlot, setBookingStep, setSelectedProfessional, setSelectedService, setAvailableProfessionals, setAvailableTimeSlots } from '@store/adminBookingSlice';
import { handleAddToBookingSessionThunk } from '@store/adminBookingThunks';
import { formatUTCToLocal } from '@features/booking/helpers/selectCalendarHelpers';

const StepTimeSlot = () => {
    const dispatch = useDispatch();
    const { available, selection, navigation } = useSelector(state => state.adminBooking);
    
    const availableTimeSlots = available.timeSlots;
    const selectedTimeSlot = selection.timeSlot;
    const selectedService = selection.service;
    const selectedProfessional = selection.professional;
    const lastSelectedService = navigation.lastService;

    return (
        <div className="booking-step-timeslot">
            <h3> Pick Your Perfect Time</h3>
            <div className="booking-modal-list">
                {availableTimeSlots
                    .filter(slot => slot.available)
                    .map(slot => (
                        <button 
                            key={slot.startTime} 
                            className={`booking-modal-list-item${selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime ? ' selected' : ''}`} 
                            onClick={() => {
                                dispatch(setSelectedTimeSlot(slot));
                                dispatch(handleAddToBookingSessionThunk(slot));
                                dispatch(setBookingStep(4));
                            }}
                        >
                            <div className="booking-modal-item-name">
                                {formatUTCToLocal(slot.startTime, { hour: '2-digit', minute: '2-digit', hour12: false })} - {formatUTCToLocal(slot.endTime, { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                            <div className="booking-modal-list-desc">
                                {selectedService?.duration} minutes with {selectedProfessional?.name}
                            </div>
                        </button>
                    ))}
            </div>
            <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => {
                    if (lastSelectedService) dispatch(setSelectedService(lastSelectedService));
                    dispatch(setSelectedTimeSlot(null));
                    dispatch(setSelectedProfessional(null));
                    dispatch(setAvailableProfessionals([]));
                    dispatch(setAvailableTimeSlots([]));
                    dispatch(setBookingStep(2));
                }}>← Back to Professional</button>
            </div>
        </div>
    );
};

export default StepTimeSlot;
