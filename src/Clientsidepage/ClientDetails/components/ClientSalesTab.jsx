import React from 'react';
import { Tag } from 'lucide-react';
import './ClientSalesTab.css';

const MOCK_SALES = [
  {
    id: 1,
    status: 'Paid',
    date: '28 Nov 2025',
    items: [
      { name: 'Relaxing Massage', price: 200 },
      { name: 'Relaxing Massage', price: 200 }
    ],
    total: 400
  },
  {
    id: 2,
    status: 'Draft',
    date: '27 Nov 2025',
    items: [
      { name: 'Deep Tissue Massage', price: 250 }
    ],
    total: 250
  },
  {
    id: 3,
    status: 'Paid',
    date: '25 Nov 2025',
    items: [
      { name: 'Facial', price: 150 }
    ],
    total: 150
  }
];

const ClientSalesTab = ({ client }) => {
  return (
    <div className="sales-tab-container">
      <div className="sales-header">
        <h2 className="sales-title">Sales</h2>
      </div>

      {/* Sales List */}
      <div className="sales-list">
        {MOCK_SALES.length > 0 ? (
          MOCK_SALES.map(sale => (
            <div key={sale.id} className="sales-card">
              <div className="timeline-icon">
                <Tag size={16} />
              </div>
              <div className="timeline-line" />
              
              <div className="sales-content">
                <div className="sales-header-row">
                  <span className="sales-title-text">Sale</span>
                </div>
                <div className="sales-meta">
                  {sale.date}
                </div>

                <div className="sales-items">
                  {sale.items.map((item, index) => (
                    <div key={index} className="sale-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">AED {item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="sales-total">
                  <span className="total-label">Total</span>
                  <span className="total-amount">AED {sale.total}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No sales found for this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSalesTab;
