import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Teammembers.css';
import './PasswordResetModal.css';
import { FiSearch, FiMoreVertical, FiFilter, FiPlus, FiChevronDown, FiEye, FiEyeOff, FiCopy, FiRefreshCw } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../Service/Api';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Loading from '../states/Loading';
import Error500Page from '../states/ErrorPage';
import generateRandomPassword from '../utils/passwordUtils';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Password Reset Modal Component ---
const PasswordResetModal = ({ isOpen, onClose, member, onReset, loading, error }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            handleGeneratePassword();
        }
    }, [isOpen]);

    const handleGeneratePassword = async () => {
        setIsGenerating(true);
        try {
            const response = await api.get('/password/generate');
            if (response.data && response.data.success) {
                const pw = response.data.data.password || generateRandomPassword(10);
                setPassword(pw.length >= 6 ? pw : generateRandomPassword(10));
            } else {
                setPassword(generateRandomPassword(10));
            }
        } catch (error) {
            console.error('Failed to generate password from API:', error);
            setPassword(generateRandomPassword(10));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onReset(member.userId, password);
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(password);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: 'Password copied to clipboard.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    };

    if (!isOpen || !member) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Reset Password</h2>
                        <p className="form-info" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                            Reset password for <strong>{member.name}</strong>
                        </p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            {error && <div className="error-message">{error}</div>}
                            
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div className="password-input-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        placeholder="Enter new password"
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="password-copy-btn"
                                        onClick={handleCopyPassword}
                                        title="Copy password"
                                    >
                                        <FiCopy size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <button
                                type="button"
                                className="generate-password-btn"
                                onClick={handleGeneratePassword}
                                disabled={isGenerating}
                            >
                                <FiRefreshCw size={16} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
                                {isGenerating ? "Generating..." : "Generate New Password"}
                            </button>

                            <div className="password-info-note">
                                <p><strong>Note:</strong> The password will be updated immediately upon clicking Reset Password.</p>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div className="modal-footer">
                    <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading || !password}
                        onClick={handleSubmit}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Edit Member Modal Component ---
const EditMemberModal = ({ isOpen, onClose, member, onUpdate, loading, error }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: '',
        position: '',
        department: '',
        hireDate: ''
    });

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (value) => {
        setFormData(prev => ({ ...prev, phone: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        try {
            await onUpdate(member.id, updatePayload);
        } catch (err) {
            console.error('onUpdate error', err);
        }
    };

    return (
        <div className="professional-modal-overlay">
            <div className="professional-modal-container">
                <div className="professional-modal-header">
                    <div>
                        <h2 className="professional-modal-title">Edit {member.name}</h2>
                        <p className="professional-modal-subtitle">Update employee details and profile information.</p>
                    </div>
                    <button className="professional-modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="professional-modal-form">
                    <div className="professional-form-section">
                        <div className="professional-section-title">Personal Information</div>
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
                                <PhoneInput
                                    country={'ae'}
                                    value={formData.phone || ''}
                                    onChange={handlePhoneChange}
                                    inputClass="professional-input-field"
                                    containerClass="professional-phone-container"
                                    buttonClass="professional-phone-button"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="professional-form-section">
                        <div className="professional-section-title">Employment Information</div>
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

                    {error && <div className="professional-error-message">{error}</div>}
                    
                    <div className="professional-modal-actions">
                        <button type="button" className="professional-btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="professional-btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
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
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [activeActionDropdown, setActiveActionDropdown] = useState(null);
    const exportMenuRef = useRef(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);
    
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [passwordResetMember, setPasswordResetMember] = useState(null);
    const [passwordResetLoading, setPasswordResetLoading] = useState(false);
    const [passwordResetError, setPasswordResetError] = useState(null);

    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/employees');
            const data = res.data;

            const members = (data.data.employees || []).map(emp => ({
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
                isActive: emp.isActive === true,
                status: emp.isActive === true ? 'Active' : 'Inactive',
            }));
            
            setTeamMembers(members);
        } catch (err) {
            console.error("Failed to fetch team members:", err);
            setError("Failed to load team members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        setAddForm(prevForm => ({
            ...prevForm,
            password: generateRandomPassword()
        }));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.team-actions-dropdown-container')) {
                setActiveActionDropdown(null);
            }
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const resetAddForm = () => {
        setAddForm({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: generateRandomPassword(),
            employeeId: '',
            position: '',
            department: '',
            hireDate: '',
        });
        setError(null);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        resetAddForm();
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        setError(null);
        try {
             const userRes = await api.post('/auth/signup', {
                    firstName: addForm.firstName,
                    lastName: addForm.lastName,
                    email: addForm.email,
                    phone: addForm.phone,
                    password: addForm.password || "Employee@123",
                    role: 'employee'
                });
                
            const userId = userRes.data.data?.user?._id;
            
            await api.post('/employees', {
                userId,
                employeeId: addForm.employeeId,
                position: addForm.position,
                department: addForm.department,
                hireDate: addForm.hireDate,
            });

            await fetchEmployees();
            setShowAddModal(false);
            resetAddForm();
            Swal.fire({
                icon: 'success',
                title: 'Employee Added',
                text: 'Employee record created successfully',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Error adding employee:', err);
            setError(err.message || 'Failed to add employee');
        } finally {
            setAddLoading(false);
        }
    };

    const handleUpdateEmployee = async (memberId, updateData) => {
        setEditLoading(true);
        setEditError(null);
        try {
            await api.patch(`/employees/${memberId}`, updateData);
            await fetchEmployees();
            setShowEditModal(false);
            Swal.fire({
                icon: 'success',
                title: 'Updated',
                text: 'Employee details updated successfully',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Update failed:', err);
            setEditError('Failed to update employee');
        } finally {
            setEditLoading(false);
        }
    };

    const handleResetPassword = async (userId, newPassword) => {
        setPasswordResetLoading(true);
        setPasswordResetError(null);
        try {
            await api.post('/password/reset', { userId, newPassword });
            setShowPasswordResetModal(false);
            Swal.fire({
                icon: 'success',
                title: 'Password Reset',
                text: 'Password has been reset successfully',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Password reset failed:', err);
            setPasswordResetError('Failed to reset password');
        } finally {
            setPasswordResetLoading(false);
        }
    };

    const toggleMemberStatus = async (member) => {
        try {
            const newStatus = !member.isActive;
            await api.patch(`/employees/${member.id}`, { isActive: newStatus });
            
            setTeamMembers(prev => prev.map(m => 
                m.id === member.id ? { ...m, isActive: newStatus, status: newStatus ? 'Active' : 'Inactive' } : m
            ));
            
            Swal.fire({
                icon: 'success',
                title: newStatus ? 'Activated' : 'Deactivated',
                text: `Member has been ${newStatus ? 'activated' : 'deactivated'}.`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Status toggle failed:', err);
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const filteredMembers = teamMembers.filter((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Export functions
    const exportToCSV = () => {
        const csvData = filteredMembers.map(member => ({
            Name: member.name,
            Email: member.email,
            Phone: member.phone,
            Position: member.position,
            Department: member.department,
            'Employee ID': member.employeeId,
            Status: member.status,
            Rating: member.rating || 'N/A',
            Reviews: member.reviewCount || 0
        }));
        
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `team_members_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        setShowExportDropdown(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Team Members Report', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const tableData = filteredMembers.map(member => [
            member.name,
            member.email,
            member.phone,
            member.position,
            member.status,
            member.rating ? `${member.rating} (${member.reviewCount})` : 'N/A'
        ]);
        
        autoTable(doc, {
            head: [['Name', 'Email', 'Phone', 'Position', 'Status', 'Rating']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [99, 102, 241] }
        });
        
        doc.save(`team_members_${new Date().toISOString().split('T')[0]}.pdf`);
        setShowExportDropdown(false);
    };

    const exportToExcel = () => {
        const excelData = filteredMembers.map(member => ({
            Name: member.name,
            Email: member.email,
            Phone: member.phone,
            Position: member.position,
            Department: member.department,
            'Employee ID': member.employeeId,
            Status: member.status,
            Rating: member.rating || 'N/A',
            'Review Count': member.reviewCount || 0
        }));
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Team Members');
        XLSX.writeFile(wb, `team_members_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowExportDropdown(false);
    };

    if (loading && teamMembers.length === 0) return <Loading />;
    if (error && teamMembers.length === 0) return <Error500Page />;

    return (
        <div className="team-members-container">
            <div className="team-members-wrapper">
                {/* Header */}
                <div className="team-header">
                    <div className="team-title-section">
                        <h1 className="team-title">Team members</h1>
                        <span className="team-count">{teamMembers.length}</span>
                    </div>
                    <div className="team-header-actions">
                        <div className="team-export-wrapper" ref={exportMenuRef}>
                            <button 
                                className="team-export-btn"
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                disabled={filteredMembers.length === 0}
                            >
                                Export <FiChevronDown />
                            </button>
                            {showExportDropdown && filteredMembers.length > 0 && (
                                <div className="team-export-dropdown">
                                    <button className="team-export-item" onClick={exportToCSV}>
                                        Export as CSV
                                    </button>
                                    <button className="team-export-item" onClick={exportToPDF}>
                                        Export as PDF
                                    </button>
                                    <button className="team-export-item" onClick={exportToExcel}>
                                        Export as Excel
                                    </button>
                                </div>
                            )}
                        </div>
                        <button className="team-add-btn" onClick={() => setShowAddModal(true)}>
                            Add
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="team-controls">
                    <div className="team-search-wrapper">
                        <FiSearch className="team-search-icon" />
                        <input
                            type="text"
                            className="team-search-input"
                            placeholder="Search team members"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="team-table-container">
                    <table className="team-table">
                        <thead className="team-table-header">
                            <tr>
                                
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Rating</th>
                                <th className="team-th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} className="team-table-row">
                                       
                                        <td>
                                            <div className="team-member-info">
                                                <div className="team-avatar-placeholder">
                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                </div>
                                                <div className="team-member-details">
                                                    <div className="team-member-name">{member.name}</div>
                                                    <div className={`team-member-status ${member.isActive ? 'status-active' : 'status-inactive'}`}>
                                                        <div className="team-status-dot"></div>
                                                        {member.isActive ? 'Active' : 'Inactive'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="team-contact-info">
                                                <a href={`mailto:${member.email}`} className="team-email-link">{member.email}</a>
                                                <div className="team-phone">{member.phone}</div>
                                            </div>
                                        </td>
                                        <td>
                                            {member.rating ? (
                                                <div className="team-rating-info">
                                                    <span className="team-rating-score">{member.rating}</span>
                                                    <FaStar className="team-rating-star" />
                                                    <span className="team-review-count">{member.reviewCount} reviews</span>
                                                </div>
                                            ) : (
                                                <span className="team-review-count">No reviews yet</span>
                                            )}
                                        </td>
                                        <td className="team-td-actions">
                                            <div className="team-actions-dropdown-container">
                                                <button 
                                                    className="team-actions-btn"
                                                    onClick={() => setActiveActionDropdown(activeActionDropdown === member.id ? null : member.id)}
                                                >
                                                    Actions <FiChevronDown />
                                                </button>
                                                {activeActionDropdown === member.id && (
                                                    <div className="team-actions-dropdown">
                                                        <button 
                                                            className="team-action-item"
                                                            onClick={() => {
                                                                setEditingMember(member);
                                                                setShowEditModal(true);
                                                                setActiveActionDropdown(null);
                                                            }}
                                                        >
                                                            Edit Profile
                                                        </button>
                                                        <button 
                                                            className="team-action-item"
                                                            onClick={() => {
                                                                setPasswordResetMember(member);
                                                                setShowPasswordResetModal(true);
                                                                setActiveActionDropdown(null);
                                                            }}
                                                        >
                                                            Reset Password
                                                        </button>
                                                        <button 
                                                            className="team-action-item danger"
                                                            onClick={() => {
                                                                toggleMemberStatus(member);
                                                                setActiveActionDropdown(null);
                                                            }}
                                                        >
                                                            {member.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="team-empty-state">
                                        No team members found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <div className="professional-modal-overlay">
                    <div className="professional-modal-container">
                        <div className="professional-modal-header">
                            <div>
                                <h2 className="professional-modal-title">Add Team Member</h2>
                                <p className="professional-modal-subtitle">Create a new employee profile.</p>
                            </div>
                            <button className="professional-modal-close" onClick={handleCloseAddModal}>&times;</button>
                        </div>
                        <form onSubmit={handleAddEmployee} className="professional-modal-form">
                            <div className="professional-form-section">
                                <div className="professional-section-title">Personal Information</div>
                                <div className="professional-form-grid">
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">First Name</label>
                                        <input
                                            type="text"
                                            className="professional-input-field"
                                            value={addForm.firstName}
                                            onChange={e => setAddForm({...addForm, firstName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">Last Name</label>
                                        <input
                                            type="text"
                                            className="professional-input-field"
                                            value={addForm.lastName}
                                            onChange={e => setAddForm({...addForm, lastName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">Email</label>
                                        <input
                                            type="email"
                                            className="professional-input-field"
                                            value={addForm.email}
                                            onChange={e => setAddForm({...addForm, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">Phone</label>
                                        <PhoneInput
                                            country={'ae'}
                                            value={addForm.phone}
                                            onChange={phone => setAddForm({...addForm, phone})}
                                            inputClass="professional-input-field"
                                            containerClass="professional-phone-container"
                                            buttonClass="professional-phone-button"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="professional-form-section">
                                <div className="professional-section-title">Employment Details</div>
                                <div className="professional-form-grid">
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">Position</label>
                                        <select
                                            className="professional-select-field"
                                            value={addForm.position}
                                            onChange={e => setAddForm({...addForm, position: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Position</option>
                                            <option value="massage-therapist">Massage Therapist</option>
                                            <option value="esthetician">Esthetician</option>
                                            <option value="receptionist">Receptionist</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                    </div>
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">Department</label>
                                        <select
                                            className="professional-select-field"
                                            value={addForm.department}
                                            onChange={e => setAddForm({...addForm, department: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            <option value="spa-services">Spa Services</option>
                                            <option value="wellness">Wellness</option>
                                            <option value="administration">Administration</option>
                                        </select>
                                    </div>
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">Employee ID</label>
                                        <input
                                            type="text"
                                            className="professional-input-field"
                                            value={addForm.employeeId}
                                            onChange={e => setAddForm({...addForm, employeeId: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="professional-input-group">
                                        <label className="professional-input-label">Hire Date</label>
                                        <input
                                            type="date"
                                            className="professional-input-field"
                                            value={addForm.hireDate}
                                            onChange={e => setAddForm({...addForm, hireDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="professional-modal-actions">
                                <button type="button" className="professional-btn-secondary" onClick={handleCloseAddModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="professional-btn-primary" disabled={addLoading}>
                                    {addLoading ? 'Adding...' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <EditMemberModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                member={editingMember}
                onUpdate={handleUpdateEmployee}
                loading={editLoading}
                error={editError}
            />

            <PasswordResetModal
                isOpen={showPasswordResetModal}
                onClose={() => setShowPasswordResetModal(false)}
                member={passwordResetMember}
                onReset={handleResetPassword}
                loading={passwordResetLoading}
                error={passwordResetError}
            />
        </div>
    );
};

export default TeamMembers;
