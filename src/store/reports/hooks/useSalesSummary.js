import { useEffect, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSalesSummary,
  setFilterBy,
  clearSalesSummary,
  selectSalesSummaryData,
  selectSalesSummaryByService,
  selectSalesSummaryByClient,
  selectSalesSummaryByTeamMember,
  selectSalesSummaryServices,
  selectSalesSummaryClients,
  selectSalesSummaryTeamMembers,
  selectSalesSummaryLoading,
  selectSalesSummaryError,
  selectSalesSummaryFilterBy,
  selectSalesSummaryLastFetched
} from '../slices/salesSummarySlice';

export const useSalesSummary = ({ 
  dateRange = null, 
  filterBy = 'service',
  autoFetch = true 
} = {}) => {
  const dispatch = useDispatch();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Selectors
  const data = useSelector(selectSalesSummaryData);
  const byService = useSelector(selectSalesSummaryByService);
  const byClient = useSelector(selectSalesSummaryByClient);
  const byTeamMember = useSelector(selectSalesSummaryByTeamMember);
  const services = useSelector(selectSalesSummaryServices);
  const clients = useSelector(selectSalesSummaryClients);
  const teamMembers = useSelector(selectSalesSummaryTeamMembers);
  const loading = useSelector(selectSalesSummaryLoading);
  const error = useSelector(selectSalesSummaryError);
  const currentFilterBy = useSelector(selectSalesSummaryFilterBy);
  const lastFetched = useSelector(selectSalesSummaryLastFetched);

  // Debug logging
  console.log('🔍 Sales Summary Hook State:', {
    currentFilterBy,
    dataLength: data?.length || 0,
    byServiceLength: byService?.length || 0,
    byClientLength: byClient?.length || 0,
    byTeamMemberLength: byTeamMember?.length || 0,
    loading,
    error,
    lastFetched: !!lastFetched
  });

  console.log('🎪 Sales Summary Hook Return groupBy:', currentFilterBy);

  // Fetch data function
  const fetchData = useCallback(async (options = {}) => {
    const fetchOptions = {
      dateRange: options.dateRange || dateRange,
      filterBy: options.filterBy || filterBy,
      ...options
    };
    
    console.log('🔄 Sales Summary Hook: Fetching data with options:', fetchOptions);
    
    try {
      await dispatch(fetchSalesSummary(fetchOptions)).unwrap();
    } catch (error) {
      console.error('❌ Sales Summary Hook: Fetch error:', error);
      throw error;
    }
  }, [dispatch, dateRange, filterBy]);

  // Change filter function
  const changeFilter = useCallback((newFilterBy) => {
    console.log('🔀 Sales Summary Hook: Changing filter from', currentFilterBy, 'to', newFilterBy);
    console.log('📊 Available data counts:', {
      services: byService?.length || 0,
      clients: byClient?.length || 0,
      teamMembers: byTeamMember?.length || 0
    });
    console.log('🔄 Before dispatch - current data length:', data?.length || 0);
    dispatch(setFilterBy(newFilterBy));
    setForceUpdate(prev => prev + 1); // Force re-render
    console.log('✅ Dispatched setFilterBy with:', newFilterBy);
  }, [dispatch, currentFilterBy, byService, byClient, byTeamMember, data]);

  // Clear data function
  const clearData = useCallback(() => {
    console.log('🧹 Sales Summary Hook: Clearing data');
    dispatch(clearSalesSummary());
  }, [dispatch]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch && !loading && !lastFetched) {
      console.log('🚀 Sales Summary Hook: Auto-fetching data on mount');
      fetchData();
    }
  }, [autoFetch, loading, lastFetched, fetchData]);

  // Filter change effect
  useEffect(() => {
    if (currentFilterBy !== filterBy && lastFetched) {
      console.log('🔄 Sales Summary Hook: Filter changed, updating display');
      changeFilter(filterBy);
    }
  }, [filterBy, currentFilterBy, changeFilter, lastFetched]);

  // Debug effect to track currentFilterBy changes
  useEffect(() => {
    console.log('🎯 Sales Summary Hook: currentFilterBy changed to:', currentFilterBy);
    console.log('📋 Current data after filter change:', {
      length: data?.length || 0,
      firstItem: data?.[0],
      filterBy: currentFilterBy
    });
  }, [currentFilterBy, data]);

  // Debug effect to track all data arrays
  useEffect(() => {
    if (lastFetched) {
      console.log('📊 All data arrays updated:', {
        services: byService?.length || 0,
        clients: byClient?.length || 0, 
        teamMembers: byTeamMember?.length || 0,
        currentFilter: currentFilterBy,
        mainDataLength: data?.length || 0
      });
    }
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

  // Status for GenericReportPage compatibility
  const status = loading ? 'loading' : error ? 'failed' : 'succeeded';

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
    status, // Added for GenericReportPage compatibility
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
      console.log('🎪 Sales Summary Hook: setGroupBy called with:', newValue);
      console.log('🔄 Current state before change:', { 
        currentFilterBy, 
        dataLength: data?.length || 0,
        byServiceLength: byService?.length || 0,
        byClientLength: byClient?.length || 0,
        byTeamMemberLength: byTeamMember?.length || 0
      });
      changeFilter(newValue);
    }, [changeFilter, currentFilterBy, data, byService, byClient, byTeamMember])
  };
};