// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import axios from "axios";

// const backendUrl = "http://localhost:4000";

// const adminAuth = () => ({
//   headers: {
//     Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
//   },
// });

// const makeThunk = (type, request) =>
//   createAsyncThunk(type, async (arg, { rejectWithValue }) => {
//     try {
//       const response = await request(arg);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || error.message || "Request failed"
//       );
//     }
//   });

// // ---------------- AUTH ----------------

// export const createAdmin = makeThunk("admin/createAdmin", (data) =>
//   axios.post(`${backendUrl}/api/admin/create-admin`, data)
// );

// export const adminLogin = makeThunk("admin/adminLogin", (data) =>
//   axios.post(`${backendUrl}/api/admin/admin-login`, data)
// );

// export const adminForgotPassword = makeThunk(
//   "admin/adminForgotPassword",
//   (value) => {
//     const email = typeof value === "string" ? value : value?.email;
//     return axios.post(`${backendUrl}/api/admin/forgot-password`, { email });
//   }
// );

// export const adminVerifyOtp = makeThunk("admin/adminVerifyOtp", (data) =>
//   axios.post(`${backendUrl}/api/admin/verify-otp`, data)
// );

// export const resendAdminOtp = makeThunk("admin/resendAdminOtp", (value) => {
//   const email = typeof value === "string" ? value : value?.email;
//   return axios.post(`${backendUrl}/api/admin/resend-otp`, { email });
// });

// export const adminResetPassword = makeThunk(
//   "admin/adminResetPassword",
//   (data) => axios.post(`${backendUrl}/api/admin/reset-password`, data)
// );

// // ---------------- DOCTORS ----------------

// export const addDoctor = makeThunk("admin/addDoctor", (formData) =>
//   axios.post(`${backendUrl}/api/admin/add-doctor`, formData, {
//     ...adminAuth(),
//   })
// );

// export const listDoctors = makeThunk("admin/listDoctors", () =>
//   axios.get(`${backendUrl}/api/admin/list-doctors`, adminAuth())
// );

// export const getDoctor = makeThunk("admin/getDoctor", (id) =>
//   axios.get(`${backendUrl}/api/admin/list-doctors/${id}`, adminAuth())
// );

// export const updateDoctor = makeThunk(
//   "admin/updateDoctor",
//   ({ id, formData }) =>
//     axios.put(`${backendUrl}/api/admin/update-doctor/${id}`, formData, {
//       ...adminAuth(),
//     })
// );

// export const deleteDoctor = makeThunk("admin/deleteDoctor", (id) =>
//   axios.delete(`${backendUrl}/api/admin/delete-doctor/${id}`, adminAuth())
// );

// export const changeDoctorAvailability = makeThunk(
//   "admin/changeDoctorAvailability",
//   (id) =>
//     axios.patch(
//       `${backendUrl}/api/admin/change-availability/${id}`,
//       {},
//       adminAuth()
//     )
// );

// // ---------------- ENQUIRIES & APPLICATIONS ----------------

// export const getAllEnquiries = makeThunk("admin/getAllEnquiries", () =>
//   axios.get(`${backendUrl}/api/admin/all-enquiries`, adminAuth())
// );

// export const deleteEnquiry = makeThunk("admin/deleteEnquiry", (id) =>
//   axios.delete(`${backendUrl}/api/admin/all-enquiries/${id}`, adminAuth())
// );

// export const getAllJobApplications = makeThunk(
//   "admin/getAllJobApplications",
//   () => axios.get(`${backendUrl}/api/admin/all-applications`, adminAuth())
// );

// export const deleteJobApplication = makeThunk(
//   "admin/deleteJobApplication",
//   (id) =>
//     axios.delete(`${backendUrl}/api/admin/all-applications/${id}`, adminAuth())
// );

// // ---------------- HOLIDAYS ----------------

// export const addHoliday = makeThunk("admin/addHoliday", (data) =>
//   axios.post(`${backendUrl}/api/admin/add-holiday`, data, adminAuth())
// );

// export const getHolidays = makeThunk("admin/getHolidays", () =>
//   axios.get(`${backendUrl}/api/admin/list-holidays`, adminAuth())
// );

// export const deleteHoliday = makeThunk("admin/deleteHoliday", (holidayId) =>
//   axios.delete(
//     `${backendUrl}/api/admin/delete-holiday/${holidayId}`,
//     adminAuth()
//   )
// );

