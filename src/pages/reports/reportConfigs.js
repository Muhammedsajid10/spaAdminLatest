import FinanceSummary from './FinanceSummary';
import { ReportsAPI } from '../../Service/api/reportsApi';
import { usePaymentTransactions } from '../../store/reports/hooks/usePaymentTransactions';
import { usePaymentSummary } from '../../store/reports/hooks/usePaymentSummary';
import { useAppointmentSummary } from '../../store/reports/hooks/useAppointmentSummary';
import { useFinanceSummary } from '../../store/reports/hooks/useFinanceSummary';
import { useWorkingHours } from '../../store/reports/hooks/useWorkingHours';
import { useSalesSummary } from '../../store/reports/hooks/useSalesSummary';

// Sample data fetchers for different reports
const mockDataFetchers = {
  salesSummary: async (dateRange) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        type: 'Services',
        salesQty: 45,
        itemsSold: 45,
        grossSales: 2250.00,
        totalDiscounts: 225.00,
        refunds: 50.00,
        netSales: 1975.00,
        taxes: 197.50,
        totalSales: 2172.50
      },
      {
        type: 'Products',
        salesQty: 23,
        itemsSold: 31,
        grossSales: 1150.00,
        totalDiscounts: 115.00,
        refunds: 25.00,
        netSales: 1010.00,
        taxes: 101.00,
        totalSales: 1111.00
      }
    ];
  },

  appointmentsSummary: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 900));
    return [
      {
        date: '2024-01-15',
        totalAppointments: 45,
        completed: 42,
        cancelled: 2,
        noShow: 1,
        revenue: 2100.00
      },
      {
        date: '2024-01-16',
        totalAppointments: 38,
        completed: 35,
        cancelled: 2,
        noShow: 1,
        revenue: 1850.00
      }
    ];
  },

  teamActivity: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 700));
    return [
      {
        employee: 'John Doe',
        hoursWorked: 40,
        shiftsCompleted: 5,
        overtime: 2,
        efficiency: 95.5
      },
      {
        employee: 'Jane Smith',
        hoursWorked: 38,
        shiftsCompleted: 5,
        overtime: 0,
        efficiency: 98.2
      }
    ];
  },

  clientList: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1 234-567-8900',
        lastVisit: '2024-01-10',
        totalSpent: 850.00,
        visits: 12
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+1 234-567-8901',
        lastVisit: '2024-01-08',
        totalSpent: 420.00,
        visits: 6
      }
    ];
  }
};


