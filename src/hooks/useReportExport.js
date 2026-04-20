import { useState, useCallback } from 'react';
import { exportReportData, exportFinanceSummary } from '@utils/exportUtils';

// Hook for handling exports in report pages
export const useReportExport = (showToast = false) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(null);
  
  // Optional toast notifications (can be used if ToastProvider is available)
  let toast = null;
  try {
    // Try to use toast context if available
    const { showSuccess, showError } = require('../contexts/ToastContext').useToast();
    if (showToast) {
      toast = { showSuccess, showError };
    }
  } catch (e) {
    // Toast context not available, continue without it
  }

  // Generic export function for regular reports
  const exportReport = useCallback(async (format, data, columns, title, filename) => {
    setExportLoading(true);
    setExportError(null);

    try {
      const result = await exportReportData(
        format,
        data,
        columns,
        title,
        filename || title.toLowerCase().replace(/\s+/g, '_')
      );

      if (result.success) {
        toast?.showSuccess?.(`${title} exported successfully as ${format.toUpperCase()}`);
        return { success: true, message: result.message };
      } else {
        console.error(`❌ ${title} export failed:`, result.message);
        setExportError(result.message);
        toast?.showError?.(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Export failed';
      console.error(`❌ ${title} export error:`, error);
      setExportError(errorMessage);
      toast?.showError?.(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setExportLoading(false);
    }
  }, []);

  // Specialized export function for Finance Summary
  const exportFinanceReport = useCallback(async (format, financeData, uniqueDates, tableStructure, filename) => {
    setExportLoading(true);
    setExportError(null);

    try {
      const result = await exportFinanceSummary(
        format,
        financeData,
        uniqueDates,
        tableStructure,
        filename || 'finance_summary'
      );

      if (result.success) {
        toast?.showSuccess?.(`Finance Summary exported successfully as ${format.toUpperCase()}`);
        return { success: true, message: result.message };
      } else {
        console.error(`❌ Finance Summary export failed:`, result.message);
        setExportError(result.message);
        toast?.showError?.(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Finance export failed';
      console.error(`❌ Finance Summary export error:`, error);
      setExportError(errorMessage);
      toast?.showError?.(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setExportLoading(false);
    }
  }, []);

  // Clear export error
  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    exportLoading,
    exportError,
    exportReport,
    exportFinanceReport,
    clearExportError
  };
};