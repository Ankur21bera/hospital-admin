import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Filter,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import {
  getAllAppointments,
  getAdminAppointment,
  adminCancelAppointment,
  markAppointmentCompleted,
  getAllPatient,
  getPatient,
} from "../../Redux/adminSlice";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getAppointmentStatus = (appointment) => {
  if (appointment?.cancelled) {
    return {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
      icon: XCircle,
    };
  }

  if (appointment?.isCompleted) {
    return {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
  };
};

const getPaymentStatus = (appointment) => {
  if (appointment?.payment === true || appointment?.paymentStatus === "paid") {
    return {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (appointment?.paymentStatus === "rejected") {
    return {
      label: "Rejected",
      className: "bg-rose-50 text-rose-700",
    };
  }

  if (appointment?.paymentStatus === "requested") {
    return {
      label: "Requested",
      className: "bg-violet-50 text-violet-700",
    };
  }

  return {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
  };
};

const getPatientName = (patient) => patient?.name || "Unknown Patient";

const getDoctorName = (appointment) =>
  appointment?.docData?.name || "Doctor not available";

const getPatientId = (appointment) =>
  appointment?.userId || appointment?.userData?._id;

const getPatientImage = (patient) => patient?.image || "";

const Avatar = ({ src, name, size = "md" }) => {
  const [imageError, setImageError] = useState(false);

  const dimensions = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-100 font-bold text-indigo-700 ring-1 ring-indigo-100",
        dimensions[size],
      )}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name || "User"}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};

const StatusBadge = ({ appointment }) => {
  const status = getAppointmentStatus(appointment);
  const Icon = status.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
        status.className,
      )}
    >
      <Icon size={13} />
      {status.label}
    </span>
  );
};

const PaymentBadge = ({ appointment }) => {
  const status = getPaymentStatus(appointment);

  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold",
        status.className,
      )}
    >
      {status.label}
    </span>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, tone }) => {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1",
            tones[tone],
          )}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center px-5 py-14 text-center sm:py-16">
    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
      <Icon size={29} />
    </div>
    <h3 className="mt-5 text-lg font-bold text-slate-800">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
      {description}
    </p>
  </div>
);

const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
    {Icon && (
      <div className="mt-0.5 shrink-0 text-slate-400">
        <Icon size={17} />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  </div>
);

const SectionHeading = ({ title, subtitle, icon: Icon }) => (
  <div className="flex items-start gap-3">
    {Icon && (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={19} />
      </div>
    )}
    <div>
      <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>
      )}
    </div>
  </div>
);