// export const updateHoliday = makeThunk(
//   "admin/updateHoliday",
//   ({ id, data }) =>
//     axios.put(`${backendUrl}/api/admin/holiday-update/${id}`, data, adminAuth())
// );

// // ---------------- DASHBOARD ----------------

// export const getAdminDashboard = makeThunk("admin/getAdminDashboard", () =>
//   axios.get(`${backendUrl}/api/admin/admin-dashboard`, adminAuth())
// );

// // ---------------- PATIENTS ----------------

// export const getAllPatient = makeThunk(
//   "admin/getAllPatient",
//   (params = {}) =>
//     axios.get(`${backendUrl}/api/admin/patient/list`, {
//       ...adminAuth(),
//       params,
//     })
// );

// export const getPatient = makeThunk("admin/getPatient", (patientId) =>
//   axios.get(
//     `${backendUrl}/api/admin/patient/single/${patientId}`,
//     adminAuth()
//   )
// );

// // ---------------- APPOINTMENTS ----------------

// export const getAllAppointments = makeThunk(
//   "admin/getAllAppointments",
//   (params = {}) =>
//     axios.get(`${backendUrl}/api/admin/appointment/list`, {
//       ...adminAuth(),
//       params,
//     })
// );

// export const getAdminAppointment = makeThunk(
//   "admin/getAdminAppointment",
//   (appointmentId) =>
//     axios.get(
//       `${backendUrl}/api/admin/appointment/single/${appointmentId}`,
//       adminAuth()
//     )
// );

// export const adminCancelAppointment = makeThunk(
//   "admin/adminCancelAppointment",
//   (appointmentId) =>
//     axios.put(
//       `${backendUrl}/api/admin/appointment/cancel/${appointmentId}`,
//       {},
//       adminAuth()
//     )
// );

// export const markAppointmentCompleted = makeThunk(
//   "admin/markAppointmentCompleted",
//   (appointmentId) =>
//     axios.put(
//       `${backendUrl}/api/admin/appointment/complete/${appointmentId}`,
//       {},
//       adminAuth()
//     )
// );

// // ---------------- OFFLINE PAYMENTS ----------------

// export const getOfflinePaymentRequests = makeThunk(
//   "admin/getOfflinePaymentRequests",
//   () => axios.get(`${backendUrl}/api/admin/offline-requests`, adminAuth())
// );

// export const approveOfflinePayment = makeThunk(
//   "admin/approveOfflinePayment",
//   (appointmentId) =>
//     axios.put(
//       `${backendUrl}/api/admin/approve-offline/${appointmentId}`,
//       {},
//       adminAuth()
//     )
// );

// export const rejectOfflinePayment = makeThunk(
//   "admin/rejectOfflinePayment",
//   (appointmentId) =>
//     axios.put(
//       `${backendUrl}/api/admin/reject-offline/${appointmentId}`,
//       {},
//       adminAuth()
//     )
// );

// // ---------------- DOCTOR LEAVES (ADMIN) ----------------

// export const getAllLeaves = makeThunk(
//   "admin/getAllLeaves",
//   (params = {}) =>
//     axios.get(`${backendUrl}/api/admin/all-leaves`, {
//       ...adminAuth(),
//       params,
//     })
// );

// export const getPendingLeaves = makeThunk("admin/getPendingLeaves", () =>
//   axios.get(`${backendUrl}/api/admin/pending`, adminAuth())
// );

// export const getAdminSingleLeave = makeThunk(
//   "admin/getAdminSingleLeave",
//   (leaveId) =>
//     axios.get(`${backendUrl}/api/admin/pending/${leaveId}`, adminAuth())
// );


// export const approveLeave = createAsyncThunk(
//   "admin/approveLeave",
//   async ({ leaveId, ...data }, { rejectWithValue }) => {
//     try {
//       const response = await axios.put(
//         `${backendUrl}/api/admin/approve/${leaveId}`,
//         data,
//         adminAuth()
//       );

//       return response.data;
//     } catch (error) {
//       // Preserve the full 409 conflict response for the UI.
//       return rejectWithValue(
//         error.response?.data || {
//           message: error.message || "Unable to approve leave.",
//         }
//       );
//     }
//   }
// );


// export const rejectLeave = makeThunk(
//   "admin/rejectLeave",
//   ({ leaveId, ...data }) =>
//     axios.put(
//       `${backendUrl}/api/admin/reject/${leaveId}`,
//       data,
//       adminAuth()
//     )
// );


