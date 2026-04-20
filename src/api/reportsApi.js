import api from './index';
import { exportData as exportDataUtil } from '@utils/exportUtils';

const withAuth = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class ReportsAPI {
  static async getPaymentTransactions({ page = 1, limit = 12899, ...params } = {}) {
    const response = await api.get('/payments/admin/all', {
      params: { page, limit, ...params },
      headers: withAuth()
    });
    return response.data;
  }

  static async getReportData(reportType, filters = {}) {
    const endpoint = `/reports/${reportType}`;
    const params = {
      startDate: filters.dateRange?.start,
      endDate: filters.dateRange?.end,
      
      location: filters.selectedLocation !== 'all' ? filters.selectedLocation : undefined,
      teamMember: filters.selectedTeamMember !== 'all' ? filters.selectedTeamMember : undefined,
      service: filters.selectedService !== 'all' ? filters.selectedService : undefined,
      groupBy: filters.groupBy
    };
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    );

    const response = await api.get(endpoint, {
      params: cleanParams,
      headers: withAuth()
    });
    return response.data;
  }

  static async getLocations() {
    const response = await api.get('/locations', { headers: withAuth() });
    return response.data;
  }

  static async getTeamMembers() {
    const response = await api.get('/team-members', { headers: withAuth() });
    return response.data;
  }

  static async getServices() {
    const response = await api.get('/services', { headers: withAuth() });
    return response.data;
  }

  static async getClients({ limit = 10000, sort = '-createdAt', ...params } = {}) {
    const response = await api.get('/admin/clients', {
      params: { limit, sort, ...params },
      headers: withAuth()
    });
    return response.data;
  }

  static async getGiftCardsPurchased(params = {}) {
    const response = await api.get('/giftcards/purchased', {
      params,
      headers: withAuth()
    });
    return response.data;
  }

  static async getBookings({ page = 1, limit = 1000, ...params } = {}) {
    const response = await api.get('/bookings/admin/all', {
      params: { page, limit, ...params },
      headers: withAuth()
    });
    return response.data;
  }

  static async getEmployeeAttendance(dateStr, params = {}) {
    const response = await api.get('/employees', {
      params: { includeAttendance: true, date: dateStr, ...params },
      headers: withAuth()
    });
    return response.data;
  }

  static async getPaymentSummary({ page = 1, limit = 15000, ...params } = {}) {
    const response = await api.get('/payments/admin/all', {
      params: { page, limit, ...params },
      headers: withAuth()
    });
    return response.data;
  }

  static async getAllEmployeesAttendance({ startDate = null, endDate = null, ...params } = {}) {
    const queryParams = {
      includeAttendance: true,
      ...params
    };
    
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    const response = await api.get('/employees', {
      params: queryParams,
      headers: withAuth()
    });
    return response.data;
  }

  static async getAllBookings({ page = 1, limit = 15000, ...params } = {}) {
    const response = await api.get('/bookings/admin/all', {
      params: { page, limit, ...params },
      headers: withAuth()
    });
    return response.data;
  }

  static async getFinanceSummary({ startDate = null, endDate = null } = {}) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;

    const response = await api.get('/admin/finance-summary', {
      params,
      headers: withAuth()
    });
    return response.data;
  }

  static async getWorkingHoursActivity({ all = true, ...params } = {}) {
    const response = await api.get('/admin/attendance?all=true', {
      // params: { all, ...params },
      headers: withAuth()
    });
    return response.data;
  }

  static async getEmployees() {
    const response = await api.get('/employees', {
      headers: withAuth()
    });
    return response.data;
  }

  static async getSalesSummary({ all = true, ...params } = {}) {
    // Fetch booking analytics data which includes popularServices, bookingTrends, etc.
    const response = await api.get('/bookings/admin/all?all=true', {
      headers: withAuth()
    });
    return response.data;
  }

  static async getBookingAnalytics({ ...params } = {}) {
    // Alternative endpoint for booking analytics if different from individual bookings
    const response = await api.get('/admin/analytics/bookings', {
      params,
      headers: withAuth()
    });
    return response.data;
  }

  static async getServiceCategories() {
    const response = await api.get('/services/categories', {
      headers: withAuth()
    });
    return response.data;
  }

  static exportData(data, format) {
    return exportDataUtil(data, format);
  }

  static async getInvoiceDetails({ page = 1, limit = 15000, ...params } = {}) {
    // Reusing bookings endpoint as it likely contains the necessary sales/invoice data
    // Adjust endpoint if a specific /invoices endpoint exists
    const response = await api.get('/bookings/admin/all', {
      params: { page, limit, ...params },
      headers: withAuth()
    });
    return response.data;
  }
}