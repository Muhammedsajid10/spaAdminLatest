import React, { useMemo } from 'react';
import { Tag } from 'lucide-react';
import './ClientSalesTab.css';

const ClientSalesTab = ({ client, sales = [] }) => {
  // Format sales data for display
  const formattedSales = useMemo(() => {
    return sales.map(payment => {
      const date = payment.createdAt 
        ? new Date(payment.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '';

      const items = [];
      // Extract items from booking services
      if (payment.booking?.services) {
        payment.booking.services.forEach(svc => {
          items.push({
            name: svc.service?.name || 'Service',
            price: svc.price || 0
          });
        });
      }

      return {
        id: payment._id,
        status: payment.paymentStatus || 'pending',
        date: date,
        items: items,
        total: payment.finalAmount || payment.amount || 0,
        paymentMethod: payment.paymentMethod,
        bookingNumber: payment.booking?.bookingNumber
      };
    });
  }, [sales]);

  return (
    <div className="sales-tab-container">
      <div className="sales-header">
        <h2 className="sales-title">Sales</h2>
      </div>

      {/* Sales List */}
      <div className="sales-list">
        {formattedSales.length > 0 ? (
          formattedSales.map(sale => (
            <div key={sale.id} className="sales-card">
              <div className="timeline-icon">
                <Tag size={16} />
              </div>
              <div className="timeline-line" />
              
              <div className="sales-content">
                <div className="sales-header-row">
                  <span className="sales-title-text">Sale</span>
                  <span className={`sale-status ${sale.status.toLowerCase()}`}>{sale.status}</span>
                </div>
                <div className="sales-meta">
                  {sale.date} {sale.paymentMethod && `• ${sale.paymentMethod}`}
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
            No sales found for this client.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSalesTab;
