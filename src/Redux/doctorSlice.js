// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import axios from "axios";

// const backendUrl = "http://localhost:4000";

// // const doctorAuth = () => ({
// //   headers: {
// //     Authorization: `Bearer ${localStorage.getItem("doctorToken") || ""}`,
// //   },
// // });


// const doctorAuth = () => {
//   const token = sessionStorage.getItem("doctorToken") || "";

//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };
// };


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

// export const doctorLogin = makeThunk("doctor/doctorLogin", (data) =>
//   axios.post(`${backendUrl}/api/doctor/doctor-login`, data)
// );

// // ---------------- PROFILE ----------------

// export const doctorProfile = makeThunk("doctor/doctorProfile", () =>
//   axios.get(`${backendUrl}/api/doctor/doctor-profile`, doctorAuth())
// );

// export const updateDoctorProfile = makeThunk(
//   "doctor/updateDoctorProfile",
//   (formData) =>
//     axios.put(`${backendUrl}/api/doctor/doctor-update`, formData, doctorAuth())
// );

// export const changeDoctorAvailability = makeThunk(
//   "doctor/changeDoctorAvailability",
//   (available) =>
//     axios.put(
//       `${backendUrl}/api/doctor/change-availability`,
//       { available },
//       doctorAuth()
//     )
// );

// // ---------------- DASHBOARD ----------------

// export const doctorDashboard = makeThunk("doctor/doctorDashboard", () =>
//   axios.get(`${backendUrl}/api/doctor/doctor-dashboard`, doctorAuth())
// );

// // ---------------- APPOINTMENTS ----------------

// export const getDoctorAppointments = makeThunk(
//   "doctor/getDoctorAppointments",
//   (params = {}) =>
//     axios.get(`${backendUrl}/api/doctor/appointments`, {
//       ...doctorAuth(),
//       params,
//     })
// );

// export const getTodayAppointments = makeThunk(
//   "doctor/getTodayAppointments",
//   () =>
//     axios.get(`${backendUrl}/api/doctor/appointments/today`, doctorAuth())
// );

// export const getUpcomingAppointments = makeThunk(
//   "doctor/getUpcomingAppointments",
//   () =>
//     axios.get(`${backendUrl}/api/doctor/appointments/upcoming`, doctorAuth())
// );

// export const getCompletedAppointments = makeThunk(
//   "doctor/getCompletedAppointments",
//   () =>
//     axios.get(`${backendUrl}/api/doctor/appointments/completed`, doctorAuth())
// );

// export const getCancelledAppointments = makeThunk(
//   "doctor/getCancelledAppointments",
//   () =>
//     axios.get(`${backendUrl}/api/doctor/appointments/cancelled`, doctorAuth())
// );

// export const getDoctorAppointment = makeThunk(
//   "doctor/getDoctorAppointment",
//   (appointmentId) =>
//     axios.get(
//       `${backendUrl}/api/doctor/appointments/${appointmentId}`,
//       doctorAuth()
//     )
// );

// export const doctorCancelAppointment = makeThunk(
//   "doctor/doctorCancelAppointment",
//   (appointmentId) =>
//     axios.put(
//       `${backendUrl}/api/doctor/appointments/cancel/${appointmentId}`,
//       {},
//       doctorAuth()
//     )
// );

// export const doctorCompleteAppointment = makeThunk(
//   "doctor/doctorCompleteAppointment",
//   (appointmentId) =>
//     axios.put(
//       `${backendUrl}/api/doctor/appointments/complete/${appointmentId}`,
//       {},
//       doctorAuth()
//     )
// );

// // ---------------- PATIENTS ----------------

// export const getDoctorPatients = makeThunk("doctor/getDoctorPatients", () =>
//   axios.get(`${backendUrl}/api/doctor/patients`, doctorAuth())
// );

// export const getDoctorPatient = makeThunk(
//   "doctor/getDoctorPatient",
//   (patientId) =>
//     axios.get(
//       `${backendUrl}/api/doctor/patients/${patientId}`,
//       doctorAuth()
//     )
// );

