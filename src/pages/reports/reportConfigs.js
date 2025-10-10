import FinanceSummary from './FinanceSummary';

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

  paymentSummary: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        paymentMethod: 'Cash',
        numberOfPayments: 25,
        paymentAmount: 1250.00,
        numberOfRefunds: 2,
        refunds: 50.00,
        netPayments: 1200.00
      },
      {
        paymentMethod: 'Credit Card',
        numberOfPayments: 43,
        paymentAmount: 2133.50,
        numberOfRefunds: 1,
        refunds: 25.00,
        netPayments: 2108.50
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
    columns: [
      { key: 'type', label: 'Type', sortable: true },
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
    // Use custom component instead of generic table
    customComponent: FinanceSummary,
    useCustomComponent: true
  },

  'payment-summary': {
    title: 'Payment Summary',
    description: 'Payments split by payment methods.',
    category: 'Finance',
    dataFetcher: mockDataFetchers.paymentSummary,
    columns: [
      { key: 'paymentMethod', label: 'Payment Method', sortable: true },
      { key: 'numberOfPayments', label: 'No. of Payments', type: 'number', align: 'right', sortable: true },
      { key: 'paymentAmount', label: 'Payment Amount', type: 'currency', align: 'right', sortable: true },
      { key: 'numberOfRefunds', label: 'No. of Refunds', type: 'number', align: 'right', sortable: true },
      { key: 'refunds', label: 'Refunds', type: 'currency', align: 'right', sortable: true },
      { key: 'netPayments', label: 'Net Payments', type: 'currency', align: 'right', sortable: true }
    ]
  },

  'appointments-summary': {
    title: 'Appointments Report',
    description: 'View appointment trends and staff bookings.',
    category: 'Appointments',
    dataFetcher: mockDataFetchers.appointmentsSummary,
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
    title: 'Client List',
    description: 'Comprehensive list of all active clients.',
    category: 'Clients',
    dataFetcher: mockDataFetchers.clientList,
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true },
      { key: 'lastVisit', label: 'Last Visit', sortable: true },
      { key: 'totalSpent', label: 'Total Spent', type: 'currency', align: 'right', sortable: true },
      { key: 'visits', label: 'Visits', type: 'number', align: 'right', sortable: true }
    ]
  }
};
