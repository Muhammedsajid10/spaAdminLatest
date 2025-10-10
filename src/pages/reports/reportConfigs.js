import FinanceSummary from './FinanceSummary';
import { ReportsAPI } from '../../Service/api/reportsApi';
import { usePaymentTransactions } from '../../store/reports/hooks/usePaymentTransactions';
import { usePaymentSummary } from '../../store/reports/hooks/usePaymentSummary';

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
    dataFetcher: mockDataFetchers.salesSummary,
    showTypeFilter: true,
    typeFilterOptions: [
      { value: 'services', label: 'Services' },
      { value: 'category', label: 'Category' },
      { value: 'item', label: 'Item' },
      { value: 'team-member', label: 'Team member' },
      { value: 'clients', label: 'Clients' }
    ],
    columns: [
      { key: 'type', label: 'Type', sortable: true },
      { key: 'salesQty', label: 'Sales qty', type: 'number', align: 'right', sortable: true },
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
    // Use custom component instead of generic table
    customComponent: FinanceSummary,
    useCustomComponent: true
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
    dataFetcher: mockDataFetchers.appointmentsSummary,
    showTypeFilter: true,
    typeFilterOptions: [
      { value: 'team-member', label: 'Team Member' },
      { value: 'channel', label: 'Channel' },
      { value: 'service', label: 'Service' },
      { value: 'channel', label: 'Channel' },
      { value: 'status', label: 'Status' }
    ],
    columns: [
      { key: 'date', label: 'Date', sortable: true },
      { key: 'totalAppointments', label: 'Total', type: 'number', align: 'right', sortable: true },
      { key: 'completed', label: 'Completed', type: 'number', align: 'right', sortable: true },
      { key: 'cancelled', label: 'Cancelled', type: 'number', align: 'right', sortable: true },
      { key: 'noShow', label: 'No Show', type: 'number', align: 'right', sortable: true },
      { key: 'revenue', label: 'Revenue', type: 'currency', align: 'right', sortable: true }
    ]
  },

  'team-activity': {
    title: 'Working Hours Activity',
    description: 'Detailed view of team members worked hours, shifts, and timesheets.',
    category: 'Team',
    dataFetcher: mockDataFetchers.teamActivity,
    columns: [
      { key: 'employee', label: 'Employee', sortable: true },
      { key: 'hoursWorked', label: 'Hours Worked', type: 'number', align: 'right', sortable: true },
      { key: 'shiftsCompleted', label: 'Shifts', type: 'number', align: 'right', sortable: true },
      { key: 'overtime', label: 'Overtime', type: 'number', align: 'right', sortable: true },
      { key: 'efficiency', label: 'Efficiency %', type: 'number', align: 'right', sortable: true }
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