// // ---------------- LEAVES ----------------

// export const applyLeave = makeThunk("doctor/applyLeave", (data) =>
//   axios.post(`${backendUrl}/api/doctor/apply-leave`, data, doctorAuth())
// );

// export const getMyLeaves = makeThunk(
//   "doctor/getMyLeaves",
//   (params = {}) =>
//     axios.get(`${backendUrl}/api/doctor/leave-list`, {
//       ...doctorAuth(),
//       params,
//     })
// );

// export const getSingleLeave = makeThunk(
//   "doctor/getSingleLeave",
//   (leaveId) =>
//     axios.get(`${backendUrl}/api/doctor/leave-list/${leaveId}`, doctorAuth())
// );

// export const cancelLeave = makeThunk(
//   "doctor/cancelLeave",
//   (leaveId) =>
//     axios.put(
//       `${backendUrl}/api/doctor/cancel-leave/${leaveId}`,
//       {},
//       doctorAuth()
//     )
// );

// // ---------------- REDUX STATE ----------------

// const doctorSlice = createSlice({
//   name: "doctor",

//   initialState: {
//     doctorToken: sessionStorage.getItem("doctorToken") || "",
//     isDoctorAuthenticated: Boolean(sessionStorage.getItem("doctorToken")),
//     doctor: null,

//     dashboard: null,
//     appointments: [],
//     appointment: null,
//     patients: [],
//     patient: null,
//     leaves: [],
//     leave: null,

//     loading: false,
//     error: null,
//     successMessage: null,
//   },

//   reducers: {
//     doctorLogout: (state) => {
//       state.doctorToken = "";
//       state.isDoctorAuthenticated = false;
//       state.doctor = null;
//       localStorage.removeItem("doctorToken");
//     },

//     clearDoctorError: (state) => {
//       state.error = null;
//     },

//     clearDoctorMessage: (state) => {
//       state.successMessage = null;
//     },
//   },

//   extraReducers: (builder) => {
//     builder
//       .addCase(doctorLogin.fulfilled, (state, action) => {
//         state.doctorToken = action.payload.token || "";
//         state.isDoctorAuthenticated = Boolean(action.payload.token);
//         state.doctor = action.payload.doctor || null;

//         if (action.payload.token) {
//           localStorage.setItem("doctorToken", action.payload.token);
//         }
//       })

//       .addCase(doctorProfile.fulfilled, (state, action) => {
//         state.doctor = action.payload.doctor || null;
//       })

//       .addCase(updateDoctorProfile.fulfilled, (state, action) => {
//         state.doctor = action.payload.doctor || state.doctor;
//       })

//       .addCase(changeDoctorAvailability.fulfilled, (state, action) => {
//         if (state.doctor) {
//           state.doctor.available = action.payload.available;
//         }
//       })

//       .addCase(doctorDashboard.fulfilled, (state, action) => {
//         state.dashboard = action.payload.dashboard || null;
//       })

//       .addCase(getDoctorAppointments.fulfilled, (state, action) => {
//         state.appointments = action.payload.appointments || [];
//       })
//       .addCase(getTodayAppointments.fulfilled, (state, action) => {
//         state.appointments = action.payload.appointments || [];
//       })
//       .addCase(getUpcomingAppointments.fulfilled, (state, action) => {
//         state.appointments = action.payload.appointments || [];
//       })
//       .addCase(getCompletedAppointments.fulfilled, (state, action) => {
//         state.appointments = action.payload.appointments || [];
//       })
//       .addCase(getCancelledAppointments.fulfilled, (state, action) => {
//         state.appointments = action.payload.appointments || [];
//       })
//       .addCase(getDoctorAppointment.fulfilled, (state, action) => {
//         state.appointment = action.payload.appointment || null;
//       })

