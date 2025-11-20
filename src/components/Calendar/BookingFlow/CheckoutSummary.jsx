/**
 * CheckoutSummary Component
 * Displays booking summary with pricing, discounts, and payment breakdown
 */

import React, { useState } from 'react';
import MembershipSection from './MembershipSection';
import GiftCardSection from './GiftCardSection';
import './CheckoutSummary.css';

const CheckoutSummary = ({
  sessionAppointments,
  selectedClient,
  clientInfo,
  getTotalSessionPrice,
  
  // Membership props
  appliedMembership,
  membershipDiscountAmount,
  membershipRefreshSignal,
  onMembershipApplied,
  onMembershipRemoved,
  
  // Gift card props
  selectedGiftCard,
  giftCardAppliedAmount,
  giftCardError,
  giftCardLoading,
  availableGiftCards,
  onGiftCardSelect,
  onGiftCardRemove,
  onValidateGiftCard,
  calculateGiftCardValue,
  
  // Custom discount
  customTotalDiscount,
  onSaveCustomDiscount,
  onClearCustomDiscount
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState('');

  const totalPrice = getTotalSessionPrice();
  const membershipDiscount = membershipDiscountAmount || 0;
  const giftCardDiscount = giftCardAppliedAmount || 0;
  const customDiscount = customTotalDiscount || 0;
  const finalTotal = Math.max(0, totalPrice - membershipDiscount - giftCardDiscount - customDiscount);

  const startEditingPrice = () => {
    setIsEditingPrice(true);
    setEditedPrice(totalPrice.toString());
  };

  const saveEditedPrice = () => {
    const newPrice = parseFloat(editedPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const discount = totalPrice - newPrice;
      onSaveCustomDiscount(discount);
      setIsEditingPrice(false);
    } else {
      alert('Please enter a valid price');
    }
  };

  const cancelEditingPrice = () => {
    setIsEditingPrice(false);
    setEditedPrice('');
  };

  return (
    <div className="checkout-summary">
      {/* Appointments Summary */}
      <div className="appointments-summary-section">
        <h4 className="section-title">
          <span className="icon">📋</span>
          Booking Summary
        </h4>
        <div className="appointments-list">
          {sessionAppointments.map((apt, index) => {
            const serviceName = apt.serviceName || apt.service?.name || 'Service';
            const professionalName = apt.professionalName || 
              (apt.professional?.user?.firstName 
                ? `${apt.professional.user.firstName} ${apt.professional.user.lastName || ''}`.trim()
                : apt.professional?.name || 'Staff');
            const price = apt.price || apt.servicePrice || apt.service?.price || 0;
            const duration = apt.duration || apt.serviceDuration || apt.service?.duration || 30;
            const timeSlot = apt.timeSlot || apt.time || '';

            return (
              <div key={apt.id} className="appointment-card-mini">
                <div className="card-number">{index + 1}</div>
                <div className="card-content">
                  <div className="card-row-1">
                    <span className="service-name">{serviceName}</span>
                    <span className="service-price">AED {price.toFixed(2)}</span>
                  </div>
                  <div className="card-row-2">
                    <span className="service-time">{timeSlot}</span>
                    <span className="dot">•</span>
                    <span className="service-duration">{Math.floor(duration / 60)}h{duration % 60 ? ` ${duration % 60}m` : ''}</span>
                    <span className="dot">•</span>
                    <span className="service-professional">{professionalName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Price Edit Section */}
        <div className="total-price-section">
          <div className="total-row">
            <span className="total-label">Subtotal:</span>
            {isEditingPrice ? (
              <div className="price-edit-controls">
                <input
                  type="number"
                  className="price-input"
                  value={editedPrice}
                  onChange={(e) => setEditedPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  autoFocus
                />
                <button className="price-save-btn" onClick={saveEditedPrice} title="Save">✓</button>
                <button className="price-cancel-btn" onClick={cancelEditingPrice} title="Cancel">✕</button>
              </div>
            ) : (
              <div className="price-display-controls">
                <span className="total-value">AED {totalPrice.toFixed(2)}</span>
                <button className="price-edit-btn" onClick={startEditingPrice} title="Edit price">✏️</button>
                {customDiscount > 0 && (
                  <button className="clear-discount-btn" onClick={onClearCustomDiscount} title="Clear discount">✕</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="client-info-section">
        <h4 className="section-title">
          <span className="icon">👤</span>
          Client Information
        </h4>
        <div className="client-details">
          <div className="client-detail-row">
            <span className="label">Name:</span>
            <span className="value">
              {selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`
                : clientInfo?.name || 'Not selected'}
              {selectedClient && <span className="vip-badge">VIP</span>}
            </span>
          </div>
          <div className="client-detail-row">
            <span className="label">Email:</span>
            <span className="value">{selectedClient?.email || clientInfo?.email || '-'}</span>
          </div>
          <div className="client-detail-row">
            <span className="label">Phone:</span>
            <span className="value">{selectedClient?.phone || clientInfo?.phone || '-'}</span>
          </div>
        </div>
      </div>

      {/* Membership Section */}
      <MembershipSection
        selectedClient={selectedClient}
        sessionAppointments={sessionAppointments}
        appliedMembership={appliedMembership}
        membershipDiscountAmount={membershipDiscountAmount}
        membershipRefreshSignal={membershipRefreshSignal}
        onMembershipApplied={onMembershipApplied}
        onMembershipRemoved={onMembershipRemoved}
      />

      {/* Gift Card Section */}
      <GiftCardSection
        selectedClient={selectedClient}
        sessionTotal={totalPrice}
        membershipDiscount={membershipDiscount}
        selectedGiftCard={selectedGiftCard}
        giftCardAppliedAmount={giftCardAppliedAmount}
        giftCardError={giftCardError}
        giftCardLoading={giftCardLoading}
        availableGiftCards={availableGiftCards}
        onGiftCardSelect={onGiftCardSelect}
        onGiftCardRemove={onGiftCardRemove}
        onValidateCode={onValidateGiftCard}
        calculateGiftCardValue={calculateGiftCardValue}
      />

      {/* Payment Summary */}
      <div className="payment-summary-section">
        <h4 className="section-title">
          <span className="icon">💰</span>
          Payment Summary
        </h4>
        <div className="payment-breakdown">
          <div className="payment-row">
            <span>Service Total:</span>
            <span>AED {totalPrice.toFixed(2)}</span>
          </div>
          
          {membershipDiscount > 0 && (
            <div className="payment-row discount">
              <span>Membership Discount {appliedMembership ? `(${appliedMembership.name})` : ''}:</span>
              <span>- AED {membershipDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {giftCardDiscount > 0 && (
            <div className="payment-row discount">
              <span>Gift Card Applied:</span>
              <span>- AED {giftCardDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {customDiscount > 0 && (
            <div className="payment-row discount">
              <span>Custom Discount:</span>
              <span>- AED {customDiscount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="payment-row total">
            <span>Amount to Pay:</span>
            <span className="final-amount">AED {finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
