/**
 * PaymentDetails Component
 * Step 5 of Booking Flow
 */

import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Gift } from 'lucide-react';
import styles from './PaymentDetails.module.css';

const PaymentDetails = ({ 
  totalAmount, 
  onPaymentMethodChange, 
  selectedPaymentMethod,
  onGiftCardApply,
  giftCardError
}) => {
  const [giftCardCode, setGiftCardCode] = useState('');

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'upi', label: 'UPI / Online', icon: Smartphone },
    { id: 'giftcard', label: 'Gift Card', icon: Gift },
  ];

  const handleApplyGiftCard = () => {
    if (giftCardCode.trim()) {
      onGiftCardApply(giftCardCode);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.summaryCard}>
        <div className={styles.row}>
          <span>Total Amount</span>
          <span className={styles.amount}>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Payment Method</h3>
        <div className={styles.methodsGrid}>
          {paymentMethods.map(method => (
            <button
              key={method.id}
              className={`${styles.methodCard} ${selectedPaymentMethod === method.id ? styles.selected : ''}`}
              onClick={() => onPaymentMethodChange(method.id)}
            >
              <method.icon size={24} className={styles.methodIcon} />
              <span className={styles.methodLabel}>{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPaymentMethod === 'giftcard' && (
        <div className={styles.giftCardSection}>
          <h3 className={styles.sectionTitle}>Redeem Gift Card</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Enter gift card code"
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value)}
              className={styles.input}
            />
            <button 
              className={styles.applyButton}
              onClick={handleApplyGiftCard}
            >
              Apply
            </button>
          </div>
          {giftCardError && <p className={styles.error}>{giftCardError}</p>}
        </div>
      )}

      <div className={styles.notesSection}>
        <h3 className={styles.sectionTitle}>Notes (Optional)</h3>
        <textarea
          placeholder="Add booking notes..."
          className={styles.textarea}
          rows={3}
        />
      </div>
    </div>
  );
};

export default PaymentDetails;
