export const exportToCSV = (data) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',')
    )
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

export const exportToExcel = (data) => {
  const csvBlob = exportToCSV(data);
  return new Blob([csvBlob], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};

export const exportToPDF = (data) => {
  const text = data.map((row) => Object.values(row).join(' | ')).join('\n');
  return new Blob([text], { type: 'application/pdf' });
};

export const exportData = (data, format) => {
  switch (format) {
    case 'csv':
      return exportToCSV(data);
    case 'excel':
      return exportToExcel(data);
    case 'pdf':
      return exportToPDF(data);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};