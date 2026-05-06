import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../Service/Api';

// Helper function to generate a random background color for avatars
const getRandomColor = () => {
  const colors = [
    "#FFDDC1", // Light Orange
    "#D1E7DD", // Light Green
    "#CCE5FF", // Light Blue
    "#F0FFF0", // Honeydew
    "#F8F8FF", // Ghost White
    "#F0F8FF", // Alice Blue
    "#FFF0F5", // Lavender Blush
    "#E0FFFF", // Light Cyan
    "#F5DEB3", // Wheat
    "#DDA0DD", // Plum
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to format appointment details
const formatAppointmentDetails = (booking) => {
  const teamMembers = booking.services
    .map((s) =>
      s.employee && s.employee.user
        ? `${s.employee.user.firstName} ${s.employee.user.lastName}`
        : ""
    )
    .filter(Boolean)
    .join(", ");

  const clientName =
    booking.client && booking.client.firstName
      ? `${booking.client.firstName} ${booking.client.lastName}`
      : "N/A";

  const serviceNames = booking.services
    .map((s) => s.service?.name)
    .filter(Boolean)
    .join(", ");

  const formattedDuration = booking.totalDuration
    ? `${Math.round(booking.totalDuration / 60)}h`
    : "";

  return {
    id: booking._id,
    date: booking.appointmentDate
      ? new Date(booking.appointmentDate).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
        })
      : "-",
    time: booking.appointmentDate
      ? new Date(booking.appointmentDate).toLocaleString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "-",
    status: booking.status || "Unknown",
    service: serviceNames || "No Service",
    details: `${clientName}, ${formattedDuration} with ${teamMembers}`,
    price: booking.finalAmount
      ? `AED ${booking.finalAmount.toFixed(2)}`
      : "AED 0.00",
    rawClientName: clientName,
    rawClientPhone: booking.client?.phone || "",
    rawClientEmail: booking.client?.email || "",
    rawBookingRef: booking.bookingNumber || booking._id,
    appointmentDateTime: booking.appointmentDate
      ? new Date(booking.appointmentDate)
      : new Date(0),
  };
};

// Async thunks for data fetching
export const fetchSearchAppointments = createAsyncThunk(
  'search/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/bookings/admin/all?limit=10000");
      const bookings = res.data.data.bookings || [];
      const now = Date.now();
      const mappedAppointments = bookings
        .map(formatAppointmentDetails)
        .filter((appt) => appt.appointmentDateTime.getTime() > now)
        .sort((a, b) => a.appointmentDateTime - b.appointmentDateTime);

      return mappedAppointments;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load appointments"
      );
    }
  }
);

export const fetchSearchClients = createAsyncThunk(
  'search/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/clients");
      const clientsData = res.data.data.clients || [];

      const transformedClients = clientsData.map((client) => ({
        id: client._id,
        name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        phone: client.phone || "-",
        email: client.email || "-",
        initial: (client.firstName
          ? client.firstName[0]
          : client.lastName
          ? client.lastName[0]
          : "?"
        ).toUpperCase(),
        color: getRandomColor(),
        createdAt: client.createdAt ? new Date(client.createdAt) : new Date(0),
      }));

      return transformedClients.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load clients"
      );
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    allAppointments: [],
    allClients: [],
    filteredAppointments: [],
    filteredClients: [],
    searchTerm: "",
    loading: true,
    error: null,
  },
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      const lowercasedSearchTerm = action.payload.toLowerCase();

      // Filter appointments
      const appointments = state.allAppointments
        .filter((appt) => {
          return (
            appt.rawClientName.toLowerCase().includes(lowercasedSearchTerm) ||
            appt.rawClientPhone.toLowerCase().includes(lowercasedSearchTerm) ||
            appt.rawClientEmail.toLowerCase().includes(lowercasedSearchTerm) ||
            appt.rawBookingRef.toLowerCase().includes(lowercasedSearchTerm) ||
            appt.service.toLowerCase().includes(lowercasedSearchTerm) ||
            appt.details.toLowerCase().includes(lowercasedSearchTerm)
          );
        })
        .sort((a, b) => a.appointmentDateTime - b.appointmentDateTime);

      state.filteredAppointments = lowercasedSearchTerm ? appointments : appointments.slice(0, 5);

      // Filter clients
      const clients = state.allClients
        .filter((client) => {
          return (
            client.name.toLowerCase().includes(lowercasedSearchTerm) ||
            client.phone.toLowerCase().includes(lowercasedSearchTerm) ||
            client.email.toLowerCase().includes(lowercasedSearchTerm)
          );
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      state.filteredClients = lowercasedSearchTerm ? clients : clients.slice(0, 5);
    },
    clearSearch: (state) => {
      state.searchTerm = "";
      state.filteredAppointments = state.allAppointments.slice(0, 5);
      state.filteredClients = state.allClients.slice(0, 5);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSearchAppointments.fulfilled, (state, action) => {
        state.allAppointments = action.payload;
        state.filteredAppointments = action.payload.slice(0, 5);
        state.loading = false;
      })
      .addCase(fetchSearchAppointments.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchSearchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSearchClients.fulfilled, (state, action) => {
        state.allClients = action.payload;
        state.filteredClients = action.payload.slice(0, 5);
        state.loading = false;
      })
      .addCase(fetchSearchClients.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { setSearchTerm, clearSearch } = searchSlice.actions;

// Selectors
export const selectSearchTerm = (state) => state.search.searchTerm;
export const selectFilteredAppointments = (state) => state.search.filteredAppointments;
export const selectFilteredClients = (state) => state.search.filteredClients;
export const selectSearchLoading = (state) => state.search.loading;
export const selectSearchError = (state) => state.search.error;

export default searchSlice.reducer;