const Pagination = ({ page, totalPages, onChange, total, pageSize }) => {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-slate-500 sm:text-sm">
        Showing{" "}
        <span className="font-bold text-slate-800">
          {start}–{end}
        </span>{" "}
        of <span className="font-bold text-slate-800">{total}</span> records
      </p>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-9 items-cente cursor-pointer gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={14} />
          Previous
        </button>

        <span className="min-w-16 text-center text-xs font-bold text-slate-600">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg cursor-pointer border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

const Allappointment = () => {
  const dispatch = useDispatch();

  const {
    appointments = [],
    patients = [],
    loading,
    error,
  } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState("appointments");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [appointmentPage, setAppointmentPage] = useState(1);
  const [patientPage, setPatientPage] = useState(1);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);

  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const pageSize = 8;

  const loadAppointments = useCallback(
    async (searchValue = appointmentSearch, statusValue = statusFilter) => {
      const result = await dispatch(
        getAllAppointments({
          search: searchValue.trim(),
          status: statusValue,
        }),
      );

      if (getAllAppointments.rejected.match(result)) {
        toast.error(
          typeof result.payload === "string"
            ? result.payload
            : "Unable to load appointments",
        );
      }
    },
    [dispatch, appointmentSearch, statusFilter],
  );

  const loadPatients = useCallback(
    async (searchValue = patientSearch) => {
      const result = await dispatch(
        getAllPatient({ search: searchValue.trim() }),
      );

      if (getAllPatient.rejected.match(result)) {
        toast.error(
          typeof result.payload === "string"
            ? result.payload
            : "Unable to load patients",
        );
      }
    },
    [dispatch, patientSearch],
  );

  useEffect(() => {
    loadAppointments("", "");
    loadPatients("");
  }, [dispatch]); // Initial loading only.

  useEffect(() => {
    setAppointmentPage(1);

    const timer = setTimeout(() => {
      loadAppointments(appointmentSearch, statusFilter);
    }, 350);

    return () => clearTimeout(timer);
  }, [appointmentSearch, statusFilter]);

  useEffect(() => {
    setPatientPage(1);

    const timer = setTimeout(() => {
      loadPatients(patientSearch);
    }, 350);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  const visibleAppointments = useMemo(() => {
    let result = [...appointments];

    if (paymentFilter) {
      result = result.filter(
        (appointment) =>
          getPaymentStatus(appointment).label.toLowerCase() === paymentFilter,
      );
    }

    result.sort((a, b) => {
      const dateA = Number(a.date) || new Date(a.slotDate).getTime() || 0;
      const dateB = Number(b.date) || new Date(b.slotDate).getTime() || 0;

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [appointments, paymentFilter, sortOrder]);

  const visiblePatients = useMemo(() => [...patients], [patients]);

  const appointmentTotalPages = Math.max(
    1,
    Math.ceil(visibleAppointments.length / pageSize),
  );

  const patientTotalPages = Math.max(
    1,
    Math.ceil(visiblePatients.length / pageSize),
  );

  useEffect(() => {
    setAppointmentPage((page) => Math.min(page, appointmentTotalPages));
  }, [appointmentTotalPages]);

  useEffect(() => {
    setPatientPage((page) => Math.min(page, patientTotalPages));
  }, [patientTotalPages]);

  const paginatedAppointments = visibleAppointments.slice(
    (appointmentPage - 1) * pageSize,
    appointmentPage * pageSize,
  );

  const paginatedPatients = visiblePatients.slice(
    (patientPage - 1) * pageSize,
    patientPage * pageSize,
  );

  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter(
      (item) => !item.cancelled && !item.isCompleted,
    ).length;
    const completed = appointments.filter((item) => item.isCompleted).length;
    const paid = appointments.filter(
      (item) => item.payment || item.paymentStatus === "paid",
    ).length;

    return { total, pending, completed, paid };
  }, [appointments]);

  const openAppointmentDetails = async (appointment) => {
    setSelectedPatient(null);
    setSelectedAppointment(appointment);
    setDetailLoading(true);

    try {
      const result = await dispatch(getAdminAppointment(appointment._id));

      if (getAdminAppointment.fulfilled.match(result)) {
        setSelectedAppointment(result.payload.appointment || appointment);
      } else {
        toast.error(
          typeof result.payload === "string"
            ? result.payload
            : "Could not load appointment details",
        );
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const openPatientDetails = async (patient) => {
    setSelectedAppointment(null);
    setSelectedPatient(patient);
    setPatientAppointments([]);
    setDetailLoading(true);

    try {
      const result = await dispatch(getPatient(patient._id));

      if (getPatient.fulfilled.match(result)) {
        setSelectedPatient(result.payload.patient || patient);
        setPatientAppointments(result.payload.appointments || []);
      } else {
        toast.error(
          typeof result.payload === "string"
            ? result.payload
            : "Could not load patient details",
        );
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAppointmentAction = async () => {
    if (!confirmAction?.appointmentId || !confirmAction?.type) return;

    setActionLoading(true);

    try {
      const thunk =
        confirmAction.type === "cancel"
          ? adminCancelAppointment
          : markAppointmentCompleted;

      const result = await dispatch(thunk(confirmAction.appointmentId));

      if (thunk.fulfilled.match(result)) {
        toast.success(
          result.payload?.message ||
            (confirmAction.type === "cancel"
              ? "Appointment cancelled"
              : "Appointment marked completed"),
        );

        const updated = result.payload?.appointment;

        if (updated) setSelectedAppointment(updated);

        setConfirmAction(null);
        await loadAppointments(appointmentSearch, statusFilter);
      } else {
        toast.error(
          typeof result.payload === "string"
            ? result.payload
            : "Unable to update appointment",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      loadAppointments(appointmentSearch, statusFilter),
      loadPatients(patientSearch),
    ]);
    toast.success("Data refreshed");
  };

  const closeDetails = () => {
    setSelectedAppointment(null);
    setSelectedPatient(null);
    setPatientAppointments([]);
  };

  const isDetailOpen = Boolean(selectedAppointment || selectedPatient);

  const selectTab = (tab) => {
    setActiveTab(tab);
    closeDetails();
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1700px] space-y-6 lg:space-y-8">
        {/* Page header */}
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-indigo-700 shadow-sm">
              <ShieldCheck size={14} />
              HOSPITAL ADMINISTRATION
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-[34px]">
              Appointments & Patients
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage appointments, patient records, visit status and payments
              from one central dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 cursor-pointer self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Appointments"
            value={appointmentStats.total}
            subtitle="Appointments loaded"
            icon={CalendarDays}
            tone="indigo"
          />
          <StatCard
            title="Pending Visits"
            value={appointmentStats.pending}
            subtitle="Awaiting completion"
            icon={Clock3}
            tone="amber"
          />
          <StatCard
            title="Completed Visits"
            value={appointmentStats.completed}
            subtitle="Marked as completed"
            icon={BadgeCheck}
            tone="emerald"
          />
          <StatCard
            title="Payments Received"
            value={appointmentStats.paid}
            subtitle="Appointments marked paid"
            icon={Wallet}
            tone="violet"
          />
        </section>

        {/* Main workspace */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">
          {/* Tabs */}
          <div className="border-b border-slate-100 p-3 sm:p-5 lg:px-6">
            <div className="flex w-full gap-2 rounded-xl bg-slate-100 p-1 sm:w-fit sm:rounded-2xl">
              <button
                type="button"
                onClick={() => selectTab("appointments")}
                className={cn(
                  "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg cursor-pointer px-3 py-3 text-sm font-bold transition sm:flex-none sm:px-5",
                  activeTab === "appointments"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                <CalendarDays size={17} />
                Appointments
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {appointments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectTab("patients")}
                className={cn(
                  "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 cursor-pointer text-sm font-bold transition sm:flex-none sm:px-5",
                  activeTab === "patients"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                <Users size={17} />
                All Patients
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {patients.length}
                </span>
              </button>
            </div>
          </div>

          {/* Appointments list */}
          {activeTab === "appointments" && !isDetailOpen && (
            <>
              {/* Search and filters */}
              <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
                <div className="relative sm:col-span-2">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={appointmentSearch}
                    onChange={(event) =>
                      setAppointmentSearch(event.target.value)
                    }
                    placeholder="Search patient, email, phone, doctor..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl cursor-pointer border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">All visit statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="paid">Paid</option>
                    <option value="offline-requested">Offline requested</option>
                    <option value="offline-rejected">Offline rejected</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <div className="relative">
                  <CreditCard
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={paymentFilter}
                    onChange={(event) => {
                      setPaymentFilter(event.target.value);
                      setAppointmentPage(1);
                    }}
                    className="h-11 w-full appearance-none rounded-xl cursor-pointer border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">All payment statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="requested">Requested</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Appointment records
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {visibleAppointments.length} records found
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSortOrder((current) =>
                      current === "newest" ? "oldest" : "newest",
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl cursor-pointer border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <ArrowDownUp size={14} />
                  {sortOrder === "newest" ? "Newest first" : "Oldest first"}
                </button>
              </div>

              {/* Desktop appointments table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] text-left">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-bold">Patient</th>
                      <th className="px-6 py-4 font-bold">Doctor</th>
                      <th className="px-6 py-4 font-bold">Date & Time</th>
                      <th className="px-6 py-4 font-bold">Visit Status</th>
                      <th className="px-6 py-4 font-bold">Payment</th>
                      <th className="px-6 py-4 font-bold">Fee</th>
                      <th className="px-6 py-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedAppointments.map((appointment) => {
                      const patient = appointment.userData || {};
                      const doctor = appointment.docData || {};

                      return (
                        <tr
                          key={appointment._id}
                          className="transition hover:bg-indigo-50/30"
                        >
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                openPatientDetails({
                                  _id: getPatientId(appointment),
                                  ...patient,
                                })
                              }
                              className="flex items-center gap-3 text-left"
                            >
                              <Avatar
                                src={getPatientImage(patient)}
                                name={getPatientName(patient)}
                              />
                              <span className="min-w-0">
                                <span className="block max-w-48 truncate text-sm font-bold text-slate-800 hover:text-indigo-700">
                                  {getPatientName(patient)}
                                </span>
                                <span className="mt-1 block max-w-48 truncate text-xs text-slate-500">
                                  {patient.email || "No email"}
                                </span>
                              </span>
                            </button>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Stethoscope size={17} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {getDoctorName(appointment)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {doctor.speciality || "General"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                              {formatDate(appointment.slotDate)}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock3 size={12} />
                              {appointment.slotTime || "—"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge appointment={appointment} />
                          </td>

                          <td className="px-6 py-4">
                            <PaymentBadge appointment={appointment} />
                            <p className="mt-1 text-[11px] capitalize text-slate-400">
                              {appointment.paymentMethod || "—"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="whitespace-nowrap text-sm font-extrabold text-slate-800">
                              {formatCurrency(appointment.amount)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  openAppointmentDetails(appointment)
                                }
                                className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                View <ArrowRight size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile and tablet appointment cards */}
              <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:hidden">
                {paginatedAppointments.map((appointment) => {
                  const patient = appointment.userData || {};
                  const doctor = appointment.docData || {};

                  return (
                    <article
                      key={appointment._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar
                            src={getPatientImage(patient)}
                            name={getPatientName(patient)}
                          />
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-extrabold text-slate-900">
                              {getPatientName(patient)}
                            </h3>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {patient.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <StatusBadge appointment={appointment} />
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 ring-1 ring-slate-200">
                            <Stethoscope size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Consulting doctor
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-slate-800">
                              {getDoctorName(appointment)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {doctor.speciality || "General"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Appointment date
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {formatDate(appointment.slotDate)}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Clock3 size={12} />
                            {appointment.slotTime || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Consultation fee
                          </p>
                          <p className="mt-1 text-base font-extrabold text-slate-900">
                            {formatCurrency(appointment.amount)}
                          </p>
                          <div className="mt-1">
                            <PaymentBadge appointment={appointment} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span className="text-xs capitalize text-slate-500">
                          {appointment.paymentMethod || "Payment method —"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openAppointmentDetails(appointment)}
                          className="inline-flex shrink-0 items-center gap-1.5 cursor-pointer rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                        >
                          View details <ArrowRight size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {!loading && paginatedAppointments.length === 0 && (
                <EmptyState
                  icon={CalendarDays}
                  title="No appointments found"
                  description="Try changing your search or filters, or refresh the appointment data."
                />
              )}

              {loading && (
                <div className="flex items-center justify-center gap-3 py-12 text-sm font-medium text-slate-500">
                  <RefreshCw size={18} className="animate-spin" />
                  Loading appointments...
                </div>
              )}

              <Pagination
                page={appointmentPage}
                totalPages={appointmentTotalPages}
                onChange={setAppointmentPage}
                total={visibleAppointments.length}
                pageSize={pageSize}
              />
            </>
          )}

          {/* Patients list */}
          {activeTab === "patients" && !isDetailOpen && (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="relative w-full sm:max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Search name, email or phone..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={17} className="text-indigo-600" />
                  <span>
                    <strong className="text-slate-800">
                      {patients.length}
                    </strong>{" "}
                    patients found
                  </span>
                </div>
              </div>

              {/* Desktop patients table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-bold">Patient</th>
                      <th className="px-6 py-4 font-bold">Contact</th>
                      <th className="px-6 py-4 font-bold">Address</th>
                      <th className="px-6 py-4 font-bold">Registered</th>
                      <th className="px-6 py-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedPatients.map((patient) => (
                      <tr
                        key={patient._id}
                        className="transition hover:bg-indigo-50/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={getPatientImage(patient)}
                              name={getPatientName(patient)}
                            />
                            <div className="min-w-0">
                              <p className="max-w-52 truncate text-sm font-bold text-slate-800">
                                {getPatientName(patient)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Patient
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="flex items-center gap-2 text-sm text-slate-700">
                            <Mail
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                            <span className="max-w-56 truncate">
                              {patient.email || "No email"}
                            </span>
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <Phone
                              size={13}
                              className="shrink-0 text-slate-400"
                            />
                            {patient.phone || "No phone"}
                          </p>
                        </td>

                        <td className="max-w-64 px-6 py-4">
                          <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                            {[patient.address?.line1, patient.address?.line2]
                              .filter(Boolean)
                              .join(", ") || "Address not provided"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="whitespace-nowrap text-sm text-slate-600">
                            {formatDate(patient.createdAt)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => openPatientDetails(patient)}
                              className="inline-flex items-center gap-1.5 rounded-xl cursor-pointer border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              View profile <ArrowRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile and tablet patient cards */}
              <div className="grid grid-cols-1 gap-4 p-3 sm:grid-cols-2 sm:p-5 lg:hidden">
                {paginatedPatients.map((patient) => (
                  <article
                    key={patient._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={getPatientImage(patient)}
                        name={getPatientName(patient)}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-base font-extrabold text-slate-900">
                          {getPatientName(patient)}
                        </h3>
                        <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Patient
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex min-w-0 items-center gap-2.5 text-sm text-slate-600">
                        <Mail size={15} className="shrink-0 text-slate-400" />
                        <span className="break-all">
                          {patient.email || "No email"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Phone size={15} className="shrink-0 text-slate-400" />
                        <span>{patient.phone || "No phone"}</span>
                      </div>

                      <div className="flex items-start gap-2.5 text-sm text-slate-600">
                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <span className="break-words">
                          {[patient.address?.line1, patient.address?.line2]
                            .filter(Boolean)
                            .join(", ") || "Address not provided"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-400">
                        Joined {formatDate(patient.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openPatientDetails(patient)}
                        className="inline-flex shrink-0 items-center gap-1.5 cursor-pointer rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                      >
                        View profile <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {!loading && paginatedPatients.length === 0 && (
                <EmptyState
                  icon={Users}
                  title="No patients found"
                  description="No patients match your search. Try another name, email address or phone number."
                />
              )}

              {loading && (
                <div className="flex items-center justify-center gap-3 py-12 text-sm font-medium text-slate-500">
                  <RefreshCw size={18} className="animate-spin" />
                  Loading patients...
                </div>
              )}

              <Pagination
                page={patientPage}
                totalPages={patientTotalPages}
                onChange={setPatientPage}
                total={visiblePatients.length}
                pageSize={pageSize}
              />
            </>
          )}

          {/* Appointment details */}
          {selectedAppointment && (
            <div className="p-3 sm:p-6 lg:p-8">
              <button
                type="button"
                onClick={closeDetails}
                className="mb-6 inline-flex items-center gap-2 cursor-pointer rounded-lg text-sm font-bold text-slate-500 transition hover:text-indigo-700"
              >
                <ArrowLeft size={17} />
                Back to {activeTab === "patients" ? "Patients" : "Appointments"}
              </button>

              <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-800 p-5 text-white sm:flex-row sm:items-center sm:p-7">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">
                    Appointment record
                  </p>
                  <h2 className="mt-2 break-all text-xl font-extrabold sm:text-2xl">
                    Visit #{String(selectedAppointment._id).slice(-8)}
                  </h2>
                  <p className="mt-2 text-sm text-indigo-100">
                    Created {formatDateTime(selectedAppointment.date)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge appointment={selectedAppointment} />
                  <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                    <p className="text-xs text-indigo-100">Consultation fee</p>
                    <p className="mt-1 text-lg font-extrabold">
                      {formatCurrency(selectedAppointment.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {detailLoading && (
                <div className="mb-5 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  <RefreshCw size={15} className="animate-spin" />
                  Refreshing appointment details...
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <SectionHeading
                      title="Appointment information"
                      subtitle="Visit schedule and payment details."
                      icon={CalendarDays}
                    />
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailRow
                        label="Appointment date"
                        value={formatDate(selectedAppointment.slotDate)}
                        icon={CalendarDays}
                      />
                      <DetailRow
                        label="Appointment time"
                        value={selectedAppointment.slotTime}
                        icon={Clock3}
                      />
                      <DetailRow
                        label="Payment method"
                        value={selectedAppointment.paymentMethod}
                        icon={CreditCard}
                      />
                      <DetailRow
                        label="Payment status"
                        value={getPaymentStatus(selectedAppointment).label}
                        icon={ShieldCheck}
                      />
                      <DetailRow
                        label="Cancelled by"
                        value={
                          selectedAppointment.cancelledBy || "Not cancelled"
                        }
                        icon={XCircle}
                      />
                      <DetailRow
                        label="Visit status"
                        value={getAppointmentStatus(selectedAppointment).label}
                        icon={Activity}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <SectionHeading
                      title="Patient information"
                      subtitle="Patient details associated with this appointment."
                      icon={UserRound}
                    />

                    <div className="mt-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                      <Avatar
                        src={selectedAppointment.userData?.image}
                        name={getPatientName(selectedAppointment.userData)}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <p className="break-words text-base font-extrabold text-slate-900">
                          {getPatientName(selectedAppointment.userData)}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {selectedAppointment.userData?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailRow
                        label="Phone"
                        value={selectedAppointment.userData?.phone}
                        icon={Phone}
                      />
                      <DetailRow
                        label="Gender"
                        value={selectedAppointment.userData?.gender}
                        icon={UserRound}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const patient = {
                          _id: getPatientId(selectedAppointment),
                          ...selectedAppointment.userData,
                        };
                        openPatientDetails(patient);
                      }}
                      className="mt-4 inline-flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 sm:w-auto"
                    >
                      <UserRound size={16} />
                      Open full patient profile
                    </button>
                  </section>
                </div>

                <div className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <SectionHeading
                      title="Doctor information"
                      subtitle="Doctor assigned to this visit."
                      icon={Stethoscope}
                    />

                    <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                      <Avatar
                        src={selectedAppointment.docData?.image}
                        name={getDoctorName(selectedAppointment)}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <p className="break-words text-base font-extrabold text-slate-900">
                          {getDoctorName(selectedAppointment)}
                        </p>
                        <p className="mt-1 text-sm text-indigo-600">
                          {selectedAppointment.docData?.speciality || "General"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <DetailRow
                        label="Qualification"
                        value={selectedAppointment.docData?.degree}
                        icon={BadgeCheck}
                      />
                      <DetailRow
                        label="Experience"
                        value={selectedAppointment.docData?.experience}
                        icon={Activity}
                      />
                      <DetailRow
                        label="Doctor email"
                        value={selectedAppointment.docData?.email}
                        icon={Mail}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <SectionHeading
                      title="Appointment actions"
                      subtitle="Update the visit status. Your backend notification and email flow remains unchanged."
                      icon={ShieldCheck}
                    />

                    <div className="mt-5 space-y-3">
                      {!selectedAppointment.cancelled &&
                        !selectedAppointment.isCompleted && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: "complete",
                                  appointmentId: selectedAppointment._id,
                                })
                              }
                              disabled={actionLoading}
                              className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 size={17} />
                              Mark as completed
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: "cancel",
                                  appointmentId: selectedAppointment._id,
                                })
                              }
                              disabled={actionLoading}
                              className="flex w-full items-center justify-center gap-2 rounded-xl cursor-pointer border border-rose-200 bg-white px-4 py-3.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              <XCircle size={17} />
                              Cancel appointment
                            </button>
                          </>
                        )}

                      {selectedAppointment.isCompleted && (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 size={18} />
                          This appointment is completed.
                        </div>
                      )}

                      {selectedAppointment.cancelled && (
                        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                          <XCircle size={18} />
                          This appointment is cancelled.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* Patient details */}
          {selectedPatient && !selectedAppointment && (
            <div className="p-3 sm:p-6 lg:p-8">
              <button
                type="button"
                onClick={closeDetails}
                className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm cursor-pointer font-bold text-slate-500 transition hover:text-indigo-700"
              >
                <ArrowLeft size={17} />
                Back to{" "}
                {activeTab === "appointments" ? "Appointments" : "Patients"}
              </button>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-800 p-5 text-white sm:p-8">
                  <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <div className="rounded-3xl bg-white/10 p-1.5 ring-1 ring-white/20">
                      <Avatar
                        src={getPatientImage(selectedPatient)}
                        name={getPatientName(selectedPatient)}
                        size="lg"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                        Patient profile
                      </p>
                      <h2 className="mt-2 break-words text-2xl font-extrabold sm:text-3xl">
                        {getPatientName(selectedPatient)}
                      </h2>
                      <p className="mt-2 break-all text-sm text-indigo-100">
                        {selectedPatient.email || "No email registered"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                          {selectedPatient.gender || "Gender not provided"}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                          Patient
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {detailLoading && (
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-500">
                    <RefreshCw size={15} className="animate-spin" />
                    Loading full patient record...
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-7">
                  <section>
                    <SectionHeading
                      title="Personal information"
                      subtitle="Registered patient details."
                      icon={UserRound}
                    />

                    <div className="mt-4 space-y-3">
                      <DetailRow
                        label="Full name"
                        value={selectedPatient.name}
                        icon={UserRound}
                      />
                      <DetailRow
                        label="Email address"
                        value={selectedPatient.email}
                        icon={Mail}
                      />
                      <DetailRow
                        label="Phone number"
                        value={selectedPatient.phone}
                        icon={Phone}
                      />
                      <DetailRow
                        label="Date of birth"
                        value={formatDate(selectedPatient.dob)}
                        icon={CalendarDays}
                      />
                      <DetailRow
                        label="Gender"
                        value={selectedPatient.gender}
                        icon={UserRound}
                      />
                      <DetailRow
                        label="Registered on"
                        value={formatDate(selectedPatient.createdAt)}
                        icon={CalendarDays}
                      />
                      <DetailRow
                        label="Address"
                        value={
                          [
                            selectedPatient.address?.line1,
                            selectedPatient.address?.line2,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Address not provided"
                        }
                        icon={MapPin}
                      />
                    </div>
                  </section>

                  <section className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <SectionHeading
                        title="Appointment history"
                        subtitle="All visits associated with this patient."
                        icon={FileText}
                      />
                      <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                        {patientAppointments.length} visits
                      </span>
                    </div>

                    {patientAppointments.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {patientAppointments.map((appointment) => (
                          <article
                            key={appointment._id}
                            className="rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/20"
                          >
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                              <div className="flex min-w-0 gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                  <Stethoscope size={19} />
                                </div>
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-bold text-slate-900">
                                    {getDoctorName(appointment)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {appointment.docData?.speciality ||
                                      "General"}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge appointment={appointment} />
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <DetailRow
                                label="Visit date"
                                value={formatDate(appointment.slotDate)}
                                icon={CalendarDays}
                              />
                              <DetailRow
                                label="Visit time"
                                value={appointment.slotTime}
                                icon={Clock3}
                              />
                              <DetailRow
                                label="Fee"
                                value={formatCurrency(appointment.amount)}
                                icon={Wallet}
                              />
                              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                  Payment
                                </p>
                                <PaymentBadge appointment={appointment} />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openAppointmentDetails(appointment)
                              }
                              className="mt-4 inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-indigo-700 transition hover:text-indigo-900"
                            >
                              View appointment details
                              <ArrowRight size={14} />
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={FileText}
                        title="No appointment history"
                        description="No appointments were returned for this patient."
                      />
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Latest admin request error: {String(error)}
          </p>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-confirm-title"
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                confirmAction.type === "cancel"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-600",
              )}
            >
              {confirmAction.type === "cancel" ? (
                <XCircle size={24} />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </div>

            <h2
              id="appointment-confirm-title"
              className="mt-5 text-xl font-extrabold text-slate-900"
            >
              {confirmAction.type === "cancel"
                ? "Cancel this appointment?"
                : "Mark appointment completed?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {confirmAction.type === "cancel"
                ? "The appointment will be cancelled, the booked slot will be released by your backend, and the patient will be notified."
                : "The appointment will be marked completed and your backend will send the patient a completion notification."}
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm cursor-pointer font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep appointment
              </button>

              <button
                type="button"
                onClick={handleAppointmentAction}
                disabled={actionLoading}
                className={cn(
                  "flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                  confirmAction.type === "cancel"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {actionLoading
                  ? "Processing..."
                  : confirmAction.type === "cancel"
                    ? "Yes, cancel"
                    : "Confirm completion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Allappointment;
