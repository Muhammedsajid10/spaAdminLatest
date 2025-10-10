import BaseAPI from './baseApi';

export class ReportsAPI {
  // Get report data
  static async getReportData(reportType, filters = {}) {
    const endpoint = `/reports/${reportType}`;
    const params = {
      startDate: filters.dateRange?.start,
      endDate: filters.dateRange?.end,
      location: filters.selectedLocation !== 'all' ? filters.selectedLocation : undefined,
      teamMember: filters.selectedTeamMember !== 'all' ? filters.selectedTeamMember : undefined,
      service: filters.selectedService !== 'all' ? filters.selectedService : undefined,
      groupBy: filters.groupBy,
    };

    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    );

    return BaseAPI.get(endpoint, cleanParams);
  }

  // Export data
  static async exportData(data, format) {
    try {
      if (format === 'csv') {
        return this.exportToCSV(data);
      } else if (format === 'excel') {
        return this.exportToExcel(data);
      } else if (format === 'pdf') {
        return this.exportToPDF(data);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Export to CSV
  static exportToCSV(data) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  }

  // Export to Excel (simplified - in real app, use a library like xlsx)
  static exportToExcel(data) {
    // This is a simplified version - use xlsx library for proper Excel export
    const csvBlob = this.exportToCSV(data);
    return new Blob([csvBlob], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  // Export to PDF (simplified - in real app, use a library like jsPDF)
  static exportToPDF(data) {
    // This is a simplified version - use jsPDF for proper PDF generation
    const text = data.map(row => Object.values(row).join(' | ')).join('\n');
    return new Blob([text], { type: 'application/pdf' });
  }

  // Get locations
  static async getLocations() {
    return BaseAPI.get('/locations');
  }

  // Get team members
  static async getTeamMembers() {
    return BaseAPI.get('/team-members');
  }

  // Get services
  static async getServices() {
    return BaseAPI.get('/services');
  }
}