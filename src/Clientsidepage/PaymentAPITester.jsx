import React, { useState } from 'react';

const PaymentAPITester = () => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testCashMovementAPI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const res = await fetch(`/api/v1/admin/cash-movement-summary?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Cash Movement API Error:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPaymentsAPI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/payments/admin/all?page=1&limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Payments API Error:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Payment API Tester</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testCashMovementAPI} disabled={loading} style={{ marginRight: '10px' }}>
          Test Cash Movement API
        </button>
        <button onClick={testPaymentsAPI} disabled={loading}>
          Test Payments API
        </button>
      </div>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        minHeight: '200px',
        overflow: 'auto'
      }}>
        {loading ? 'Loading...' : response || 'Click a button to test the APIs'}
      </div>
    </div>
  );
};

export default PaymentAPITester;