// export const cancelApprovedLeave = makeThunk(
//   "admin/cancelApprovedLeave",
//   ({ leaveId, ...data }) =>
//     axios.put(
//       `${backendUrl}/api/admin/cancel/${leaveId}`,
//       data,
//       adminAuth()
//     )
// );


// // ---------------- REDUX STATE ----------------

// const adminSlice = createSlice({
//   name: "admin",
//   initialState: {
//     adminToken: localStorage.getItem("adminToken") || "",
//     isAdminAuthenticated: Boolean(localStorage.getItem("adminToken")),
//     admin: null,

//     doctors: [],
//     doctor: null,
//     enquiries: [],
//     applications: [],
//     holidays: [],
//     dashboard: null,
//     patients: [],
//     patient: null,
//     appointments: [],
//     appointment: null,
//     offlinePaymentRequests: [],
//     leaves: [],
//     leave: null,

//     loading: false,
//     error: null,
//     successMessage: null,
//   },

//   reducers: {
//     adminLogout: (state) => {
//       state.adminToken = "";
//       state.isAdminAuthenticated = false;
//       state.admin = null;
//       localStorage.removeItem("adminToken");
//     },

//     clearAdminError: (state) => {
//       state.error = null;
//     },

//     clearAdminMessage: (state) => {
//       state.successMessage = null;
//     },
//   },

//   extraReducers: (builder) => {
//     builder
//       .addCase(adminLogin.fulfilled, (state, action) => {
//         state.adminToken = action.payload.token || "";
//         state.isAdminAuthenticated = Boolean(action.payload.token);
//         state.admin = action.payload.admin || null;

//         if (action.payload.token) {
//           localStorage.setItem("adminToken", action.payload.token);
//         }
//       })

//       .addCase(listDoctors.fulfilled, (state, action) => {
//         state.doctors = action.payload.doctors || [];
//       })
//       .addCase(getDoctor.fulfilled, (state, action) => {
//         state.doctor = action.payload.doctor || null;
//       })
//       .addCase(addDoctor.fulfilled, (state, action) => {
//         if (action.payload.doctor) {
//           state.doctors.unshift(action.payload.doctor);
//         }
//       })
//       .addCase(updateDoctor.fulfilled, (state, action) => {
//         if (action.payload.doctor) {
//           state.doctors = state.doctors.map((item) =>
//             String(item._id || item.id) ===
//             String(action.payload.doctor._id || action.payload.doctor.id)
//               ? action.payload.doctor
//               : item
//           );
//           state.doctor = action.payload.doctor;
//         }
//       })
//       .addCase(deleteDoctor.fulfilled, (state, action) => {
//         const id = action.meta.arg;
//         state.doctors = state.doctors.filter(
//           (item) => String(item._id || item.id) !== String(id)
//         );
//       })
//       .addCase(changeDoctorAvailability.fulfilled, (state, action) => {
//         const id = action.meta.arg;
//         state.doctors = state.doctors.map((item) =>
//           String(item._id || item.id) === String(id)
//             ? { ...item, available: action.payload.available }
//             : item
//         );
//       })

//       .addCase(getAllEnquiries.fulfilled, (state, action) => {
//         state.enquiries = action.payload.enquiries || [];
//       })
//       .addCase(deleteEnquiry.fulfilled, (state, action) => {
//         state.enquiries = state.enquiries.filter(
//           (item) => String(item._id) !== String(action.meta.arg)
//         );
//       })
//       .addCase(getAllJobApplications.fulfilled, (state, action) => {
//         state.applications = action.payload.applications || [];
//       })
//       .addCase(deleteJobApplication.fulfilled, (state, action) => {
//         state.applications = state.applications.filter(
//           (item) => String(item._id) !== String(action.meta.arg)
//         );
//       })

//       .addCase(getHolidays.fulfilled, (state, action) => {
//         state.holidays = action.payload.holidays || [];
//       })
//       .addCase(addHoliday.fulfilled, (state, action) => {
//         if (action.payload.holiday) {
//           state.holidays.push(action.payload.holiday);
//         }
//       })
//       .addCase(deleteHoliday.fulfilled, (state, action) => {
//         state.holidays = state.holidays.filter(
//           (item) => String(item._id) !== String(action.meta.arg)
//         );
//       })
//       .addCase(updateHoliday.fulfilled, (state, action) => {
//         const holiday = action.payload.holiday;
//         if (holiday) {
//           state.holidays = state.holidays.map((item) =>
//             String(item._id) === String(holiday._id) ? holiday : item
//           );
//         }
//       })

