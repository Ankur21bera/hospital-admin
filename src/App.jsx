import React, { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

import Login from "./Pages/Login";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";

import Dashboard from "./Pages/admin/Dashboard";
import AddDoctor from "./Pages/admin/Adddoctor";
import Doctorlist from "./Pages/admin/Doctorlist";
import AllAppointments from "./Pages/admin/Allappointment";
import Enquiries from "./Pages/admin/Enquiries";
import ManageHoliday from "./Pages/admin/Manageholiday";
import Manageleave from "./Pages/admin/Manageleave";

import DoctorDashboard from "./Pages/Doctor/Doctordashboard";
import DoctorAllAppointments from "./Pages/Doctor/Doctorappointment";
import DoctorProfile from "./Pages/Doctor/Doctorprofile";
import Appointmentdetail from "./Pages/Doctor/Appointmentdetail";
import Doctorleave from "./Pages/Doctor/Doctorleave";


const ProtectedRoute = ({ role }) => {
  const location = useLocation();

  const adminToken = useSelector(
    (state) => state.admin?.adminToken
  );
  const doctorToken = useSelector(
    (state) => state.doctor?.doctorToken
  );

  const savedAdminToken = localStorage.getItem("adminToken");
  const savedDoctorToken = localStorage.getItem("doctorToken");

  if (role === "admin" && !(adminToken || savedAdminToken)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (role === "doctor" && !(doctorToken || savedDoctorToken)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "14px",
            padding: "14px 16px",
            fontSize: "13px",
          },
        }}
      />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/admin-dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/admin/add-doctor"
              element={<AddDoctor />}
            />
            <Route
              path="/admin/doctor-list"
              element={<Doctorlist />}
            />
            <Route
              path="/admin/appointments"
              element={<AllAppointments />}
            />
            <Route
              path="/admin/enquiries"
              element={<Enquiries />}
            />
            <Route
              path="/admin/manage-holidays"
              element={<ManageHoliday />}
            />
            <Route path="/admin/manage-leave" element={<Manageleave/>}/>
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="doctor" />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/doctor-dashboard"
              element={<DoctorDashboard />}
            />
            <Route
              path="/doctor/appointments"
              element={<DoctorAllAppointments />}
            />
            <Route
              path="/doctor/appointment-details/:appointmentId?"
              element={<Appointmentdetail />}
            />
            <Route
              path="/doctor/profile"
              element={<DoctorProfile />}
            />
            <Route path="/doctor/leave" element={<Doctorleave/>}/>
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;