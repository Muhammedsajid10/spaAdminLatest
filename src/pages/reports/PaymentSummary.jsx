import React, { useMemo } from 'react';
import { useReports } from '../../hooks/useReports';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import FilterSection from '../../components/common/FilterSection';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/ui/Button';
import { ArrowLeft, Star } from 'lucide-react';

const PaymentSummary = () => {
  const { data, loading, error, exportData } = useReports('paymentSummary');
  
  const columns = useMemo(() => [
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      sortable: true,
    },
    {
      key: 'numberOfPayments',
      label: 'No. of Payments',
      type: 'number',
      align: 'right',
      sortable: true,
    },
    {
      key: 'paymentAmount',
      label: 'Payment Amount',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      key: 'numberOfRefunds',
      label: 'No. of Refunds',
      type: 'number',
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
      key: 'netPayments',
      label: 'Net Payments',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
  ], []);

  const handleExport = (format) => {
    exportData(format);
  };

  return (
    <PageLayout
      title="Payments summary"
      subtitle="Payments split by payment methods"
      breadcrumbs={
        <div className="breadcrumbs">
          <Button variant="ghost" icon={<ArrowLeft />}>Back</Button>
          <span>All reports</span>
          <span>Finance</span>
          <span>Payments summary</span>
        </div>
      }
      actions={
        <Button variant="ghost" icon={<Star />}>
          Add to Favorites
        </Button>
      }
    >
      <FilterSection
        reportType="paymentSummary"
        onExport={handleExport}
      />
      
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        sortable={true}
        paginated={true}
        emptyMessage="No payment data available for the selected period"
      />
    </PageLayout>
  );
};

export default PaymentSummary;  