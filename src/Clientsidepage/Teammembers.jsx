import React, { useState, useEffect } from 'react';
import './Teammembers.css';
import { FiSearch } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { MdKeyboardArrowDown } from 'react-icons/md';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';
import Swal from 'sweetalert2';

const generateRandomPassword = (length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const TeamMembers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    position: '',
    department: '',
    employeeId: '',
    hireDate: '',
    // Removed salary and commissionRate
  });
  const [addLoading, setAddLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(null); // Track which member status is being toggled
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false); // Export options dropdown

  // Extract fetchEmployees as a separate function so we can reuse it
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching team members...');
      const res = await api.get('/employees');
      console.log('✅ Team members fetched successfully!', res.data);
      
      const data = res.data;
      console.log('🔍 Raw employee data from backend:', data.data.employees);
      
      const members = (data.data.employees || []).map(emp => {
        // Debug each employee's isActive status
        const userIsActive = emp.user?.isActive;
        console.log(`👤 Employee ${emp.user?.firstName || 'Unknown'}: user.isActive = ${userIsActive} (type: ${typeof userIsActive})`);
        
        return {
          id: emp._id,
          employeeId: emp._id, // Employee record ID
          userId: emp.user?._id, // User account ID  
          name: emp.user?.firstName && emp.user?.lastName ? `${emp.user.firstName} ${emp.user.lastName}` : emp.user?.firstName || emp.user?.email || 'N/A',
          email: emp.user?.email || '',
          phone: emp.user?.phone || '',
          position: emp.position || '',
          rating: emp.performance?.ratings?.average || null,
          reviewCount: emp.performance?.ratings?.count || null,
          // Fix: Proper boolean handling for isActive status
          isActive: userIsActive === true, // Only true if explicitly true
          status: userIsActive === true ? 'Active' : 'Inactive',
        };
      });
      
      console.log('✅ Processed members with status:', members.map(m => `${m.name}: ${m.isActive}`));
      setTeamMembers(members);
    } catch (err) {
      console.log('❌ Team members API failed, using mock data');
      if (err.message === 'MOCK_DATA_MODE' || localStorage.getItem('useMockData') === 'true') {
        console.log('🔧 Mock data mode activated for team members');
      } else {
        console.log('Error details:', err.response?.status, err.response?.data?.message || err.message);
      }
      
      // Set mock team members data
      setTeamMembers([
        {
          id: '1',
          employeeId: '1',
          userId: 'user1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@spa.com',
          phone: '+1 (555) 123-4567',
          role: 'Massage Therapist',
          experience: '5 years',
          specialization: 'Deep Tissue, Swedish Massage',
          rating: 4.8,
          status: 'Active',
          isActive: true
        },
        {
          id: '2',
          employeeId: '2', 
          userId: 'user2',
          name: 'Mike Chen',
          email: 'mike.chen@spa.com',
          phone: '+1 (555) 234-5678',
          role: 'Facial Specialist',
          experience: '3 years',
          specialization: 'Anti-aging, Hydrating Facials',
          rating: 4.6,
          status: 'Active',
          isActive: true
        },
        {
          id: '3',
          employeeId: '3',
          userId: 'user3',
          name: 'Emma Wilson',
          email: 'emma.wilson@spa.com', 
          phone: '+1 (555) 345-6789',
          role: 'Spa Manager',
          experience: '7 years',
          specialization: 'Management, Customer Service',
          rating: 4.9,
          status: 'Active',
          isActive: true
        },
        {
          id: '4',
          employeeId: '4',
          userId: 'user4',
          name: 'David Lee',
          email: 'david.lee@spa.com',
          phone: '+1 (555) 456-7890',
          role: 'Aromatherapist',
          experience: '4 years',
          specialization: 'Essential Oils, Relaxation',
          rating: 4.7,
          status: 'Inactive',
          isActive: false
        },
        {
          id: '5',
          employeeId: '5',
          userId: 'user5',
          name: 'Lisa Park',
          email: 'lisa.park@spa.com',
          phone: '+1 (555) 567-8901',
          role: 'Receptionist',
          experience: '2 years',
          specialization: 'Customer Service, Scheduling',
          rating: 4.5,
          status: 'Active',
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.team-options-container')) {
        setShowOptionsDropdown(false);
      }
    };

    if (showOptionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showOptionsDropdown]);

  // Filtered members
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add employee handler (two-step)
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);
    try {
      // 1. Create user
      const userRes = await fetch(`${Base_url}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          email: addForm.email,
          phone: addForm.phone,
          password: addForm.password,
          role: 'employee',
          gender: addForm.gender,
          address: addForm.address,
        }),
      });
      if (!userRes.ok) {
        const errData = await userRes.json();
        throw new Error(errData.message || 'Failed to create user');
      }
      const userData = await userRes.json();
      const userId = userData.data?.user?._id;
      if (!userId) throw new Error('User ID not returned');
      // 2. Create employee profile
      const token = localStorage.getItem('token');
      const empRes = await fetch(`${Base_url}/employees`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          employeeId: addForm.employeeId,
          position: addForm.position,
          department: addForm.department,
          hireDate: addForm.hireDate,
          // Removed salary and commissionRate
        }),
      });
      if (!empRes.ok) {
        const errData = await empRes.json();
        throw new Error(errData.message || 'Failed to create employee profile');
      }
      // Add to UI instantly with proper ID structure
      setTeamMembers(prev => [
        {
          id: newEmployeeId || userId, // Use employee ID if available, fallback to user ID
          employeeId: newEmployeeId || userId,
          userId: userId,
          name: `${addForm.firstName} ${addForm.lastName}`,
          email: addForm.email,
          phone: addForm.phone,
          position: addForm.position,
          rating: null,
          reviewCount: null,
          status: 'Active',
          isActive: true,
        },
        ...prev,
      ]);
      setShowAddModal(false);
      setAddForm({
        firstName: '', lastName: '', email: '', phone: '', password: '', gender: '',
        address: { street: '', city: '', state: '', zipCode: '', country: '' },
        position: '', department: '', employeeId: '', hireDate: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const toggleMemberStatus = async (memberId, currentStatus) => {
    try {
      setToggleLoading(true);
      
      // Find the member to get the correct userId
      const member = teamMembers.find(m => m.id === memberId || m.employeeId === memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      // Use userId for the API call
      const targetUserId = member.userId || member.id;
      const newStatus = !currentStatus; // Toggle the boolean status
      
      console.log('Toggling status for user:', targetUserId, 'to:', newStatus);
      
      // If deactivating, check for upcoming appointments
      if (currentStatus === true && newStatus === false) {
        console.log('Checking for upcoming appointments before deactivation...');
        
        try {
          const token = localStorage.getItem('token');
          
          // Get current date and one week from now
          const today = new Date();
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(today.getDate() + 7);
          
          const todayStr = today.toISOString().split('T')[0];
          const oneWeekStr = oneWeekFromNow.toISOString().split('T')[0];
          
          // Check for upcoming bookings for this employee
          const bookingsRes = await api.get(`/bookings/admin/all?startDate=${todayStr}&endDate=${oneWeekStr}`);
          
          if (bookingsRes.data.success) {
            const allBookings = bookingsRes.data.data.bookings || [];
            
            // Filter bookings for this specific employee that are confirmed or pending
            const employeeBookings = allBookings.filter(booking => {
              // Check if this employee is assigned to any service in the booking
              return booking.services.some(service => {
                const serviceEmployeeId = service.employee?._id || service.employee;
                return serviceEmployeeId === member.employeeId && 
                       ['confirmed', 'pending', 'in-progress'].includes(booking.status);
              });
            });
            
            if (employeeBookings.length > 0) {
              // Create detailed appointment list
              const appointmentDetails = employeeBookings.map(booking => {
                const appointmentDate = new Date(booking.appointmentDate);
                const clientName = `${booking.client?.firstName || 'Client'} ${booking.client?.lastName || ''}`.trim();
                
                const employeeServices = booking.services.filter(service => {
                  const serviceEmployeeId = service.employee?._id || service.employee;
                  return serviceEmployeeId === member.employeeId;
                });
                
                return {
                  date: appointmentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }),
                  time: appointmentDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }),
                  client: clientName,
                  services: employeeServices.map(s => s.service?.name || 'Service').join(', '),
                  bookingNumber: booking.bookingNumber,
                  status: booking.status
                };
              }).sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
              
              // Create detailed warning message
              const appointmentList = appointmentDetails.map(apt => 
                `• ${apt.date} at ${apt.time} - ${apt.client} (${apt.services}) [${apt.status.toUpperCase()}]`
              ).join('\n');
              
              const warningMessage = `⚠️ CANNOT DEACTIVATE EMPLOYEE
              
${member.name} has ${employeeBookings.length} scheduled appointment${employeeBookings.length > 1 ? 's' : ''} in the next 7 days:

${appointmentList}

BUSINESS IMPACT:
❌ Client appointments will be disrupted
❌ Revenue loss from cancelled bookings  
❌ Negative customer experience
❌ Potential rebooking complications

RECOMMENDED ACTIONS:
1️⃣ Reschedule all appointments to other available staff
2️⃣ Contact affected clients to explain the changes
3️⃣ Ensure smooth handover of responsibilities
4️⃣ Complete all pending services before deactivation

Would you like to:
• View detailed booking information
• Reschedule appointments first  
• Contact the affected clients
• Proceed anyway (NOT RECOMMENDED)`;

              const result = await Swal.fire({
                title: '⚠️ CANNOT DEACTIVATE EMPLOYEE',
                html: `
                  <div style="text-align: left; margin: 20px 0;">
                    <p><strong>${member.name}</strong> has <strong>${employeeBookings.length}</strong> scheduled appointment${employeeBookings.length > 1 ? 's' : ''} in the next 7 days:</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; max-height: 200px; overflow-y: auto;">
                      ${appointmentDetails.map(apt => 
                        `<div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #dc3545;">
                          <strong>${apt.date}</strong> at <strong>${apt.time}</strong><br>
                          <span style="color: #6c757d;">Client: ${apt.client}</span><br>
                          <span style="color: #6c757d;">Service: ${apt.services}</span><br>
                          <span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${apt.status.toUpperCase()}</span>
                        </div>`
                      ).join('')}
                    </div>

                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 15px 0;">
                      <h4 style="margin: 0 0 10px 0; color: #856404;">📊 BUSINESS IMPACT:</h4>
                      <ul style="margin: 0; padding-left: 20px; color: #856404;">
                        <li>Client appointments will be disrupted</li>
                        <li>Revenue loss from cancelled bookings</li>
                        <li>Negative customer experience</li>
                        <li>Potential rebooking complications</li>
                      </ul>
                    </div>

                    <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 15px 0;">
                      <h4 style="margin: 0 0 10px 0; color: #0c5460;">✅ RECOMMENDED ACTIONS:</h4>
                      <ol style="margin: 0; padding-left: 20px; color: #0c5460;">
                        <li>Reschedule all appointments to other available staff</li>
                        <li>Contact affected clients to explain the changes</li>
                        <li>Ensure smooth handover of responsibilities</li>
                        <li>Complete all pending services before deactivation</li>
                      </ol>
                    </div>
                  </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                cancelButtonText: 'Handle Appointments First',
                confirmButtonText: 'Proceed Anyway (NOT RECOMMENDED)',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#28a745',
                reverseButtons: true,
                customClass: {
                  popup: 'swal-wide',
                  htmlContainer: 'swal-html-container'
                },
                width: '800px'
              });
              
              if (result.isDismissed || result.dismiss === Swal.DismissReason.cancel) {
                setToggleLoading(false);
                
                // Show helpful guidance
                await Swal.fire({
                  title: '✅ Good Decision!',
                  html: `
                    <div style="text-align: left; margin: 20px 0;">
                      <p>Please handle the <strong>${employeeBookings.length}</strong> appointment${employeeBookings.length > 1 ? 's' : ''} first:</p>
                      
                      <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 15px 0;">
                        <ul style="margin: 0; padding-left: 20px; color: #155724;">
                          <li>📅 Go to Calendar/Schedule page to reschedule appointments</li>
                          <li>📞 Contact clients to inform about changes</li>
                          <li>👥 Assign services to other available team members</li>
                          <li>✅ Return here once all appointments are handled</li>
                        </ul>
                      </div>
                      
                      <p style="text-align: center; margin-top: 20px; padding: 10px; background: #fff3cd; border-radius: 6px; color: #856404;">
                        <strong>The employee will remain ACTIVE until all conflicts are resolved.</strong>
                      </p>
                    </div>
                  `,
                  icon: 'success',
                  confirmButtonText: 'Understood',
                  confirmButtonColor: '#28a745'
                });
                
                return;
              } else if (result.isConfirmed) {
                // Show final warning
                const finalResult = await Swal.fire({
                  title: '🚨 FINAL WARNING 🚨',
                  html: `
                    <div style="text-align: left; margin: 20px 0;">
                      <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 15px 0;">
                        <p style="color: #721c24; margin: 0;"><strong>Proceeding will:</strong></p>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #721c24;">
                          <li>Leave <strong>${employeeBookings.length}</strong> client${employeeBookings.length > 1 ? 's' : ''} without service provider</li>
                          <li>Potentially create operational chaos</li>
                          <li>Damage customer relationships</li>
                          <li>Require immediate crisis management</li>
                        </ul>
                      </div>
                      
                      <p style="text-align: center; margin: 20px 0; padding: 15px; background: #721c24; color: white; border-radius: 6px; font-weight: bold;">
                        This action CANNOT be undone easily.
                      </p>
                      
                      <p style="text-align: center; color: #dc3545; font-weight: bold;">
                        Are you ABSOLUTELY SURE you want to deactivate ${member.name} despite active appointments?
                      </p>
                    </div>
                  `,
                  icon: 'error',
                  showCancelButton: true,
                  cancelButtonText: 'No, Cancel',
                  confirmButtonText: 'Yes, Emergency Deactivation',
                  confirmButtonColor: '#dc3545',
                  cancelButtonColor: '#6c757d',
                  reverseButtons: true,
                  customClass: {
                    popup: 'swal-wide'
                  }
                });
                
                if (!finalResult.isConfirmed) {
                  setToggleLoading(false);
                  return;
                }
              }
            } else {
              console.log('✅ No upcoming appointments found, safe to deactivate');
            }
          } else {
            console.warn('⚠️ Could not verify appointments, proceeding with caution');
          }
          
        } catch (bookingCheckError) {
          console.warn('⚠️ Error checking appointments:', bookingCheckError);
          
          // If we can't check appointments, show warning and let admin decide
          const result = await Swal.fire({
            title: '⚠️ Unable to Verify Appointments',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p>Unable to verify upcoming appointments for <strong>${member.name}</strong>.</p>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 15px 0;">
                  <p style="margin: 0; color: #856404;"><strong>This could be due to:</strong></p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
                    <li>Network connectivity issues</li>
                    <li>Backend service unavailability</li>
                    <li>Permission restrictions</li>
                  </ul>
                </div>
                
                <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 15px 0;">
                  <p style="margin: 0; color: #0c5460; font-weight: bold;">📋 RECOMMENDATION:</p>
                  <p style="margin: 10px 0 0 0; color: #0c5460;">Check the calendar/schedule manually before proceeding.</p>
                </div>
              </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Cancel - Check Manually',
            confirmButtonText: 'Proceed with Deactivation',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            reverseButtons: true
          });
          
          if (!result.isConfirmed) {
            setToggleLoading(false);
            return;
          }
        }
      }
      
      // Proceed with status update
      const response = await api.patch('/admin/users/bulk-update', {
        userIds: [targetUserId],
        updateData: {
          isActive: newStatus
        }
      });

      console.log('API Response:', response.data);

      // Check if the response is successful (Axios uses response.status, not response.ok)
      if (response.status === 200 && response.data.success) {
        // Update the team member status in the UI immediately
        setTeamMembers(prev => prev.map(member => 
          (member.id === memberId || member.employeeId === memberId) 
            ? { 
                ...member, 
                isActive: newStatus,
                status: newStatus ? 'Active' : 'Inactive' 
              }
            : member
        ));
        
        const statusAction = newStatus ? 'activated' : 'deactivated';
        
        // Show success message with SweetAlert
        await Swal.fire({
          title: `✅ Status Updated Successfully!`,
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p style="text-align: center; font-size: 18px; margin-bottom: 20px; color: #28a745;">
                <strong>${member.name}</strong> has been <strong>${statusAction}</strong> successfully!
              </p>
              
              <div style="background: ${newStatus ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${newStatus ? '#28a745' : '#dc3545'};">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: ${newStatus ? '#155724' : '#721c24'};">The employee:</p>
                <ul style="margin: 0; padding-left: 20px; color: ${newStatus ? '#155724' : '#721c24'};">
                  ${newStatus ? `
                    <li>Can now receive new appointment assignments</li>
                    <li>Will appear in booking/calendar systems</li>
                    <li>Has restored access to employee features</li>
                    <li>Is visible to clients for service selection</li>
                  ` : `
                    <li>Will not receive new appointment assignments</li>
                    <li>Is hidden from client booking interfaces</li>
                    <li>Maintains access to view existing appointments</li>
                    <li>Can still complete scheduled services</li>
                    <li>Profile remains in system for reporting</li>
                  `}
                </ul>
              </div>
              
              ${!newStatus ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 15px;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">⚠️ Remember to:</p>
                  <ul style="margin: 0; padding-left: 20px; color: #856404;">
                    <li>Monitor any remaining appointments</li>
                    <li>Reassign ongoing responsibilities</li>
                    <li>Update team schedules accordingly</li>
                  </ul>
                </div>
              ` : ''}
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Got it!',
          confirmButtonColor: '#28a745',
          timer: 8000,
          timerProgressBar: true
        });
        
        // Refresh data from backend to ensure consistency
        console.log('🔄 Refreshing team data to ensure backend consistency...');
        setTimeout(() => {
          fetchEmployees();
        }, 1000); // Small delay to allow backend to process
        
      } else {
        console.error('API Response indicates failure:', response.data);
        throw new Error(response.data?.message || 'Failed to update member status');
      }
    } catch (error) {
      console.error('Error toggling member status:', error);
      console.error('Error response:', error.response?.data);
      
      // Log available endpoints if provided by backend
      if (error.response?.data?.availableEndpoints) {
        console.log('Available endpoints from backend:', error.response.data.availableEndpoints);
      }
      
      // Get newStatus from currentStatus toggle since it's in this scope
      const newStatus = !currentStatus;
      
      // If the endpoint doesn't exist, suggest checking backend routes
      if (error.response?.status === 404) {
        // Update UI optimistically since backend endpoint doesn't exist yet
        setTeamMembers(prev => prev.map(member => 
          (member.id === memberId || member.employeeId === memberId) 
            ? { 
                ...member, 
                isActive: newStatus,
                status: newStatus ? 'Active' : 'Inactive' 
              }
            : member
        ));
        alert(`Team member ${newStatus ? 'activated' : 'deactivated'} locally. Note: Backend endpoint for user status updates is not available yet. Please contact your backend developer to implement the user status update endpoint.`);
      } else {
        await Swal.fire({
          title: '❌ Update Failed',
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p style="text-align: center; font-size: 16px; margin-bottom: 20px; color: #dc3545;">
                Failed to update team member status. Please try again.
              </p>
              
              <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #721c24;">Possible causes:</p>
                <ul style="margin: 0; padding-left: 20px; color: #721c24;">
                  <li>Network connectivity issues</li>
                  <li>Server temporarily unavailable</li>
                  <li>Permission restrictions</li>
                  <li>Backend service error</li>
                </ul>
              </div>
              
              <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8; margin-top: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #0c5460;">💡 What to try:</p>
                <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
                  <li>Check your internet connection</li>
                  <li>Try again in a few moments</li>
                  <li>Contact system administrator if issue persists</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#dc3545'
        });
      }
    } finally {
      setToggleLoading(false);
    }
  };

  const handleStatusToggleClick = async (member) => {
    const newStatus = !member.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    // Show SweetAlert confirmation with enhanced styling
    const result = await Swal.fire({
      title: `${newStatus ? '✅' : '⏸️'} Confirm Status Change`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p style="text-align: center; font-size: 16px; margin-bottom: 20px; color: #374151;">
            Are you sure you want to <strong style="color: ${newStatus ? '#059669' : '#dc2626'};">${action}</strong> 
            <strong>${member.name}</strong>?
          </p>
          
          <div style="background: ${newStatus ? '#d1fae5' : '#fee2e2'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${newStatus ? '#10b981' : '#ef4444'};">
            <p style="margin: 0; font-weight: 500; color: ${newStatus ? '#065f46' : '#991b1b'};">
              ${newStatus ? '🔄 This will:' : '⚠️ This will:'}
            </p>
            <p style="margin: 8px 0 0 0; color: ${newStatus ? '#065f46' : '#991b1b'}; font-size: 14px;">
              ${newStatus ? 
                'Restore their access and make them visible in active team lists, booking systems, and client interfaces.' :
                'Remove their access and hide them from active team lists, booking systems, and client interfaces.'}
            </p>
          </div>
        </div>
      `,
      icon: newStatus ? 'question' : 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      confirmButtonText: `${newStatus ? 'Yes, Activate' : 'Yes, Deactivate'}`,
      confirmButtonColor: newStatus ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      customClass: {
        popup: 'status-confirm-modal'
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
      focusConfirm: false,
      focusCancel: true
    });

    if (result.isConfirmed) {
      await toggleMemberStatus(member.id || member._id, member.isActive);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setAddForm(f => {
      // Only generate if password is empty and email looks valid
      if (!f.password && /^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        return { ...f, email, password: generateRandomPassword() };
      }
      return { ...f, email };
    });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(addForm.password);
  };

  const handleRegeneratePassword = () => {
    setAddForm(f => ({ ...f, password: generateRandomPassword() }));
  };

  // Export Functions
  const convertToCSV = (data) => {
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Status', 'Rating', 'Review Count'];
    const csvContent = [
      headers.join(','),
      ...data.map(member => [
        `"${member.name}"`,
        `"${member.email}"`,
        `"${member.phone}"`,
        `"${member.position || 'N/A'}"`,
        `"${member.isActive ? 'Active' : 'Inactive'}"`,
        `"${member.rating !== null ? member.rating.toFixed(1) : 'No rating'}"`,
        `"${member.reviewCount !== null ? member.reviewCount : '0'}"`
      ].join(','))
    ].join('\n');
    return csvContent;
  };

  const downloadCSV = () => {
    try {
      const csvContent = convertToCSV(filteredMembers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `team_members_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowOptionsDropdown(false);
      Swal.fire({
        title: '✅ Export Successful!',
        text: 'Team members data has been exported to CSV format.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: '❌ Export Failed',
        text: 'Failed to export team members data. Please try again.',
        icon: 'error'
      });
    }
  };

  const downloadExcel = () => {
    try {
      // Create basic Excel-compatible format (tab-separated values)
      const headers = ['Name', 'Email', 'Phone', 'Position', 'Status', 'Rating', 'Review Count'];
      const excelContent = [
        headers.join('\t'),
        ...filteredMembers.map(member => [
          member.name,
          member.email,
          member.phone,
          member.position || 'N/A',
          member.isActive ? 'Active' : 'Inactive',
          member.rating !== null ? member.rating.toFixed(1) : 'No rating',
          member.reviewCount !== null ? member.reviewCount : '0'
        ].join('\t'))
      ].join('\n');
      
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `team_members_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowOptionsDropdown(false);
      Swal.fire({
        title: '✅ Export Successful!',
        text: 'Team members data has been exported to Excel format.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: '❌ Export Failed',
        text: 'Failed to export team members data. Please try again.',
        icon: 'error'
      });
    }
  };

  const handleOptionsClick = () => {
    setShowOptionsDropdown(!showOptionsDropdown);
  };

  return (
    <div className="team-members-container">
      <div className="team-members-wrapper">
        {/* Header */}
        <div className="team-header">
          <div className="team-title-section">
            <h1 className="team-title">Team members</h1>
           <span className="team-count">{filteredMembers.length}</span>
          </div>
          <div className="team-header-actions">
            <div className="team-options-container">
              <button 
                className="team-options-btn"
                onClick={handleOptionsClick}
              >
                <span>Options</span>
                <MdKeyboardArrowDown size={16} />
              </button>
              
              {showOptionsDropdown && (
                <div className="team-options-dropdown">
                  <div className="team-options-header">
                    <span>Export Team Members</span>
                  </div>
                  <button 
                    className="team-option-item"
                    onClick={downloadCSV}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    <span>Export as CSV</span>
                  </button>
                  <button 
                    className="team-option-item"
                    onClick={downloadExcel}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <rect x="8" y="13" width="8" height="4"></rect>
                    </svg>
                    <span>Export as Excel</span>
                  </button>
                </div>
              )}
            </div>
            <button className="team-add-btn" onClick={() => setShowAddModal(true)}>Add</button>
          </div>
        </div>
        
        {/* Professional Add Modal */}
        {showAddModal && (
          <div className="professional-modal-overlay">
            <div className="professional-modal-container">
              <div className="professional-modal-header">
                <h2 className="professional-modal-title">Add New Employee</h2>
                <p className="professional-modal-subtitle">Create a new team member profile with all necessary details</p>
                <button 
                  className="professional-modal-close"
                  onClick={() => setShowAddModal(false)}
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="professional-modal-form">
                <div className="professional-form-content">
                  
                  {/* Personal Information Section */}
                  <div className="professional-form-section">
                    <div className="professional-section-header">
                      <div className="professional-section-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <h3 className="professional-section-title">Personal Information</h3>
                    </div>
                    <div className="professional-form-grid">
                      <div className="professional-input-group">
                        <label className="professional-input-label">First Name</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter first name"
                          value={addForm.firstName} 
                          onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} 
                          required 
                        />
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Last Name</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter last name"
                          value={addForm.lastName} 
                          onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} 
                          required 
                        />
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Gender</label>
                        <select 
                          className="professional-select-field"
                          value={addForm.gender} 
                          onChange={e => setAddForm(f => ({ ...f, gender: e.target.value }))} 
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Employee ID</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter employee ID"
                          value={addForm.employeeId} 
                          onChange={e => setAddForm(f => ({ ...f, employeeId: e.target.value }))} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="professional-form-section">
                    <div className="professional-section-header">
                      <div className="professional-section-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <h3 className="professional-section-title">Contact Information</h3>
                    </div>
                    <div className="professional-form-grid">
                      <div className="professional-input-group">
                        <label className="professional-input-label">Email Address</label>
                        <input 
                          type="email" 
                          className="professional-input-field"
                          placeholder="Enter email address"
                          value={addForm.email} 
                          onChange={handleEmailChange} 
                          required 
                        />
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Phone Number</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter phone number"
                          value={addForm.phone} 
                          onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} 
                          required 
                        />
                      </div>
                      <div className="professional-input-group professional-password-group">
                        <label className="professional-input-label">Password</label>
                        <div className="professional-password-container">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="professional-input-field professional-password-input"
                            placeholder="Generated password"
                            value={addForm.password}
                            readOnly
                            required
                          />
                          <button
                            type="button"
                            className="professional-password-toggle"
                            onClick={() => setShowPassword(v => !v)}
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </button>
                          <button 
                            type="button" 
                            className="professional-password-copy"
                            onClick={handleCopyPassword} 
                            title="Copy password"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                        <button 
                          type="button" 
                          className="professional-password-regenerate"
                          onClick={handleRegeneratePassword}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                          </svg>
                          Regenerate Password
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Address Information Section */}
                  <div className="professional-form-section">
                    <div className="professional-section-header">
                      <div className="professional-section-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <h3 className="professional-section-title">Address Information</h3>
                    </div>
                    <div className="professional-form-grid">
                      <div className="professional-input-group professional-full-width">
                        <label className="professional-input-label">Street Address</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter street address"
                          value={addForm.address.street} 
                          onChange={e => setAddForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} 
                        />
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">City</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter city"
                          value={addForm.address.city} 
                          onChange={e => setAddForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} 
                        />
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">State</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter state"
                          value={addForm.address.state} 
                          onChange={e => setAddForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} 
                        />
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Zip Code</label>
                        <input 
                          type="text" 
                          className="professional-input-field"
                          placeholder="Enter zip code"
                          value={addForm.address.zipCode} 
                          onChange={e => setAddForm(f => ({ ...f, address: { ...f.address, zipCode: e.target.value } }))} 
                        />
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Country</label>
                        <select 
                          className="professional-select-field"
                          value={addForm.address.country} 
                          onChange={e => setAddForm(f => ({ ...f, address: { ...f.address, country: e.target.value } }))} 
                          required
                        >
                          <option value="">Select Country</option>
                          <option value="UAE">UAE</option>
                          <option value="India">India</option>
                          <option value="USA">USA</option>
                          <option value="UK">UK</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Employment Information Section */}
                  <div className="professional-form-section">
                    <div className="professional-section-header">
                      <div className="professional-section-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                      </div>
                      <h3 className="professional-section-title">Employment Information</h3>
                    </div>
                    <div className="professional-form-grid">
                      <div className="professional-input-group">
                        <label className="professional-input-label">Position</label>
                        <select 
                          className="professional-select-field"
                          value={addForm.position} 
                          onChange={e => setAddForm(f => ({ ...f, position: e.target.value }))} 
                          required
                        >
                          <option value="">Select Position</option>
                          <option value="massage-therapist">Massage Therapist</option>
                          <option value="esthetician">Esthetician</option>
                          <option value="nail-technician">Nail Technician</option>
                          <option value="hair-stylist">Hair Stylist</option>
                          <option value="wellness-coach">Wellness Coach</option>
                          <option value="receptionist">Receptionist</option>
                          <option value="manager">Manager</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Department</label>
                        <select 
                          className="professional-select-field"
                          value={addForm.department} 
                          onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))} 
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="spa-services">Spa Services</option>
                          <option value="wellness">Wellness</option>
                          <option value="beauty">Beauty</option>
                          <option value="administration">Administration</option>
                          <option value="customer-service">Customer Service</option>
                        </select>
                      </div>
                      <div className="professional-input-group">
                        <label className="professional-input-label">Hire Date</label>
                        <input 
                          type="date" 
                          className="professional-input-field"
                          value={addForm.hireDate} 
                          onChange={e => setAddForm(f => ({ ...f, hireDate: e.target.value }))} 
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Error Display */}
                {error && (
                  <div className="professional-error-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Modal Actions */}
                <div className="professional-modal-actions">
                  <button 
                    type="button" 
                    className="professional-btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="professional-btn-primary"
                    disabled={addLoading}
                  >
                    {addLoading ? (
                      <>
                        <svg className="professional-loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 11-6.219-8.56"/>
                        </svg>
                        Adding Employee...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                          <line x1="20" y1="8" x2="20" y2="14"></line>
                          <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        Add Employee
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="team-error">{error}</div>}
        {/* Loading */}
        {loading ? (
          <div className="team-loading">Loading team members...</div>
        ) : (
        <>
        {/* Search and Filters */}
        <div className="team-controls">
          <div className="team-search-wrapper">
            <FiSearch className="team-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search team members"
              className="team-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* Table */}
        <div className="team-table-container">
          <div className="team-table-wrapper">
            <table className="team-table">
              <thead className="team-table-header">
                <tr>
                  <th className="team-th-checkbox">
                    <input type="checkbox" className="team-checkbox" />
                  </th>
                  <th className="team-th-name">
                    <div className="team-th-content">
                      Name
                      <MdKeyboardArrowDown size={16} className="team-sort-icon" />
                    </div>
                  </th>
                  <th className="team-th-contact">Contact</th>
                  <th className="team-th-rating">
                    <div className="team-th-content">
                      Rating
                      <MdKeyboardArrowDown size={16} className="team-sort-icon" />
                    </div>
                  </th>
                  <th className="team-th-status">Status</th>
                  <th className="team-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody className="team-table-body">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="team-table-row">
                      <td className="team-td-checkbox">
                        <input type="checkbox" className="team-checkbox" />
                      </td>
                      <td className="team-td-name">
                        <div className="team-member-info">
                            <div
                              className="team-avatar-placeholder"
                              style={{
                              backgroundColor: '#f1e7ff',
                              color: '#8846d3',
                              }}
                            >
                            {member.name[0]}
                            </div>
                          <div className="team-member-details">
                            <div className="team-member-name">{member.name}</div>
                            {member.position && (
                              <div className="team-member-position">{member.position}</div>
                            )}
                            {member.status && (
                              <div className="team-member-status">
                                <div className="team-status-dot"></div>
                                <span>{member.status}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="team-td-contact">
                        <div className="team-contact-info">
                          <a
                            href={`mailto:${member.email}`}
                            className="team-email-link"
                          >
                            {member.email}
                          </a>
                          <div className="team-phone">{member.phone}</div>
                        </div>
                      </td>
                      <td className="team-td-rating">
                        {member.rating === null ? (
                          <span className="team-no-reviews">No reviews yet</span>
                        ) : (
                          <div className="team-rating-info">
                            <span className="team-rating-score">
                              {member.rating.toFixed(1)}
                            </span>
                            <FaStar size={14} className="team-rating-star" />
                            <span className="team-review-count">
                              {member.reviewCount} reviews
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="team-td-status">
                        <div className="team-status-badge">
                          <span className={`team-status-indicator ${member.isActive ? 'status-active' : 'status-inactive'}`}>
                            <div className="team-status-dot"></div>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="team-td-actions">
                        <div className="team-action-buttons">
                          <button
                            className={`team-toggle-btn ${member.isActive ? 'team-btn-deactivate' : 'team-btn-activate'}`}
                            onClick={() => handleStatusToggleClick(member)}
                            disabled={toggleLoading}
                            title={member.isActive ? 'Deactivate member' : 'Activate member'}
                          >
                            {member.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="team-empty-state">
                      No team members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  );
};

export default TeamMembers;

