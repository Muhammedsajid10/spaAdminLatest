import React from 'react';
import  '../../calendar/components/ClientInformation.css';

const ClientSummary = ({ selectedExistingClient, clientInfo }) => {
  const clientName = selectedExistingClient
    ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
    : clientInfo.name || 'N/A';
  const clientEmail = selectedExistingClient
    ? selectedExistingClient.email
    : clientInfo.email;
  const clientPhone = selectedExistingClient
    ? selectedExistingClient.phone
    : clientInfo.phone;
  const isVip = !!selectedExistingClient;

  return (
    <div className='clientSummaryRow'>
      <span className='clientSummaryItem'>
        <span className='clientSummaryLabel'>Client:</span>
        <span className='clientSummaryValue'>
          {clientName}
          {/* {isVip && (
            <span className='vipIndicator'>VIP Member</span>
          )} */}
        </span>
      </span>
      <span className='clientSummaryItem'>
        <span className='clientSummaryLabel'>Email:</span>
        <span className='clientSummaryValue'>{clientEmail}</span>
      </span>
      <span className='clientSummaryItem'>
        <span className='clientSummaryLabel'>Phone:</span>
        <span className='clientSummaryValue'>{clientPhone}</span>
      </span>
    </div>
  );
};

export default ClientSummary;