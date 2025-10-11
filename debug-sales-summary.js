// Debug script to test sales summary normalization
import { normalizeSalesData } from './src/store/reports/slices/salesSummarySlice.js';

// Sample booking data
const sampleBookings = {
  data: {
    bookings: [
      {
        _id: '1',
        status: 'completed',
        service: { name: 'Hair Cut' },
        client: { fullName: 'John Doe' },
        employee: { name: 'Sarah Smith' },
        totalAmount: 50
      },
      {
        _id: '2', 
        status: 'completed',
        service: { name: 'Massage' },
        client: { fullName: 'Jane Wilson' },
        employee: { name: 'Mike Johnson' },
        totalAmount: 80
      },
      {
        _id: '3',
        status: 'completed', 
        service: { name: 'Hair Cut' },
        client: { fullName: 'Bob Brown' },
        employee: { name: 'Sarah Smith' },
        totalAmount: 50
      }
    ]
  }
};

console.log('Testing normalization...');
const result = normalizeSalesData(sampleBookings);

console.log('\n=== RESULTS ===');
console.log('Services:', result.byService.length);
result.byService.forEach(s => console.log('  -', s.name || s.service, ':', s));

console.log('Clients:', result.byClient.length); 
result.byClient.forEach(c => console.log('  -', c.name || c.client, ':', c));

console.log('Team Members:', result.byTeamMember.length);
result.byTeamMember.forEach(t => console.log('  -', t.name || t.teamMember, ':', t));