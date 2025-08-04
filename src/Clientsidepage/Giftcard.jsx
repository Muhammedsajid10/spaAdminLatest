import React, { useState } from 'react';
import './Giftcard.css';

const giftCardsData = [
  { 
    code: 'INJBBHOB', 
    status: 'Expired', 
    sale: '4051', 
    purchaser: 'Bernie', 
    owner: 'Bernie', 
    total: 100.00, 
    redeemed: 0.00 
  },
  { 
    code: 'HZCMWMLQ', 
    status: 'Expired', 
    sale: '4051', 
    purchaser: 'Bernie', 
    owner: 'Bernie', 
    total: 100.00, 
    redeemed: 0.00 
  },
  { 
    code: 'PTIMAPFN', 
    status: 'Expired', 
    sale: '4051', 
    purchaser: 'Bernie', 
    owner: 'Bernie', 
    total: 100.00, 
    redeemed: 0.00 
  },
  { 
    code: 'KDLEDHAU', 
    status: 'Expired', 
    sale: '4051', 
    purchaser: 'Bernie', 
    owner: 'Bernie', 
    total: 100.00, 
    redeemed: 0.00 
  },
  { 
    code: 'XCZTMRPL', 
    status: 'Redeemed', 
    sale: '4051', 
    purchaser: 'Bernie', 
    owner: 'Bernie', 
    total: 100.00, 
    redeemed: 100.00 
  },
];

const Giftcards = () => {
  const [search, setSearch] = useState('');

  const filteredCards = giftCardsData.filter(card =>
    card.code.toLowerCase().includes(search.toLowerCase()) ||
    card.purchaser.toLowerCase().includes(search.toLowerCase()) ||
    card.owner.toLowerCase().includes(search.toLowerCase())
  );

  const calculateRemaining = (total, redeemed) => {
    return (total - redeemed).toFixed(2);
  };

  return (
    <div className="gift-container">
      <div className="header-section">
        <h1>Gift cards sold</h1>
        <button className="options-btn">
          Export
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p className="desc">
        View, filter and export gift cards purchased by your clients. <a href="#">Learn more</a>
      </p>
      
      <div className="controls">
        <input
          type="text"
          placeholder="Search by Code, Purchaser or Owner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
      </div>

      <div className="table-responsive">
        <table className="gift-table">
          <thead>
            <tr>
              <th>Gift card</th>
              <th>Status</th>
              <th>Sale #</th>
              <th>Purchaser</th>
              <th>Owner</th>
              <th>Total</th>
              <th>Redeemed</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((card, index) => (
              <tr key={index}>
                <td>
                  <span className="link">{card.code}</span>
                </td>
                <td>
                  <span className={card.status.toLowerCase()}>
                    {card.status}
                  </span>
                </td>
                <td>
                  <span className="link">{card.sale}</span>
                </td>
                <td>
                  <span className="link">{card.purchaser}</span>
                </td>
                <td>
                  <span className="link">{card.owner}</span>
                </td>
                <td>AED {card.total.toFixed(2)}</td>
                <td>AED {card.redeemed.toFixed(2)}</td>
                <td>AED {calculateRemaining(card.total, card.redeemed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredCards.length === 0 && (
        <div className="no-results">
          <p>No gift cards found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Giftcards;





