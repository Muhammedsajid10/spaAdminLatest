/**
 * PricingSummary Component
 * Displays pricing with edit functionality
 */

import React from 'react';
import { Edit2, Check, X } from 'lucide-react';

const PricingSummary = ({
  originalTotal,
  customDiscount,
  finalTotal,
  isEditing,
  tempPrice,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateTemp,
  onClearDiscount,
  currency = '$'
}) => {
  const hasDiscount = customDiscount > 0;

  return (
    <div className="pricing-summary">
      <div className="price-row">
        <span className="price-label">Subtotal:</span>
        <span className="price-value">
          {currency}{originalTotal.toFixed(2)}
        </span>
      </div>

      {hasDiscount && !isEditing && (
        <div className="price-row discount-row">
          <span className="price-label">Discount:</span>
          <span className="price-value discount-value">
            -{currency}{customDiscount.toFixed(2)}
            <button 
              className="clear-discount-btn"
              onClick={onClearDiscount}
              title="Remove discount"
            >
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      <div className="price-row total-row">
        <span className="price-label">Total:</span>
        <div className="total-display-controls">
          {!isEditing ? (
            <>
              {hasDiscount && (
                <span className="original-price strikethrough">
                  {currency}{originalTotal.toFixed(2)}
                </span>
              )}
              <span className="price-value total-value">
                {currency}{finalTotal.toFixed(2)}
              </span>
              <button 
                className="edit-price-btn"
                onClick={onStartEdit}
                title="Edit total price"
              >
                <Edit2 size={16} />
              </button>
            </>
          ) : (
            <div className="price-edit-controls-inline">
              <span className="currency-label">{currency}</span>
              <input
                type="number"
                className="price-input"
                value={tempPrice}
                onChange={(e) => onUpdateTemp(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
              />
              <button 
                className="save-price-btn"
                onClick={onSaveEdit}
                title="Save"
              >
                <Check size={16} />
              </button>
              <button 
                className="cancel-price-btn"
                onClick={onCancelEdit}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingSummary;