//       .addCase(getAdminDashboard.fulfilled, (state, action) => {
//         state.dashboard = action.payload.dashboard || null;
//       })

//       .addCase(getAllPatient.fulfilled, (state, action) => {
//         state.patients = action.payload.patients || [];
//       })
//       .addCase(getPatient.fulfilled, (state, action) => {
//         state.patient = action.payload.patient || null;
//         state.appointments = action.payload.appointments || [];
//       })

//       .addCase(getAllAppointments.fulfilled, (state, action) => {
//         state.appointments = action.payload.appointments || [];
//       })
//       .addCase(getAdminAppointment.fulfilled, (state, action) => {
//         state.appointment = action.payload.appointment || null;
//       })
//       .addCase(adminCancelAppointment.fulfilled, (state, action) => {
//         const updated = action.payload.appointment;
//         if (updated) {
//           state.appointments = state.appointments.map((item) =>
//             String(item._id) === String(updated._id) ? updated : item
//           );
//           state.appointment = updated;
//         }
//       })
//       .addCase(markAppointmentCompleted.fulfilled, (state, action) => {
//         const updated = action.payload.appointment;
//         if (updated) {
//           state.appointments = state.appointments.map((item) =>
//             String(item._id) === String(updated._id) ? updated : item
//           );
//           state.appointment = updated;
//         }
//       })

//       .addCase(getOfflinePaymentRequests.fulfilled, (state, action) => {
//         state.offlinePaymentRequests = action.payload.appointments || [];
//       })
//       .addCase(approveOfflinePayment.fulfilled, (state, action) => {
//         state.offlinePaymentRequests = state.offlinePaymentRequests.filter(
//           (item) =>
//             String(item._id) !== String(action.meta.arg)
//         );
//       })
//       .addCase(rejectOfflinePayment.fulfilled, (state, action) => {
//         state.offlinePaymentRequests = state.offlinePaymentRequests.filter(
//           (item) =>
//             String(item._id) !== String(action.meta.arg)
//         );
//       })

//       .addCase(getAllLeaves.fulfilled, (state, action) => {
//         state.leaves = action.payload.leaves || [];
//       })
//       .addCase(getPendingLeaves.fulfilled, (state, action) => {
//         state.leaves = action.payload.leaves || [];
//       })
//       .addCase(getAdminSingleLeave.fulfilled, (state, action) => {
//         state.leave = action.payload.leave || null;
//       })
//       .addCase(approveLeave.fulfilled, (state, action) => {
//         if (action.payload.leave) {
//           state.leaves = state.leaves.map((item) =>
//             String(item._id) === String(action.payload.leave._id)
//               ? action.payload.leave
//               : item
//           );
//           state.leave = action.payload.leave;
//         }
//       })
//       .addCase(rejectLeave.fulfilled, (state, action) => {
//         if (action.payload.leave) {
//           state.leaves = state.leaves.map((item) =>
//             String(item._id) === String(action.payload.leave._id)
//               ? action.payload.leave
//               : item
//           );
//           state.leave = action.payload.leave;
//         }
//       })
//       .addCase(cancelApprovedLeave.fulfilled, (state, action) => {
//         if (action.payload.leave) {
//           state.leaves = state.leaves.map((item) =>
//             String(item._id) === String(action.payload.leave._id)
//               ? action.payload.leave
//               : item
//           );
//           state.leave = action.payload.leave;
//         }
//       })

//       .addMatcher(
//         (action) =>
//           action.type.startsWith("admin/") &&
//           action.type.endsWith("/pending"),
//         (state) => {
//           state.loading = true;
//           state.error = null;
//           state.successMessage = null;
//         }
//       )
//       .addMatcher(
//         (action) =>
//           action.type.startsWith("admin/") &&
//           action.type.endsWith("/fulfilled"),
//         (state, action) => {
//           state.loading = false;
//           state.error = null;
//           state.successMessage = action.payload?.message || null;
//         }
//       )
//       .addMatcher(
//         (action) =>
//           action.type.startsWith("admin/") &&
//           action.type.endsWith("/rejected"),
//         (state, action) => {
//           state.loading = false;
//           state.error = action.payload || action.error.message;
//         }
//       );
//   },
// });

