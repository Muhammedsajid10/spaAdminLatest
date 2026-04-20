import React, { useCallback } from 'react';
import GenericReportPage from './GenericReportPage';
import { ReportsAPI } from '@api/reportsApi';
import { generateInvoicePDF } from '@utils/invoiceGenerator';
import { Download } from 'lucide-react';

const InvoiceDetailsReport = () => {
  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { key: 'date', label: 'Date', sortable: true, render: (row) => {
      const d = new Date(row.date);
      return !isNaN(d.getTime()) ? d.toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : row.date;
    }},
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'serviceName', label: 'Service', sortable: true },
    { key: 'employeeName', label: 'Professional', sortable: true, render: (row) => row.employeeName || '-' },
    { key: 'amount', label: 'Amount', sortable: true, render: (row) => `AED ${parseFloat(row.amount || 0).toFixed(2)}` },
    { key: 'status', label: 'Status', sortable: true, render: (row) => (
      <span style={{ 
        padding: '4px 8px', 
        borderRadius: '4px', 
        backgroundColor: row.status === 'completed' ? '#dcfce7' : '#f3f4f6',
        color: row.status === 'completed' ? '#166534' : '#374151',
        fontSize: '12px',
        fontWeight: 500
      }}>
        {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '-'}
      </span>
    )},
    { key: 'action', label: 'Action', sortable: false }
  ];

  const fetchInvoiceData = useCallback(async (dateRange) => {
    try {
      const response = await ReportsAPI.getPaymentTransactions({
        startDate: dateRange?.start,
        endDate: dateRange?.end,
        limit: 1000 // Fetch enough to filter client-side if needed
      });
      
      // Extract transactions array based on API response structure
      // Based on paymentTransactionsSlice.js, it seems to be response.data.payments
      const transactions = response?.data?.payments || response?.payments || response?.data || [];
      
      if (!Array.isArray(transactions)) {
        console.error("Expected transactions to be an array, got:", typeof transactions, transactions);
        return [];
      }
      
      // Filter for completed transactions only
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      
      const expandedRows = [];
      completedTransactions.forEach(t => {
        // Extract booking details
        const booking = t.booking || {};
        const services = booking.services || [];

        // Get client details from booking or user
        const client = booking.client || t.user || {};
        const clientName = client.firstName && client.lastName 
          ? `${client.firstName} ${client.lastName}`
          : (client.firstName || client.lastName || t.user?.firstName || 'Walk-in Customer');
        const clientPhone = client.phone || t.user?.phone || '';

        // Get proper date from booking or transaction
        const transactionDate = booking.appointmentDate || t.createdAt || new Date();
        const invoiceNumber = t.bookingNumber || booking.bookingNumber || t._id?.slice(-6).toUpperCase();
        
        const transactionTotal = t.amount || booking.totalAmount || 0;
        const transactionDiscount = t.discount || booking.discountAmount || 0;
        const paymentMethod = t.paymentMethod || booking.paymentMethod || 'card';

        if (!services || services.length === 0) {
          // Fallback if no specific nested services are available
          expandedRows.push({
            ...t,
            date: transactionDate,
            invoiceNumber,
            clientName,
            clientPhone,
            serviceName: 'Service',
            employeeName: '',
            amount: transactionTotal,
            discount: transactionDiscount,
            paymentMethod,
            booking,
            services: []
          });
        } else {
          // Create a row for each specific sub-service
          services.forEach(svc => {
            const service = svc.service || {};
            const employeeObj = svc.employee || {};
            const employeeUser = employeeObj.user || employeeObj;

            const svcName = service.name || svc.serviceName || 'Unknown Service';
            const empName = employeeUser.firstName 
              ? `${employeeUser.firstName} ${employeeUser.lastName || ''}`.trim() 
              : (employeeUser.name || '');

            expandedRows.push({
              ...t,
              date: svc.startTime || svc.appointmentDate || transactionDate,
              invoiceNumber,
              clientName,
              clientPhone,
              serviceName: svcName,
              employeeName: empName,
              amount: svc.price || service.price || 0, // show individual svc price on the table Row
              discount: 0,
              paymentMethod,
              transactionTotal,         // Store correct whole-booking amount just for PDF to reference
              transactionDiscount,
              booking,
              services: services        // Pass the FULL services array into the row for the PDF renderer
            });
          });
        }
      });
      return expandedRows;
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      throw error;
    }
  }, []);

  const customRenderer = (row, column) => {
    if (column.key === 'date') {
      const d = new Date(row.date);
      return !isNaN(d.getTime()) ? d.toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : row.date;
    }
    if (column.key === 'action') {
      return (
        <button 
          onClick={() => generateInvoicePDF(row)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Download Invoice"
        >
          <Download size={18} className="text-gray-600" />
        </button>
      );
    }
    return null; // Default rendering
  };

  return (
    <GenericReportPage
      title="Invoice Details"
      description="View and download invoice details for completed transactions"
      columns={columns}
      dataFetcher={fetchInvoiceData}
      customRenderer={customRenderer}
      category="Sales"
    />
  );
};

export default InvoiceDetailsReport;
