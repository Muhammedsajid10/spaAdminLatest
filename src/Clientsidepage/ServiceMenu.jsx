import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, ArrowDown, Plus, Edit, Trash2, MoreVertical, AlertTriangle, Info } from "lucide-react";
import { Button, TextField, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Menu, /* Add Menu from MUI */ TextareaAutosize } from "@mui/material"; // Import Menu
import api from "../Service/Api";
import "./ServiceMenu.css";
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoData from "../states/NoData";

// Add export libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ServiceMenu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration: "",
    price: "",
    discountPrice: ""
  });
  const [success, setSuccess] = useState(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // --- NEW STATE FOR ADD DROPDOWN ---
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null); // Anchor for the Add menu
  const openAddMenu = Boolean(addMenuAnchorEl); // Boolean for Menu open prop

  const [newCategoryData, setNewCategoryData] = useState({
    name: "",
    displayName: ""
  });

  // --- NEW: Export dropdown state ---
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);

  // Add new state for enhanced deletion dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    category: null,
    hasServices: false,
    serviceCount: 0,
    loading: false
  });

  // Fetch all services
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/services');

      if (response.data.success) {
        const services = response.data.data.services || [];
        setServices(services);
        setAllServices(services);
      } else {
        throw new Error(response.data.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('❌ Failed to fetch services:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from the API for dropdown
  const fetchAvailableCategories = async () => {
    try {
      const response = await api.get('/services/categories');
      if (response.data.success) {
        setAvailableCategories(response.data.data.categories || []);
      }
    } catch (err) {
      console.error('❌ Failed to fetch available categories:', err);
    }
  };

  // Fetch categories for sidebar with counts
  const fetchCategories = async () => {
    try {
      const response = await api.get('/services/categories');

      if (response.data.success) {
        const categoryList = response.data.data.categories || [];

        const categoriesWithCounts = categoryList.map(category => {
          const count = allServices.filter(service => {
            const serviceCategoryId = service.category?._id;
            const serviceCategoryName = service.category?.displayName || service.category?.name;

            return serviceCategoryId === category._id ||
                   serviceCategoryName === category.displayName ||
                   serviceCategoryName === category.name;
          }).length;

          return {
            _id: category._id,
            name: category.displayName || category.name,
            count: count
          };
        });

        const total = allServices.length;
        const finalCategories = [{ name: "All categories", count: total }, ...categoriesWithCounts];
        setCategories(finalCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([{ name: "All categories", count: allServices.length }]);
    }
  };

  // Search services
  const searchServices = async (query) => {
    if (!query.trim()) {
      setServices(allServices);
      if (selectedCategory !== "All categories") {
        setServices(allServices.filter(service => {
          const serviceCategoryName = service.category?.displayName || service.category?.name;
          return serviceCategoryName === selectedCategory;
        }));
      }
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);

      const response = await api.get(`/services/search?q=${encodeURIComponent(query)}`);

      if (response.data.success) {
        setServices(response.data.data.services || []);
      } else {
        throw new Error(response.data.message || 'Failed to search services');
      }
    } catch (err) {
      console.error('❌ Failed to search services:', err);
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Create new service
  const createService = async (serviceData) => {
    try {
      const response = await api.post('/services', serviceData);

      if (response.data.success) {
        setShowAddModal(false);
        setFormData({ name: "", description: "", category: "", duration: "", price: "", discountPrice: "" });
        await fetchServices();
        await fetchCategories(); // Refresh categories
        setSuccess('Service created successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to create service');
      }
    } catch (err) {
      console.error('❌ Failed to create service:', err);
      
      // Enhanced error handling for service creation
      let userMessage = 'Failed to create service.';
      
      if (err.response) {
        switch (err.response.status) {
          case 400:
            if (err.response.data?.message) {
              if (err.response.data.message.includes('validation')) {
                userMessage = 'Please fill in all required fields with valid information.';
              } else if (err.response.data.message.includes('duplicate') || err.response.data.message.includes('already exists')) {
                userMessage = 'A service with this name already exists. Please choose a different name.';
              } else {
                userMessage = err.response.data.message;
              }
            } else {
              userMessage = 'Invalid service information. Please check your input and try again.';
            }
            break;
            
          case 401:
            userMessage = 'You are not authorized to create services. Please log in and try again.';
            break;
            
          case 403:
            userMessage = 'You do not have permission to create services. Please contact an administrator.';
            break;
            
          case 422:
            if (err.response.data?.message) {
              userMessage = err.response.data.message;
            } else {
              userMessage = 'The service information contains invalid data. Please review all fields.';
            }
            break;
            
          case 500:
            userMessage = 'A server error occurred while creating the service. Please try again in a few moments.';
            break;
            
          default:
            if (err.response.data?.message) {
              let cleanMessage = err.response.data.message
                .replace(/error code:?\s*\d+/gi, '')
                .replace(/status:?\s*\d+/gi, '')
                .replace(/\[.*?\]/g, '')
                .trim();
              userMessage = cleanMessage || 'An unexpected error occurred while creating the service.';
            } else {
              userMessage = 'An unexpected error occurred while creating the service. Please try again.';
            }
        }
      } else if (err.request) {
        userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.message) {
        let cleanMessage = err.message
          .replace(/error code:?\s*\d+/gi, '')
          .replace(/status:?\s*\d+/gi, '')
          .replace(/\[.*?\]/g, '')
          .replace(/axios/gi, '')
          .trim();
        userMessage = cleanMessage || 'An error occurred while creating the service.';
      }
      
      setError(userMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Update service with enhanced error handling
  const updateService = async (serviceId, serviceData) => {
    try {
      const response = await api.patch(`/services/${serviceId}`, serviceData);

      if (response.data.success) {
        setShowEditModal(false);
        setSelectedService(null);
        setFormData({ name: "", description: "", category: "", duration: "", price: "", discountPrice: "" });
        await fetchServices();
        await fetchCategories(); // Refresh categories in case category changed
        setSuccess('Service updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update service');
      }
    } catch (err) {
      console.error('❌ Failed to update service:', err);
      
      // Enhanced error handling with user-friendly messages
      let userMessage = 'Failed to update service.';
      
      if (err.response) {
        // Handle different HTTP status codes
        switch (err.response.status) {
          case 400:
            if (err.response.data?.message) {
              // Handle validation errors
              if (err.response.data.message.includes('validation')) {
                userMessage = 'Please check all required fields and ensure they contain valid information.';
              } else if (err.response.data.message.includes('duplicate') || err.response.data.message.includes('already exists')) {
                userMessage = 'A service with this name already exists. Please choose a different name.';
              } else {
                userMessage = err.response.data.message;
              }
            } else {
              userMessage = 'Invalid service information. Please check your input and try again.';
            }
            break;
            
          case 401:
            userMessage = 'You are not authorized to update this service. Please log in and try again.';
            break;
            
          case 403:
            userMessage = 'You do not have permission to update services. Please contact an administrator.';
            break;
            
          case 404:
            userMessage = 'The service you are trying to update no longer exists. It may have been deleted by another user.';
            // Refresh the services list to reflect current state
            await fetchServices();
            break;
            
          case 409:
            userMessage = 'This service cannot be updated due to a conflict. Another user may have modified it recently. Please refresh and try again.';
            await fetchServices();
            break;
            
          case 422:
            if (err.response.data?.message) {
              userMessage = err.response.data.message;
            } else {
              userMessage = 'The service information contains invalid data. Please review all fields.';
            }
            break;
            
          case 500:
            userMessage = 'A server error occurred while updating the service. Please try again in a few moments.';
            break;
            
          case 503:
            userMessage = 'The service is temporarily unavailable. Please try again later.';
            break;
            
          default:
            // For any other HTTP errors
            if (err.response.data?.message) {
              // Remove technical details and server codes from user message
              let cleanMessage = err.response.data.message
                .replace(/error code:?\s*\d+/gi, '')
                .replace(/status:?\s*\d+/gi, '')
                .replace(/\[.*?\]/g, '')
                .trim();
              userMessage = cleanMessage || 'An unexpected error occurred while updating the service.';
            } else {
              userMessage = 'An unexpected error occurred while updating the service. Please try again.';
            }
        }
      } else if (err.request) {
        // Network error
        userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.message) {
        // Clean up technical error messages
        let cleanMessage = err.message
          .replace(/error code:?\s*\d+/gi, '')
          .replace(/status:?\s*\d+/gi, '')
          .replace(/\[.*?\]/g, '')
          .replace(/axios/gi, '')
          .trim();
        userMessage = cleanMessage || 'An error occurred while updating the service.';
      }
      
      setError(userMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Create new category
  const createCategory = async (categoryData) => {
    try {
    const response = await api.post('/categories/categories', categoryData);

      if (response.data.success) {
        setShowAddCategoryModal(false);
        setNewCategoryData({ name: "", displayName: "" });
        await fetchAvailableCategories();
        await fetchCategories();
        setSuccess('Category created successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to create category');
      }
    } catch (err) {
      console.error('❌ Failed to create category:', err);
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Delete category
  const deleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/categories/categories/${categoryId}`);

      if (response.data.success) {
        await fetchServices();
        await fetchAvailableCategories();
        await fetchCategories();
        setSuccess(response.data.message || 'Category deleted successfully');
        setTimeout(() => setSuccess(null), 3000);

        if (selectedCategory === categoryName) {
          setSelectedCategory("All categories");
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('❌ Failed to delete category:', err);
      let userMessage = 'Failed to delete category.';
      if (err.response?.data?.message) {
        if (err.response.data.message.includes('Please reassign or delete the services first')) {
          userMessage = `Cannot delete category "${categoryName}" because it still has services assigned. Please reassign or delete those services first.`;
        } else {
          userMessage = err.response.data.message;
        }
      } else if (err.message) {
        userMessage = err.message;
      }
      setError(userMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Delete service
  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const response = await api.delete(`/services/${serviceId}`);

      if (response.data.success) {
        await fetchServices();
        await fetchCategories(); // Refresh categories in case counts changed
        setSuccess(response.data.message || 'Service deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to delete service');
      }
    } catch (err) {
      console.error('❌ Failed to delete service:', err);
      
      let userMessage = 'Failed to delete service.';
      
      if (err.response) {
        switch (err.response.status) {
          case 401:
            userMessage = 'You are not authorized to delete this service. Please log in and try again.';
            break;
            
          case 403:
            userMessage = 'You do not have permission to delete services. Please contact an administrator.';
            break;
            
          case 404:
            userMessage = 'The service you are trying to delete no longer exists. It may have already been deleted.';
            await fetchServices(); // Refresh to show current state
            break;
            
          case 409:
            userMessage = 'This service cannot be deleted because it is currently being used in bookings or appointments. Please contact support for assistance.';
            break;
            
          case 500:
            userMessage = 'A server error occurred while deleting the service. Please try again in a few moments.';
            break;
            
          default:
            if (err.response.data?.message) {
              let cleanMessage = err.response.data.message
                .replace(/error code:?\s*\d+/gi, '')
                .replace(/status:?\s*\d+/gi, '')
                .replace(/\[.*?\]/g, '')
                .trim();
              userMessage = cleanMessage || 'An unexpected error occurred while deleting the service.';
            } else {
              userMessage = 'An unexpected error occurred while deleting the service. Please try again.';
            }
        }
      } else if (err.request) {
        userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.message) {
        let cleanMessage = err.message
          .replace(/error code:?\s*\d+/gi, '')
          .replace(/status:?\s*\d+/gi, '')
          .replace(/\[.*?\]/g, '')
          .replace(/axios/gi, '')
          .trim();
        userMessage = cleanMessage || 'An error occurred while deleting the service.';
      }
      
      setError(userMessage);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Handle form submission (for add/edit service)
  const handleSubmit = (e) => {
    e.preventDefault();
    const serviceData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      ...(formData.discountPrice && { discountPrice: parseFloat(formData.discountPrice) })
    };

    if (selectedService) {
      updateService(selectedService._id, serviceData);
    } else {
      createService(serviceData);
    }
  };

  // Handle category creation form submission
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    createCategory(newCategoryData);
  };

  // Handle edit service modal open
  const handleEditService = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category?._id || service.category,
      duration: service.duration.toString(),
      price: service.price.toString(),
      discountPrice: service.discountPrice ? service.discountPrice.toString() : ""
    });
    setShowEditModal(true);
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchServices(searchTerm);
      } else {
        setServices(allServices);
        if (selectedCategory !== "All categories") {
          setServices(allServices.filter(service => {
            const serviceCategoryName = service.category?.displayName || service.category?.name;
            return serviceCategoryName === selectedCategory;
          }));
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, allServices, selectedCategory]);

  // Handle category change - filter in memory
  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  // Initial data fetch on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchServices();
      fetchAvailableCategories();
    };
    loadData();
  }, []);

  // Update categories for sidebar once allServices is populated/changes
  useEffect(() => {
    if (allServices.length > 0 || categories.length === 0) {
      fetchCategories();
    }
  }, [allServices]);

  // Filter services based on search term and selected category using useMemo for efficiency
  const filteredAndCategorizedServices = useMemo(() => {
    let currentServices = [...services];

    if (selectedCategory !== "All categories") {
      currentServices = currentServices.filter(service => {
        const categoryMatch = service.category?._id === (categories.find(c => c.name === selectedCategory)?._id);
        const displayNameMatch = (service.category?.displayName || service.category?.name) === selectedCategory;
        return categoryMatch || displayNameMatch;
      });
    }

    currentServices.sort((a, b) => a.name.localeCompare(b.name));

    const grouped = currentServices.reduce((acc, service) => {
      const categoryName = service.category?.displayName || service.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {});

    return grouped;
  }, [selectedCategory, services, categories]); // Added categories as dependency for grouping

  // Format duration from minutes to readable format
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  // Format price
  const formatPrice = (price) => {
    return `AED ${price.toFixed(2)}`;
  };

  // --- HANDLERS FOR ADD DROPDOWN ---
  const handleAddMenuClick = (event) => {
    setAddMenuAnchorEl(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  const handleAddServiceFromMenu = () => {
    setShowAddModal(true);
    handleAddMenuClose(); // Close dropdown
  };

  const handleAddCategoryFromMenu = () => {
    setShowAddCategoryModal(true);
    handleAddMenuClose(); // Close dropdown
  };
  // --- END HANDLERS FOR ADD DROPDOWN ---

  // --- EXPORT ACTIONS ---
  const downloadCSV = () => {
    try {
      const dataSrc = services.length ? services : allServices;
      const { headers, rows } = buildExportRows(dataSrc);
      const csvLines = [
        headers.join(","),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\r\n");

      const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `services_export_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed", err);
    } finally {
      setExportAnchorEl(null);
    }
  };

  const downloadExcel = () => {
    try {
      const dataSrc = services.length ? services : allServices;
      const { headers, rows } = buildExportRows(dataSrc);
      const tsv = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\r\n");
      const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `services_export_${new Date().toISOString().slice(0,10)}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export failed", err);
    } finally {
      setExportAnchorEl(null);
    }
  };

  const downloadPDF = () => {
    try {
      const dataSrc = services.length ? services : allServices;
      const { headers, rows } = buildExportRows(dataSrc);
      const doc = new jsPDF('l', 'pt', 'A4');
      doc.setFontSize(14);
      doc.text(`Services export — ${new Date().toLocaleDateString()}`, 40, 36);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 56,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [40, 116, 240], textColor: 255 },
        margin: { left: 20, right: 20 },
        didDrawPage: (data) => {
          const page = doc.internal.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(`Allora Spa — Page ${page}`, doc.internal.pageSize.width - 120, doc.internal.pageSize.height - 10);
        }
      });

      doc.save(`services_export_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setExportAnchorEl(null);
    }
  };

  const handleExportClick = (e) => setExportAnchorEl(e.currentTarget);
  const handleExportClose = () => setExportAnchorEl(null);

  // --- BUILD EXPORT ROWS ---
  const buildExportRows = (servicesList) => {
    const headers = ["Name", "Category", "Duration", "Price (AED)", "Discount Price (AED)", "Description"];
    const rows = servicesList.map(svc => [
      svc.name || "",
      (svc.category?.displayName || svc.category?.name) || (typeof svc.category === 'string' ? svc.category : ""),
      formatDuration(svc.duration || 0),
      (typeof svc.price === 'number') ? svc.price.toFixed(2) : (svc.price ? String(svc.price) : ""),
      (typeof svc.discountPrice === 'number') ? svc.discountPrice.toFixed(2) : (svc.discountPrice ? String(svc.discountPrice) : ""),
      svc.description ? svc.description.replace(/[\r\n]+/g, " ") : ""
    ]);
    return { headers, rows };
  };

  // Enhanced delete category function with better error handling
  const initiateDeleteCategory = async (categoryId, categoryName) => {
    try {
      // First, check if category has services
      const servicesInCategory = allServices.filter(service => {
        const serviceCategoryId = service.category?._id;
        const serviceCategoryName = service.category?.displayName || service.category?.name;
        return serviceCategoryId === categoryId || serviceCategoryName === categoryName;
      });

      setDeleteDialog({
        open: true,
        category: { id: categoryId, name: categoryName },
        hasServices: servicesInCategory.length > 0,
        serviceCount: servicesInCategory.length,
        loading: false
      });
    } catch (err) {
      console.error('Error checking category services:', err);
      setError('Unable to verify category status. Please try again.');
      setTimeout(() => setError(null), 4000);
    }
  };

  // Confirmed delete category
  const confirmDeleteCategory = async (force = false) => {
    const { category } = deleteDialog;
    
    if (!category) return;

    setDeleteDialog(prev => ({ ...prev, loading: true }));

    try {
      const response = await api.delete(`/categories/categories/${category.id}${force ? '?force=true' : ''}`);

      if (response.data.success) {
        await fetchServices();
        await fetchAvailableCategories();
        await fetchCategories();
        
        setDeleteDialog({ open: false, category: null, hasServices: false, serviceCount: 0, loading: false });
        setSuccess(response.data.message || 'Category deleted successfully');
        setTimeout(() => setSuccess(null), 3000);

        if (selectedCategory === category.name) {
          setSelectedCategory("All categories");
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('❌ Failed to delete category:', err);
      
      let userMessage = 'Failed to delete category.';
      if (err.response?.status === 409) {
        userMessage = `Cannot delete "${category.name}" as it contains ${deleteDialog.serviceCount} service${deleteDialog.serviceCount !== 1 ? 's' : ''}. Please reassign or delete these services first, or use force delete.`;
      } else if (err.response?.data?.message) {
        userMessage = err.response.data.message;
      } else if (err.message) {
        userMessage = err.message;
      }
      
      setError(userMessage);
      setTimeout(() => setError(null), 5000);
      
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Close delete dialog
  const handleDeleteDialogClose = () => {
    if (!deleteDialog.loading) {
      setDeleteDialog({ open: false, category: null, hasServices: false, serviceCount: 0, loading: false });
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  // Show full page error for network / server errors
  if (error) {
    return <Error500Page message={error} />;
  }
  
  return (
    <div className="service-menu-container">
      {/* Header */}
      <div className="service-menu__header">
        <div className="service-menu__header-content">
          <div className="service-menu__title-section">
            <h1 className="service-menu__title">Service Menu</h1>
            <p className="service-menu__subtitle">
              View and manage the services offered by your business.{" "}
            </p>
          </div>
          <div className="service-menu__header-actions">
            {/* Add button (existing) */}
            <Button
              className="  mem-export-bbtn service-menu__btn service-menu__btn--primary service-menu__btn--dropdown"
              aria-controls={openAddMenu ? 'add-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openAddMenu ? 'true' : undefined}
              onClick={handleAddMenuClick}
              style={{width:"80px"}}
            
            >
              Add
            </Button>
            <Menu
              id="add-menu"
              anchorEl={addMenuAnchorEl}
              open={openAddMenu}
              onClose={handleAddMenuClose}
              MenuListProps={{ 'aria-labelledby': 'add-button' }}
              className="service-menu__add-menu"
            >
              <MenuItem onClick={handleAddServiceFromMenu}>
                <Plus size={16} style={{marginRight: '8px'}} /> Add Service
              </MenuItem>
              <MenuItem onClick={handleAddCategoryFromMenu}>
                <Plus size={16} style={{marginRight: '8px'}} /> Add Category
              </MenuItem>
            </Menu>

            {/* --- NEW: Export button with dropdown --- */}
            <Button
            style={{background:"black",color:"white"}}
              className="mem-export-bbtn service-menu__btn service-menu__btn--secondary service-menu__export-btn"
              aria-controls={openExportMenu ? 'export-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openExportMenu ? 'true' : undefined}
              onClick={handleExportClick}
              // endIcon={<ArrowDown size={14} />}
            >
              Export
            </Button>
            <Menu
              id="export-menu"
              anchorEl={exportAnchorEl}
              open={openExportMenu}
              onClose={handleExportClose}
              MenuListProps={{ 'aria-labelledby': 'export-button' }}
              className="service-menu__export-menu"
            >
              <MenuItem onClick={downloadCSV}>CSV</MenuItem>
              <MenuItem onClick={downloadExcel}>Excel</MenuItem>
              <MenuItem onClick={downloadPDF}>PDF</MenuItem>
            </Menu>
            {/* --- END Export --- */}

          </div>
        </div>
      </div>

      {/* Only show inline alerts for non-fatal success messages */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} className="service-menu__alert service-menu__alert--success">
          {success}
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="service-menu__controls">
        <div className="service-menu__search-section">
          <div className="service-menu__search-wrapper">
            <Search className="service-menu__search-icon" size={20} />
            <input
              type="text"
              className="service-menu__search-input"
              placeholder="Search service name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchLoading && <CircularProgress size={16} className="service-menu__search-loading" />}
          </div>
        </div>
        <div className="service-menu__filter-actions">
          {/* <Button
            className="service-menu__btn service-menu__btn--secondary"
            onClick={() => null}
            startIcon={<Filter size={16} />}
          >
            Filters
          </Button> */}
          {/* <Button
            className="service-menu__btn service-menu__btn--secondary"
            onClick={() =>null}
            startIcon={<ArrowDown size={16} />}
          >
            Manage order
          </Button> */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="service-menu__content">
        {/* Categories Sidebar */}
        <div className="service-menu__sidebar">
          <h3 className="service-menu__sidebar-title">Categories</h3>
          <div className="service-menu__categories">
            {categories.map((category) => (
              <div
                key={category.name}
                className={`service-menu__category-wrapper ${selectedCategory === category.name
                    ? "service-menu__category-wrapper--active"
                    : ""
                  }`}
              >
                <button
                  type="button"
                  className={`service-menu__category ${selectedCategory === category.name
                      ? "service-menu__category--active"
                      : ""
                    }`}
                  onClick={() => handleCategoryChange(category.name)}
                >
                  <span className="service-menu__category-name">
                    {category.name}
                  </span>
                  <span className="service-menu__category-count">
                    {category.count}
                  </span>
                </button>
                {category.name !== "All categories" && (
                  <button
                    className="service-menu__category-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateDeleteCategory(category._id, category.name);
                    }}
                    title={`Delete ${category.name} category`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services List (Grouped by Category) */}
        <div className="service-menu__services-list">
          {Object.keys(filteredAndCategorizedServices).length > 0 ? (
            Object.keys(filteredAndCategorizedServices).map(categoryName => (
              <div key={categoryName} className="service-menu__category-group">
                <div className="service-menu__category-group-header">
                  <h2 className="service-menu__category-group-title">{categoryName}</h2>
                  {/* <Button
                    className="service-menu__btn service-menu__btn--secondary service-menu__btn--dropdown service-menu__category-group-actions"
                    onClick={() => null}
                    endIcon={<ArrowDown size={16} />}
                  >
                    Actions
                  </Button> */}
                 </div>
                {filteredAndCategorizedServices[categoryName].map((service) => (
                  <div key={service._id} className="service-menu__service-card">
                    <div className="service-menu__service-card-main-info">
                      <h3 className="service-menu__service-card-name">{service.name}</h3>
                      <button
                        className="service-menu__action-icon-btn service-menu__service-card-more-options"
                        onClick={() => handleEditService(service)} // Link to Edit for now
                        title="More options"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </div>
                    <p className="service-menu__service-card-description">
                      {service.description}
                    </p>

                    <div className="service-menu__service-options-list">
                      {/* Base Service Option */}
                      <div className="service-menu__service-option-item">
                        <div className="service-menu__option-details">
                          <span className="service-menu__option-name">
                            {service.name}
                          </span>
                          <span className="service-menu__option-duration">
                            {formatDuration(service.duration)}
                          </span>
                        </div>
                        <span className="service-menu__option-price">
                          {formatPrice(service.price)}
                        </span>
                      </div>

                      {/* Simulated Discounted Service Option (as a variant) */}
                      {service.discountPrice && service.discountPrice < service.price && (
                        <div className="service-menu__service-option-item">
                          <div className="service-menu__option-details">
                            <span className="service-menu__option-name service-menu__option-name--discount">
                              {service.name} (Discounted)
                            </span>
                            <span className="service-menu__option-duration">
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                          <span className="service-menu__option-price service-menu__option-price--discount">
                            {formatPrice(service.discountPrice)}
                            <span className="service-menu__original-price">
                              {formatPrice(service.price)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="service-menu__no-results">
              <p>No services found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Service</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit} className="service-menu__form">
            <TextField fullWidth label="Service Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required margin="normal" variant="outlined" className="service-menu__form-input" />
            <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required margin="normal" multiline rows={3} variant="outlined" className="service-menu__form-input" />
            <FormControl fullWidth margin="normal" variant="outlined" className="service-menu__form-control">
              <InputLabel>Category</InputLabel>
              <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} label="Category" required>
                {availableCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>{category.displayName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Duration (minutes)" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required margin="normal" inputProps={{ min: 15, max: 480}} variant="outlined" className="service-menu__form-input" />
            <TextField fullWidth label="Price (AED)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required margin="normal" inputProps={{ min: 0, step: 0.01 }} variant="outlined" className="service-menu__form-input" />
            {/* <TextField fullWidth label="Discount Price (AED) - Optional" type="number" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })} margin="normal" inputProps={{ min: 0, step: 0.01 }} variant="outlined" className="service-menu__form-input" /> */}
          </form>
        </DialogContent>
        <DialogActions className="service-menu__modal-actions">
          <Button onClick={() => setShowAddModal(false)} className="service-menu__btn service-menu__btn--cancel">Cancel</Button>
          <Button onClick={handleSubmit} className="service-menu__btn service-menu__btn--primary">Add Service</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit} className="service-menu__form">
            <TextField fullWidth label="Service Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required margin="normal" variant="outlined" className="service-menu__form-input" />
            <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required margin="normal" multiline rows={3} variant="outlined" className="service-menu__form-input" />
            <FormControl fullWidth margin="normal" variant="outlined" className="service-menu__form-control">
              <InputLabel>Category</InputLabel>
              <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} label="Category" required>
                {availableCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>{category.displayName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Duration (minutes)" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required margin="normal" inputProps={{ min: 15, max: 480 }} variant="outlined" className="service-menu__form-input" />
            <TextField fullWidth label="Price (AED)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required margin="normal" inputProps={{ min: 0, step: 0.01 }} variant="outlined" className="service-menu__form-input" />
            {/* <TextField fullWidth label="Discount Price (AED) - Optional" type="number" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })} margin="normal" inputProps={{ min: 0, step: 0.01 }} variant="outlined" className="service-menu__form-input" /> */}
          </form>
        </DialogContent>
        <DialogActions className="service-menu__modal-actions">
          <Button onClick={() => setShowEditModal(false)} className="service-menu__btn service-menu__btn--cancel">Cancel</Button>
          <Button onClick={handleSubmit} className="service-menu__btn service-menu__btn--primary">Update Service</Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleCategorySubmit} className="service-menu__form">
            <TextField fullWidth label="Category Name (Internal)" value={newCategoryData.name} onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })} required margin="normal" variant="outlined" className="service-menu__form-input" helperText="Used for internal identification (e.g., 'facial-treatments')" />
            <TextField fullWidth label="Display Name" value={newCategoryData.displayName} onChange={(e) => setNewCategoryData({ ...newCategoryData, displayName: e.target.value })} required margin="normal" variant="outlined" className="service-menu__form-input" helperText="Name shown to users (e.g., 'Facial Treatments')" />
          </form>
        </DialogContent>
        <DialogActions className="service-menu__modal-actions">
          <Button onClick={() => setShowAddCategoryModal(false)} className="service-menu__btn service-menu__btn--cancel">Cancel</Button>
          <Button onClick={handleCategorySubmit} className="service-menu__btn service-menu__btn--primary">Add Category</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Delete Category Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={handleDeleteDialogClose}
        maxWidth="md" 
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            backgroundColor: '#ffffff'
          }
        }}
      >
        <DialogTitle style={{ 
          padding: '24px 24px 16px', 
          background: deleteDialog.hasServices ? '#f8f9fa' : '#ffffff',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {deleteDialog.hasServices ? (
              <AlertTriangle size={24} style={{ color: '#495057' }} />
            ) : (
              <Info size={24} style={{ color: '#6c757d' }} />
            )}
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#212529' }}>
              {deleteDialog.hasServices ? 'Category Contains Services' : 'Confirm Category Deletion'}
            </span>
          </div>
        </DialogTitle>
        
        <DialogContent style={{ padding: '24px', backgroundColor: '#ffffff' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ 
              fontSize: '16px', 
              color: '#495057', 
              margin: '0 0 16px',
              lineHeight: '1.5'
            }}>
              You are about to delete the category <strong>"{deleteDialog.category?.name}"</strong>.
            </p>
            
            {deleteDialog.hasServices ? (
              <div style={{ 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle size={20} style={{ color: '#495057', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ 
                      margin: '0 0 8px', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#212529' 
                    }}>
                      Warning: Category Not Empty
                    </h4>
                    <p style={{ margin: '0 0 12px', color: '#495057', fontSize: '14px' }}>
                      This category currently contains <strong>{deleteDialog.serviceCount} service{deleteDialog.serviceCount !== 1 ? 's' : ''}</strong>. 
                    </p>
                    <p style={{ margin: 0, color: '#dc3545', fontSize: '14px', fontWeight: '500' }}>
                      Deleting this category will permanently remove all associated services.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Info size={20} style={{ color: '#495057' }} />
                  <p style={{ margin: 0, color: '#495057', fontSize: '14px' }}>
                    This category is empty and safe to delete.
                  </p>
                </div>
              </div>
            )}
            
            <p style={{ 
              fontSize: '14px', 
              color: '#6c757d', 
              margin: 0,
              fontStyle: 'italic'
            }}>
              This action cannot be undone. Please proceed with caution.
            </p>
          </div>
        </DialogContent>
        
        <DialogActions style={{ 
          padding: '16px 24px 24px', 
          gap: '12px',
          borderTop: '1px solid #e9ecef',
          backgroundColor: '#ffffff'
        }}>
          <Button 
            onClick={handleDeleteDialogClose}
            disabled={deleteDialog.loading}
            style={{
              color: '#495057',
              borderColor: '#dee2e6',
              padding: '10px 24px',
              fontWeight: '500',
              backgroundColor: '#ffffff'
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          
          <Button 
            onClick={() => confirmDeleteCategory(true)}
            disabled={deleteDialog.loading}
            style={{
              backgroundColor: '#212529',
              color: '#ffffff',
              padding: '10px 24px',
              fontWeight: '500',
              '&:hover': {
                backgroundColor: '#343a40'
              }
            }}
            variant="contained"
          >
            {deleteDialog.loading ? (
              <CircularProgress size={16} style={{ color: '#ffffff' }} />
            ) : (
              deleteDialog.hasServices ? 
                `Force Delete Category & ${deleteDialog.serviceCount} Service${deleteDialog.serviceCount !== 1 ? 's' : ''}` : 
                'Delete Category'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ServiceMenu;