// export const { adminLogout, clearAdminError, clearAdminMessage } =
//   adminSlice.actions;

// export default adminSlice.reducer;


import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const backendUrl = "https://hospital-backend-gray.vercel.app";

// ---------------- AUTH HELPERS ----------------

const adminAuth = () => {
  const token = sessionStorage.getItem("adminToken") || "";

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Common thunk helper
const makeThunk = (type, request) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const response = await request(arg);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Request failed"
      );
    }
  });

// ---------------- AUTH ----------------

export const createAdmin = makeThunk(
  "admin/createAdmin",
  (data) =>
    axios.post(`${backendUrl}/api/admin/create-admin`, data)
);

export const adminLogin = makeThunk(
  "admin/adminLogin",
  (data) =>
    axios.post(`${backendUrl}/api/admin/admin-login`, data)
);

export const adminForgotPassword = makeThunk(
  "admin/adminForgotPassword",
  (value) => {
    const email =
      typeof value === "string" ? value : value?.email;

    return axios.post(
      `${backendUrl}/api/admin/forgot-password`,
      { email }
    );
  }
);

export const adminVerifyOtp = makeThunk(
  "admin/adminVerifyOtp",
  (data) =>
    axios.post(`${backendUrl}/api/admin/verify-otp`, data)
);

export const resendAdminOtp = makeThunk(
  "admin/resendAdminOtp",
  (value) => {
    const email =
      typeof value === "string" ? value : value?.email;

    return axios.post(
      `${backendUrl}/api/admin/resend-otp`,
      { email }
    );
  }
);

export const adminResetPassword = makeThunk(
  "admin/adminResetPassword",
  (data) =>
    axios.post(`${backendUrl}/api/admin/reset-password`, data)
);

// ---------------- DOCTORS ----------------

export const addDoctor = makeThunk(
  "admin/addDoctor",
  (formData) =>
    axios.post(
      `${backendUrl}/api/admin/add-doctor`,
      formData,
      adminAuth()
    )
);

export const listDoctors = makeThunk(
  "admin/listDoctors",
  () =>
    axios.get(
      `${backendUrl}/api/admin/list-doctors`,
      adminAuth()
    )
);

export const getDoctor = makeThunk(
  "admin/getDoctor",
  (id) =>
    axios.get(
      `${backendUrl}/api/admin/list-doctors/${id}`,
      adminAuth()
    )
);

export const updateDoctor = makeThunk(
  "admin/updateDoctor",
  ({ id, formData }) =>
    axios.put(
      `${backendUrl}/api/admin/update-doctor/${id}`,
      formData,
      adminAuth()
    )
);

export const deleteDoctor = makeThunk(
  "admin/deleteDoctor",
  (id) =>
    axios.delete(
      `${backendUrl}/api/admin/delete-doctor/${id}`,
      adminAuth()
    )
);

export const changeDoctorAvailability = makeThunk(
  "admin/changeDoctorAvailability",
  (id) =>
    axios.patch(
      `${backendUrl}/api/admin/change-availability/${id}`,
      {},
      adminAuth()
    )
);

// ---------------- ENQUIRIES & APPLICATIONS ----------------

export const getAllEnquiries = makeThunk(
  "admin/getAllEnquiries",
  () =>
    axios.get(
      `${backendUrl}/api/admin/all-enquiries`,
      adminAuth()
    )
);

export const deleteEnquiry = makeThunk(
  "admin/deleteEnquiry",
  (id) =>
    axios.delete(
      `${backendUrl}/api/admin/all-enquiries/${id}`,
      adminAuth()
    )
);

export const getAllJobApplications = makeThunk(
  "admin/getAllJobApplications",
  () =>
    axios.get(
      `${backendUrl}/api/admin/all-applications`,
      adminAuth()
    )
);

export const deleteJobApplication = makeThunk(
  "admin/deleteJobApplication",
  (id) =>
    axios.delete(
      `${backendUrl}/api/admin/all-applications/${id}`,
      adminAuth()
    )
);

// ---------------- HOLIDAYS ----------------

export const addHoliday = makeThunk(
  "admin/addHoliday",
  (data) =>
    axios.post(
      `${backendUrl}/api/admin/add-holiday`,
      data,
      adminAuth()
    )
);

export const getHolidays = makeThunk(
  "admin/getHolidays",
  () =>
    axios.get(
      `${backendUrl}/api/admin/list-holidays`,
      adminAuth()
    )
);