//       .addCase(doctorCancelAppointment.fulfilled, (state, action) => {
//         const updated = action.payload.appointment;
//         if (updated) {
//           state.appointments = state.appointments.map((item) =>
//             String(item._id) === String(updated._id) ? updated : item
//           );
//           state.appointment = updated;
//         }
//       })
//       .addCase(doctorCompleteAppointment.fulfilled, (state, action) => {
//         const updated = action.payload.appointment;
//         if (updated) {
//           state.appointments = state.appointments.map((item) =>
//             String(item._id) === String(updated._id) ? updated : item
//           );
//           state.appointment = updated;
//         }
//       })

//       .addCase(getDoctorPatients.fulfilled, (state, action) => {
//         state.patients = action.payload.patients || [];
//       })
//       .addCase(getDoctorPatient.fulfilled, (state, action) => {
//         state.patient = action.payload.patient || null;
//         state.appointments = action.payload.appointmentHistory || [];
//       })

//       .addCase(getMyLeaves.fulfilled, (state, action) => {
//         state.leaves = action.payload.leaves || [];
//       })
//       .addCase(getSingleLeave.fulfilled, (state, action) => {
//         state.leave = action.payload.leave || null;
//       })
//       .addCase(applyLeave.fulfilled, (state, action) => {
//         if (action.payload.leave) {
//           state.leaves.unshift(action.payload.leave);
//         }
//       })
//       .addCase(cancelLeave.fulfilled, (state, action) => {
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
//           action.type.startsWith("doctor/") &&
//           action.type.endsWith("/pending"),
//         (state) => {
//           state.loading = true;
//           state.error = null;
//           state.successMessage = null;
//         }
//       )
//       .addMatcher(
//         (action) =>
//           action.type.startsWith("doctor/") &&
//           action.type.endsWith("/fulfilled"),
//         (state, action) => {
//           state.loading = false;
//           state.error = null;
//           state.successMessage = action.payload?.message || null;
//         }
//       )
//       .addMatcher(
//         (action) =>
//           action.type.startsWith("doctor/") &&
//           action.type.endsWith("/rejected"),
//         (state, action) => {
//           state.loading = false;
//           state.error = action.payload || action.error.message;
//         }
//       );
//   },
// });

// export const { doctorLogout, clearDoctorError, clearDoctorMessage } =
//   doctorSlice.actions;

// export default doctorSlice.reducer;



import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const backendUrl = "https://hospital-backend-gray.vercel.app";

// ---------------- DOCTOR AUTH ----------------

const getDoctorToken = () => sessionStorage.getItem("doctorToken") || "";

const doctorAuth = () => ({
  headers: {
    Authorization: `Bearer ${getDoctorToken()}`,
  },
});

// ---------------- COMMON THUNK ----------------

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

export const doctorLogin = makeThunk("doctor/doctorLogin", (data) =>
  axios.post(`${backendUrl}/api/doctor/doctor-login`, data)
);

// ---------------- PROFILE ----------------

export const doctorProfile = makeThunk("doctor/doctorProfile", () =>
  axios.get(`${backendUrl}/api/doctor/doctor-profile`, doctorAuth())
);

export const updateDoctorProfile = makeThunk(
  "doctor/updateDoctorProfile",
  (formData) =>
    axios.put(
      `${backendUrl}/api/doctor/doctor-update`,
      formData,
      doctorAuth()
    )
);

export const changeDoctorAvailability = makeThunk(
  "doctor/changeDoctorAvailability",
  (available) =>
    axios.put(
      `${backendUrl}/api/doctor/change-availability`,
      { available },
      doctorAuth()
    )
);

// ---------------- DASHBOARD ----------------

export const doctorDashboard = makeThunk("doctor/doctorDashboard", () =>
  axios.get(`${backendUrl}/api/doctor/doctor-dashboard`, doctorAuth())
);

// ---------------- APPOINTMENTS ----------------

export const getDoctorAppointments = makeThunk(
  "doctor/getDoctorAppointments",
  (params = {}) =>
    axios.get(`${backendUrl}/api/doctor/appointments`, {
      ...doctorAuth(),
      params,
    })
);

