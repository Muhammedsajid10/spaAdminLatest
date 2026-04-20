import React, { useMemo } from 'react';
import { Gift } from 'lucide-react';
import './ClientGiftCardsTab.css';

const ClientGiftCardsTab = ({ client, giftCards = [] }) => {
  const formattedGiftCards = useMemo(() => {
    const formatted = giftCards.map(card => ({
      id: card._id,
      code: card.code || 'N/A', // Actual gift card code
      amount: parseFloat(card.value || card.amount || 0), // Handle value/amount fields
      balance: parseFloat(card.remainingValue || card.balance || 0), // Handle remainingValue/balance fields
      status: card.status || 'Active', // Default to Active if missing
      purchaseDate: card.purchaseDate 
        ? new Date(card.purchaseDate).toLocaleDateString('en-GB')
        : '',
      expiryDate: card.expiryDate 
        ? new Date(card.expiryDate).toLocaleDateString('en-GB')
        : ''
    }));
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
                    {card.amount > 0 && (
                      <span>Balance: AED {card.balance} / {card.amount}</span>
                    )}
                    {card.expiryDate && (
                      <span>{card.amount > 0 ? ' • ' : ''}Expires: {card.expiryDate}</span>
                    )}
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
