// Format currency for display
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'AED 0.00';
  const formatted = Math.abs(amount).toFixed(2);
  const sign = amount < 0 ? '- ' : '';
  return `${sign}AED ${formatted}`;
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
};

// Format percentage
const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
};

// Get formatted value based on column type
const getFormattedValue = (value, column) => {
  if (value === null || value === undefined) return '';
  
  switch (column?.type) {
    case 'currency':
      return formatCurrency(value);
    case 'date':
      return formatDate(value);
    case 'percent':
      return formatPercentage(value);
    case 'number':
      return Number(value).toLocaleString();
    default:
      return String(value);
  }
};

// Export to CSV
export const exportToCSV = (data, columns, filename = 'export') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // If no columns provided, infer from data
    if (!columns) {
      const keys = Object.keys(data[0]);
      columns = keys.map(key => ({ key, label: key, type: 'text' }));
    }

    // Create headers
    const headers = columns.map(col => col.label);
    
    // Create rows
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // For CSV, we want clean values without formatting for better compatibility
        if (col.type === 'currency') {
          return typeof value === 'number' ? value : 0;
        }
        return getFormattedValue(value, col);
      })
    );

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'CSV exported successfully' };
  } catch (error) {
    console.error('CSV Export Error:', error);
    return { success: false, message: error.message || 'Failed to export CSV' };
  }
};

// Basic Excel export (creates CSV with .xlsx extension for compatibility)
export const exportToExcel = (data, columns, filename = 'export') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // If no columns provided, infer from data
    if (!columns) {
      const keys = Object.keys(data[0]);
      columns = keys.map(key => ({ key, label: key, type: 'text' }));
    }

    // Create headers
    const headers = columns.map(col => col.label);
    
    // Create rows with tab separation for better Excel compatibility
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Keep numeric values for Excel
        if (col.type === 'currency' || col.type === 'number') {
          return typeof value === 'number' ? value : 0;
        }
        return getFormattedValue(value, col);
      })
    );

    // Use tab-separated format for better Excel compatibility
    const tsvContent = [headers, ...rows]
      .map(row => row.join('\t'))
      .join('\n');

    // Create and download file
    const blob = new Blob([tsvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Excel file exported successfully' };
  } catch (error) {
    console.error('Excel Export Error:', error);
    return { success: false, message: error.message || 'Failed to export Excel file' };
  }
};

// Export to PDF (creates formatted text file with .pdf extension)
export const exportToPDF = (data, columns, title = 'Report', filename = 'export') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // If no columns provided, infer from data
    if (!columns) {
      const keys = Object.keys(data[0]);
      columns = keys.map(key => ({ key, label: key, type: 'text' }));
    }

    // Create formatted text content
    let content = `${title}\n`;
    content += `Exported: ${new Date().toLocaleDateString()}\n`;
    content += '='.repeat(50) + '\n\n';

    // Add headers
    const headers = columns.map(col => col.label);
    content += headers.join(' | ') + '\n';
    content += '-'.repeat(headers.join(' | ').length) + '\n';

    // Add rows
    data.forEach(row => {
      const rowValues = columns.map(col => {
        const value = row[col.key];
        return getFormattedValue(value, col);
      });
      content += rowValues.join(' | ') + '\n';
    });

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'PDF exported successfully' };
  } catch (error) {
    console.error('PDF Export Error:', error);
    return { success: false, message: error.message || 'Failed to export PDF' };
  }
};

// Main export function that handles all formats
export const exportReportData = async (format, data, columns, reportTitle, filename) => {
  try {
    let result;
    
    switch (format.toLowerCase()) {
      case 'csv':
        result = exportToCSV(data, columns, filename);
        break;
      case 'excel':
        result = exportToExcel(data, columns, filename);
        break;
      case 'pdf':
        result = exportToPDF(data, columns, reportTitle, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return result;
  } catch (error) {
    console.error('Export Error:', error);
    return { 
      success: false, 
      message: error.message || `Failed to export ${format.toUpperCase()}` 
    };
  }
};

// Legacy function for backward compatibility
export const exportData = (data, format) => {
  return exportReportData(format, data, null, 'Report', 'export');
};

// Special export function for Finance Summary (handles dynamic columns)
export const exportFinanceSummary = (format, financeData, uniqueDates, tableStructure, filename = 'finance_summary') => {
  try {
    if (!financeData || financeData.length === 0) {
      throw new Error('No finance data to export');
    }

    // Create columns: first column is the metric name, followed by date columns
    const columns = [
      { key: 'metric', label: 'Metric', type: 'text' },
      ...uniqueDates.map(date => ({
        key: date,
        label: formatDate(date),
        type: 'currency'
      }))
    ];

    // Create flattened data rows
    const exportData = [];
    
    tableStructure.forEach(section => {
      // Add section header
      exportData.push({
        metric: section.label.toUpperCase(),
        ...uniqueDates.reduce((acc, date) => {
          acc[date] = '';
          return acc;
        }, {})
      });
      
      // Add section rows
      section.rows.forEach(row => {
        const rowData = {
          metric: row.isSubRow ? `  ${row.label}` : row.label,
        };
        
        uniqueDates.forEach(date => {
          const dayData = financeData.find(item => item.date === date);
          rowData[date] = dayData ? dayData[row.key] : 0;
        });
        
        exportData.push(rowData);
      });
      
      // Add spacing row between sections
      exportData.push({
        metric: '',
        ...uniqueDates.reduce((acc, date) => {
          acc[date] = '';
          return acc;
        }, {})
      });
    });

    return exportReportData(format, exportData, columns, 'Finance Summary', filename);
  } catch (error) {
    console.error('Finance Summary Export Error:', error);
    return { 
      success: false, 
      message: error.message || `Failed to export finance summary` 
    };
  }
};