export const getTodayAppointments = makeThunk(
  "doctor/getTodayAppointments",
  () =>
    axios.get(`${backendUrl}/api/doctor/appointments/today`, doctorAuth())
);

export const getUpcomingAppointments = makeThunk(
  "doctor/getUpcomingAppointments",
  () =>
    axios.get(`${backendUrl}/api/doctor/appointments/upcoming`, doctorAuth())
);

export const getCompletedAppointments = makeThunk(
  "doctor/getCompletedAppointments",
  () =>
    axios.get(`${backendUrl}/api/doctor/appointments/completed`, doctorAuth())
);

export const getCancelledAppointments = makeThunk(
  "doctor/getCancelledAppointments",
  () =>
    axios.get(`${backendUrl}/api/doctor/appointments/cancelled`, doctorAuth())
);

export const getDoctorAppointment = makeThunk(
  "doctor/getDoctorAppointment",
  (appointmentId) =>
    axios.get(
      `${backendUrl}/api/doctor/appointments/${appointmentId}`,
      doctorAuth()
    )
);

export const doctorCancelAppointment = makeThunk(
  "doctor/doctorCancelAppointment",
  (appointmentId) =>
    axios.put(
      `${backendUrl}/api/doctor/appointments/cancel/${appointmentId}`,
      {},
      doctorAuth()
    )
);

export const doctorCompleteAppointment = makeThunk(
  "doctor/doctorCompleteAppointment",
  (appointmentId) =>
    axios.put(
      `${backendUrl}/api/doctor/appointments/complete/${appointmentId}`,
      {},
      doctorAuth()
    )
);

// ---------------- PATIENTS ----------------

export const getDoctorPatients = makeThunk("doctor/getDoctorPatients", () =>
  axios.get(`${backendUrl}/api/doctor/patients`, doctorAuth())
);

export const getDoctorPatient = makeThunk(
  "doctor/getDoctorPatient",
  (patientId) =>
    axios.get(
      `${backendUrl}/api/doctor/patients/${patientId}`,
      doctorAuth()
    )
);

// ---------------- LEAVES ----------------

export const applyLeave = makeThunk("doctor/applyLeave", (data) =>
  axios.post(`${backendUrl}/api/doctor/apply-leave`, data, doctorAuth())
);

export const getMyLeaves = makeThunk(
  "doctor/getMyLeaves",
  (params = {}) =>
    axios.get(`${backendUrl}/api/doctor/leave-list`, {
      ...doctorAuth(),
      params,
    })
);

export const getSingleLeave = makeThunk(
  "doctor/getSingleLeave",
  (leaveId) =>
    axios.get(`${backendUrl}/api/doctor/leave-list/${leaveId}`, doctorAuth())
);

export const cancelLeave = makeThunk(
  "doctor/cancelLeave",
  (leaveId) =>
    axios.put(
      `${backendUrl}/api/doctor/cancel-leave/${leaveId}`,
      {},
      doctorAuth()
    )
);

// ---------------- REDUX STATE ----------------

const existingDoctorToken = getDoctorToken();

const initialState = {
  doctorToken: existingDoctorToken,
  isDoctorAuthenticated: Boolean(existingDoctorToken),
  doctor: null,

  dashboard: null,
  appointments: [],
  appointment: null,
  patients: [],
  patient: null,
  leaves: [],
  leave: null,

  loading: false,
  error: null,
  successMessage: null,
};

