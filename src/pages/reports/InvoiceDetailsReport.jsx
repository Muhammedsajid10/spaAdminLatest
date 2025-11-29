import React, { useCallback } from 'react';
import GenericReportPage from './GenericReportPage';
import { ReportsAPI } from '../../Service/api/reportsApi';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import { Download } from 'lucide-react';

const InvoiceDetailsReport = () => {
  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { key: 'date', label: 'Date', sortable: true, render: (row) => new Date(row.date).toLocaleDateString() },
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
      
      return completedTransactions.map(t => {
        // Extract booking details
        const booking = t.booking || {};
        const services = booking.services || [];
        const firstService = services[0] || {};
        
        console.log('📊 Processing transaction:', {
          transactionId: t._id,
          hasBooking: !!booking,
          servicesCount: services.length,
          firstService: firstService
        });
        
        // Get client details from booking or user
        const client = booking.client || t.user || {};
        const clientName = client.firstName && client.lastName 
          ? `${client.firstName} ${client.lastName}`
          : (client.firstName || client.lastName || t.user?.firstName || 'Walk-in Customer');
        const clientPhone = client.phone || t.user?.phone || '';
        
        // Get service details
        const service = firstService.service || {};
        const serviceName = service.name || 'Service';
        
        // Get employee/professional details
        const employee = firstService.employee || {};
        // Employee data can be in employee.user (populated) or directly on employee
        const employeeUser = employee.user || employee;
        const employeeName = employeeUser.firstName && employeeUser.lastName
          ? `${employeeUser.firstName} ${employeeUser.lastName}`
          : (employeeUser.firstName || employeeUser.lastName || employee.firstName || employee.lastName || '');
        
        console.log('👤 Extracted employee data:', {
          employee: employee,
          employeeUser: employeeUser,
          employeeName: employeeName,
          hasFirstName: !!employeeUser.firstName,
          hasLastName: !!employeeUser.lastName
        });
        
        // Get proper date from booking or transaction
        const transactionDate = booking.appointmentDate || t.createdAt || new Date();
        
        return {
          ...t,
          // Ensure fields map correctly for the report and PDF
          date: transactionDate,
          invoiceNumber: t.bookingNumber || booking.bookingNumber || t._id?.slice(-6).toUpperCase(),
          clientName: clientName,
          clientPhone: clientPhone,
          serviceName: serviceName,
          employeeName: employeeName,
          amount: t.amount || t.totalAmount || 0,
          discount: t.discount || 0,
          paymentMethod: t.paymentMethod || 'card',
          // Pass full booking data for PDF generation
          booking: booking,
          services: services
        };
      });
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      throw error;
    }
  }, []);

  const customRenderer = (row, column) => {
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
