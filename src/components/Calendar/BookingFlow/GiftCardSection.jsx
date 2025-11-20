/**
 * GiftCardSection Component
 * Displays and manages gift card redemption during booking
 */

import React, { useState, useEffect } from 'react';
import './GiftCardSection.css';

const GiftCardSection = ({
  selectedClient,
  sessionTotal,
  membershipDiscount,
  selectedGiftCard,
  giftCardAppliedAmount,
  giftCardError,
  giftCardLoading,
  availableGiftCards,
  onGiftCardSelect,
  onGiftCardRemove,
  onValidateCode,
  calculateGiftCardValue
}) => {
  const [manualCode, setManualCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [validating, setValidating] = useState(false);
  const [codeError, setCodeError] = useState('');

  const handleManualCodeSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setCodeError('Please enter a gift card code');
      return;
    }

    try {
      setValidating(true);
      setCodeError('');
      const giftCardData = await onValidateCode(manualCode.trim());
      onGiftCardSelect(giftCardData, sessionTotal);
      setManualCode('');
      setShowCodeInput(false);
    } catch (error) {
      setCodeError(error.message || 'Invalid gift card code');
    } finally {
      setValidating(false);
    }
  };

  if (!selectedClient) {
    return (
      <div className="gift-card-section-empty">
        <p className="empty-message">Select a client to check for available gift cards</p>
      </div>
    );
  }

  const remainingTotal = Math.max(0, sessionTotal - membershipDiscount);

  return (
    <div className="gift-card-section">
      <h4 className="gift-card-section-title">
        <span className="icon">🎁</span>
        Gift Cards
      </h4>

      {selectedGiftCard && (
        <div className="applied-gift-card-banner">
          <div className="banner-icon">✅</div>
          <div className="banner-content">
            <div className="banner-title">Gift Card Applied!</div>
            <div className="banner-text">
              <strong>{selectedGiftCard.code || 'Gift Card'}</strong>
              <br />
              Applied: AED {giftCardAppliedAmount.toFixed(2)} 
              {' / '} 
              Available: AED {calculateGiftCardValue(selectedGiftCard).toFixed(2)}
            </div>
          </div>
          <button 
            className="banner-remove-btn"
            onClick={onGiftCardRemove}
            title="Remove gift card"
          >
            ×
          </button>
        </div>
      )}

      {!selectedGiftCard && (
        <>
          {/* Available Gift Cards List */}
          {availableGiftCards && availableGiftCards.length > 0 && (
            <div className="available-gift-cards">
              <p className="section-label">Client's Gift Cards:</p>
              <div className="gift-card-list">
                {availableGiftCards.map((card) => {
                  const value = calculateGiftCardValue(card);
                  return (
                    <div key={card._id} className="gift-card-item">
                      <div className="gift-card-info">
                        <div className="gift-card-code">{card.code}</div>
                        <div className="gift-card-value">AED {value.toFixed(2)}</div>
                      </div>
                      <button
                        className="gift-card-apply-btn"
                        onClick={() => onGiftCardSelect(card, sessionTotal)}
                        disabled={value <= 0}
                      >
                        {value > 0 ? 'Apply' : 'No Balance'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual Code Entry */}
          <div className="manual-code-section">
            {!showCodeInput ? (
              <button
                className="show-code-input-btn"
                onClick={() => setShowCodeInput(true)}
              >
                + Enter Gift Card Code
              </button>
            ) : (
              <form onSubmit={handleManualCodeSubmit} className="code-input-form">
                <div className="input-group">
                  <input
                    type="text"
                    className="code-input"
                    placeholder="Enter gift card code"
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value.toUpperCase());
                      setCodeError('');
                    }}
                    disabled={validating}
                  />
                  <button
                    type="submit"
                    className="apply-code-btn"
                    disabled={validating || !manualCode.trim()}
                  >
                    {validating ? 'Validating...' : 'Apply'}
                  </button>
                  <button
                    type="button"
                    className="cancel-code-btn"
                    onClick={() => {
                      setShowCodeInput(false);
                      setManualCode('');
                      setCodeError('');
                    }}
                    disabled={validating}
                  >
                    Cancel
                  </button>
                </div>
                {codeError && <div className="code-error">{codeError}</div>}
              </form>
            )}
          </div>
        </>
      )}

      {giftCardError && (
        <div className="gift-card-error">
          ⚠️ {giftCardError}
        </div>
      )}

      {!selectedGiftCard && remainingTotal > 0 && (
        <p className="gift-card-hint">
          💡 Gift cards can be used to pay for the booking. Remaining balance: AED {remainingTotal.toFixed(2)}
        </p>
      )}
    </div>
  );
};

export default GiftCardSection;
