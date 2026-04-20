import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, ChevronDown, Plus, Edit, Trash2, X, Eye } from "lucide-react";
import "./Clientlist.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import api from '@api'; // Assuming 'api' is correctly configured with your Base_url and token handling
import Loading from "@components/ui/Loading";
import Error500Page from "@components/ui/ErrorPage";
import NoDataState from "@components/ui/NoData";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ClientDetailsModal from "./ClientDetails/ClientDetailsModal";

// Helper function to get random color for avatars (Moved out for reusability)
const getRandomColor = () => {
  const colors = [
    "purple",
    "blue",
    "indigo",
    "green",
    "red",
    "yellow",
    "pink",
    "teal",
    "cyan",
    "orange",
  ]; // Added more colors
  return colors[Math.floor(Math.random() * colors.length)];
};

// Client Form Modal Component (Remains unchanged from your last provided code)
const ClientFormModal = ({ isOpen, onClose, client, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "other",
  });

  // Populate form when client prop changes (for editing)
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.mobile || "", // Use client.mobile for phone
        gender: client.gender || "other",
      });
    } else {
      // Reset form for adding new client
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "other",
      });
    }
  }, [client]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
  <div className="client-modal-overlay">
  <div className="client-modal-content">
    <div className="client-modal-header">
      <h2>{client ? "Edit Client" : "Add New Client"}</h2>
      <button onClick={onClose} className="client-modal-close">
        <X className="icon-small" />
      </button>
    </div>

    <form onSubmit={handleSubmit} className="client-modal-form">
      <div className="client-modal-row">
        <div className="client-modal-group">
          <label>First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
        </div>
        <div className="client-modal-group">
          <label>Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
        </div>
      </div>

      <div className="client-modal-group">
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />
      </div>

      <div className="client-modal-group">
        <label>Phone</label>
        <PhoneInput
          country={"ae"}
          value={formData.phone}
          onChange={(phone) => setFormData({ ...formData, phone })}
          inputProps={{
            name: "phone",
            required: false,
            autoFocus: false,
          }}
        />
      </div>

      <div className="client-modal-group">
        <label>Gender</label>
        <select
          value={formData.gender}
          onChange={(e) =>
            setFormData({ ...formData, gender: e.target.value })
          }
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="client-modal-actions">
        <button
          type="button"
          onClick={onClose}
          className="client-modal-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="client-modal-btn-primary"
          disabled={loading}
        >
          {loading ? <div className="btn-loader" /> : client ? "Update Client" : "Add Client"}
        </button>
      </div>
    </form>
  </div>
</div>

  );
};

