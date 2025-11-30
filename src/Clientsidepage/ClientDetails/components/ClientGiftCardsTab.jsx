import React, { useMemo } from 'react';
import { Gift } from 'lucide-react';
import './ClientGiftCardsTab.css';

const ClientGiftCardsTab = ({ client, giftCards = [] }) => {
  console.log('🎁 GiftCards Tab - received giftCards:', giftCards);
  console.log('🎁 GiftCards Tab - length:', giftCards?.length);
  
  const formattedGiftCards = useMemo(() => {
    const formatted = giftCards.map(card => ({
      id: card._id,
      code: card.code, // Actual gift card code like "6XUB37469HUW"
      amount: card.value || 0, // Original value
      balance: card.remainingValue || 0, // Remaining balance
      status: card.status, // "Redeemed", "Active", etc.
      purchaseDate: card.purchaseDate 
        ? new Date(card.purchaseDate).toLocaleDateString('en-GB')
        : '',
      expiryDate: card.expiryDate 
        ? new Date(card.expiryDate).toLocaleDateString('en-GB')
        : ''
    }));
    console.log('📋 Formatted gift cards:', formatted);
    return formatted;
  }, [giftCards]);

  return (
    <div className="giftcards-tab-container">
      <div className="giftcards-header">
        <h2 className="giftcards-title">Gift cards</h2>
      </div>

      <div className="giftcards-content">
        {formattedGiftCards.length > 0 ? (
          <div className="giftcards-list">
            {formattedGiftCards.map(card => (
              <div key={card.id} className="giftcard-item">
                <Gift size={24} />
                <div className="giftcard-details">
                  <div className="giftcard-code">{card.code}</div>
                  <div className="giftcard-meta">
                    Balance: AED {card.balance} / {card.amount}
                    {card.expiryDate && ` • Expires: ${card.expiryDate}`}
                  </div>
                  <span className={`giftcard-status ${card.status?.toLowerCase()}`}>
                    {card.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-container">
            <div className="empty-icon-wrapper">
              <Gift size={32} />
            </div>
            <h3 className="empty-title">No gift cards</h3>
            <p className="empty-description">
              No gift cards have been sold to this client
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientGiftCardsTab;
