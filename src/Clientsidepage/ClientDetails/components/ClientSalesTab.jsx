import React from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ClientSalesTab = ({ sales }) => {
  
  const handleDownloadInvoice = (invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Invoice Details", 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoiceNumber || '-'}`, 14, 30);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 14, 36);
    
    // Table
    autoTable(doc, {
      startY: 45,
      head: [['Service', 'Professional', 'Price', 'Discount', 'Subtotal', 'Total']],
      body: [
        [
          invoice.serviceName || '-',
          invoice.professionalName || '-',
          invoice.servicePrice || '0',
          invoice.discount || '0',
          invoice.subtotal || '0',
          invoice.total || '0'
        ]
      ],
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY || 50;
    doc.text(`Payment Method: ${invoice.paymentMethod || '-'}`, 14, finalY + 10);

    doc.save(`invoice_${invoice.invoiceNumber || 'unknown'}.pdf`);
  };

  if (!sales || sales.length === 0) {
    return (
      <div className="no-data-message">
        <p>No sales history found for this client.</p>
      </div>
    );
  }

  return (
    <div className="client-sales-tab">
      <h2 className="overview-section-title" style={{ fontSize: 24, marginBottom: 24 }}>Sales History</h2>
      
      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Service Name</th>
              <th>Professional</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Subtotal</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((invoice, index) => (
              <tr key={index}>
                <td>{invoice.invoiceNumber || '-'}</td>
                <td>{invoice.serviceName || '-'}</td>
                <td>{invoice.professionalName || '-'}</td>
                <td>{invoice.servicePrice || '0'}</td>
                <td>{invoice.discount || '0'}</td>
                <td>{invoice.subtotal || '0'}</td>
                <td style={{ fontWeight: 600 }}>{invoice.total || '0'}</td>
                <td>{invoice.paymentMethod || '-'}</td>
                <td>
                  {invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : '-'}
                </td>
                <td>
                  <button 
                    className="btn-download-invoice"
                    onClick={() => handleDownloadInvoice(invoice)}
                    title="Download Invoice"
                  >
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientSalesTab;
