import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Filter,
  HeartPulse,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  X,
  XCircle,
  AlertTriangle,
  Bell,
  LoaderCircle,
  ClipboardList,
  BadgeCheck,
} from "lucide-react";

import {
  getTodayAppointments,
  getUpcomingAppointments,
  getCompletedAppointments,
  getCancelledAppointments,
  getDoctorAppointment,
  doctorCancelAppointment,
  doctorCompleteAppointment,
  getDoctorPatients,
  getDoctorPatient,
} from "../../Redux/doctorSlice";


const getInitials = (name = "Patient") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || "")
    .join("")
    .toUpperCase();

const getPatient = (appointment) =>
  appointment?.userData ||
  appointment?.patientData ||
  appointment?.patient ||
  {};

const getDoctor = (appointment) =>
  appointment?.docData || appointment?.doctorData || appointment?.doctor || {};

const formatDate = (value) => {
  if (!value) return "Not provided";

  const raw = String(value);

  // Supports DD_MM_YYYY and DD-MM-YYYY.
  const legacy = raw.match(/^(\d{2})[-_](\d{2})[-_](\d{4})$/);

  const normalized = legacy ? `${legacy[3]}-${legacy[2]}-${legacy[1]}` : raw;

  // Avoid timezone shifts for date-only strings.
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(normalized)
      ? `${normalized}T00:00:00`
      : normalized,
  );

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatus = (appointment) => {
  if (appointment?.cancelled) {
    return {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
      dot: "bg-rose-500",
    };
  }

  if (appointment?.isCompleted) {
    return {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  return {
    label: "Upcoming",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
  };
};

const getPaymentStatus = (appointment) => {
  const value = String(appointment?.paymentStatus || "").toLowerCase();

  if (value === "refunded") {
    return {
      label: "Refunded",
      className: "bg-violet-50 text-violet-700",
    };
  }

  if (value === "failed") {
    return {
      label: "Failed",
      className: "bg-rose-50 text-rose-700",
    };
  }

  if (value === "paid" || appointment?.payment === true) {
    return {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
  };
};

const getAmount = (appointment) =>
  Number(appointment?.amount ?? appointment?.fees ?? 0);

const getAddress = (value) => {
  if (!value) return "Not provided";
  if (typeof value === "string") return value;

  return (
    [value.line1, value.line2, value.city, value.state, value.zipcode]
      .filter(Boolean)
      .join(", ") || "Not provided"
  );
};

const tabs = [
  {
    id: "today",
    label: "Today",
    icon: CalendarCheck,
  },
  {
    id: "upcoming",
    label: "Upcoming",
    icon: CalendarClock,
  },
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
  },
  {
    id: "cancelled",
    label: "Cancelled",
    icon: XCircle,
  },
];

const appointmentThunkMap = {
  today: getTodayAppointments,
  upcoming: getUpcomingAppointments,
  completed: getCompletedAppointments,
  cancelled: getCancelledAppointments,
};


const StatusBadge = ({ appointment }) => {
  const status = getStatus(appointment);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
};

const PaymentBadge = ({ appointment }) => {
  const payment = getPaymentStatus(appointment);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-semibold ${payment.className}`}
    >
      {payment.label}
    </span>
  );
};

const PatientAvatar = ({ name, image, size = "h-11 w-11" }) => (
  <div
    className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-700`}
  >
    {image ? (
      <img
        src={image}
        alt={name || "Patient"}
        className="h-full w-full object-cover"
      />
    ) : (
      getInitials(name)
    )}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = "blue", subtitle }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
        >
          <Icon size={21} />
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 text-xs leading-5 text-slate-400">{subtitle}</p>
      )}
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value, subValue }) => (
  <div className="flex min-w-0 gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 transition hover:border-blue-100 hover:bg-blue-50/30 sm:p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <Icon size={18} />
    </div>

    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Not provided"}
      </p>

      {subValue && (
        <p className="mt-1 break-words text-xs text-slate-500">{subValue}</p>
      )}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description, onRetry }) => (
  <div className="px-5 py-14 text-center sm:py-16">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      <Icon size={29} />
    </div>

    <h3 className="mt-5 text-lg font-bold text-slate-800">{title}</h3>

    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
      {description}
    </p>

    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    )}
  </div>
);


const Appointmentdetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { appointmentId } = useParams();

  const [activeTab, setActiveTab] = useState("today");
  const [activeSection, setActiveSection] = useState("appointments");

  // Component-local lists prevent patient history from replacing
  // appointment list data in the shared Redux state.
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [popup, setPopup] = useState(null);

  const [search, setSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [listLoading, setListLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [patientDetailsLoading, setPatientDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [listError, setListError] = useState("");
  const [patientError, setPatientError] = useState("");
  const [detailsError, setDetailsError] = useState("");

  const [counts, setCounts] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });


  const loadAppointments = useCallback(
    async (tab = activeTab, showToast = false) => {
      const thunk = appointmentThunkMap[tab];
      if (!thunk) return;

      setListLoading(true);
      setListError("");

      try {
        const result = await dispatch(thunk()).unwrap();

        if (result?.success === false) {
          throw new Error(result?.message || "Unable to load appointments.");
        }

        const list = Array.isArray(result?.appointments)
          ? result.appointments
          : [];

        setAppointments(list);

        // Keep the current tab's count in sync with its loaded list.
        setCounts((previous) => ({
          ...previous,
          [tab]: list.length,
        }));

        if (showToast) {
          toast.success("Appointments refreshed");
        }
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message ||
              "Unable to load appointments. Please try again.";

        setListError(message);
        setAppointments([]);

        if (showToast) toast.error(message);
      } finally {
        setListLoading(false);
      }
    },
    [dispatch, activeTab],
  );

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);

    const requests = Object.entries(appointmentThunkMap);

    try {
      const results = await Promise.all(
        requests.map(async ([key, thunk]) => {
          try {
            const result = await dispatch(thunk()).unwrap();

            if (result?.success === false) {
              throw new Error(
                result?.message || `Unable to load ${key} appointments`,
              );
            }

            const count = Array.isArray(result?.appointments)
              ? result.appointments.length
              : Number(result?.count || 0);

            return { key, count };
          } catch (error) {
            console.error(`Unable to load ${key} appointment count:`, error);

            return { key, count: null };
          }
        }),
      );

      setCounts((previous) => {
        const next = { ...previous };

        results.forEach(({ key, count }) => {
          // Do not replace a previously loaded count if an API fails.
          if (count !== null) {
            next[key] = count;
          }
        });

        return next;
      });
    } finally {
      setCountsLoading(false);
    }
  }, [dispatch]);


  const loadPatients = useCallback(
    async (showToast = false) => {
      setPatientsLoading(true);
      setPatientError("");

      try {
        const result = await dispatch(getDoctorPatients()).unwrap();

        if (result?.success === false) {
          throw new Error(result?.message || "Unable to load patients.");
        }

        const list = Array.isArray(result?.patients) ? result.patients : [];

        setPatients(list);

        if (showToast) toast.success("Patient list refreshed");
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Unable to load patients. Please try again.";

        setPatientError(message);

        if (showToast) toast.error(message);
      } finally {
        setPatientsLoading(false);
      }
    },
    [dispatch],
  );

  const loadAppointmentDetails = useCallback(
    async (id, openPopup = true) => {
      if (!id) return;

      setDetailsLoading(true);
      setDetailsError("");

      if (openPopup) {
        setSelectedAppointment(null);
        setPopup("appointment");
      }

      try {
        const result = await dispatch(getDoctorAppointment(id)).unwrap();

        if (!result?.appointment) {
          throw new Error("Appointment details were not returned.");
        }

        setSelectedAppointment(result.appointment);

        if (openPopup) setPopup("appointment");
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Unable to load appointment details.";

        setDetailsError(message);
        toast.error(message);
      } finally {
        setDetailsLoading(false);
      }
    },
    [dispatch],
  );

  const loadPatientDetails = useCallback(
    async (patientId) => {
      if (!patientId) {
        toast.error("Patient ID is not available.");
        return;
      }

      setPatientDetailsLoading(true);
      setPatientError("");
      setSelectedPatient(null);
      setPatientHistory([]);
      setCompletedHistory([]);
      setPopup("patient");

      try {
        const result = await dispatch(getDoctorPatient(patientId)).unwrap();

        if (result?.success === false) {
          throw new Error(result?.message || "Unable to load patient details.");
        }

        setSelectedPatient(result?.patient || null);

        setPatientHistory(
          Array.isArray(result?.appointmentHistory)
            ? result.appointmentHistory
            : [],
        );

        setCompletedHistory(
          Array.isArray(result?.previousCompletedAppointments)
            ? result.previousCompletedAppointments
            : [],
        );
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Unable to load patient details.";

        setPatientError(message);
        toast.error(message);
      } finally {
        setPatientDetailsLoading(false);
      }
    },
    [dispatch],
  );
  useEffect(() => {
    loadCounts();
    loadPatients();
  }, [loadCounts, loadPatients]);

  useEffect(() => {
    if (activeSection === "appointments") {
      loadAppointments(activeTab);
    }
  }, [activeSection, activeTab, loadAppointments]);

  // Support /doctor/appointment-details/:appointmentId.
  useEffect(() => {
    if (appointmentId) {
      loadAppointmentDetails(appointmentId);
    }
  }, [appointmentId, loadAppointmentDetails]);

  const handleAppointmentAction = async () => {
    if (!selectedAppointment?._id || !popup) return;

    if (selectedAppointment.cancelled || selectedAppointment.isCompleted) {
      toast.error("This appointment can no longer be changed.");
      return;
    }

    const action = popup;
    const appointmentIdToUpdate = selectedAppointment._id;

    setActionLoading(true);

    try {
      const thunk =
        action === "complete"
          ? doctorCompleteAppointment
          : doctorCancelAppointment;

      const result = await dispatch(thunk(appointmentIdToUpdate)).unwrap();

      if (result?.success === false) {
        throw new Error(result?.message || "Unable to update appointment.");
      }

      if (result?.appointment) {
        setSelectedAppointment(result.appointment);
      }

      toast.success(
        result?.message ||
          (action === "complete"
            ? "Appointment completed successfully"
            : "Appointment cancelled successfully"),
      );

      // Refresh list, all summary counts, and appointment details.
      await Promise.all([
        loadAppointments(activeTab),
        loadCounts(),
        loadAppointmentDetails(appointmentIdToUpdate, false),
      ]);

      setPopup("appointment");
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Unable to update appointment.";

      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirmation = (action, appointment) => {
    setSelectedAppointment(appointment);
    setDetailsError("");
    setPopup(action);
  };

  const closePopup = () => {
    if (actionLoading) return;

    setPopup(null);
    setDetailsError("");
  };

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const patient = getPatient(appointment);
      const doctor = getDoctor(appointment);

      const matchesSearch =
        !term ||
        [
          patient.name,
          patient.email,
          patient.phone,
          doctor.name,
          appointment._id,
          appointment.slotDate,
          appointment.slotTime,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(term),
        );

      const payment = getPaymentStatus(appointment).label.toLowerCase();

      const matchesPayment =
        paymentFilter === "all" || payment === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [appointments, search, paymentFilter]);

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();

    return patients.filter((patient) =>
      [
        patient.name,
        patient.email,
        patient.phone,
        patient.gender,
        patient._id,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [patients, patientSearch]);

  const patientTotals = useMemo(
    () =>
      patients.reduce(
        (total, patient) => ({
          appointments:
            total.appointments + Number(patient.totalAppointments || 0),
          completed:
            total.completed + Number(patient.completedAppointments || 0),
          cancelled:
            total.cancelled + Number(patient.cancelledAppointments || 0),
        }),
        { appointments: 0, completed: 0, cancelled: 0 },
      ),
    [patients],
  );

  const canManage =
    Boolean(selectedAppointment) &&
    !selectedAppointment.cancelled &&
    !selectedAppointment.isCompleted;

  const refreshAll = async () => {
    if (activeSection === "appointments") {
      await Promise.all([loadAppointments(activeTab, true), loadCounts()]);
    } else {
      await loadPatients(true);
    }
  };

  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* HEADER */}
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Doctor workspace
                </h1>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Management
                </span>
              </div>

              <p className="mt-1.5 text-sm text-slate-500">
                Manage appointments, review patients and track consultations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={listLoading || patientsLoading || countsLoading}
            className="inline-flex items-center justify-center gap-2 self-start cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 md:self-auto"
          >
            <RefreshCw
              size={16}
              className={
                listLoading || patientsLoading || countsLoading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh data
          </button>
        </header>

        {/* MAIN SECTION NAVIGATION */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveSection("appointments")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm cursor-pointer font-semibold transition ${
              activeSection === "appointments"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <CalendarDays size={17} />
            Appointments
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("patients")}
            className={`inline-flex items-center gap-2 rounded-xl cursor-pointer px-4 py-3 text-sm font-semibold transition ${
              activeSection === "patients"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users size={17} />
            Patients
            <span
              className={`rounded-lg px-2 py-0.5 text-xs ${
                activeSection === "patients"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {patientsLoading ? "…" : patients.length}
            </span>
          </button>
        </div>

        {/* APPOINTMENTS SECTION */}
        {activeSection === "appointments" && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Today's appointments"
                value={countsLoading ? "…" : counts.today}
                icon={CalendarCheck}
                color="blue"
                subtitle="Appointments scheduled for today"
              />

              <StatCard
                label="Upcoming"
                value={countsLoading ? "…" : counts.upcoming}
                icon={CalendarClock}
                color="violet"
                subtitle="Consultations awaiting completion"
              />

              <StatCard
                label="Completed"
                value={countsLoading ? "…" : counts.completed}
                icon={CheckCircle2}
                color="emerald"
                subtitle="Successfully completed consultations"
              />

              <StatCard
                label="Cancelled"
                value={countsLoading ? "…" : counts.cancelled}
                icon={XCircle}
                color="rose"
                subtitle="Bookings cancelled previously"
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 pt-5 sm:px-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                      Appointment management
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      View booking records and manage consultation status.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                    <Activity size={15} className="text-blue-600" />
                    {filteredAppointments.length} records shown
                  </div>
                </div>

                {/* APPOINTMENT TABS */}
                <div className="-mb-px mt-5 flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSearch("");
                          setPaymentFilter("all");
                        }}
                        className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                          active
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800"
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-xs ${
                            active
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {countsLoading ? "…" : counts[tab.id]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SEARCH AND FILTERS */}
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search patient, email, phone or appointment ID..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Filter
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={paymentFilter}
                      onChange={(event) => setPaymentFilter(event.target.value)}
                      className="w-full appearance-none rounded-xl cursor-pointer border border-slate-200 bg-white py-3 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 sm:w-44"
                    >
                      <option value="all">All payments</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPaymentFilter("all");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    <X size={15} />
                    Clear
                  </button>
                </div>
              </div>

              {/* APPOINTMENT LOADING */}
              {listLoading && (
                <div className="flex items-center justify-center gap-3 py-16 text-sm font-medium text-slate-500">
                  <LoaderCircle
                    size={22}
                    className="animate-spin text-blue-600"
                  />
                  Loading appointments...
                </div>
              )}

              {/* APPOINTMENT ERROR */}
              {!listLoading && listError && (
                <EmptyState
                  icon={AlertTriangle}
                  title="Unable to load appointments"
                  description={listError}
                  onRetry={() => loadAppointments(activeTab)}
                />
              )}

              {/* EMPTY APPOINTMENT LIST */}
              {!listLoading &&
                !listError &&
                filteredAppointments.length === 0 && (
                  <EmptyState
                    icon={ClipboardList}
                    title={
                      search || paymentFilter !== "all"
                        ? "No matching appointments"
                        : activeTab === "today"
                          ? "No appointments for today"
                          : activeTab === "upcoming"
                            ? "No upcoming appointments"
                            : activeTab === "completed"
                              ? "No completed appointments yet"
                              : "No cancelled appointments"
                    }
                    description={
                      search || paymentFilter !== "all"
                        ? "Try a different search term or clear your filters."
                        : "When appointment records are available for this category, they will appear here."
                    }
                    onRetry={() => loadAppointments(activeTab)}
                  />
                )}

              {/* DESKTOP APPOINTMENT TABLE */}
              {!listLoading &&
                !listError &&
                filteredAppointments.length > 0 && (
                  <>
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full min-w-[950px] text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-white">
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Patient
                            </th>
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Appointment
                            </th>
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Payment
                            </th>
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Status
                            </th>
                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {filteredAppointments.map((item) => {
                            const patient = getPatient(item);

                            return (
                              <tr
                                key={item._id}
                                className="transition hover:bg-slate-50/80"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <PatientAvatar
                                      name={patient.name}
                                      image={patient.image}
                                    />

                                    <div className="min-w-0">
                                      <p className="max-w-[200px] truncate text-sm font-bold text-slate-800">
                                        {patient.name || "Patient"}
                                      </p>
                                      <p className="mt-1 max-w-[200px] truncate text-xs text-slate-400">
                                        {patient.email ||
                                          patient.phone ||
                                          "No contact details"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {formatDate(item.slotDate)}
                                  </p>
                                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                    <Clock3 size={13} />
                                    {item.slotTime || "Time not specified"}
                                  </p>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="text-sm font-bold text-slate-800">
                                    ₹{getAmount(item).toLocaleString("en-IN")}
                                  </p>
                                  <div className="mt-1.5">
                                    <PaymentBadge appointment={item} />
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <StatusBadge appointment={item} />
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      title="View appointment"
                                      onClick={() =>
                                        loadAppointmentDetails(item._id)
                                      }
                                      className="flex h-9 w-9 items-center justify-center cursor-pointer rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      <Eye size={16} />
                                    </button>

                                    {!item.cancelled && !item.isCompleted && (
                                      <>
                                        <button
                                          type="button"
                                          title="Mark completed"
                                          onClick={() =>
                                            openConfirmation("complete", item)
                                          }
                                          className="flex h-9 w-9 items-center justify-center rounded-xl cursor-pointer border border-emerald-100 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                                        >
                                          <Check size={16} />
                                        </button>

                                        <button
                                          type="button"
                                          title="Cancel appointment"
                                          onClick={() =>
                                            openConfirmation("cancel", item)
                                          }
                                          className="flex h-9 w-9 items-center justify-center rounded-xl cursor-pointer border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                        >
                                          <X size={16} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* RESPONSIVE APPOINTMENT CARDS */}
                    <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
                      {filteredAppointments.map((item) => {
                        const patient = getPatient(item);

                        return (
                          <article
                            key={item._id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:p-5"
                          >
                            <div className="flex items-start gap-3">
                              <PatientAvatar
                                name={patient.name}
                                image={patient.image}
                                size="h-12 w-12"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="break-words text-sm font-bold text-slate-900">
                                    {patient.name || "Patient"}
                                  </h3>
                                  <StatusBadge appointment={item} />
                                </div>

                                <p className="mt-1 break-all text-xs text-slate-500">
                                  {patient.email ||
                                    patient.phone ||
                                    "No contact details"}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                                  <span className="flex items-center gap-1.5">
                                    <CalendarDays
                                      size={14}
                                      className="text-blue-600"
                                    />
                                    {formatDate(item.slotDate)}
                                  </span>

                                  <span className="flex items-center gap-1.5">
                                    <Clock3
                                      size={14}
                                      className="text-blue-600"
                                    />
                                    {item.slotTime || "Time N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                              <div>
                                <p className="text-lg font-bold text-slate-900">
                                  ₹{getAmount(item).toLocaleString("en-IN")}
                                </p>
                                <div className="mt-1">
                                  <PaymentBadge appointment={item} />
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    loadAppointmentDetails(item._id)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl cursor-pointer border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Eye size={15} />
                                  Details
                                </button>

                                {!item.cancelled && !item.isCompleted && (
                                  <>
                                    <button
                                      type="button"
                                      aria-label="Complete appointment"
                                      onClick={() =>
                                        openConfirmation("complete", item)
                                      }
                                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                                    >
                                      <Check size={17} />
                                    </button>

                                    <button
                                      type="button"
                                      aria-label="Cancel appointment"
                                      onClick={() =>
                                        openConfirmation("cancel", item)
                                      }
                                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                    >
                                      <X size={17} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <span>
                        Showing {filteredAppointments.length} of{" "}
                        {appointments.length} appointments
                      </span>

                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        Data loaded from your appointment API
                      </span>
                    </div>
                  </>
                )}
            </section>
          </>
        )}

        {/* PATIENTS SECTION */}
        {activeSection === "patients" && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total patients"
                value={patientsLoading ? "…" : patients.length}
                icon={Users}
                color="blue"
                subtitle="Patients with appointments"
              />

              <StatCard
                label="Appointments"
                value={patientTotals.appointments}
                icon={CalendarDays}
                color="violet"
                subtitle="Combined patient appointment records"
              />

              <StatCard
                label="Completed"
                value={patientTotals.completed}
                icon={CheckCircle2}
                color="emerald"
                subtitle="Completed patient appointments"
              />

              <StatCard
                label="Cancelled"
                value={patientTotals.cancelled}
                icon={XCircle}
                color="rose"
                subtitle="Cancelled patient appointments"
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    Patient management
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review patient profiles and their appointment history.
                  </p>
                </div>

                <div className="relative w-full lg:max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Search name, email, phone or patient ID..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {patientsLoading && (
                <div className="flex items-center justify-center gap-3 py-16 text-sm font-medium text-slate-500">
                  <LoaderCircle
                    size={22}
                    className="animate-spin text-blue-600"
                  />
                  Loading patients...
                </div>
              )}

              {!patientsLoading && patientError && (
                <EmptyState
                  icon={AlertTriangle}
                  title="Unable to load patients"
                  description={patientError}
                  onRetry={() => loadPatients()}
                />
              )}

              {!patientsLoading &&
                !patientError &&
                filteredPatients.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title={
                      patientSearch
                        ? "No matching patients"
                        : "No patients found"
                    }
                    description={
                      patientSearch
                        ? "Try another name, email or phone number."
                        : "Patients returned by your doctor-patients endpoint will appear here."
                    }
                    onRetry={() => loadPatients()}
                  />
                )}

              {!patientsLoading &&
                !patientError &&
                filteredPatients.length > 0 && (
                  <>
                    {/* DESKTOP PATIENT TABLE */}
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full min-w-[850px] text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Patient
                            </th>
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Contact
                            </th>
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Appointments
                            </th>
                            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Last appointment
                            </th>
                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {filteredPatients.map((patient) => (
                            <tr
                              key={patient._id}
                              className="transition hover:bg-slate-50/70"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <PatientAvatar
                                    name={patient.name}
                                    image={patient.image}
                                  />

                                  <div>
                                    <p className="text-sm font-bold text-slate-800">
                                      {patient.name || "Patient"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      ID:{" "}
                                      {String(patient._id || "").slice(-8) ||
                                        "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <p className="flex items-center gap-2 text-sm text-slate-700">
                                  <Mail size={14} className="text-slate-400" />
                                  <span className="max-w-[220px] truncate">
                                    {patient.email || "Not provided"}
                                  </span>
                                </p>

                                <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                                  <Phone size={13} />
                                  {patient.phone || "Not provided"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm font-bold text-slate-800">
                                  {patient.totalAppointments || 0} total
                                </p>

                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                    {patient.completedAppointments || 0}{" "}
                                    completed
                                  </span>

                                  <span className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
                                    {patient.cancelledAppointments || 0}{" "}
                                    cancelled
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                {patient.lastAppointment ? (
                                  <>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {formatDate(
                                        patient.lastAppointment.slotDate,
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {patient.lastAppointment.slotTime ||
                                        "Time N/A"}
                                    </p>
                                  </>
                                ) : (
                                  <span className="text-sm text-slate-400">
                                    N/A
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    loadPatientDetails(patient._id)
                                  }
                                  disabled={patientDetailsLoading}
                                  className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                                >
                                  <Eye size={15} />
                                  View history
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* RESPONSIVE PATIENT CARDS */}
                    <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
                      {filteredPatients.map((patient) => (
                        <article
                          key={patient._id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <PatientAvatar
                              name={patient.name}
                              image={patient.image}
                              size="h-12 w-12"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-bold text-slate-900">
                                {patient.name || "Patient"}
                              </p>
                              <p className="mt-1 break-all text-xs text-slate-500">
                                {patient.email || "No email"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {patient.phone || "No phone"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                              <p className="text-lg font-bold text-slate-900">
                                {patient.totalAppointments || 0}
                              </p>
                              <p className="text-[10px] font-medium text-slate-500">
                                Total
                              </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 p-2.5 text-center">
                              <p className="text-lg font-bold text-emerald-700">
                                {patient.completedAppointments || 0}
                              </p>
                              <p className="text-[10px] font-medium text-emerald-700">
                                Completed
                              </p>
                            </div>

                            <div className="rounded-xl bg-rose-50 p-2.5 text-center">
                              <p className="text-lg font-bold text-rose-700">
                                {patient.cancelledAppointments || 0}
                              </p>
                              <p className="text-[10px] font-medium text-rose-700">
                                Cancelled
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => loadPatientDetails(patient._id)}
                            disabled={patientDetailsLoading}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 cursor-pointer rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Eye size={16} />
                            View patient and history
                          </button>
                        </article>
                      ))}
                    </div>
                  </>
                )}
            </section>
          </>
        )}

        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <HeartPulse size={15} />
            Prescripto Management System
          </span>
          <span>Doctor appointments &amp; patient records</span>
        </footer>
      </div>


      {popup === "appointment" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePopup();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/50 bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardList size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Appointment details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Full booking information
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePopup}
                aria-label="Close appointment details"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 cursor-pointer transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {detailsLoading && !selectedAppointment && (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
                <LoaderCircle
                  size={22}
                  className="animate-spin text-blue-600"
                />
                Loading appointment details...
              </div>
            )}

            {detailsError && !selectedAppointment && (
              <EmptyState
                icon={AlertTriangle}
                title="Unable to load details"
                description={detailsError}
                onRetry={() => {
                  if (appointmentId) {
                    loadAppointmentDetails(appointmentId);
                  }
                }}
              />
            )}

            {selectedAppointment && (
              <>
                {(() => {
                  const patient = getPatient(selectedAppointment);
                  const doctor = getDoctor(selectedAppointment);
                  const address = getAddress(patient.address);
                  const payment = getPaymentStatus(selectedAppointment);

                  return (
                    <div className="space-y-5 p-5 sm:p-7">
                      <div className="rounded-2xl bg-gradient-to-br from-[#123c8c] to-[#2879df] p-5 text-white sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <PatientAvatar
                            name={patient.name}
                            image={patient.image}
                            size="h-16 w-16"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-xl font-bold">
                                {patient.name || "Patient"}
                              </h3>
                              <StatusBadge appointment={selectedAppointment} />
                            </div>

                            <p className="mt-1 break-all text-sm text-blue-100">
                              {patient.email || "No email provided"}
                            </p>
                            <p className="mt-1 text-sm text-blue-100">
                              {patient.phone || "No phone provided"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-blue-100">
                              Appointment date
                            </p>
                            <p className="mt-1 text-sm font-bold">
                              {formatDate(selectedAppointment.slotDate)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-blue-100">Time slot</p>
                            <p className="mt-1 text-sm font-bold">
                              {selectedAppointment.slotTime || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-blue-100">
                              Appointment fee
                            </p>
                            <p className="mt-1 text-sm font-bold">
                              ₹
                              {getAmount(selectedAppointment).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                          <UserRound size={17} className="text-blue-600" />
                          Patient information
                        </h3>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoTile
                            icon={Mail}
                            label="Email"
                            value={patient.email}
                          />
                          <InfoTile
                            icon={Phone}
                            label="Phone"
                            value={patient.phone}
                          />
                          <InfoTile
                            icon={Activity}
                            label="Gender"
                            value={patient.gender}
                          />
                          <InfoTile
                            icon={CalendarDays}
                            label="Date of birth"
                            value={formatDate(patient.dob)}
                          />
                          <InfoTile
                            icon={MapPin}
                            label="Address"
                            value={address}
                          />
                          <InfoTile
                            icon={ShieldCheck}
                            label="Patient ID"
                            value={String(
                              selectedAppointment.userId ||
                                patient._id ||
                                "N/A",
                            )}
                          />
                        </div>
                      </section>

                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                          <Stethoscope size={17} className="text-blue-600" />
                          Doctor and payment
                        </h3>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoTile
                            icon={Stethoscope}
                            label="Doctor"
                            value={doctor.name || "Assigned doctor"}
                            subValue={doctor.speciality}
                          />
                          <InfoTile
                            icon={CreditCard}
                            label="Payment method"
                            value={
                              selectedAppointment.paymentMethod ||
                              "Not specified"
                            }
                            subValue={`Payment status: ${payment.label}`}
                          />
                          <InfoTile
                            icon={IndianRupee}
                            label="Amount"
                            value={`₹${getAmount(selectedAppointment).toLocaleString("en-IN")}`}
                          />
                          <InfoTile
                            icon={FileText}
                            label="Booking reference"
                            value={selectedAppointment._id}
                          />
                        </div>
                      </section>

                      {selectedAppointment.cancelled && (
                        <div className="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                          <XCircle
                            size={21}
                            className="shrink-0 text-rose-600"
                          />
                          <div>
                            <p className="text-sm font-bold text-rose-800">
                              Appointment cancelled
                            </p>
                            <p className="mt-1 text-sm text-rose-700">
                              Cancelled by:{" "}
                              {selectedAppointment.cancelledBy ||
                                "Not specified"}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedAppointment.isCompleted && (
                        <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <CheckCircle2
                            size={21}
                            className="shrink-0 text-emerald-600"
                          />
                          <div>
                            <p className="text-sm font-bold text-emerald-800">
                              Appointment completed
                            </p>
                            <p className="mt-1 text-sm text-emerald-700">
                              This appointment has already been marked as
                              completed.
                            </p>
                          </div>
                        </div>
                      )}

                      {Array.isArray(selectedAppointment.notifications) && (
                        <section className="rounded-2xl border border-slate-200 p-4">
                          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Bell size={17} className="text-blue-600" />
                            Notifications
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              {selectedAppointment.notifications.length}
                            </span>
                          </h3>

                          {selectedAppointment.notifications.length ? (
                            <div className="mt-3 space-y-3">
                              {selectedAppointment.notifications.map(
                                (notification, index) => (
                                  <div
                                    key={
                                      notification._id ||
                                      `${notification.date}-${index}`
                                    }
                                    className="rounded-xl bg-slate-50 p-3.5"
                                  >
                                    <p className="break-words text-sm leading-6 text-slate-700">
                                      {notification.message || "Notification"}
                                    </p>

                                    {notification.date && (
                                      <p className="mt-1.5 text-xs text-slate-400">
                                        {formatDateTime(notification.date)}
                                      </p>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              No notifications recorded.
                            </p>
                          )}
                        </section>
                      )}
                    </div>
                  );
                })()}

                <div className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 cursor-pointer transition hover:bg-slate-50"
                  >
                    Close details
                  </button>

                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPopup("cancel")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 cursor-pointer px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => setPopup("complete")}
                        className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={16} />
                        Mark completed
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {(popup === "cancel" || popup === "complete") && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePopup();
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="my-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div
              className={`px-6 pb-6 pt-7 ${
                popup === "cancel"
                  ? "bg-gradient-to-br from-rose-50 to-white"
                  : "bg-gradient-to-br from-emerald-50 to-white"
              }`}
            >
              <button
                type="button"
                onClick={closePopup}
                disabled={actionLoading}
                aria-label="Close confirmation"
                className="float-right flex h-9 w-9 items-center justify-center rounded-xl border cursor-pointer border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={17} />
              </button>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  popup === "cancel"
                    ? "bg-rose-100 text-rose-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {popup === "cancel" ? (
                  <AlertTriangle size={27} />
                ) : (
                  <BadgeCheck size={27} />
                )}
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                {popup === "cancel"
                  ? "Cancel this appointment?"
                  : "Complete this appointment?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {popup === "cancel"
                  ? "Please verify the booking before confirming. Your backend will mark it as cancelled and attempt to notify the patient."
                  : "Confirm that the consultation has taken place. Your backend will mark the appointment as completed and attempt to notify the patient."}
              </p>
            </div>

            <div className="px-6 pb-5">
              {selectedAppointment && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <PatientAvatar
                      name={getPatient(selectedAppointment).name}
                      image={getPatient(selectedAppointment).image}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold text-slate-900">
                        {getPatient(selectedAppointment).name || "Patient"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(selectedAppointment.slotDate)}
                        {" · "}
                        {selectedAppointment.slotTime || "Time N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-sm text-slate-500">
                      Appointment amount
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{getAmount(selectedAppointment).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}

              <div
                className={`mt-4 flex gap-2.5 rounded-xl p-3.5 ${
                  popup === "cancel"
                    ? "bg-rose-50 text-rose-800"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <p className="text-xs leading-5">
                  The backend may reject this request if the appointment is
                  already cancelled or completed.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePopup}
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={handleAppointmentAction}
                disabled={actionLoading || !canManage}
                className={`inline-flex items-center justify-center cursor-pointer gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  popup === "cancel"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionLoading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Processing...
                  </>
                ) : popup === "cancel" ? (
                  <>
                    <XCircle size={17} />
                    Confirm cancellation
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    Confirm completion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {popup === "patient" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePopup();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="my-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Patient profile
                  </h2>
                  <p className="text-xs text-slate-500">
                    Patient details and appointment history
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePopup}
                aria-label="Close patient profile"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 cursor-pointer text-slate-500 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {patientDetailsLoading && !selectedPatient && (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
                <LoaderCircle
                  size={22}
                  className="animate-spin text-blue-600"
                />
                Loading patient history...
              </div>
            )}

            {!patientDetailsLoading && patientError && !selectedPatient && (
              <EmptyState
                icon={AlertTriangle}
                title="Unable to load patient"
                description={patientError}
                onRetry={() => {
                  const patientId = selectedPatient?._id;
                  if (patientId) loadPatientDetails(patientId);
                }}
              />
            )}

            {!patientDetailsLoading && selectedPatient && (
              <div className="space-y-6 p-5 sm:p-7">
                <div className="rounded-2xl bg-gradient-to-br from-[#123c8c] to-[#2879df] p-5 text-white sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <PatientAvatar
                      name={selectedPatient.name}
                      image={selectedPatient.image}
                      size="h-20 w-20"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-2xl font-bold">
                        {selectedPatient.name || "Patient"}
                      </h3>
                      <p className="mt-1 break-all text-sm text-blue-100">
                        {selectedPatient.email || "No email provided"}
                      </p>
                      <p className="mt-1 text-sm text-blue-100">
                        {selectedPatient.phone || "No phone provided"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                      <p className="text-xs text-blue-100">Patient ID</p>
                      <p className="mt-1 break-all text-sm font-bold">
                        {selectedPatient.id || selectedPatient._id || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <section>
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Personal information
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile
                      icon={Mail}
                      label="Email"
                      value={selectedPatient.email}
                    />
                    <InfoTile
                      icon={Phone}
                      label="Phone"
                      value={selectedPatient.phone}
                    />
                    <InfoTile
                      icon={Activity}
                      label="Gender"
                      value={selectedPatient.gender}
                    />
                    <InfoTile
                      icon={CalendarDays}
                      label="Date of birth"
                      value={formatDate(selectedPatient.dob)}
                    />
                    <InfoTile
                      icon={MapPin}
                      label="Address"
                      value={getAddress(selectedPatient.address)}
                    />
                  </div>
                </section>

                <section>
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Appointment history
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        All appointments this patient has had with you.
                      </p>
                    </div>

                    <span className="self-start rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                      {patientHistory.length} records
                    </span>
                  </div>

                  {patientHistory.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                      <CalendarDays
                        size={27}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No appointment history
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {patientHistory.map((item) => (
                        <div
                          key={item._id}
                          className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 sm:p-5"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  {formatDate(item.slotDate)}
                                </span>
                                <StatusBadge appointment={item} />
                              </div>

                              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                                <Clock3 size={15} />
                                {item.slotTime || "Time not specified"}
                              </p>

                              <p className="mt-2 text-xs text-slate-400">
                                Booking ID: {item._id || "N/A"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                              <div className="text-left sm:text-right">
                                <p className="text-lg font-bold text-slate-900">
                                  ₹{getAmount(item).toLocaleString("en-IN")}
                                </p>
                                <div className="mt-1">
                                  <PaymentBadge appointment={item} />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setPopup(null);
                                  loadAppointmentDetails(item._id);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Eye size={14} />
                                Details
                              </button>
                            </div>
                          </div>

                          {item.cancelled && (
                            <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                              Cancelled by:{" "}
                              {item.cancelledBy || "Not specified"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={19} className="text-emerald-600" />
                    <h3 className="font-bold text-slate-900">
                      Previous completed appointments
                    </h3>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {completedHistory.length}
                    </span>
                  </div>

                  {completedHistory.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No completed appointments were returned for this patient.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {completedHistory.map((item) => (
                        <div
                          key={item._id}
                          className="flex flex-col justify-between gap-2 rounded-xl border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(item.slotDate)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.slotTime || "Time not specified"}
                            </p>
                          </div>

                          <span className="text-sm font-bold text-slate-900">
                            ₹{getAmount(item).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            <div className="sticky bottom-0 flex justify-end border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:px-7">
              <button
                type="button"
                onClick={closePopup}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold cursor-pointer text-slate-700 transition hover:bg-slate-50"
              >
                Close patient profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Appointmentdetail;
