import React, { useState, useEffect, useCallback } from 'react';
import './Teammembers.css';
import { FiSearch } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { MdKeyboardArrowDown } from 'react-icons/md';
import Swal from 'sweetalert2';
import api from '../Service/Api';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Base_url } from '../Service/Base_url';
import Loading from '../states/Loading';
import Error500Page from '../states/ErrorPage';
import NoDataState from '../states/NoData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- NEW Edit Member Modal Component ---
const EditMemberModal = ({ isOpen, onClose, member, onUpdate, loading, error }) => {
    const [formData, setFormData] = useState(member);

    useEffect(() => {
        if (member) {
            const formattedHireDate = member.hireDate ? new Date(member.hireDate).toISOString().split('T')[0] : '';
            setFormData({
                ...member,
                hireDate: formattedHireDate,
            });
        }
    }, [member]);

    if (!isOpen || !member) return null;

    // A generic handler for regular input fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('Field changed:', name, 'New value:', value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // A specific handler for the PhoneInput component
    const handlePhoneChange = (value) => {
        setFormData(prev => ({ ...prev, phone: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Include editable personal and employee-specific fields
        const updatePayload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            employeeId: formData.employeeId,
            position: formData.position,
            department: formData.department,
            hireDate: formData.hireDate
        };
        console.log('Submitting update payload for member:', member.id, updatePayload);
        try {
            const result = await onUpdate(member.id, updatePayload);
            console.log('onUpdate result for', member.id, result);
        } catch (err) {
            console.error('onUpdate error for', member.id, err);
        }
    };

    return (
        <div className="professional-modal-overlay">
            <div className="professional-modal-container">
                <div className="professional-modal-header">
                    <h2 className="professional-modal-title">Edit {member.name}</h2>
                    <p className="professional-modal-subtitle">Update employee details and profile information.</p>
                    <button className="professional-modal-close" onClick={onClose} type="button">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="professional-modal-form">
                    <div className="professional-form-content">
                        <div className="professional-form-section">
                            <div className="professional-section-header">
                                <div className="professional-section-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <h3 className="professional-section-title">Personal Information</h3>
                                <span className="professional-readonly-badge">Editable</span>
                            </div>
                            <div className="professional-form-grid">
                                <div className="professional-input-group">
                                    <label className="professional-input-label">First Name</label>
                                    <input
                                        type="text"
                                        className="professional-input-field"
                                        name="firstName"
                                        value={formData.firstName || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="professional-input-group">
                                    <label className="professional-input-label">Last Name</label>
                                    <input
                                        type="text"
                                        className="professional-input-field"
                                        name="lastName"
                                        value={formData.lastName || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="professional-input-group">
                                    <label className="professional-input-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="professional-input-field"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="professional-input-group">
                                    <label className="professional-input-label">Phone Number</label>
                                    <input
                                        type="text"
                                        className="professional-input-field"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        
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
                                        name="position"
                                        value={formData.position || ''}
                                        onChange={handleInputChange}
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
                                        name="department"
                                        value={formData.department || ''}
                                        onChange={handleInputChange}
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
                                    <label className="professional-input-label">Employee ID</label>
                                    <input
                                        type="text"
                                        className="professional-input-field"
                                        name="employeeId"
                                        value={formData.employeeId || ''}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="professional-input-group">
                                    <label className="professional-input-label">Hire Date</label>
                                    <input
                                        type="date"
                                        className="professional-input-field"
                                        name="hireDate"
                                        value={formData.hireDate || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="professional-error-message">
                            {error}
                        </div>
                    )}
                    <div className="professional-modal-actions">
                        <button type="button" className="professional-btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="professional-btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loading/>
                                    {/* Updating... */}
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Helper Functions ---
const generateRandomPassword = (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// --- Main TeamMembers Component ---
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
        employeeId: '',
        position: '',
        department: '',
        hireDate: '',
    });
    const [addLoading, setAddLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(null);
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

    // --- FIX: showEditModal state variable ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/employees');
            const data = res.data;

            const members = (data.data.employees || []).map(emp => {
                const userIsActive = emp.isActive;
                return {
                    id: emp._id,
                    employeeId: emp.employeeId || '',
                    userId: emp.user?._id,
                    name: emp.user?.firstName && emp.user?.lastName ? `${emp.user.firstName} ${emp.user.lastName}` : emp.user?.firstName || emp.user?.email || 'N/A',
                    firstName: emp.user?.firstName || '',
                    lastName: emp.user?.lastName || '',
                    email: emp.user?.email || '',
                    phone: emp.user?.phone || '',
                    position: emp.position || '',
                    department: emp.department || '',
                    hireDate: emp.hireDate || '',
                    rating: emp.performance?.ratings?.average || null,
                    reviewCount: emp.performance?.ratings?.count || null,
                    isActive: userIsActive === true,
                    status: userIsActive === true ? 'Active' : 'Inactive',
                };
            });
            // Only show active employees in the team members list
            setTeamMembers(members);
        } catch (err) {
            console.error("Failed to fetch team members:", err);
            let errorMessage = "Failed to load team members";

            // Check for network errors
            if (!navigator.onLine) {
                errorMessage = "No internet connection. Please check your network and try again.";
            } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
                errorMessage = "Network error. Please check your internet connection.";
            } else if (err.response) {
                // Server responded with error status
                if (err.response.status === 404) {
                    errorMessage = "Team members service not found. Please contact support.";
                } else if (err.response.status === 500) {
                    errorMessage = "Server error. Please try again later.";
                } else if (err.response.status === 401) {
                    errorMessage = "Authentication failed. Please login again.";
                } else {
                    errorMessage = err.response.data?.message || "Server error occurred.";
                }
            } else if (err.request) {
                // Network error or no response
                errorMessage = "Unable to connect to server. Please check your internet connection.";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

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

    const filteredMembers = teamMembers.filter((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPhoneChange = (value) => {
        setAddForm(f => ({ ...f, phone: value }));
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        setError(null);
        try {
            // Check network connectivity
            if (!navigator.onLine) {
                throw new Error('No internet connection. Please check your network and try again.');
            }

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
                }),
            });
            if (!empRes.ok) {
                const errData = await empRes.json();
                throw new Error(errData.message || 'Failed to create employee profile');
            }
            const newEmployeeId = empRes.data?._id;
            setTeamMembers(prev => [
                {
                    id: newEmployeeId || userId,
                    employeeId: addForm.employeeId,
                    userId: userId,
                    name: `${addForm.firstName} ${addForm.lastName}`,
                    firstName: addForm.firstName,
                    lastName: addForm.lastName,
                    email: addForm.email,
                    phone: addForm.phone,
                    position: addForm.position,
                    department: addForm.department,
                    hireDate: addForm.hireDate,
                    rating: null,
                    reviewCount: null,
                    status: 'Active',
                    isActive: true,
                },
                ...prev,
            ]);
            setShowAddModal(false);
            setAddForm({
                firstName: '', lastName: '', email: '', phone: '', password: '',
                employeeId: '', position: '', department: '', hireDate: '',
            });
            Swal.fire('Success!', 'Employee added successfully.', 'success');
        } catch (err) {
            console.error('Error adding employee:', err);
            let errorMessage = err.message;

            if (!navigator.onLine) {
                errorMessage = 'No internet connection. Please check your network and try again.';
            } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection.';
            }

            setError(errorMessage);
            Swal.fire('Error!', errorMessage, 'error');
        } finally {
            setAddLoading(false);
        }
    };

    const handleEmailChange = (e) => {
        const email = e.target.value;
        setAddForm(f => {
            if (!f.password && /^[^@]+@[^@]+\.[^@]+$/.test(email)) {
                return { ...f, email, password: generateRandomPassword() };
            }
            return { ...f, email };
        });
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(addForm.password);
        Swal.fire('Copied!', 'Password copied to clipboard.', 'success');
    };

    const handleRegeneratePassword = () => {
        setAddForm(f => ({ ...f, password: generateRandomPassword() }));
    };
      // Toggle member active status (update server and local state)
        async function toggleMemberStatus(memberId, currentIsActive) {
            console.log("somethign sinside ")
            setToggleLoading(memberId);
            try {
                const payload = { isActive: !currentIsActive };

                // Find the member locally to get associated userId if available
                const memberRecord = teamMembers.find(m => m.id === memberId);
                const userId = memberRecord?.userId;

                let resp;
                // Prefer updating the employees endpoint because memberId is employee._id
                try {
                    console.log(`toggleMemberStatus: attempting PATCH /employees/${memberId}`, payload);
                    resp = await api.patch(`/employees/${memberId}`, payload);
                } catch (empErr) {
                    console.warn('employees PATCH failed, will try users endpoint if available', empErr);
                    // If we have a linked userId, try updating the users endpoint next
                    if (userId) {
                        console.log(`toggleMemberStatus: attempting PATCH /users/${userId}`, payload);
                        resp = await api.patch(`/users/${userId}`, payload);
                    } else {
                        // As a last resort, try using the same id against /users
                        console.log(`toggleMemberStatus: attempting PATCH /users/${memberId} (no userId available)`);
                        resp = await api.patch(`/users/${memberId}`, payload);
                    }
                }

                // Optimistically update UI state
                setTeamMembers(prev => prev.map(m => {
                    if (m.id === memberId || m.userId === memberId || m.id === (memberId)) {
                        return { ...m, isActive: !currentIsActive, status: !currentIsActive ? 'Active' : 'Inactive' };
                    }
                    return m;
                }));

                Swal.fire('Success', `Member ${!currentIsActive ? 'activated' : 'deactivated'} successfully.`, 'success');
            } catch (err) {
                console.error('Failed to toggle member status:', err);
                const errMsg = err.response?.data?.message || err.message || 'Failed to update status';
                Swal.fire('Error', errMsg, 'error');
            } finally {
                setToggleLoading(null);
            }
        }
    const handleStatusToggleClick = async (member) => {
        const newStatus = !member.isActive;
        const action = newStatus ? 'activate' : 'deactivate';

        const result = await Swal.fire({
            title: `${newStatus ? '✅' : '⏸️'} Confirm Status Change`,
            html: `
                <div style="text-align: left; margin: 10px 0;margin-bottom: 1px;">
                    <p style="text-align: center; font-size: 12px; margin-bottom: 10px; color: #374151;">
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
    
      
    // Export Functions
    const convertToCSV = (data) => {
        const headers = ['Name', 'Email', 'Phone', 'Position', 'Department', 'Status', 'Rating', 'Review Count'];
        const csvContent = [
            headers.join(','),
            ...data.map(member => [
                `"${member.name}"`,
                `"${member.email}"`,
                `"${member.phone}"`,
                `"${member.position || 'N/A'}"`,
                `"${member.department || 'N/A'}"`,
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
            const headers = ['Name', 'Email', 'Phone', 'Position', 'Department', 'Status', 'Rating', 'Review Count'];
            const excelContent = [
                headers.join('\t'),
                ...filteredMembers.map(member => [
                    member.name,
                    member.email,
                    member.phone,
                    member.position || 'N/A',
                    member.department || 'N/A',
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

    // PDF Export Function
    const downloadPDF = () => {
        try {
            const doc = new jsPDF();

            // Add title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('Team Members Report', 14, 20);

            // Add metadata
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
            doc.text(`Total Team Members: ${filteredMembers.length}`, 14, 36);

            // Calculate statistics
            const activeMembers = filteredMembers.filter(m => m.isActive).length;
            const inactiveMembers = filteredMembers.length - activeMembers;
            const avgRating = filteredMembers
                .filter(m => m.rating !== null)
                .reduce((sum, m, _, arr) => sum + m.rating / arr.length, 0);

            doc.text(`Active Members: ${activeMembers}`, 14, 42);
            doc.text(`Inactive Members: ${inactiveMembers}`, 14, 48);
            if (avgRating > 0) {
                doc.text(`Average Rating: ${avgRating.toFixed(1)} stars`, 14, 54);
            }

            // Prepare table data
            const tableColumn = [
                "Name",
                "Email",
                "Phone",
                "Position",
                "Department",
                "Status",
                "Rating",
                "Reviews"
            ];

            const tableRows = filteredMembers.map(member => [
                member.name,
                member.email,
                member.phone || 'N/A',
                member.position || 'N/A',
                member.department || 'N/A',
                member.isActive ? 'Active' : 'Inactive',
                member.rating !== null ? `${member.rating.toFixed(1)} ⭐` : 'No rating',
                member.reviewCount !== null ? member.reviewCount.toString() : '0'
            ]);

            // Generate table
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 65,
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    overflow: 'linebreak',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 25 }, // Name
                    1: { cellWidth: 35 }, // Email
                    2: { cellWidth: 25 }, // Phone
                    3: { cellWidth: 25 }, // Position
                    4: { cellWidth: 25 }, // Department
                    5: { cellWidth: 15 }, // Status
                    6: { cellWidth: 20 }, // Rating
                    7: { cellWidth: 15 }  // Reviews
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                tableLineColor: [220, 220, 220],
                tableLineWidth: 0.1,
                margin: { left: 14, right: 14 }
            });

            // Add footer with page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
                doc.text(
                    'Allora Spa - Team Members Report',
                    14,
                    doc.internal.pageSize.height - 10
                );
            }

            // Save the PDF
            doc.save(`team_members_${new Date().toISOString().split('T')[0]}.pdf`);

            setShowOptionsDropdown(false);
            Swal.fire({
                title: '✅ Export Successful!',
                text: 'Team members data has been exported to PDF format.',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('PDF Export Error:', error);
            Swal.fire({
                title: '❌ Export Failed',
                text: 'Failed to export team members data to PDF. Please try again.',
                icon: 'error'
            });
        }
    };

    const handleOptionsClick = () => {
        setShowOptionsDropdown(!showOptionsDropdown);
    };

    const handleEditClick = (member) => {
        setEditingMember(member);
        setShowEditModal(true);
    };

    const handleUpdateEmployee = async (memberId, updatedData) => {
        setEditLoading(true);
        setEditError(null);
        console.log('handleUpdateEmployee called for', memberId, updatedData);
        let empUpdateRes = null;
        let userUpdateRes = null;
        try {
            // Check network connectivity
            if (!navigator.onLine) {
                throw new Error('No internet connection. Please check your network and try again.');
            }

            // Prepare employee payload
            const empPayload = {
                employeeId: updatedData.employeeId,
                position: updatedData.position,
                department: updatedData.department,
                hireDate: updatedData.hireDate,
            };

            console.log('Patching /employees/', memberId, empPayload);
            empUpdateRes = await api.patch(`/employees/${memberId}`, empPayload);

            // If personal fields were provided, try to update the linked user record
            const memberRecord = teamMembers.find(m => m.id === memberId);
            const userId = memberRecord?.userId;
            const userPayload = {};
            if (updatedData.firstName !== undefined) userPayload.firstName = updatedData.firstName;
            if (updatedData.lastName !== undefined) userPayload.lastName = updatedData.lastName;
            if (updatedData.email !== undefined) userPayload.email = updatedData.email;
            if (updatedData.phone !== undefined) userPayload.phone = updatedData.phone;

            if (userId && Object.keys(userPayload).length > 0) {
                try {
                    userUpdateRes = await api.patch(`/employees/${userId}`, userPayload);
                } catch (userErr) {
                    console.warn('Failed to update user profile; continuing with employee update', userErr);
                }
            }

            // Check if employee API call was successful
            if (empUpdateRes && (empUpdateRes.status === 200 || empUpdateRes.status === 204)) {
                // Update the local state with both personal and employee fields
                setTeamMembers(prev => prev.map(member =>
                    member.id === memberId ? {
                        ...member,
                        firstName: updatedData.firstName !== undefined ? updatedData.firstName : member.firstName,
                        lastName: updatedData.lastName !== undefined ? updatedData.lastName : member.lastName,
                        email: updatedData.email !== undefined ? updatedData.email : member.email,
                        phone: updatedData.phone !== undefined ? updatedData.phone : member.phone,
                        name: `${updatedData.firstName !== undefined ? updatedData.firstName : member.firstName} ${updatedData.lastName !== undefined ? updatedData.lastName : member.lastName}`.trim(),
                        employeeId: updatedData.employeeId,
                        position: updatedData.position,
                        department: updatedData.department,
                        hireDate: updatedData.hireDate
                    } : member
                ));

                // Close the modal
                setShowEditModal(false);

                // Show a success message
                Swal.fire('Updated!', 'Employee details have been updated successfully.', 'success');

                return { empUpdateRes, userUpdateRes };
            } else {
                // Handle cases where the call failed but didn't throw an error
                throw new Error('Employee API request failed with an unexpected status.');
            }
        } catch (err) {
            console.error('Error updating employee:', err);
            let errorMessage = err.response?.data?.message || err.message || 'Failed to update employee';

            if (!navigator.onLine) {
                errorMessage = 'No internet connection. Please check your network and try again.';
            } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection.';
            }

            setEditError(errorMessage);

            // Show a detailed error message
            Swal.fire('Error!', errorMessage, 'error');
            throw err; // rethrow so callers (modal) can see it
        } finally {
            setEditLoading(false);
        }
    };

    // Network connectivity check
    const isOnline = navigator.onLine;

    // Check if we have no data
    const hasNoData = !loading && !error && teamMembers.length === 0;
    const hasNoResults = !loading && !error && teamMembers.length > 0 && filteredMembers.length === 0;

    // Show loading state
    if (loading) {
        return (
            <div className="team-members-container">
                <div className="team-members-wrapper">
                    <div className="team-header">
                        <div className="team-title-section">
                            <h1 className="team-title">Team members</h1>
                            <span className="team-count">0</span>
                        </div>
                        <div className="team-header-actions">
                            <div className="team-options-container">
                                <button className="team-options-btn" disabled>
                                    <span>Export</span>
                                    <MdKeyboardArrowDown size={16} />
                                </button>
                            </div>
                            <button className="team-add-btn" disabled>Add</button>
                        </div>
                    </div>
                    <Loading />
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="team-members-container">
                <div className="team-members-wrapper">
                    <div className="team-header">
                        <div className="team-title-section">
                            <h1 className="team-title">Team members</h1>
                            <span className="team-count">0</span>
                        </div>
                     
                    </div>
                   <Error500Page/>
                </div>
                {/* Add Modal should still be available */}
                {showAddModal && (
                    <div className="professional-modal-overlay">
                        <div className="professional-modal-container">
                            <div className="professional-modal-header">
                                <h2 className="professional-modal-title">Add New Employee</h2>
                                <p className="professional-modal-subtitle">Create a new team member profile.</p>
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
                                                    name="firstName"
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
                                                    name="lastName"
                                                    value={addForm.lastName}
                                                    onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="professional-input-group">
                                                <label className="professional-input-label">Email Address</label>
                                                <input
                                                    type="email"
                                                    className="professional-input-field"
                                                    name="email"
                                                    value={addForm.email}
                                                    onChange={handleEmailChange}
                                                    required
                                                />
                                            </div>
                                            <div className="professional-input-group">
                                                <label className="professional-input-label">Phone Number</label>
                                                <PhoneInput
                                                    country={"ae"}
                                                    value={addForm.phone}
                                                    onChange={handleAddPhoneChange}
                                                    inputProps={{
                                                        name: "phone",
                                                        required: true,
                                                        autoFocus: false,
                                                    }}
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
                                                    name="position"
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
                                                    name="department"
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
                                                <label className="professional-input-label">Employee ID</label>
                                                <input
                                                    type="text"
                                                    className="professional-input-field"
                                                    name="employeeId"
                                                    value={addForm.employeeId}
                                                    onChange={e => setAddForm(f => ({ ...f, employeeId: e.target.value }))}
                                                />
                                            </div>
                                            <div className="professional-input-group">
                                                <label className="professional-input-label">Hire Date</label>
                                                <input
                                                    type="date"
                                                    className="professional-input-field"
                                                    name="hireDate"
                                                    value={addForm.hireDate}
                                                    onChange={e => setAddForm(f => ({ ...f, hireDate: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {error && <div className="professional-error-message">{error}</div>}
                                <div className="professional-modal-actions">
                                    <button type="button" className="professional-btn-secondary" onClick={() => setShowAddModal(false)} disabled={addLoading}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="professional-btn-primary" disabled={addLoading}>
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
            </div>
        );
    }

    // Show no data state
    if (hasNoData) {
        return (
            <div className="team-members-container">
                <div className="team-members-wrapper">
                    <div className="team-header">
                        <div className="team-title-section">
                            <h1 className="team-title">Team members</h1>
                            <span className="team-count">0</span>
                        </div>
                        <div className="team-header-actions">
                            <div className="team-options-container">
                                <button className="team-options-btn" disabled>
                                    <span>Export</span>
                                    <MdKeyboardArrowDown size={16} />
                                </button>
                            </div>
                            <button className="team-add-btn" onClick={() => setShowAddModal(true)}>Add</button>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '60vh',
                        width: '100%'
                    }}>
                        <NoDataState
                            message="No team members found"
                            description="There are no team members yet. Start by adding your first team member."
                            icon="👥"
                        />
                    </div>
                </div>
                {/* Add Modal should still be available */}
                {showAddModal && (
                    <div className="professional-modal-overlay">
                        {/* Add modal content remains the same */}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="team-members-container">
            <div className="team-members-wrapper">

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
                                disabled={filteredMembers.length === 0}
                            >
                                <span>Export</span>
                                <MdKeyboardArrowDown size={16} />
                            </button>
                            {showOptionsDropdown && filteredMembers.length > 0 && (
                                <div className="team-options-dropdown">
                                    <button
                                        className="team-option-item"
                                        onClick={downloadCSV}
                                    >
                                        <span>Export as CSV</span>
                                    </button>
                                    <button
                                        className="team-option-item"
                                        onClick={downloadExcel}
                                    >
                                        <span>Export as Excel</span>
                                    </button>
                                    <button
                                        className="team-option-item"
                                        onClick={downloadPDF}
                                    >
                                        <span>Export as PDF</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button className="team-add-btn" onClick={() => setShowAddModal(true)}>Add</button>
                    </div>
                </div>

                {/* Professional Add Modal - keeping existing code */}
                {showAddModal && (
                    <div className="professional-modal-overlay">
                        <div className="professional-modal-container">
                            <div className="professional-modal-header">
                                <h2 className="professional-modal-title">Add New Employee</h2>
                                <p className="professional-modal-subtitle">Create a new team member profile.</p>
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
                                                    name="firstName"
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
                                                    name="lastName"
                                                    value={addForm.lastName}
                                                    onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="professional-input-group">
                                                <label className="professional-input-label">Email Address</label>
                                                <input
                                                    type="email"
                                                    className="professional-input-field"
                                                    name="email"
                                                    value={addForm.email}
                                                    onChange={handleEmailChange}
                                                    required
                                                />
                                            </div>
                                            <div className="professional-input-group">
                                                <label className="professional-input-label">Phone Number</label>
                                                <PhoneInput
                                                    country={"ae"}
                                                    value={addForm.phone}
                                                    onChange={handleAddPhoneChange}
                                                    inputProps={{
                                                        name: "phone",
                                                        required: true,
                                                        autoFocus: false,
                                                    }}
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
                                                    name="position"
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
                                                    name="department"
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
                                                <label className="professional-input-label">Employee ID</label>
                                                <input
                                                    type="text"
                                                    className="professional-input-field"
                                                    name="employeeId"
                                                    value={addForm.employeeId}
                                                    onChange={e => setAddForm(f => ({ ...f, employeeId: e.target.value }))}
                                                />
                                            </div>
                                            <div className="professional-input-group">
                                                <label className="professional-input-label">Hire Date</label>
                                                <input
                                                    type="date"
                                                    className="professional-input-field"
                                                    name="hireDate"
                                                    value={addForm.hireDate}
                                                    onChange={e => setAddForm(f => ({ ...f, hireDate: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {error && <div className="professional-error-message">{error}</div>}
                                <div className="professional-modal-actions">
                                    <button type="button" className="professional-btn-secondary" onClick={() => setShowAddModal(false)} disabled={addLoading}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="professional-btn-primary" disabled={addLoading}>
                                        {addLoading ? (
                                            <>
                                                <Loading size="small" />
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

                <div className="team-controls">
                    <div className="team-search-wrapper">
                        <FiSearch className="team-search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search team members by name, email, position..."
                            className="team-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {hasNoResults ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '50vh',
                        width: '100%'
                    }}>
                        <NoDataState
                            message="No team members match your search"
                            description={`No team members found matching "${searchTerm}". Try adjusting your search terms.`}
                            icon="🔍"
                        />
                    </div>
                ) : (
                    <div className="team-table-container">
                        <div className="team-table-wrapper">
                            <table className="team-table">
                                <thead className="team-table-header">
                                    <tr>
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
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="team-table-row">
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
                                                <div className="team-actions-dropdown-container">
                                                    <button
                                                        className="team-actions-text-btn"
                                                        onClick={() => setEditingMember(prev => prev?.id === member.id ? null : member)}
                                                    >
                                                        Actions
                                                        <MdKeyboardArrowDown size={16} />
                                                    </button>
                                                    {editingMember?.id === member.id && (
                                                        <div className="team-actions-dropdown">
                                                            <button className="team-action-item" onClick={() => { handleEditClick(member); }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                                <span>Edit Details</span>
                                                            </button>
                                                            <button className="team-action-item" onClick={() => { handleStatusToggleClick(member); setEditingMember(null); }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                                                    <line x1="12" y1="2" x2="12" y2="12"></line>
                                                                </svg>
                                                                <span>{member.isActive ? 'Deactivate' : 'Activate'}</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <EditMemberModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                member={editingMember}
                onUpdate={handleUpdateEmployee}
                loading={editLoading}
                error={editError}
            />
        </div>
    );
};

export default TeamMembers;

