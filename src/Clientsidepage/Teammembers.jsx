import React, { useState, useEffect } from 'react';
import './Teammembers.css';
import { FiSearch } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { MdKeyboardArrowDown } from 'react-icons/md';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';

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

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Fetching team members...');
        const res = await api.get('/employees');
        console.log('✅ Team members fetched successfully!', res.data);
        
        const data = res.data;
        const members = (data.data.employees || []).map(emp => ({
          id: emp._id,
          name: emp.user?.firstName && emp.user?.lastName ? `${emp.user.firstName} ${emp.user.lastName}` : emp.user?.firstName || emp.user?.email || 'N/A',
          email: emp.user?.email || '',
          phone: emp.user?.phone || '',
          position: emp.position || '',
          rating: emp.performance?.ratings?.average || null,
          reviewCount: emp.performance?.ratings?.count || null,
          status: emp.user?.isActive === false ? 'Inactive' : 'Active',
        }));
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
            name: 'Sarah Johnson',
            email: 'sarah.johnson@spa.com',
            phone: '+1 (555) 123-4567',
            role: 'Massage Therapist',
            experience: '5 years',
            specialization: 'Deep Tissue, Swedish Massage',
            rating: 4.8,
            status: 'Active'
          },
          {
            id: '2', 
            name: 'Mike Chen',
            email: 'mike.chen@spa.com',
            phone: '+1 (555) 234-5678',
            role: 'Facial Specialist',
            experience: '3 years',
            specialization: 'Anti-aging, Hydrating Facials',
            rating: 4.6,
            status: 'Active'
          },
          {
            id: '3',
            name: 'Emma Wilson',
            email: 'emma.wilson@spa.com', 
            phone: '+1 (555) 345-6789',
            role: 'Spa Manager',
            experience: '7 years',
            specialization: 'Management, Customer Service',
            rating: 4.9,
            status: 'Active'
          },
          {
            id: '4',
            name: 'David Lee',
            email: 'david.lee@spa.com',
            phone: '+1 (555) 456-7890',
            role: 'Aromatherapist',
            experience: '4 years',
            specialization: 'Essential Oils, Relaxation',
            rating: 4.7,
            status: 'Active'
          },
          {
            id: '5',
            name: 'Lisa Park',
            email: 'lisa.park@spa.com',
            phone: '+1 (555) 567-8901',
            role: 'Receptionist',
            experience: '2 years',
            specialization: 'Customer Service, Scheduling',
            rating: 4.5,
            status: 'Active'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

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
      // Add to UI instantly
      setTeamMembers(prev => [
        {
          id: userId,
          name: `${addForm.firstName} ${addForm.lastName}`,
          email: addForm.email,
          phone: addForm.phone,
          position: addForm.position,
          rating: null,
          reviewCount: null,
          status: 'Active',
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
            <button className="team-options-btn">
              <span>Options</span>
              <MdKeyboardArrowDown size={16} />
            </button>
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
                  <th className="team-th-actions"></th>
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
                      <td className="team-td-actions"></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="team-empty-state">
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

