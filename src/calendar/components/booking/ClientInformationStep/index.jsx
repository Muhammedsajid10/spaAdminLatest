/**
 * ClientInformationStep Component
 * Step 5 of booking flow - Client information collection and selection
 */
import React, { useCallback } from 'react';
import './ClientInformationStep.css';

// Helper: Get client initials
const getClientInitials = (client) => {
  return (client.firstName?.[0] || '') + (client.lastName?.[0] || '');
};

// Helper: Get full client name
const getClientFullName = (client) => {
  return `${client.firstName} ${client.lastName}`;
};

// Sub-component: Walk-in Toggle
const WalkInToggle = ({ isWalkIn, onToggle }) => (
  <aside className="client-right-panel">
    <h4 className="client-right-heading">Walk-in client</h4>
    <div className="walkin-control">
      <label className="walkin-switch" htmlFor="walkInSwitch">
        <input
          id="walkInSwitch"
          type="checkbox"
          checked={isWalkIn}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="walkin-slider" />
      </label>
      <div className="walkin-labels">
        <div className="walkin-title">Walk-in client</div>
        <div className="walkin-sub">No additional data required</div>
      </div>
    </div>
  </aside>
);

// Sub-component: Client Search Result Item
const ClientSearchResultItem = ({ client, onSelect }) => (
  <div
    className="client-search-result"
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => onSelect(client)}
  >
    <div className="client-result-avatar">
      {getClientInitials(client)}
    </div>
    <div className="client-result-info">
      <div className="client-result-name">
        {getClientFullName(client)}
      </div>
      <div className="client-result-contact">
        {client.email} • {client.phone}
      </div>
    </div>
  </div>
);

// Sub-component: Selected Client Display
const SelectedClientDisplay = ({ client }) => (
  <div className="selected-client-display">
    <div className="selected-client-avatar">
      {getClientInitials(client)}
    </div>
    <div className="selected-client-info">
      <div className="selected-client-name">
        {getClientFullName(client)}
      </div>
      <div className="selected-client-contact">
        {client.email} • {client.phone}
      </div>
    </div>
    <div className="selected-client-badge">
      Existing Client
    </div>
  </div>
);

// Sub-component: New Client Form
const NewClientForm = ({ clientInfo, isWalkIn, onClientInfoChange, onBackToSearch }) => (
  <div className="new-client-form">
    <div className="new-client-header">
      <h4>Add New Client</h4>
      <button className="back-to-search-btn" onClick={onBackToSearch}>
        ← Back to Search
      </button>
    </div>
    <div className="booking-modal-form">
      <div className="form-group">
        <label htmlFor="clientName">
          Client Name {isWalkIn ? '(optional for walk-ins)' : '*'}
        </label>
        <input
          id="clientName"
          type="text"
          placeholder="Enter client's full name"
          value={clientInfo.name}
          onChange={(e) => onClientInfoChange({ ...clientInfo, name: e.target.value })}
          required={!isWalkIn}
        />
      </div>

      {!isWalkIn && (
        <>
          <div className="form-group">
            <label htmlFor="clientEmail">Email Address (Optional)</label>
            <input
              id="clientEmail"
              type="email"
              placeholder="Enter client's email address"
              value={clientInfo.email}
              onChange={(e) => onClientInfoChange({ ...clientInfo, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="clientPhone">Phone Number (Optional)</label>
            <input
              id="clientPhone"
              type="tel"
              placeholder="Enter client's phone number"
              value={clientInfo.phone}
              onChange={(e) => onClientInfoChange({ ...clientInfo, phone: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  </div>
);

// Main Component
const ClientInformationStep = ({
  // Client data
  clientInfo,
  isWalkIn,
  selectedExistingClient,
  clientSearchQuery,
  clientSearchResults,
  showClientSearch,
  isAddingNewClient,
  
  // Callbacks
  onClientInfoChange,
  onWalkInToggle,
  onClientSearchChange,
  onShowClientSearch,
  onClientSelect,
  onClearClient,
  onAddNewClient,
  onBackToSearch,
  onContinueToPayment,
  onBack,
}) => {
  const showSearchInput = !selectedExistingClient && !isAddingNewClient;
  const showSearchResults = showClientSearch && clientSearchResults.length > 0;
  const showNoResults = showClientSearch && clientSearchQuery && clientSearchResults.length === 0;
  const canContinue = selectedExistingClient || isWalkIn || (clientInfo.name && clientInfo.name.trim());

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => onShowClientSearch(false), 200);
  }, [onShowClientSearch]);

  return (
    <>
      <h3>Client Information</h3>

      <div className="client-step-grid">
        <WalkInToggle isWalkIn={isWalkIn} onToggle={onWalkInToggle} />

        <div className="client-search-section">
          <div className="client-search-header">
            <h4>Search Existing Client</h4>
            {selectedExistingClient && (
              <button className="clear-client-btn" onClick={onClearClient}>
                Clear Selection
              </button>
            )}
          </div>

          {/* Search Input */}
          {showSearchInput && (
            <div className="client-search-input-wrapper">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={clientSearchQuery}
                onChange={(e) => onClientSearchChange(e.target.value)}
                onFocus={() => onShowClientSearch(true)}
                onBlur={handleSearchBlur}
              />

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="client-search-results">
                  {clientSearchResults.map((client) => (
                    <ClientSearchResultItem
                      key={client._id}
                      client={client}
                      onSelect={onClientSelect}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {showNoResults && (
                <div className="client-search-no-results">
                  <p>No clients found</p>
                  <button className="add-new-client-btn" onClick={onAddNewClient}>
                    Add New Client
                  </button>
                </div>
              )}

              {/* Add New Client Button */}
              {!showClientSearch && (
                <button className="add-new-client-btn" onClick={onAddNewClient}>
                  Add New Client
                </button>
              )}
            </div>
          )}

          {/* Selected Client Display */}
          {selectedExistingClient && (
            <SelectedClientDisplay client={selectedExistingClient} />
          )}

          {/* New Client Form */}
          {isAddingNewClient && (
            <NewClientForm
              clientInfo={clientInfo}
              isWalkIn={isWalkIn}
              onClientInfoChange={onClientInfoChange}
              onBackToSearch={onBackToSearch}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="booking-modal-actions">
        <button
          className="booking-modal-next"
          onClick={onContinueToPayment}
          disabled={!canContinue}
        >
          Continue to Payment
        </button>
        <button className="booking-modal-back" onClick={onBack}>
          ← Back to Services
        </button>
      </div>
    </>
  );
};

export default ClientInformationStep;
