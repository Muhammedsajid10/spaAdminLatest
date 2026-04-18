import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectProfessionalThunk } from '../../../store/adminBookingThunks';
import { setBookingStep } from '../../../store/adminBookingSlice';

const StepProfessional = () => {
    const dispatch = useDispatch();
    const { available, selection } = useSelector(state => state.adminBooking);
    const { currentDate } = useSelector(state => state.calendar);
    
    const availableProfessionals = available.professionals;
    const selectedProfessional = selection.professional;
    const bookingDate = selection.date || currentDate;

    return (
        <div className="booking-step-professional">
            <h3> Choose Your Professional</h3>
            {availableProfessionals.length === 0 ? (
                <div className="booking-modal-empty-state">
                    <p>No professionals are available for this service on {new Date(bookingDate).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                    })}.</p>
                    <p>Please select a different date or service.</p>
                </div>
            ) : (
                <div className="booking-modal-list">
                    {availableProfessionals.map(prof => (
                        <button
                            key={prof._id}
                            className={`booking-modal-list-item${selectedProfessional && selectedProfessional._id === prof._id ? ' selected' : ''}`}
                            onClick={() => dispatch(selectProfessionalThunk(prof))}
                        >
                            <div className="booking-modal-item-name">
                                {prof.name}
                                <span className="professional-shift-indicator">Available</span>
                            </div>
                            <div className="booking-modal-list-desc">
                                {prof.position}
                            </div>
                        </button>
                    ))}
                </div>
            )}
            <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => dispatch(setBookingStep(1))}>← Back</button>
            </div>
        </div>
    );
};

export default StepProfessional;