const doctorSlice = createSlice({
  name: "doctor",
  initialState,

  reducers: {
    doctorLogout: (state) => {
      state.doctorToken = "";
      state.isDoctorAuthenticated = false;
      state.doctor = null;

      state.dashboard = null;
      state.appointments = [];
      state.appointment = null;
      state.patients = [];
      state.patient = null;
      state.leaves = [];
      state.leave = null;

      state.loading = false;
      state.error = null;
      state.successMessage = null;

      sessionStorage.removeItem("doctorToken");
    },

    clearDoctorError: (state) => {
      state.error = null;
    },

    clearDoctorMessage: (state) => {
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ---------------- LOGIN ----------------
      .addCase(doctorLogin.fulfilled, (state, action) => {
        const token = action.payload?.token || "";

        state.doctorToken = token;
        state.isDoctorAuthenticated = Boolean(token);
        state.doctor = action.payload?.doctor || null;

        if (token) {
          sessionStorage.setItem("doctorToken", token);
        } else {
          sessionStorage.removeItem("doctorToken");
        }
      })

      // ---------------- PROFILE ----------------
      .addCase(doctorProfile.fulfilled, (state, action) => {
        state.doctor = action.payload?.doctor || null;
      })

      .addCase(updateDoctorProfile.fulfilled, (state, action) => {
        state.doctor = action.payload?.doctor || state.doctor;
      })

      .addCase(changeDoctorAvailability.fulfilled, (state, action) => {
        if (state.doctor) {
          state.doctor.available = action.payload?.available;
        }
      })

      // ---------------- DASHBOARD ----------------
      .addCase(doctorDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload?.dashboard || null;
      })

      // ---------------- APPOINTMENTS ----------------
      .addCase(getDoctorAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload?.appointments || [];
      })

      .addCase(getTodayAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload?.appointments || [];
      })

      .addCase(getUpcomingAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload?.appointments || [];
      })

      .addCase(getCompletedAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload?.appointments || [];
      })

      .addCase(getCancelledAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload?.appointments || [];
      })

      .addCase(getDoctorAppointment.fulfilled, (state, action) => {
        state.appointment = action.payload?.appointment || null;
      })

      .addCase(doctorCancelAppointment.fulfilled, (state, action) => {
        const updated = action.payload?.appointment;

        if (updated) {
          state.appointments = state.appointments.map((item) =>
            String(item._id) === String(updated._id) ? updated : item
          );

          state.appointment = updated;
        }
      })

      .addCase(doctorCompleteAppointment.fulfilled, (state, action) => {
        const updated = action.payload?.appointment;

        if (updated) {
          state.appointments = state.appointments.map((item) =>
            String(item._id) === String(updated._id) ? updated : item
          );

          state.appointment = updated;
        }
      })

      // ---------------- PATIENTS ----------------
      .addCase(getDoctorPatients.fulfilled, (state, action) => {
        state.patients = action.payload?.patients || [];
      })

      .addCase(getDoctorPatient.fulfilled, (state, action) => {
        state.patient = action.payload?.patient || null;
        state.appointments = action.payload?.appointmentHistory || [];
      })

      // ---------------- LEAVES ----------------
      .addCase(getMyLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload?.leaves || [];
      })

      .addCase(getSingleLeave.fulfilled, (state, action) => {
        state.leave = action.payload?.leave || null;
      })

      .addCase(applyLeave.fulfilled, (state, action) => {
        if (action.payload?.leave) {
          state.leaves.unshift(action.payload.leave);
        }
      })

      .addCase(cancelLeave.fulfilled, (state, action) => {
        const updatedLeave = action.payload?.leave;

        if (updatedLeave) {
          state.leaves = state.leaves.map((item) =>
            String(item._id) === String(updatedLeave._id)
              ? updatedLeave
              : item
          );

          state.leave = updatedLeave;
        }
      })

      // ---------------- COMMON PENDING ----------------
      .addMatcher(
        (action) =>
          action.type.startsWith("doctor/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
          state.successMessage = null;
        }
      )

      // ---------------- COMMON FULFILLED ----------------
      .addMatcher(
        (action) =>
          action.type.startsWith("doctor/") &&
          action.type.endsWith("/fulfilled"),
        (state, action) => {
          state.loading = false;
          state.error = null;
          state.successMessage = action.payload?.message || null;
        }
      )

      // ---------------- COMMON REJECTED ----------------
      .addMatcher(
        (action) =>
          action.type.startsWith("doctor/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || "Request failed";
        }
      );
  },
});

export const {
  doctorLogout,
  clearDoctorError,
  clearDoctorMessage,
} = doctorSlice.actions;

export default doctorSlice.reducer;
