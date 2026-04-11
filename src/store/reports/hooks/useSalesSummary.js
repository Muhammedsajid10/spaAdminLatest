import { useEffect, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSalesSummary,
  setFilterBy,
  clearSalesSummary,
  buildSalesSummary,
  selectSalesSummaryRawBookings,
  selectSalesSummaryLoading,
  selectSalesSummaryStatus,
  selectSalesSummaryError,
  selectSalesSummaryFilterBy,
  selectSalesSummaryLastFetched
} from '../slices/salesSummarySlice';
import { useReportDateRange } from '../../reports/hooks';

export const useSalesSummary = ({ 
  autoFetch = true 
} = {}) => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Selectors
  const rawBookings = useSelector(selectSalesSummaryRawBookings);
  const status = useSelector(selectSalesSummaryStatus);
  const loading = useSelector(selectSalesSummaryLoading);
  const error = useSelector(selectSalesSummaryError);
  const currentFilterBy = useSelector(selectSalesSummaryFilterBy);
  const lastFetched = useSelector(selectSalesSummaryLastFetched);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      await dispatch(fetchSalesSummary()).unwrap();
    } catch (error) {
      console.error('❌ Sales Summary Hook: Fetch error:', error);
      throw error;
    }
  }, [dispatch]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch && status === 'idle') {
      fetchData();
    }
  }, [autoFetch, status, fetchData]);

  // Build full summary
  const summary = useMemo(() => {
    if (status !== 'succeeded') return null;
    return buildSalesSummary(rawBookings, dateRange);
  }, [rawBookings, dateRange, status]);

  // Extract necessary parts from summary
  const byService = summary?.byService || [];
  const byClient = summary?.byClient || [];
  const byTeamMember = summary?.byTeamMember || [];
  const services = summary?.services || [];
  const clients = summary?.clients || [];
  const teamMembers = summary?.teamMembers || [];

  // Pick data based on filterBy
  const data = useMemo(() => {
    switch (currentFilterBy) {
      case 'client': return byClient;
      case 'team-member': return byTeamMember;
      case 'service':
      default: return byService;
    }
  }, [currentFilterBy, byService, byClient, byTeamMember]);

  // Change filter function
  const changeFilter = useCallback((newFilterBy) => {
    dispatch(setFilterBy(newFilterBy));
    setForceUpdate(prev => prev + 1); // Force re-render
  }, [dispatch, currentFilterBy, byService, byClient, byTeamMember, data]);

  const clearData = useCallback(() => {
    dispatch(clearSalesSummary());
  }, [dispatch]);

  // Debug effect to track currentFilterBy changes
  useEffect(() => {}, [currentFilterBy, data]);

  // Debug effect to track all data arrays
  useEffect(() => {
    if (lastFetched) {}
  }, [byService, byClient, byTeamMember, currentFilterBy, data, lastFetched]);

  // Memoized filter options for dropdowns
  const filterOptions = useMemo(() => {
    const serviceOptions = services.map(service => ({
      value: service.id || service.name,
      label: service.name
    }));

    const clientOptions = clients.map(client => ({
      value: client.id || client.name,
      label: client.name
    }));

    const teamMemberOptions = teamMembers.map(member => ({
      value: member.id || member.name,
      label: member.name
    }));

    return {
      services: [
        { value: 'all', label: 'All Services' },
        ...serviceOptions
      ],
      clients: [
        { value: 'all', label: 'All Clients' },
        ...clientOptions
      ],
      teamMembers: [
        { value: 'all', label: 'All Team Members' },
        ...teamMemberOptions
      ]
    };
  }, [services, clients, teamMembers]);

  // Memoized statistics
  const statistics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalSalesQty: 0,
        totalItemsSold: 0,
        totalGrossSales: 0,
        totalDiscounts: 0,
        totalRefunds: 0,
        totalNetSales: 0,
        totalTaxes: 0,
        totalSales: 0,
        averageOrderValue: 0
      };
    }

    const totals = data.reduce((acc, item) => {
      acc.totalSalesQty += item.salesQty || 0;
      acc.totalItemsSold += item.itemsSold || 0;
      acc.totalGrossSales += item.grossSales || 0;
      acc.totalDiscounts += item.totalDiscounts || 0;
      acc.totalRefunds += item.refunds || 0;
      acc.totalNetSales += item.netSales || 0;
      acc.totalTaxes += item.taxes || 0;
      acc.totalSales += item.totalSales || 0;
      return acc;
    }, {
      totalSalesQty: 0,
      totalItemsSold: 0,
      totalGrossSales: 0,
      totalDiscounts: 0,
      totalRefunds: 0,
      totalNetSales: 0,
      totalTaxes: 0,
      totalSales: 0
    });

    totals.averageOrderValue = totals.totalSalesQty > 0 ? totals.totalSales / totals.totalSalesQty : 0;

    return totals;
  }, [data]);

  // Memoized formatted data for display
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      // Format currency fields
      grossSalesFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.grossSales || 0),
      totalDiscountsFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.totalDiscounts || 0),
      refundsFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.refunds || 0),
      netSalesFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.netSales || 0),
      taxesFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.taxes || 0),
      totalSalesFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.totalSales || 0)
    }));
  }, [data]);

  const statusVal = loading ? 'loading' : error ? 'failed' : 'succeeded';

  return {
    // Data
    data: formattedData,
    rawData: data,
    byService,
    byClient,
    byTeamMember,
    services,
    clients,
    teamMembers,
    
    // State
    loading,
    error,
    status: statusVal, // Added for GenericReportPage compatibility
    filterBy: currentFilterBy,
    lastFetched,
    
    // Statistics
    statistics,
    
    // Filter options
    filterOptions,
    
    // Actions
    fetchData,
    changeFilter,
    clearData,
    
    // Helper methods
    refetch: () => fetchData({ force: true }),
    refresh: () => fetchData({ force: true }), // Added for GenericReportPage compatibility
    hasData: data && data.length > 0,
    isEmpty: !loading && (!data || data.length === 0),
    
    // Group by functionality for type filter
    groupBy: currentFilterBy,
    setGroupBy: useCallback((newValue) => {
      changeFilter(newValue);
    }, [changeFilter, currentFilterBy, data, byService, byClient, byTeamMember])
  };
};