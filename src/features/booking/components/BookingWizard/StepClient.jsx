import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    setStep, setClientInfo, setIsWalkIn 
} from '@store/adminBookingSlice';
import { 
    searchClientsThunk, 
    clearClientSelectionThunk, 
    startAddNewClientThunk 
} from '@store/adminBookingThunks';

const StepClient = () => {
  const dispatch = useDispatch();
  const { client, isWalkIn, step } = useSelector(state => state.adminBooking);
  const { selected, searchQuery, searchResults, isAddingNew, info } = client;

  const handleSearch = (e) => {
    const q = e.target.value;
    dispatch(searchClientsThunk(q));
  };

  const selectClient = (c) => {
    dispatch({ type: 'adminBooking/setSelectedClient', payload: c });
  };

  return (
    <div className="booking-step-client">
      <h3> Client Information</h3>
      <div className="client-step-grid">
        <aside className="client-right-panel">
          <h4 className="client-right-heading">Walk-in client</h4>
          <div className="walkin-control">
            <label className="walkin-switch" htmlFor="walkInSwitch">
              <input
                id="walkInSwitch"
                type="checkbox"
                checked={isWalkIn}
                onChange={e => dispatch(setIsWalkIn(e.target.checked))}
              />
              <span className="walkin-slider" />
            </label>
            <div className="walkin-labels">
              <div className="walkin-title">Walk-in client</div>
              <div className="walkin-sub">No additional data required</div>
            </div>
          </div>
        </aside>

        <div className="client-search-section">
          {!selected && !isAddingNew && (
            <div className="client-search-input-wrapper">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchResults.length > 0 && (
                <div className="client-search-results">
                  {searchResults.map(c => (
                    <div key={c._id} className="client-search-result" onClick={() => selectClient(c)}>
                      {c.firstName} {c.lastName} ({c.phone})
                    </div>
                  ))}
                </div>
              )}
              <button className="add-new-client-btn" onClick={() => dispatch(startAddNewClientThunk())}>
                Add New Client
              </button>
            </div>
          )}

          {selected && (
            <div className="selected-client-display">
              <div className="client-info">
                <strong>{selected.firstName} {selected.lastName}</strong>
                <p>{selected.email} • {selected.phone}</p>
              </div>
              <button onClick={() => dispatch(clearClientSelectionThunk())}>Change Client</button>
            </div>
          )}

          {isAddingNew && (
            <div className="new-client-form">
                <input 
                    placeholder="Name" 
                    value={info.name} 
                    onChange={e => dispatch(setClientInfo({ name: e.target.value }))} 
                />
                <button onClick={() => dispatch({ type: 'adminBooking/setIsAddingNewClient', payload: false })}>Cancel</button>
            </div>
          )}
        </div>
      </div>
      <div className="booking-modal-actions">
        <button className="booking-modal-back" onClick={() => dispatch(setStep(4))}>← Back</button>
        <button 
            className="booking-modal-next" 
            disabled={!isWalkIn && !selected && !info.name}
            onClick={() => dispatch(setStep(6))}
        >
            Next: Preview →
        </button>
      </div>
    </div>
  );
};

export default StepClient;