export const deleteHoliday = makeThunk(
  "admin/deleteHoliday",
  (holidayId) =>
    axios.delete(
      `${backendUrl}/api/admin/delete-holiday/${holidayId}`,
      adminAuth()
    )
);

export const updateHoliday = makeThunk(
  "admin/updateHoliday",
  ({ id, data }) =>
    axios.put(
      `${backendUrl}/api/admin/holiday-update/${id}`,
      data,
      adminAuth()
    )
);

// ---------------- DASHBOARD ----------------

export const getAdminDashboard = makeThunk(
  "admin/getAdminDashboard",
  () =>
    axios.get(
      `${backendUrl}/api/admin/admin-dashboard`,
      adminAuth()
    )
);

// ---------------- PATIENTS ----------------

export const getAllPatient = makeThunk(
  "admin/getAllPatient",
  (params = {}) =>
    axios.get(
      `${backendUrl}/api/admin/patient/list`,
      {
        ...adminAuth(),
        params,
      }
    )
);

export const getPatient = makeThunk(
  "admin/getPatient",
  (patientId) =>
    axios.get(
      `${backendUrl}/api/admin/patient/single/${patientId}`,
      adminAuth()
    )
);

// ---------------- APPOINTMENTS ----------------

export const getAllAppointments = makeThunk(
  "admin/getAllAppointments",
  (params = {}) =>
    axios.get(
      `${backendUrl}/api/admin/appointment/list`,
      {
        ...adminAuth(),
        params,
      }
    )
);

export const getAdminAppointment = makeThunk(
  "admin/getAdminAppointment",
  (appointmentId) =>
    axios.get(
      `${backendUrl}/api/admin/appointment/single/${appointmentId}`,
      adminAuth()
    )
);

export const adminCancelAppointment = makeThunk(
  "admin/adminCancelAppointment",
  (appointmentId) =>
    axios.put(
      `${backendUrl}/api/admin/appointment/cancel/${appointmentId}`,
      {},
      adminAuth()
    )
);

export const markAppointmentCompleted = makeThunk(
  "admin/markAppointmentCompleted",
  (appointmentId) =>
    axios.put(
      `${backendUrl}/api/admin/appointment/complete/${appointmentId}`,
      {},
      adminAuth()
    )
);

// ---------------- OFFLINE PAYMENTS ----------------

export const getOfflinePaymentRequests = makeThunk(
  "admin/getOfflinePaymentRequests",
  () =>
    axios.get(
      `${backendUrl}/api/admin/offline-requests`,
      adminAuth()
    )
);

export const approveOfflinePayment = makeThunk(
  "admin/approveOfflinePayment",
  (appointmentId) =>
    axios.put(
      `${backendUrl}/api/admin/approve-offline/${appointmentId}`,
      {},
      adminAuth()
    )
);

export const rejectOfflinePayment = makeThunk(
  "admin/rejectOfflinePayment",
  (appointmentId) =>
    axios.put(
      `${backendUrl}/api/admin/reject-offline/${appointmentId}`,
      {},
      adminAuth()
    )
);

// ---------------- DOCTOR LEAVES ----------------

export const getAllLeaves = makeThunk(
  "admin/getAllLeaves",
  (params = {}) =>
    axios.get(
      `${backendUrl}/api/admin/all-leaves`,
      {
        ...adminAuth(),
        params,
      }
    )
);

export const getPendingLeaves = makeThunk(
  "admin/getPendingLeaves",
  () =>
    axios.get(
      `${backendUrl}/api/admin/pending`,
      adminAuth()
    )
);

export const getAdminSingleLeave = makeThunk(
  "admin/getAdminSingleLeave",
  (leaveId) =>
    axios.get(
      `${backendUrl}/api/admin/pending/${leaveId}`,
      adminAuth()
    )
);