// Client Directory Component (Full functionality restored and Add Client fixed)
const ClientDirectory = () => {
  // Store all clients for searching
  const [allClients, setAllClients] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // Default sort
  const [selectedClients, setSelectedClients] = useState([]); // For checkboxes
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false); // For new sort dropdown
  const [showModal, setShowModal] = useState(false); // For ClientFormModal
  const [editingClient, setEditingClient] = useState(null); // Client being edited
  const [formLoading, setFormLoading] = useState(false); // Loading state for modal form -- THIS IS THE KEY FIX
  const [salesData, setSalesData] = useState({}); // To store sales data separately
  const [showExportMenu, setShowExportMenu] = useState(false); // For export dropdown
  const exportMenuRef = useRef(null);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Client Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // --- Export Functions ---
  const exportToCSV = () => {
    const csvData = filteredAndSortedClients.map(client => ({
      'Client Name': client.name,
      'Mobile Number': client.mobile,
      'Email': client.email,
      'Sales': client.sales,
      'Gender': client.gender || 'Other',
      'Created At': client.createdAt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Clients List Report", 14, 15);
    
    // Add date and count
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);
    doc.text(`Total Clients: ${filteredAndSortedClients.length}`, 14, 32);

    // Prepare table data
    const tableColumn = ["Client Name", "Mobile Number", "Email", "Sales", "Created At"];
    const tableRows = filteredAndSortedClients.map(client => [
      client.name,
      client.mobile,
      client.email,
      client.sales,
      client.createdAt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 35 }, // Client Name
        1: { cellWidth: 30 }, // Mobile
        2: { cellWidth: 50 }, // Email
        3: { cellWidth: 25 }, // Sales
        4: { cellWidth: 25 }  // Created At
      }
    });

    doc.save(`clients_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const excelData = filteredAndSortedClients.map(client => ({
      'Client Name': client.name,
      'Mobile Number': client.mobile,
      'Email': client.email,
      'Sales': client.sales,
      'Gender': client.gender || 'Other',
      'Created At': client.createdAt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    ws['!cols'] = [
      { width: 20 }, // Client Name
      { width: 18 }, // Mobile Number
      { width: 30 }, // Email
      { width: 15 }, // Sales
      { width: 12 }, // Gender
      { width: 15 }  // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, `clients_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportClick = (e) => {
    e.stopPropagation();
    if (filteredAndSortedClients.length > 0) {
      setShowExportMenu(!showExportMenu);
    }
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // --- API Fetching Functions ---

  // Fetches sales data for all clients
  const fetchSalesData = useCallback(async (clientsList) => {
    try {
      const salesMap = {};
      // Create an array of promises for parallel fetching
      const salesPromises = clientsList.map(async (client) => {
        try {
          // Ensure client.id is available, if not, skip this client
          if (!client.id) {
            console.warn("Client ID missing for sales data fetch:", client);
            salesMap[client.id] = 0;
            return;
          }
          // Fetch bookings to calculate total sales (matching ClientOverviewTab logic)
          const res = await api.get(`/admin/clients/${client.id}/bookings?includeAll=true`);
          let bookings = res.data.data;
          
          // Handle potential response structures
          if (!Array.isArray(bookings)) {
            bookings = bookings?.bookings || [];
          }
          
          if (!Array.isArray(bookings)) {
            bookings = [];
          }

          const totalSpent = bookings
            .filter(booking => {
              const status = booking.status?.toLowerCase();
              return status === 'complete' || status === 'completed';
            })
            .reduce((total, booking) => {
              return total + (booking.finalAmount || booking.totalAmount || 0);
            }, 0);

          salesMap[client.id] = totalSpent;
        } catch (err) {
          console.error(`Failed to fetch sales for client ${client.id}:`, err);
          salesMap[client.id] = 0; // Default to 0 on error
        }
      });
      await Promise.all(salesPromises); // Wait for all sales fetches to complete
      setSalesData(salesMap);
    } catch (err) {
      console.error("Error fetching sales data:", err);
    }
  }, []);

  // Main function to fetch clients and then their sales data
  // Fetch clients for a specific page
  const fetchClients = useCallback(async (page = 1, limit = itemsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch paginated clients for current page
      const res = await api.get(`/admin/clients?limit=${limit}&page=${page}`);
      const clientsData = res.data.data.clients || [];
      const total = res.data.totalCount || 0;
      const pages = res.data.pagination?.totalPages || 1;

      // Transform the data to match the frontend format, and assign random colors
      const transformedClients = clientsData.map((client) => ({
        id: client._id,
        name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        mobile: client.phone || "-", // Ensure using 'phone' from API
        email: client.email || "-",
        reviews: "-", // This would typically require another API or be part of client data
        sales: `AED 0`, // Placeholder, updated by fetchSalesData
        createdAt: new Date(client.createdAt), // Keep as Date object for sorting
        initial: client.firstName
          ? client.firstName[0].toUpperCase()
          : client.lastName
          ? client.lastName[0].toUpperCase()
          : "?",
        color: getRandomColor(),
        isActive: client.isActive,
        gender: client.gender,
      }));

      setClients(transformedClients);
      setTotalCount(total);
      setTotalPages(pages);
      // After setting clients, fetch their sales data
      await fetchSalesData(transformedClients);

      // Fetch all clients for searching only once (if not already fetched)
      if (allClients.length === 0) {
        try {
          const allRes = await api.get(`/admin/clients?limit=10000`);
          const allClientsData = allRes.data.data.clients || [];
          const allTransformed = allClientsData.map((client) => ({
            id: client._id,
            name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
            firstName: client.firstName || "",
            lastName: client.lastName || "",
            mobile: client.phone || "-",
            email: client.email || "-",
            reviews: "-",
            sales: `AED 0`,
            createdAt: new Date(client.createdAt),
            initial: client.firstName
              ? client.firstName[0].toUpperCase()
              : client.lastName
              ? client.lastName[0].toUpperCase()
              : "?",
            color: getRandomColor(),
            isActive: client.isActive,
            gender: client.gender,
          }));
          setAllClients(allTransformed);
        } catch (err) {
          // Ignore error, fallback to paginated data
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load clients"
      );
    } finally {
      setLoading(false);
    }
  }, [fetchSalesData, itemsPerPage]);

  // --- CRUD Operations ---

  // Toast notification function
  const showNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000); // Hide after 3 seconds
  };

  const handleCreateClient = async (formData) => {
    setFormLoading(true); // Set form loading true here
    try {
      // API call to create client (assuming /auth/signup creates a user with role 'client')
      const response = await api.post("/auth/signup", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        role: "client",
        password: "defaultPassword123", // You might want to generate a secure password or prompt for it
      });

      setShowModal(false); // Close modal on success
      showNotification('Client created successfully!', 'success');
      fetchClients(); // Refresh the list
    } catch (err) {
      console.error(
        "Error creating client:",
        err.response?.data || err.message
      ); // Log error details
      showNotification(err.response?.data?.message || 'Failed to create client', 'error');
    } finally {
      setFormLoading(false); // Set form loading false here
    }
  };

  const handleUpdateClient = async (formData) => {
    setFormLoading(true); // Set form loading true here
    try {
      // Build update payload - only include non-empty fields
      const updatePayload = {};
      if (formData.firstName?.trim()) updatePayload.firstName = formData.firstName.trim();
      if (formData.lastName?.trim()) updatePayload.lastName = formData.lastName.trim();
      if (formData.email?.trim()) updatePayload.email = formData.email.trim();
      if (formData.phone?.trim()) updatePayload.phone = formData.phone.trim();
      if (formData.gender) updatePayload.gender = formData.gender;

      // API call to update client
      await api.patch(`/admin/clients/${editingClient.id}`, updatePayload);

      // Optimistically update the client in local state immediately
      const updatedClientData = {
        ...editingClient,
        firstName: formData.firstName?.trim() || editingClient.firstName,
        lastName: formData.lastName?.trim() || editingClient.lastName,
        name: `${formData.firstName?.trim() || editingClient.firstName || ''} ${formData.lastName?.trim() || editingClient.lastName || ''}`.trim(),
        email: formData.email?.trim() || editingClient.email,
        mobile: formData.phone?.trim() || editingClient.mobile,
        gender: formData.gender || editingClient.gender,
        initial: (formData.firstName?.trim() || editingClient.firstName)
          ? (formData.firstName?.trim() || editingClient.firstName)[0].toUpperCase()
          : (formData.lastName?.trim() || editingClient.lastName)
          ? (formData.lastName?.trim() || editingClient.lastName)[0].toUpperCase()
          : "?",
      };

      // Update in paginated clients list
      setClients((prev) =>
        prev.map((client) =>
          client.id === editingClient.id ? updatedClientData : client
        )
      );

      // Update in all clients list (for search)
      setAllClients((prev) =>
        prev.map((client) =>
          client.id === editingClient.id ? updatedClientData : client
        )
      );

      setShowModal(false);
      setEditingClient(null); // Clear editing state
      showNotification('Client updated successfully!', 'success');
      
      // Still fetch from backend to ensure data consistency (but UI updates immediately)
      fetchClients(currentPage, itemsPerPage);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update client', 'error');
    } finally {
      setFormLoading(false); // Set form loading false here
    }
  };

  const handleDeleteClient = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteModal(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      // Optimistically update UI first
      setClients((prev) => prev.filter((client) => client.id !== clientToDelete));
      setSelectedClients((prev) => prev.filter((id) => id !== clientToDelete)); // Remove from selected too

      // API call to delete client
      await api.delete(`/admin/clients/${clientToDelete}`);
      
      // Show success notification
      showNotification('Client deleted successfully!', 'success');
      
      // Close modal
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete client', 'error');
      fetchClients(); // Re-fetch to sync if optimistic update failed
      setShowDeleteModal(false);
      setClientToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setClientToDelete(null);
  };

  // --- Client Details Modal Handlers ---
  const openDetailsModal = (client) => {
    setSelectedClientForDetails(client.id);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedClientForDetails(null);
  };

  // --- Effect Hook for Initial Data Load ---
  // Track current page for API
  useEffect(() => {
    fetchClients(currentPage, itemsPerPage);
  }, [fetchClients, currentPage, itemsPerPage]);

  // --- Modal Open/Close Handlers ---
  const openEditModal = (client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingClient(null); // Ensure no client is being edited
    setShowModal(true);
  };

  // --- Client Selection Handlers ---
  const handleSelectClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (
      selectedClients.length === filteredAndSortedClients.length &&
      filteredAndSortedClients.length > 0
    ) {
      setSelectedClients([]); // Deselect all
    } else {
      setSelectedClients(filteredAndSortedClients.map((client) => client.id)); // Select all visible on current page
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // fetchClients(page, itemsPerPage); // useEffect will handle fetch
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = Math.max(currentPage - half, 1);
      let end = Math.min(start + maxVisiblePages - 1, totalPages);
      
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(end - maxVisiblePages + 1, 1);
      }
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  // --- Sorting Logic ---
  const sortOptions = useMemo(
    () => ({
      newest: "Newest",
      oldest: "Oldest",
      name_asc: "Name (A-Z)",
      name_desc: "Name (Z-A)",
      sales_desc: "Sales (High to Low)", // New sort option
      sales_asc: "Sales (Low to High)", // New sort option
    }),
    []
  );

  // Filter and sort clients in memory based on searchTerm and sortBy
  const filteredAndSortedClients = useMemo(() => {
  // Use allClients for searching, otherwise use paginated clients
  let currentClients = (searchTerm.trim() ? allClients : clients).map((client) => ({
      ...client,
      sales: `AED ${salesData[client.id]?.toLocaleString() || "0"}`,
    }));

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      currentClients = currentClients.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.mobile.includes(term) ||
          client.email?.toLowerCase().includes(term) ||
          (client.sales ? client.sales.toLowerCase().includes(term) : false)
      );
    }

    // Sort
    currentClients.sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === "oldest") {
        return a.createdAt.getTime() - b.createdAt.getTime();
      } else if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "sales_desc") {
        const salesA = parseFloat(String(a.sales).replace("AED ", "").replace(/,/g, "")) || 0;
        const salesB = parseFloat(String(b.sales).replace("AED ", "").replace(/,/g, "")) || 0;
        return salesB - salesA;
      } else if (sortBy === "sales_asc") {
        const salesA = parseFloat(String(a.sales).replace("AED ", "").replace(/,/g, "")) || 0;
        const salesB = parseFloat(String(b.sales).replace("AED ", "").replace(/,/g, "")) || 0;
        return salesA - salesB;
      }
      return 0;
    });

    return currentClients;
  }, [clients, salesData, searchTerm, sortBy]);

  // Move state updates out of render/memo to avoid infinite loops.
  // Remove local totalPages calculation, now using backend value

  // --- Conditional Rendering for Loading/Error States ---
  if (loading && clients.length === 0) {
    return (
      <div className="client-directory-container">
        <div className="client-directory-wrapper">
          <div className="loading-state-container">
            <Loading/>
            <p>Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <Error500Page/>;
  }

  return (
    <div className="client-directory-container">
      <div className="client-directory-wrapper">
        {/* Header */}
        <div className="directory-header">
          <div className="header-main">
            <div className="header-title-block">
              <h1 className="directory-title">
                Clients list
                <span className="directory-count">{totalCount}</span>
              </h1>
              <p className="directory-subtitle">
                View, add, edit and delete your client's details.
                <span style={{ marginLeft: 8, color: '#888', fontSize: '0.95em' }}>
                  (Page {currentPage} of {totalPages})
                </span>
              </p>
            </div>
            <div className="header-actions-block">
              {/* Export Dropdown */}
              <div className="export-wrapper" ref={exportMenuRef}>
                <button 
                  className="btn-export"
                  onClick={handleExportClick}
                  disabled={filteredAndSortedClients.length === 0}
                >
                  Export
                  <ChevronDown size={16} />
                </button>
                {showExportMenu && filteredAndSortedClients.length > 0 && (
                  <div className="export-dropdown">
                    <button className="export-item" onClick={exportToCSV}>
                      Export as CSV
                    </button>
                    <button className="export-item" onClick={exportToPDF}>
                      Export as PDF
                    </button>
                    <button className="export-item" onClick={exportToExcel}>
                      Export as Excel
                    </button>
                  </div>
                )}
              </div>
              
              <button onClick={openCreateModal} className="btn-add-client">
                <Plus className="icon-small" />
                <span className="btn-text">Add Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="directory-search-filters">
          <div className="search-input-box">
            <Search className="icon-search" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-search"
            />
          </div>

          {/* Sort Dropdown UI */}
          <div className="sort-dropdown">
            <button
              className="sort-toggle-button"
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            >
              Sort by: {sortOptions[sortBy]}
              <ChevronDown size={16} />
            </button>
            {isSortMenuOpen && (
              <div className="sort-dropdown-menu">
                {Object.entries(sortOptions).map(([key, value]) => (
                  <button
                    key={key}
                    className="sort-option"
                    onClick={() => {
                      setSortBy(key);
                      setIsSortMenuOpen(false);
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="client-table-container">
          {filteredAndSortedClients.length === 0 ? (
            <NoDataState
              message="No clients found"
              description={searchTerm ? `No clients found matching "${searchTerm}". Try adjusting your search terms.` : "There are no clients yet. Start by adding your first client."}
              icon={searchTerm ? "🔍" : "👥"}
            />
          ) : (
            <>
              {/* Table Info */}
              <div className="table-info">
                <div className="table-results-info">
                  Showing {clients.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} to {clients.length > 0 ? ((currentPage - 1) * itemsPerPage + clients.length) : 0} of {totalCount} clients
                </div>
                <div className="table-per-page">
                  <label>Show:</label>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="per-page-select"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per page</span>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Client Name</th>
                    <th>Mobile Number</th>
                    <th>Email</th>
                    <th>Sales</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedClients.map((client) => (
                    <tr key={client.id} onClick={() => openDetailsModal(client)} style={{ cursor: 'pointer' }}>
                        <td></td>
                        <td>
                        <div className="client-avatar-name">
                          <div className={`avatar-color avatar-${client.color}`}>
                            {client.initial}
                          </div>
                          <div className="client-meta">
                            <div className="client-full-name">{client.name}</div>
                            {/* Display phone here for smaller screens if needed by CSS responsive rules */}
                            <div className="client-secondary-phone">
                              {client.mobile}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{client.mobile}</td>
                      <td>{client.email}</td>
                      <td>{client.sales}</td>
                      <td>
                        {client.createdAt.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="table-col-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailsModal(client);
                            }}
                            className="btn-action btn-view"
                            title="View client details"
                          >
                            <Eye className="icon-small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination">
                    {/* Previous Button */}
                    <button 
                      className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    {/* Next Button */}
                    <button 
                      className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingClient(null); // Clear editing client on modal close
        }}
        client={editingClient}
        onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
        loading={formLoading}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className={`toast-notification ${toastType}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toastType === 'success' ? '✓' : '✕'}
            </span>
            <span className="toast-message">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="client-modal-overlay">
          <div className="client-modal-content" style={{ maxWidth: '450px' }}>
            <div className="client-modal-header">
              <h2>Confirm Delete</h2>
              <button onClick={cancelDelete} className="client-modal-close">
                <X className="icon-small" />
              </button>
            </div>
            <div className="delete-modal-body">
              <p>Are you sure you want to delete this client? This action cannot be undone.</p>
            </div>
            <div className="client-modal-actions">
              <button
                type="button"
                onClick={cancelDelete}
                className="client-modal-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteClient}
                className="client-modal-btn-primary"
                style={{ backgroundColor: '#ef4444' }}
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      <ClientDetailsModal 
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
        clientId={selectedClientForDetails}
        onEdit={(client) => {
          closeDetailsModal();
          openEditModal(client);
        }}
        onDelete={(clientId) => {
          closeDetailsModal();
          handleDeleteClient(clientId);
        }}
      />
    </div>
  );
};

export default ClientDirectory;
