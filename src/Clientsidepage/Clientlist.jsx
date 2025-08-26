import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, ChevronDown, Plus, Edit, Trash2, X } from "lucide-react";
import "./Clientlist.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import api from "../Service/Api"; // Assuming 'api' is correctly configured with your Base_url and token handling
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoDataState from "../states/NoData";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{client ? "Edit Client" : "Add New Client"}</h2>
          <button onClick={onClose} className="modal-close">
            <X className="icon-small" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              readOnly={!!client} // 🔹 Make read-only when editing
              style={
                client
                  ? { backgroundColor: "#f5f5f5", cursor: "not-allowed" }
                  : {}
              }
            />
          </div>

          <div className="form-group">
            <label>Phone *</label>
            <PhoneInput
              country={"ae"} // default country (example: UAE)
              value={formData.phone}
              onChange={(phone) => setFormData({ ...formData, phone })}
              inputProps={{
                name: "phone",
                required: true,
                autoFocus: false,
              }}
            />
          </div>

          <div className="form-group">
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
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <Loading/>
              ) : client ? "Update Client" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Client Directory Component (Full functionality restored and Add Client fixed)
const ClientDirectory = () => {
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
          const res = await api.get(`/admin/clients/${client.id}/stats`);
          const totalSpent = res.data.data.totalSpent || 0;
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
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/clients");
      const clientsData = res.data.data.clients || [];

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
      // After setting clients, fetch their sales data
      await fetchSalesData(transformedClients);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load clients"
      );
    } finally {
      setLoading(false);
    }
  }, [fetchSalesData]); // Dependency on fetchSalesData

  // --- CRUD Operations ---

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

      console.log("Client created successfully:", response.data); // Log success

      setShowModal(false); // Close modal on success
      fetchClients(); // Refresh the list
    } catch (err) {
      console.error(
        "Error creating client:",
        err.response?.data || err.message
      ); // Log error details
      alert(err.response?.data?.message || "Failed to create client");
    } finally {
      setFormLoading(false); // Set form loading false here
    }
  };

  const handleUpdateClient = async (formData) => {
    setFormLoading(true); // Set form loading true here
    try {
      // API call to update client
      await api.patch(`/admin/clients/${editingClient.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
      });

      setShowModal(false);
      setEditingClient(null); // Clear editing state
      fetchClients(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update client");
    } finally {
      setFormLoading(false); // Set form loading false here
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    try {
      // Optimistically update UI first
      setClients((prev) => prev.filter((client) => client.id !== clientId));
      setSelectedClients((prev) => prev.filter((id) => id !== clientId)); // Remove from selected too

      // API call to delete client
      await api.delete(`/admin/clients/${clientId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete client");
      fetchClients(); // Re-fetch to sync if optimistic update failed
    }
  };

  // --- Effect Hook for Initial Data Load ---
  useEffect(() => {
    fetchClients();
  }, [fetchClients]); // fetchClients is a dependency because it's wrapped in useCallback

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
      setSelectedClients(filteredAndSortedClients.map((client) => client.id)); // Select all visible
    }
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

  const filteredAndSortedClients = useMemo(() => {
    let currentClients = [...clients]; // Create a mutable copy

    // 1. Filter
    currentClients = currentClients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.mobile.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Ensure client.sales is a string before calling toLowerCase
        (client.sales
          ? client.sales.toLowerCase().includes(searchTerm.toLowerCase())
          : false)
    );

    // 2. Sort
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
        // Parse sales string (e.g., "AED 1,250" -> 1250)
        const salesA =
          parseFloat(String(a.sales).replace("AED ", "").replace(/,/g, "")) ||
          0;
        const salesB =
          parseFloat(String(b.sales).replace("AED ", "").replace(/,/g, "")) ||
          0;
        return salesB - salesA;
      } else if (sortBy === "sales_asc") {
        const salesA =
          parseFloat(String(a.sales).replace("AED ", "").replace(/,/g, "")) ||
          0;
        const salesB =
          parseFloat(String(b.sales).replace("AED ", "").replace(/,/g, "")) ||
          0;
        return salesA - salesB;
      }
      return 0; // Default no-sort
    });

    // 3. Update 'sales' display value based on fetched salesData
    // Map over currentClients to ensure sales data is always fresh based on salesData state
    return currentClients.map((client) => ({
      ...client,
      sales: `AED ${salesData[client.id]?.toLocaleString() || "0"}`, // Format sales for display
    }));
  }, [clients, searchTerm, sortBy, salesData]); // Dependencies for useMemo

  // --- Conditional Rendering for Loading/Error States ---
  if (loading) {
    return <Loading/>;
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
                <span className="directory-count">{clients.length}</span>
              </h1>
              <p className="directory-subtitle">
                View, add, edit and delete your client's details.
                {/* <span className="learn-more">Learn more</span> */}
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
                  <tr key={client.id}>
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
                          onClick={() => openEditModal(client)}
                          className="btn-action btn-edit"
                          title="Edit client"
                        >
                          <Edit className="icon-small" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="btn-action btn-delete"
                          title="Delete client"
                        >
                          <Trash2 className="icon-small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
};

export default ClientDirectory;