// Preserve the complete backend error response for conflicts.
export const approveLeave = createAsyncThunk(
  "admin/approveLeave",
  async ({ leaveId, ...data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/admin/approve/${leaveId}`,
        data,
        adminAuth()
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message:
            error.message || "Unable to approve leave.",
        }
      );
    }
  }
);

export const rejectLeave = makeAsyncThunkForLeave(
  "admin/rejectLeave",
  ({ leaveId, ...data }) =>
    axios.put(
      `${backendUrl}/api/admin/reject/${leaveId}`,
      data,
      adminAuth()
    )
);

export const cancelApprovedLeave = makeAsyncThunkForLeave(
  "admin/cancelApprovedLeave",
  ({ leaveId, ...data }) =>
    axios.put(
      `${backendUrl}/api/admin/cancel/${leaveId}`,
      data,
      adminAuth()
    )
);

// Leave actions retain the full backend error object.
function makeAsyncThunkForLeave(type, request) {
  return createAsyncThunk(
    type,
    async (arg, { rejectWithValue }) => {
      try {
        const response = await request(arg);
        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data || {
            message:
              error.message || "Leave request failed.",
          }
        );
      }
    }
  );
}

// ---------------- REDUX STATE ----------------

const existingAdminToken =
  sessionStorage.getItem("adminToken") || "";

const initialState = {
  adminToken: existingAdminToken,
  isAdminAuthenticated: Boolean(existingAdminToken),
  admin: null,

  doctors: [],
  doctor: null,

  enquiries: [],
  applications: [],

  holidays: [],
  dashboard: null,

  patients: [],
  patient: null,

  appointments: [],
  appointment: null,

  offlinePaymentRequests: [],

  leaves: [],
  leave: null,

  loading: false,
  error: null,
  successMessage: null,
};

// ---------------- SLICE ----------------

const adminSlice = createSlice({
  name: "admin",
  initialState,

  reducers: {
    adminLogout: (state) => {
      state.adminToken = "";
      state.isAdminAuthenticated = false;
      state.admin = null;

      sessionStorage.removeItem("adminToken");
    },

    clearAdminError: (state) => {
      state.error = null;
    },

    clearAdminMessage: (state) => {
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // AUTH
      .addCase(adminLogin.fulfilled, (state, action) => {
        const token = action.payload?.token || "";

        state.adminToken = token;
        state.isAdminAuthenticated = Boolean(token);
        state.admin = action.payload?.admin || null;

        if (token) {
          sessionStorage.setItem("adminToken", token);
        } else {
          sessionStorage.removeItem("adminToken");
        }
      })

      // DOCTORS
      .addCase(listDoctors.fulfilled, (state, action) => {
        state.doctors = action.payload?.doctors || [];
      })

      .addCase(getDoctor.fulfilled, (state, action) => {
        state.doctor = action.payload?.doctor || null;
      })

      .addCase(addDoctor.fulfilled, (state, action) => {
        if (action.payload?.doctor) {
          state.doctors.unshift(action.payload.doctor);
        }
      })

      .addCase(updateDoctor.fulfilled, (state, action) => {
        const updatedDoctor = action.payload?.doctor;

        if (updatedDoctor) {
          state.doctors = state.doctors.map((item) =>
            String(item._id || item.id) ===
            String(updatedDoctor._id || updatedDoctor.id)
              ? updatedDoctor
              : item
          );

          state.doctor = updatedDoctor;
        }
      })

      .addCase(deleteDoctor.fulfilled, (state, action) => {
        const id = action.meta.arg;

        state.doctors = state.doctors.filter(
          (item) =>
            String(item._id || item.id) !== String(id)
        );
      })

      .addCase(
        changeDoctorAvailability.fulfilled,
        (state, action) => {
          const id = action.meta.arg;

          state.doctors = state.doctors.map((item) =>
            String(item._id || item.id) === String(id)
              ? {
                  ...item,
                  available: action.payload?.available,
                }
              : item
          );
        }
      )

      // ENQUIRIES
      .addCase(getAllEnquiries.fulfilled, (state, action) => {
        state.enquiries = action.payload?.enquiries || [];
      })

      .addCase(deleteEnquiry.fulfilled, (state, action) => {
        state.enquiries = state.enquiries.filter(
          (item) => String(item._id) !== String(action.meta.arg)
        );
      })

      // JOB APPLICATIONS
      .addCase(
        getAllJobApplications.fulfilled,
        (state, action) => {
          state.applications =
            action.payload?.applications || [];
        }
      )

      .addCase(
        deleteJobApplication.fulfilled,
        (state, action) => {
          state.applications = state.applications.filter(
            (item) =>
              String(item._id) !== String(action.meta.arg)
          );
        }
      )

      // HOLIDAYS
      .addCase(getHolidays.fulfilled, (state, action) => {
        state.holidays = action.payload?.holidays || [];
      })

      .addCase(addHoliday.fulfilled, (state, action) => {
        if (action.payload?.holiday) {
          state.holidays.push(action.payload.holiday);
        }
      })

      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.holidays = state.holidays.filter(
          (item) => String(item._id) !== String(action.meta.arg)
        );
      })

      .addCase(updateHoliday.fulfilled, (state, action) => {
        const holiday = action.payload?.holiday;

        if (holiday) {
          state.holidays = state.holidays.map((item) =>
            String(item._id) === String(holiday._id)
              ? holiday
              : item
          );
        }
      })

      // DASHBOARD
      .addCase(getAdminDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload?.dashboard || null;
      })

      // PATIENTS
      .addCase(getAllPatient.fulfilled, (state, action) => {
        state.patients = action.payload?.patients || [];
      })

      .addCase(getPatient.fulfilled, (state, action) => {
        state.patient = action.payload?.patient || null;
        state.appointments = action.payload?.appointments || [];
      })

      // APPOINTMENTS
      .addCase(getAllAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload?.appointments || [];
      })

      .addCase(getAdminAppointment.fulfilled, (state, action) => {
        state.appointment = action.payload?.appointment || null;
      })

      .addCase(
        adminCancelAppointment.fulfilled,
        (state, action) => {
          const updated = action.payload?.appointment;

          if (updated) {
            state.appointments = state.appointments.map(
              (item) =>
                String(item._id) === String(updated._id)
                  ? updated
                  : item
            );

            state.appointment = updated;
          }
        }
      )

      .addCase(
        markAppointmentCompleted.fulfilled,
        (state, action) => {
          const updated = action.payload?.appointment;

          if (updated) {
            state.appointments = state.appointments.map(
              (item) =>
                String(item._id) === String(updated._id)
                  ? updated
                  : item
            );

            state.appointment = updated;
          }
        }
      )

      // OFFLINE PAYMENTS
      .addCase(
        getOfflinePaymentRequests.fulfilled,
        (state, action) => {
          state.offlinePaymentRequests =
            action.payload?.appointments || [];
        }
      )

      .addCase(
        approveOfflinePayment.fulfilled,
        (state, action) => {
          state.offlinePaymentRequests =
            state.offlinePaymentRequests.filter(
              (item) =>
                String(item._id) !== String(action.meta.arg)
            );
        }
      )

      .addCase(
        rejectOfflinePayment.fulfilled,
        (state, action) => {
          state.offlinePaymentRequests =
            state.offlinePaymentRequests.filter(
              (item) =>
                String(item._id) !== String(action.meta.arg)
            );
        }
      )

      // LEAVES
      .addCase(getAllLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload?.leaves || [];
      })

      .addCase(getPendingLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload?.leaves || [];
      })

      .addCase(
        getAdminSingleLeave.fulfilled,
        (state, action) => {
          state.leave = action.payload?.leave || null;
        }
      )

      .addCase(approveLeave.fulfilled, (state, action) => {
        const updated = action.payload?.leave;

        if (updated) {
          state.leaves = state.leaves.map((item) =>
            String(item._id) === String(updated._id)
              ? updated
              : item
          );

          state.leave = updated;
        }
      })

      .addCase(rejectLeave.fulfilled, (state, action) => {
        const updated = action.payload?.leave;

        if (updated) {
          state.leaves = state.leaves.map((item) =>
            String(item._id) === String(updated._id)
              ? updated
              : item
          );

          state.leave = updated;
        }
      })

      .addCase(
        cancelApprovedLeave.fulfilled,
        (state, action) => {
          const updated = action.payload?.leave;

          if (updated) {
            state.leaves = state.leaves.map((item) =>
              String(item._id) === String(updated._id)
                ? updated
                : item
            );

            state.leave = updated;
          }
        }
      )

      // LOADING
      .addMatcher(
        (action) =>
          action.type.startsWith("admin/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
          state.successMessage = null;
        }
      )

      .addMatcher(
        (action) =>
          action.type.startsWith("admin/") &&
          action.type.endsWith("/fulfilled"),
        (state, action) => {
          state.loading = false;
          state.error = null;
          state.successMessage =
            action.payload?.message || null;
        }
      )

      .addMatcher(
        (action) =>
          action.type.startsWith("admin/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;

          const error = action.payload || action.error?.message;

          state.error =
            typeof error === "string"
              ? error
              : error?.message || "Request failed";
        }
      );
  },
});

export const {
  adminLogout,
  clearAdminError,
  clearAdminMessage,
} = adminSlice.actions;

export default adminSlice.reducer;