// Report configurations
export const reportsConfig = {
  'sales-summary': {
    title: 'Sales Summary',
    description: 'Sales quantities and value, excluding tips and gift card sales.',
    category: 'Sales',
    dataHook: useSalesSummary,
    showTypeFilter: true,
    typeFilterKey: 'filterBy',
    typeFilterOptions: [
      { value: 'service', label: 'Service' },
      { value: 'client', label: 'Client' },
      { value: 'team-member', label: 'Team Member' }
    ],
    showFilters: true,
    filters: [
      {
        key: 'service',
        label: 'Service',
        type: 'select',
        options: async () => {
          try {
            const res = await ReportsAPI.getServices();
            const services = res?.data?.services || [];
            return [
              { value: 'all', label: 'All Services' },
              ...services.map(service => ({ 
                value: service._id || service.id, 
                label: service.name 
              }))
            ];
          } catch (error) {
            console.error('Error loading services:', error);
            return [{ value: 'all', label: 'All Services' }];
          }
        }
      },
      {
        key: 'client',
        label: 'Client',
        type: 'select',
        options: async () => {
          try {
            const res = await ReportsAPI.getClients({ limit: 1000 });
            const clients = res?.data?.clients || [];
            return [
              { value: 'all', label: 'All Clients' },
              ...clients.map(client => ({ 
                value: client._id || client.id, 
                label: client.fullName || client.firstName + ' ' + client.lastName || client.name 
              }))
            ];
          } catch (error) {
            console.error('Error loading clients:', error);
            return [{ value: 'all', label: 'All Clients' }];
          }
        }
      },
      {
        key: 'teamMember',
        label: 'Team Member',
        type: 'select',
        options: async () => {
          try {
            const res = await ReportsAPI.getEmployees();
            const employees = res?.data?.employees || [];
            return [
              { value: 'all', label: 'All Team Members' },
              ...employees.map(employee => ({ 
                value: employee._id || employee.id, 
                label: employee.name || employee.fullName 
              }))
            ];
          } catch (error) {
            console.error('Error loading team members:', error);
            return [{ value: 'all', label: 'All Team Members' }];
          }
        }
      }
    ],
    columns: [
      { 
        key: 'name', 
        label: 'Service', 
        sortable: true 
      },
      { key: 'salesQty', label: 'Sales Qty', type: 'number', align: 'right', sortable: true },
      { key: 'itemsSold', label: 'Items Sold', type: 'number', align: 'right', sortable: true },
      { key: 'grossSales', label: 'Gross Sales', type: 'currency', align: 'right', sortable: true },
      { key: 'totalDiscounts', label: 'Total Discounts', type: 'currency', align: 'right', sortable: true },
      { key: 'refunds', label: 'Refunds', type: 'currency', align: 'right', sortable: true },
      { key: 'netSales', label: 'Net Sales', type: 'currency', align: 'right', sortable: true },
      { key: 'taxes', label: 'Taxes', type: 'currency', align: 'right', sortable: true },
      { key: 'totalSales', label: 'Total Sales', type: 'currency', align: 'right', sortable: true }
    ]
  },

  'finance-summary': {
    title: 'Finance Summary',
    description: 'High-level summary of sales, payments, and liabilities.',
    category: 'Finance',
    // Use custom component with hook-based data fetching
    customComponent: FinanceSummary,
    useCustomComponent: true,
    dataHook: useFinanceSummary
  },

  'payment-summary': {
    title: 'Payment Summary',
    description: 'Payments grouped by payment method within the selected period.',
    category: 'Finance',
    dataHook: usePaymentSummary,
    columns: [
      { key: 'paymentMethod', label: 'Payment method', sortable: true },
      { key: 'numberOfPayments', label: 'No. of payments', type: 'number', align: 'right', sortable: true },
      { key: 'paymentAmount', label: 'Payment amount', type: 'currency', align: 'right', sortable: true },
      { key: 'numberOfRefunds', label: 'No. of refunds', type: 'number', align: 'right' },
      { key: 'refundAmount', label: 'Refunds', type: 'currency', align: 'right' },
      { key: 'netPayments', label: 'Net payments', type: 'currency', align: 'right' }
    ]
  },

  'appointments-summary': {
    title: 'Appointments Summary',
    description: 'View appointment trends and staff bookings.',
    category: 'Appointments',
    dataHook: useAppointmentSummary,
    showTypeFilter: true,
    typeFilterKey: 'type',
    typeFilterOptions: [
      { value: 'team-member', label: 'Team member' },
      { value: 'service', label: 'Service' },
      { value: 'channel', label: 'Channel' },
      { value: 'status', label: 'Status' }
    ],
    columns: [
      { key: 'label', label: 'Team member', sortable: true },
      { key: 'appointments', label: 'Appointments', type: 'number', align: 'right', sortable: true },
      { key: 'services', label: 'Services', type: 'number', align: 'right', sortable: true },
      { key: 'percentRequested', label: '% requested', type: 'percent', align: 'right' },
      { key: 'totalApptValue', label: 'Total appt. value', type: 'currency', align: 'right', sortable: true },
      { key: 'averageApptValue', label: 'Average appt. value', type: 'currency', align: 'right', sortable: true },
      { key: 'percentOnline', label: '% online', type: 'percent', align: 'right' },
      { key: 'percentCancelled', label: '% cancelled', type: 'percent', align: 'right' },
      { key: 'percentNoShow', label: '% no show', type: 'percent', align: 'right' },
      { key: 'totalClients', label: 'Total clients', type: 'number', align: 'right', sortable: true },
      { key: 'newClients', label: 'New clients', type: 'number', align: 'right' },
      { key: 'percentNewClients', label: '% new clients', type: 'percent', align: 'right' },
      { key: 'percentReturningClients', label: '% returning clients', type: 'percent', align: 'right' }
    ]
  },

  'team-activity': {
    title: 'Working Hours Activity',
    description: 'Detailed view of team members worked hours, shifts, and timesheets.',
    category: 'Team',
    dataHook: useWorkingHours,
    columns: [
      { key: 'teamMember', label: 'Team member', sortable: true },
      { key: 'location', label: 'Location', sortable: true },
      { key: 'date', label: 'Date', type: 'date', sortable: true },
      { key: 'source', label: 'Source', sortable: true },
      { key: 'expectedStart', label: 'Expected start', align: 'center' },
      { key: 'clockIn', label: 'Clock in', align: 'center' },
      { key: 'clockInType', label: 'Clock in type', align: 'center' },
      { key: 'clockInDeviation', label: 'Clock in deviation', align: 'center' },
      { key: 'expectedEnd', label: 'Expected end', align: 'center' },
      { key: 'clockOut', label: 'Clock out', align: 'center' },
      { key: 'clockOutType', label: 'Clock out type', align: 'center' },
      { key: 'clockOutDeviation', label: 'Clock out deviation', align: 'center' },
      { key: 'scheduledHours', label: 'Scheduled', align: 'right', sortable: true },
      { key: 'workedHours', label: 'Worked', align: 'right', sortable: true }
    ]
  },

  'client-list': {
    title: 'Client list',
    description: 'Complete client directory.',
    category: 'Clients',
    dataFetcher: async ({ dateRange }) => {
      const res = await ReportsAPI.getClients();
      const rows = res?.data?.clients ?? [];
      return rows.filter((row) => {
        if (!dateRange?.start || !dateRange?.end) return true;
        const created = new Date(row.createdAt);
        return created >= new Date(dateRange.start) && created <= new Date(`${dateRange.end}T23:59:59`);
      });
    },
    columns: [
      { key: 'fullName', label: 'Client name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true },
      { key: 'gender', label: 'Gender' },
      { key: 'createdAt', label: 'Created', type: 'date', sortable: true },
      // { key: 'isActive', label: 'Active' }
    ]
  },

  'payment-transactions': {
    title: 'Payment transactions',
    description: 'Detailed view of all payment transactions.',
    category: 'Finance',
    dataHook: usePaymentTransactions,
    typeFilterKey: 'transactionType',
    columns: [
      { key: 'paymentDate', label: 'Payment date', sortable: true, type: 'date' },
      { key: 'paymentNumber', label: 'Payment no.', sortable: true },
      { key: 'saleDate', label: 'Sale date', sortable: true, type: 'date' },
      { key: 'saleNumber', label: 'Sale no.', sortable: true },
      { key: 'appointmentRef', label: 'Appt. ref', sortable: true },
      { key: 'client', label: 'Client', sortable: true },
      { key: 'location', label: 'Location', sortable: true },
      { key: 'teamMember', label: 'Team member', sortable: true },
      { key: 'transactionType', label: 'Transaction type', sortable: true },
      { key: 'paymentMethod', label: 'Payment method', sortable: true },
      { key: 'paymentAmount', label: 'Payment amount', type: 'currency', align: 'right', sortable: true }
    ]
  }
};
