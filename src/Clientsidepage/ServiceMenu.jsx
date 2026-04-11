import React, { useState, useMemo, useEffect } from "react";
import { FiSearch, FiFilter, FiChevronDown, FiPlus, FiMoreVertical, FiArrowUp, FiArrowDown, FiTrash2 } from "react-icons/fi";
import { Button, TextField, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Menu, /* Add Menu from MUI */ TextareaAutosize } from "@mui/material"; // Import Menu
import api from "../Service/Api";
import Swal from 'sweetalert2';
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
  // Fatal error state - shows Error500Page when component fails to render
  const [error, setError] = useState(null);
  // Operation error state - shows inline alerts for failed operations (CRUD operations)
  const [operationError, setOperationError] = useState(null);
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
      setError(`Failed to load services: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from the API for dropdown
  const fetchAvailableCategories = async () => {
    try {
      // Try multiple endpoints to find categories
      const endpoints = [
        '/services/categories',
        '/categories/categories',
        '/categories'
      ];

      let categoriesLoaded = false;

      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);

          if (response.data.success && response.data.data) {
            const categories = response.data.data.categories || response.data.data || [];
            if (Array.isArray(categories) && categories.length > 0) {
              setAvailableCategories(categories);
              categoriesLoaded = true;
              break;
            }
          }
        } catch (endpointErr) {
          console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointErr.response?.status);
          continue;
        }
      }

      if (!categoriesLoaded) {
        console.warn('⚠️ No categories found from any endpoint');
        setAvailableCategories([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch available categories:', err);
      console.error('Error details:', err.response?.data || err.message);
      setAvailableCategories([]);
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
      setOperationError(null);

      const response = await api.get(`/services/search?q=${encodeURIComponent(query)}`);

      if (response.data.success) {
        setServices(response.data.data.services || []);
      } else {
        throw new Error(response.data.message || 'Failed to search services');
      }
    } catch (err) {
      console.error('❌ Failed to search services:', err);
      setOperationError(err.message);
      setTimeout(() => setOperationError(null), 4000);
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
      
      setOperationError(userMessage);
      setTimeout(() => setOperationError(null), 5000);
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
      
      setOperationError(userMessage);
      setTimeout(() => setOperationError(null), 5000);
    }
  };

  // Create new category
  const createCategory = async (categoryData) => {
    const endpoints = ['/categories/categories', '/services/categories', '/categories'];
    let lastError = null;
    for (const ep of endpoints) {
      try {
        console.info('Attempting create category via', ep);
        const response = await api.post(ep, categoryData);

        if (response && response.data && response.data.success) {
          setShowAddCategoryModal(false);
          setNewCategoryData({ name: "", displayName: "" });
          await fetchAvailableCategories();
          await fetchCategories();
          setSuccess('Category created successfully');
          setTimeout(() => setSuccess(null), 3000);
          return;
        } else if (response && response.data) {
          // Received a response but not success
          lastError = new Error(response.data.message || 'Failed to create category');
          // If server returned 404-like shape inside data, continue to next
        }
      } catch (err) {
        console.warn('Create category attempt failed for', ep, err?.response?.status || err.message);
        lastError = err;
        // If 404, try next endpoint
        if (err?.response?.status === 404) {
          continue;
        } else {
          // For other errors, break and show the error
          break;
        }
      }
    }

    console.error('❌ Failed to create category after trying endpoints:', endpoints, lastError);
    const userMessage = lastError?.response?.data?.message || lastError?.message || 'Failed to create category';
    setOperationError(userMessage);
    setTimeout(() => setOperationError(null), 4000);
  };

  // Delete category
  const deleteCategory = async (categoryId, categoryName) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
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
      setOperationError(userMessage);
      setTimeout(() => setOperationError(null), 5000);
    }
  };

  // Delete service
  const deleteService = async (serviceId) => {
    const confirm = await Swal.fire({
      title: 'Delete service?',
      text: 'Are you sure you want to delete this service? This action will deactivate it and may affect existing bookings.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await api.delete(`/services/${serviceId}`);

      if (response.data.success) {
        // Backend performs a soft-delete (isActive = false). Update client state to remove the service
        const updatedAll = allServices.filter(s => s._id !== serviceId);
        setAllServices(updatedAll);
        setServices(prev => prev.filter(s => s._id !== serviceId));

        // Recompute categories counts locally if we have the available categories list
        if (availableCategories && availableCategories.length > 0) {
          const categoriesWithCounts = availableCategories.map(category => {
            const count = updatedAll.filter(service => {
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

          const total = updatedAll.length;
          const finalCategories = [{ name: "All categories", count: total }, ...categoriesWithCounts];
          setCategories(finalCategories);
        } else {
          // Fallback to fetch categories from server
          await fetchCategories();
        }

        setSuccess(response.data.message || 'Service deleted successfully');
        // Authoritative refresh to ensure UI matches server state
        try {
          await fetchServices();
          await fetchCategories();
          console.debug('✅ Services and categories refreshed after delete');
        } catch (refreshErr) {
          console.warn('⚠️ Failed to refresh services/categories after delete:', refreshErr);
        }

        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to delete service');
      }
    } catch (err) {
      console.error('❌ Failed to delete service:', err);
      
      let userMessage = 'Failed to delete service.';
      // If the backend refuses delete because of active bookings, offer to deactivate instead
      const backendMsg = err?.response?.data?.message || '';
      if (err?.response?.status === 400 && backendMsg.includes('Cannot delete service with active bookings')) {
        const deactivateConfirm = await Swal.fire({
          title: 'Service has active bookings',
          html: `This service has active bookings and cannot be deleted.<br/><strong>Would you like to deactivate (hide) the service instead?</strong>`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Deactivate',
          cancelButtonText: 'Cancel',
          reverseButtons: true,
        });

        if (deactivateConfirm.isConfirmed) {
          try {
            Swal.fire({
              title: 'Deactivating...',
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading()
            });

            const patchRes = await api.patch(`/services/${serviceId}`, { isActive: false });

            Swal.close();

            if (patchRes?.data?.success) {
              // Update local state similar to delete success
              const updatedAll = allServices.filter(s => s._id !== serviceId);
              setAllServices(updatedAll);
              setServices(prev => prev.filter(s => s._id !== serviceId));

              if (availableCategories && availableCategories.length > 0) {
                const categoriesWithCounts = availableCategories.map(category => {
                  const count = updatedAll.filter(service => {
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

                const total = updatedAll.length;
                const finalCategories = [{ name: "All categories", count: total }, ...categoriesWithCounts];
                setCategories(finalCategories);
              } else {
                await fetchCategories();
              }

              // Authoritative refresh after deactivate to keep UI and server authoritative
              try {
                await fetchServices();
                await fetchCategories();
                console.debug('✅ Services and categories refreshed after deactivate');
              } catch (refreshErr) {
                console.warn('⚠️ Failed to refresh services/categories after deactivate:', refreshErr);
              }

              Swal.fire('Deactivated', patchRes.data.message || 'Service deactivated successfully', 'success');
              return;
            }
          } catch (patchErr) {
            console.error('Failed to deactivate service after delete blocked:', patchErr);
            Swal.fire('Error', patchErr?.response?.data?.message || patchErr.message || 'Failed to deactivate service', 'error');
            return;
          }
        }
      }

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
      
      setOperationError(userMessage);
      setTimeout(() => setOperationError(null), 4000);
    }
  };

  // Handle form submission (for add/edit service)
  const handleSubmit = (e) => {
    // allow calling without an event (DialogAction onClick calls it directly)
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    // Trim string inputs
    const name = (formData.name || '').toString().trim();
    const description = (formData.description || '').toString().trim();
    const category = formData.category;

    // Parse numeric inputs defensively
    const durationVal = formData.duration === '' || formData.duration === null ? NaN : Number(formData.duration);
    const priceVal = formData.price === '' || formData.price === null ? NaN : Number(formData.price);
    const discountVal = formData.discountPrice === '' || formData.discountPrice == null ? undefined : Number(formData.discountPrice);

    // Client-side validation to avoid sending null/NaN to backend
    if (!name) {
      setOperationError('Service name is required');
      setTimeout(() => setOperationError(null), 4000);
      return;
    }
    if (!category) {
      setOperationError('Please select a category');
      setTimeout(() => setOperationError(null), 4000);
      return;
    }
    if (!Number.isFinite(durationVal) || durationVal <= 0) {
      setOperationError('Please enter a valid duration (minutes)');
      setTimeout(() => setOperationError(null), 4000);
      return;
    }
    if (!Number.isFinite(priceVal) || priceVal <= 0) {
      setOperationError('Please enter a valid price');
      setTimeout(() => setOperationError(null), 4000);
      return;
    }

    const serviceData = {
      name,
      description,
      category,
      duration: Math.round(durationVal),
      price: Number(priceVal.toFixed(2)),
      ...(discountVal !== undefined && Number.isFinite(discountVal) ? { discountPrice: Number(discountVal.toFixed(2)) } : {})
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
      await fetchAvailableCategories(); // Await to ensure categories are loaded
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
      setOperationError('Unable to verify category status. Please try again.');
      setTimeout(() => setOperationError(null), 4000);
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
      
      setOperationError(userMessage);
      setTimeout(() => setOperationError(null), 5000);
      
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

  // Show full page error only for fatal errors during component initialization
  if (error) {
    return <Error500Page message={error} />;
  }
  
  return (
    <div className="service-menu-container">
      <div className="service-menu-wrapper">
        {/* Header */}
        <div className="service-menu-header">
          <div className="service-menu-title-group">
            <h1>Service menu</h1>
            <p className="service-menu-subtitle">
              View and manage the services offered by your business. <a href="#">Learn more</a>
            </p>
          </div>
          <div className="service-menu-actions">
            {/* Export Button */}
            <button 
              className="btn btn-secondary"
              onClick={handleExportClick}
            >
              Options <FiChevronDown />
            </button>
            <Menu
              anchorEl={exportAnchorEl}
              open={Boolean(exportAnchorEl)}
              onClose={handleExportClose}
              PaperProps={{
                style: {
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  marginTop: '8px'
                }
              }}
            >
              <MenuItem onClick={downloadCSV}>Export as CSV</MenuItem>
              <MenuItem onClick={downloadExcel}>Export as Excel</MenuItem>
              <MenuItem onClick={downloadPDF}>Export as PDF</MenuItem>
            </Menu>

            {/* Add Button */}
            <button 
              className="btn btn-secondary"
              onClick={handleAddMenuClick}
            >
              Add <FiChevronDown />
            </button>
            <Menu
              anchorEl={addMenuAnchorEl}
              open={Boolean(addMenuAnchorEl)}
              onClose={handleAddMenuClose}
              PaperProps={{
                style: {
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  marginTop: '8px'
                }
              }}
            >
              <MenuItem onClick={handleAddServiceFromMenu}>
                <FiPlus style={{ marginRight: '8px' }} /> Add Service
              </MenuItem>
              <MenuItem onClick={handleAddCategoryFromMenu}>
                <FiPlus style={{ marginRight: '8px' }} /> Add Category
              </MenuItem>
            </Menu>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} style={{ marginBottom: '24px', borderRadius: '8px' }}>
            {success}
          </Alert>
        )}
        {operationError && (
          <Alert severity="error" onClose={() => setOperationError(null)} style={{ marginBottom: '24px', borderRadius: '8px' }}>
            {operationError}
          </Alert>
        )}

        {/* Controls */}
        <div className="service-menu-controls">
          <div className="controls-left">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search service name" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
           
          </div>
        </div>

        {/* Main Content */}
        <div className="service-menu-content">
          {/* Sidebar */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">Categories</h3>
            <div className="category-list">
              {categories.map((category) => (
              <div 
                key={category.name}
                className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.name)}
              >
                <div className="category-content">
                  <span>{category.name}</span>
                  <span className="category-count">{category.count}</span>
                </div>
                {category.name !== "All categories" && (
                  <button
                    className="category-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateDeleteCategory(category._id, category.name);
                    }}
                    title={`Delete ${category.name} category`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            </div>
            <a 
              className="add-category-btn"
              onClick={(e) => { e.preventDefault(); setShowAddCategoryModal(true); }}
            >
              Add category
            </a>
          </div>

          {/* Services List */}
          <div className="services-section">
            {Object.keys(filteredAndCategorizedServices).length > 0 ? (
              Object.keys(filteredAndCategorizedServices).map(categoryName => (
                <div key={categoryName} className="category-group">
                  <div className="category-header">
                    <h2 className="category-title">{categoryName}</h2>
                
                  </div>
                  
                  <div className="category-group-container">
                    {filteredAndCategorizedServices[categoryName].map((service) => (
                      <div key={service._id} className="service-card">
                        <div className="service-info">
                          <h3 className="service-name">{service.name}</h3>
                          <p className="service-description">
                            {service.description && service.description.length > 50 
                              ? `${service.description.substring(0, 50)}...` 
                              : service.description}
                          </p>
                        </div>
                        <div className="service-meta">
                          <span className="service-duration">{formatDuration(service.duration)}</span>
                          <span className="service-price">{formatPrice(service.price)}</span>
                        </div>
                        <div className="service-actions" style={{ display: 'flex', alignItems: 'center' }}>
                          <button
                            className="service-actions-btn"
                            onClick={(e) => { e.stopPropagation(); handleEditService(service); }}
                            title="Edit service"
                          >
                            <FiMoreVertical size={20} />
                          </button>
                          <button
                            className="service-actions-btn"
                            onClick={(e) => { e.stopPropagation(); deleteService(service._id); }}
                            title="Delete service"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <p>No services found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals - Keeping existing functional modals but ensuring they render */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Service</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Service Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required margin="normal" variant="outlined" />
            <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required margin="normal" multiline rows={3} variant="outlined" />
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} label="Category" required>
                {availableCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.displayName || category.name || 'Unnamed Category'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Duration (minutes)" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required margin="normal" inputProps={{ min: 15 }} variant="outlined" />
            <TextField fullWidth label="Price (AED)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required margin="normal" inputProps={{ min: 0, step: 0.01 }} variant="outlined" />
          </form>
        </DialogContent>
        <DialogActions className="service-menu__modal-actions">
          <Button onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</Button>
          <Button onClick={handleSubmit} className="btn btn-primary">Add Service</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Service Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required margin="normal" variant="outlined" />
            <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required margin="normal" multiline rows={3} variant="outlined" />
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} label="Category" required>
                {availableCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.displayName || category.name || 'Unnamed Category'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Duration (minutes)" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required margin="normal" inputProps={{ min: 15 }} variant="outlined" />
            <TextField fullWidth label="Price (AED)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required margin="normal" inputProps={{ min: 0, step: 0.01 }} variant="outlined" />
          </form>
        </DialogContent>
        <DialogActions className="service-menu__modal-actions">
          <Button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</Button>
          <Button onClick={handleSubmit} className="btn btn-primary">Update Service</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleCategorySubmit}>
            <TextField fullWidth label="Category Name (Internal)" value={newCategoryData.name} onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })} required margin="normal" variant="outlined" helperText="Used for internal identification" />
            <TextField fullWidth label="Display Name" value={newCategoryData.displayName} onChange={(e) => setNewCategoryData({ ...newCategoryData, displayName: e.target.value })} required margin="normal" variant="outlined" helperText="Name shown to users" />
          </form>
        </DialogContent>
        <DialogActions className="service-menu__modal-actions">
          <Button onClick={() => setShowAddCategoryModal(false)} className="btn btn-secondary">Cancel</Button>
          <Button onClick={handleCategorySubmit} className="btn btn-primary">Add Category</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to delete the category <strong>"{deleteDialog.category?.name}"</strong>?</p>
          {deleteDialog.hasServices && (
            <Alert severity="warning" style={{ marginTop: '16px' }}>
              This category contains {deleteDialog.serviceCount} services. Deleting it will remove all associated services.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="inherit">Cancel</Button>
          <Button onClick={() => confirmDeleteCategory(true)} color="error" variant="contained">
            {deleteDialog.hasServices ? 'Force Delete' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ServiceMenu;