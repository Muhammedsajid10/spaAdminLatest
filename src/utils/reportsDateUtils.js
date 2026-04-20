export class DateUtils {
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    const d = new Date(date);
    
    switch (format) {
      case 'YYYY-MM-DD':
        return d.toISOString().split('T')[0];
      case 'DD/MM/YYYY':
        return d.toLocaleDateString('en-GB');
      case 'MMM DD, YYYY':
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return d.toLocaleDateString();
    }
  }

  static getCurrentMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  }

  static getLast30Days() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  static getDateRangeLabel(dateRange) {
    if (!dateRange?.start || !dateRange?.end) return 'Select date range';
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    return `${this.formatDate(startDate, 'MMM DD')} - ${this.formatDate(endDate, 'MMM DD, YYYY')}`;
  }
}

// src/services/utils/formatUtils.js
export class FormatUtils {
  static formatCurrency(amount, currency = 'AED') {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }

  static formatPercentage(value, decimals = 1) {
    return `${(value || 0).toFixed(decimals)}%`;
  }

  static formatNumber(value, options = {}) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(value || 0);
  }

  static truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  static capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}