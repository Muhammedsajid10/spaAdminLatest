import React, { useMemo } from 'react';
import { useReports } from '../../hooks/useReports';
import { useTable } from '../../hooks/useTable';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import FilterSection from '../../components/common/FilterSection';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/ui/Button';
import { ArrowLeft, Star } from 'lucide-react';
import '../../styles/subPages.css';

const SalesSummary = () => {
  const { data, loading, error, exportData } = useReports('salesSummary');
  
  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'type',
      label: 'Type',
      sortable: true,
    },
    {
      key: 'salesQty',
      label: 'Sales Qty',
      type: 'number',
      align: 'right',
      sortable: true,
    },
    {
      key: 'itemsSold',
      label: 'Items Sold',
      type: 'number',
      align: 'right',
      sortable: true,
    },
    {
      key: 'grossSales',
      label: 'Gross Sales',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      key: 'totalDiscounts',
      label: 'Total Discounts',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      key: 'refunds',
      label: 'Refunds',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      key: 'netSales',
      label: 'Net Sales',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      key: 'taxes',
      label: 'Taxes',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      key: 'totalSales',
      label: 'Total Sales',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
  ], []);

  const handleExport = (format) => {
    exportData(format);
  };

  const handleBackClick = () => {
    // Navigate back to reports main page
    window.history.back();
  };

  const handleAddToFavorites = () => {
    // Add to favorites functionality
    console.log('Added to favorites');
  };

  // Page actions
  const pageActions = (
    <div className="sales-summary__actions">
      <Button
        variant="ghost"
        icon={<Star />}
        onClick={handleAddToFavorites}
      >
        Add to Favorites
      </Button>
      <Button
        variant="secondary"
        onClick={handleBackClick}
      >
        Duplicate
      </Button>
    </div>
  );

  // Breadcrumbs
  const breadcrumbs = (
    <div className="sales-summary__breadcrumbs">
      <Button
        variant="ghost"
        icon={<ArrowLeft />}
        onClick={handleBackClick}
        className="sales-summary__back-btn"
      >
        Back
      </Button>
      <span>All reports</span>
      <span>Sales</span>
      <span>Sales summary</span>
    </div>
  );

  return (
    <PageLayout
      title="Sales summary"
      subtitle="Sales quantities and value, excluding tips and gift card sales."
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      className="sales-summary"
    >
      <FilterSection
        reportType="salesSummary"
        showLocationFilter={false}
        showTeamMemberFilter={false}
        showServiceFilter={false}
        showGroupByFilter={true}
        onExport={handleExport}
      />
      
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        sortable={true}
        paginated={true}
        selectable={false}
        className="sales-summary__table"
        emptyMessage="No sales data available for the selected period"
      />
    </PageLayout>
  );
};

export default SalesSummary;