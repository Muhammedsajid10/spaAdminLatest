import React from 'react';
import { Gift } from 'lucide-react';
import './ClientGiftCardsTab.css';

const ClientGiftCardsTab = ({ client }) => {
  return (
    <div className="giftcards-tab-container">
      <div className="giftcards-header">
        <h2 className="giftcards-title">Gift cards</h2>
      </div>

      <div className="giftcards-content">
        <div className="empty-state-container">
          <div className="empty-icon-wrapper">
            <Gift size={32} />
          </div>
          <h3 className="empty-title">No gift cards</h3>
          <p className="empty-description">
            No gift cards have been sold to this client
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientGiftCardsTab;
