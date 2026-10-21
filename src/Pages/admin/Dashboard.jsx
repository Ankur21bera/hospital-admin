import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  UserRound,
  Wallet,
  X,
  XCircle,
  AlertCircle,
  CircleDollarSign,
} from "lucide-react";

import {
  getAdminDashboard,
  getAllAppointments,
  getOfflinePaymentRequests,
  approveOfflinePayment,
  rejectOfflinePayment,
} from "../../Redux/adminSlice";

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAppointmentStatus = (appointment) => {
  if (appointment?.cancelled) return "Cancelled";
  if (appointment?.isCompleted) return "Completed";

  if (
    appointment?.paymentStatus === "requested" &&
    appointment?.paymentMethod === "offline"
  ) {
    return "Payment Review";
  }

  return "Upcoming";
};

const getPaymentStatus = (appointment) => {
  if (appointment?.payment === true || appointment?.paymentStatus === "paid") {
    return "Paid";
  }

  if (appointment?.paymentStatus === "rejected") return "Rejected";

  if (appointment?.paymentStatus === "requested") return "Pending";

  return "Pending";
};

const getStatusStyle = (status) => {
  const styles = {
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    Cancelled: "bg-rose-50 text-rose-700 ring-rose-600/15",
    Upcoming: "bg-blue-50 text-blue-700 ring-blue-600/15",
    "Payment Review": "bg-amber-50 text-amber-700 ring-amber-600/15",
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    Pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-600/15",
    Offline: "bg-violet-50 text-violet-700 ring-violet-600/15",
    Online: "bg-blue-50 text-blue-700 ring-blue-600/15",
  };

  return styles[status] || "bg-slate-100 text-slate-600 ring-slate-500/10";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
      status,
    )}`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        status === "Completed" || status === "Paid"
          ? "bg-emerald-500"
          : status === "Cancelled" || status === "Rejected"
            ? "bg-rose-500"
            : status === "Pending" || status === "Payment Review"
              ? "bg-amber-500"
              : "bg-blue-500"
      }`}
    />
    {status}
  </span>
);

const SectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div className="min-w-0">
      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        {title}
      </h2>

      {description && (
        <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
      )}
    </div>

    {action}
  </div>
);

const EmptyState = ({ icon: Icon = CalendarDays, title, description }) => (
  <div className="flex flex-col items-center justify-center px-5 py-12 text-center sm:py-16">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
      <Icon size={27} strokeWidth={1.7} />
    </div>

    <h3 className="mt-4 text-base font-bold text-slate-800">{title}</h3>

    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
      {description}
    </p>
  </div>
);

const Avatar = ({ image, name, doctor = false, size = "h-11 w-11" }) => (
  <div
    className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-xl ${
      doctor ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
    }`}
  >
    {image ? (
      <img
        src={image}
        alt={name || (doctor ? "Doctor" : "Patient")}
        className="h-full w-full object-cover"
      />
    ) : doctor ? (
      <Stethoscope size={19} />
    ) : (
      <UserRound size={19} />
    )}
  </div>
);

const MetricCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
  accent,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg sm:p-5 ${
      onClick ? "cursor-pointer" : "cursor-default"
    }`}
  >
    <div
      className={`absolute inset-x-0 top-0 h-1 ${accent || "bg-indigo-500"}`}
    />

    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
      >
        <Icon size={21} strokeWidth={2} />
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between gap-2">
      <p className="text-xs leading-5 text-slate-500">{description}</p>

      {onClick && (
        <ChevronRight
          size={17}
          className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
        />
      )}
    </div>
  </button>
);

const AppointmentPerson = ({ image, name, subtitle, doctor = false }) => (
  <div className="flex min-w-0 items-center gap-3">
    <Avatar image={image} name={name} doctor={doctor} />

    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-slate-800">
        {name || (doctor ? "Unknown doctor" : "Unknown patient")}
      </p>

      <p className="mt-1 truncate text-xs text-slate-500">
        {subtitle || "Details unavailable"}
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    dashboard,
    appointments = [],
    offlinePaymentRequests = [],
  } = useSelector((state) => state.admin);

  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState("All");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  /* Load dashboard data */

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        dispatch(getAdminDashboard()),
        dispatch(getAllAppointments()),
        dispatch(getOfflinePaymentRequests()),
      ]);
    } catch (error) {
      toast.error("Unable to refresh the dashboard.");
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* Dashboard statistics */

  const stats = useMemo(() => {
    const data = dashboard || {};

    return [
      {
        title: "Total Patients",
        value: data.totalPatients ?? 0,
        description: "Registered patient accounts",
        icon: Users,
        iconStyle: "bg-blue-50 text-blue-600",
        accent: "bg-blue-500",
        route: "/admin/patients",
      },
      {
        title: "Total Doctors",
        value: data.totalDoctors ?? 0,
        description: "Doctors in your hospital",
        icon: Stethoscope,
        iconStyle: "bg-violet-50 text-violet-600",
        accent: "bg-violet-500",
        route: "/admin/doctor-list",
      },
      {
        title: "Appointments",
        value: data.totalAppointments ?? 0,
        description: "All booked appointments",
        icon: CalendarDays,
        iconStyle: "bg-indigo-50 text-indigo-600",
        accent: "bg-indigo-500",
        route: "/admin/appointments",
      },
      {
        title: "Completed",
        value: data.completedAppointments ?? 0,
        description: "Successfully completed",
        icon: CheckCircle2,
        iconStyle: "bg-emerald-50 text-emerald-600",
        accent: "bg-emerald-500",
        route: "/admin/appointments",
      },
      {
        title: "Pending",
        value: data.pendingAppointments ?? 0,
        description: "Awaiting completion",
        icon: Clock3,
        iconStyle: "bg-amber-50 text-amber-600",
        accent: "bg-amber-500",
        route: "/admin/appointments",
      },
      {
        title: "Cancelled",
        value: data.cancelledAppointments ?? 0,
        description: "Cancelled appointments",
        icon: XCircle,
        iconStyle: "bg-rose-50 text-rose-600",
        accent: "bg-rose-500",
        route: "/admin/cancelled-appointments",
      },
      {
        title: "Paid Appointments",
        value: data.paidAppointments ?? 0,
        description: "Payments marked as paid",
        icon: CreditCard,
        iconStyle: "bg-teal-50 text-teal-600",
        accent: "bg-teal-500",
        route: "/admin/appointments",
      },
      {
        title: "Offline Requests",
        value: data.offlinePaymentRequests ?? 0,
        description: "Waiting for admin review",
        icon: Wallet,
        iconStyle: "bg-orange-50 text-orange-600",
        accent: "bg-orange-500",
        route: "#offline-requests",
      },
    ];
  }, [dashboard]);

  /* Recent appointment filtering */

  const filteredAppointments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return appointments
      .filter((appointment) => {
        const patientName = appointment.userData?.name || "";
        const doctorName = appointment.docData?.name || "";
        const speciality = appointment.docData?.speciality || "";
        const email = appointment.userData?.email || "";

        const matchesSearch =
          !search ||
          [patientName, doctorName, speciality, email].some((value) =>
            String(value).toLowerCase().includes(search),
          );

        const status = getAppointmentStatus(appointment);

        const matchesFilter =
          appointmentFilter === "All" ||
          (appointmentFilter === "Upcoming" && status === "Upcoming") ||
          (appointmentFilter === "Completed" && status === "Completed") ||
          (appointmentFilter === "Cancelled" && status === "Cancelled") ||
          (appointmentFilter === "Payment Review" &&
            status === "Payment Review");

        return matchesSearch && matchesFilter;
      })
      .slice(0, 8);
  }, [appointments, searchTerm, appointmentFilter]);

  /* Offline payment request filtering */

  const filteredPaymentRequests = useMemo(() => {
    const search = paymentSearch.trim().toLowerCase();

    return offlinePaymentRequests.filter((appointment) => {
      const patient = appointment.userData?.name || "";
      const doctor = appointment.docData?.name || "";
      const email = appointment.userData?.email || "";

      return [patient, doctor, email].some((value) =>
        String(value).toLowerCase().includes(search),
      );
    });
  }, [offlinePaymentRequests, paymentSearch]);

  /* Approve offline payment */

  const handleApprovePayment = async (appointment) => {
    const id = appointment._id;

    if (
      !window.confirm(
        `Approve offline payment of ${formatCurrency(
          appointment.amount,
        )} for ${appointment.userData?.name || "this patient"}?`,
      )
    ) {
      return;
    }

    setActionLoading(id);

    try {
      const result = await dispatch(approveOfflinePayment(id)).unwrap();

      if (!result?.success) {
        toast.error(result?.message || "Payment approval failed.");
        return;
      }

      toast.success("Offline payment approved successfully.");
      await loadDashboard();
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Unable to approve offline payment.",
      );
    } finally {
      setActionLoading("");
    }
  };

  /* Reject offline payment */

  const handleRejectPayment = async (appointment) => {
    const id = appointment._id;

    if (
      !window.confirm(
        `Reject the offline payment request from ${
          appointment.userData?.name || "this patient"
        }?`,
      )
    ) {
      return;
    }

    setActionLoading(id);

    try {
      const result = await dispatch(rejectOfflinePayment(id)).unwrap();

      if (!result?.success) {
        toast.error(result?.message || "Payment rejection failed.");
        return;
      }

      toast.success("Offline payment request rejected.");
      await loadDashboard();
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Unable to reject offline payment.",
      );
    } finally {
      setActionLoading("");
    }
  };

  const totalAppointments = Number(dashboard?.totalAppointments) || 0;
  const paidAppointments = Number(dashboard?.paidAppointments) || 0;
  const offlineRequestsCount = Number(dashboard?.offlinePaymentRequests) || 0;

  const paidPercentage = totalAppointments
    ? Math.min(100, (paidAppointments / totalAppointments) * 100)
    : 0;

  const offlinePercentage = totalAppointments
    ? Math.min(100, (offlineRequestsCount / totalAppointments) * 100)
    : 0;

  /* Render */

  return (
    <main className="min-h-screen bg-slate-50/80 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-7 sm:space-y-9">
        {/* HERO HEADER */}

        <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-5 py-7 text-white shadow-xl shadow-indigo-950/10 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-10 -z-10 h-52 w-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 h-60 w-60 rounded-full bg-indigo-400/15 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-wide text-indigo-100 sm:text-xs">
                <Activity size={14} />
                HOSPITAL MANAGEMENT SYSTEM
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Admin Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-indigo-100/80 sm:text-base">
                Monitor hospital operations, track appointments, review payments
                and manage your daily activity from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/appointments")}
                  className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-950 shadow-sm transition hover:bg-indigo-50 sm:px-5"
                >
                  <CalendarCheck size={17} />
                  View Appointments
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/doctor-list")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 sm:px-5"
                >
                  <Stethoscope size={17} />
                  Manage Doctors
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-center gap-2 text-indigo-100/80">
                  <Users size={16} />
                  <span className="text-xs font-medium">Patients</span>
                </div>

                <p className="mt-3 text-3xl font-extrabold">
                  {dashboard?.totalPatients ?? "—"}
                </p>

                <p className="mt-1 text-xs text-indigo-100/60">
                  Registered accounts
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-center gap-2 text-indigo-100/80">
                  <CalendarDays size={16} />
                  <span className="text-xs font-medium">Appointments</span>
                </div>

                <p className="mt-3 text-3xl font-extrabold">
                  {dashboard?.totalAppointments ?? "—"}
                </p>

                <p className="mt-1 text-xs text-indigo-100/60">
                  Total bookings
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}

        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LayoutDashboard size={16} />
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="font-semibold text-slate-800">Overview</span>
            </div>

            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Hospital Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your hospital statistics and latest activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl cursor-pointer border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </section>

        {/* STATISTICS */}

        <section>
          <SectionHeading
            eyebrow="Performance"
            title="Key Statistics"
            description="A quick look at the current state of your hospital."
          />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <MetricCard
                key={stat.title}
                {...stat}
                onClick={() => {
                  if (stat.route === "#offline-requests") {
                    document
                      .getElementById("offline-requests")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    return;
                  }

                  navigate(stat.route);
                }}
              />
            ))}
          </div>
        </section>

        {/* REVENUE AND PAYMENT OVERVIEW */}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-900/10 sm:p-7 lg:col-span-2">
            <div className="pointer-events-none absolute -right-8 -top-8 -z-10 h-44 w-44 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-50">
                  <CircleDollarSign size={19} />
                  Total Revenue
                </div>

                <p className="mt-4 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {formatCurrency(dashboard?.totalRevenue)}
                </p>

                <p className="mt-2 max-w-md text-sm leading-6 text-emerald-50/80">
                  Revenue from paid, non-cancelled appointments recorded by your
                  backend.
                </p>
              </div>

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <IndianRupee size={31} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Payment Overview
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Collection Status
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CreditCard size={21} />
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Paid appointments</span>
                  <span className="font-bold text-slate-900">
                    {paidAppointments}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Offline requests</span>
                  <span className="font-bold text-slate-900">
                    {offlineRequestsCount}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${offlinePercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                Progress is calculated against total appointments.
              </p>
            </div>
          </div>
        </section>

        {/* RECENT APPOINTMENTS */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <SectionHeading
              eyebrow="Hospital Activity"
              title="Recent Appointments"
              description="Review patients, doctors, schedules and appointment status."
              action={
                <button
                  type="button"
                  onClick={() => navigate("/admin/appointments")}
                  className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-indigo-600 cursor-pointer transition hover:text-indigo-800 sm:self-auto"
                >
                  View all
                  <ArrowRight size={16} />
                </button>
              }
            />

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-w-0">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search patient, doctor, speciality..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <select
                value={appointmentFilter}
                onChange={(event) => setAppointmentFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm cursor-pointer font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="All">All statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Payment Review">Payment review</option>
              </select>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No appointments found"
              description="Try changing the search term or selecting a different status."
            />
          ) : (
            <>
              {/* Desktop table */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">Patient</th>
                      <th className="px-5 py-4">Doctor</th>
                      <th className="px-5 py-4">Schedule</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((appointment) => {
                      const patient = appointment.userData || {};
                      const doctor = appointment.docData || {};

                      return (
                        <tr
                          key={appointment._id}
                          className="transition hover:bg-indigo-50/30"
                        >
                          <td className="px-5 py-4">
                            <AppointmentPerson
                              image={patient.image}
                              name={patient.name || "Unknown patient"}
                              subtitle={patient.email || "No email available"}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <AppointmentPerson
                              image={doctor.image}
                              name={doctor.name || "Unknown doctor"}
                              subtitle={doctor.speciality || "General"}
                              doctor
                            />
                          </td>

                          <td className="px-5 py-4">
                            <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                              {formatDate(appointment.slotDate)}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock3 size={13} />
                              {appointment.slotTime || "Time unavailable"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-slate-900">
                              {formatCurrency(appointment.amount)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-1.5">
                              <StatusBadge
                                status={getPaymentStatus(appointment)}
                              />
                              <span className="text-xs capitalize text-slate-500">
                                {appointment.paymentMethod || "Not specified"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={getAppointmentStatus(appointment)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile and tablet cards */}

              <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:hidden">
                {filteredAppointments.map((appointment) => {
                  const patient = appointment.userData || {};
                  const doctor = appointment.docData || {};

                  return (
                    <article
                      key={appointment._id}
                      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <AppointmentPerson
                          image={patient.image}
                          name={patient.name || "Unknown patient"}
                          subtitle={patient.email || "No email available"}
                        />

                        <StatusBadge
                          status={getAppointmentStatus(appointment)}
                        />
                      </div>

                      <div className="my-4 border-t border-slate-100" />

                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          image={doctor.image}
                          name={doctor.name}
                          doctor
                        />

                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">
                            Appointment with
                          </p>
                          <p className="mt-1 truncate text-sm font-bold text-slate-800">
                            {doctor.name || "Unknown doctor"}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {doctor.speciality || "General"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatDate(appointment.slotDate)}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Clock3 size={12} />
                            {appointment.slotTime || "Unavailable"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="mt-1 break-words text-lg font-extrabold text-slate-900">
                            {formatCurrency(appointment.amount)}
                          </p>
                          <div className="mt-1">
                            <StatusBadge
                              status={getPaymentStatus(appointment)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span className="capitalize">
                          Payment:{" "}
                          {appointment.paymentMethod || "Not specified"}
                        </span>
                        <span className="font-medium">Appointment</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
            <span>
              Showing {filteredAppointments.length} appointment
              {filteredAppointments.length === 1 ? "" : "s"}
              {appointments.length > 8 ? " · Latest 8 records" : ""}
            </span>

            <button
              type="button"
              onClick={() => navigate("/admin/appointments")}
              className="inline-flex items-center gap-1 self-start font-semibold text-indigo-600 transition cursor-pointer hover:text-indigo-800 sm:self-auto"
            >
              Manage appointments
              <ChevronRight size={15} />
            </button>
          </div>
        </section>

        {/* OFFLINE PAYMENT REQUESTS */}

        <section
          id="offline-requests"
          className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <SectionHeading
                eyebrow="Payment Management"
                title="Offline Payment Requests"
                description="Review offline payment requests and approve or reject them."
              />

              <div className="flex w-fit items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                <AlertCircle size={17} />
                {offlinePaymentRequests.length} awaiting review
              </div>
            </div>

            <div className="relative mt-5 max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={paymentSearch}
                onChange={(event) => setPaymentSearch(event.target.value)}
                placeholder="Search patient or doctor..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {filteredPaymentRequests.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={
                offlinePaymentRequests.length === 0
                  ? "All caught up!"
                  : "No matching requests"
              }
              description={
                offlinePaymentRequests.length === 0
                  ? "There are no offline payment requests waiting for review."
                  : "Try another patient or doctor name."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-2">
              {filteredPaymentRequests.map((appointment) => {
                const patient = appointment.userData || {};
                const doctor = appointment.docData || {};
                const isWorking = actionLoading === appointment._id;

                return (
                  <article
                    key={appointment._id}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:border-indigo-200 hover:shadow-md sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          image={patient.image}
                          name={patient.name}
                          size="h-12 w-12"
                        />

                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900">
                            {patient.name || "Unknown patient"}
                          </h3>

                          <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-500">
                            <Mail size={12} className="shrink-0" />
                            <span className="truncate">
                              {patient.email || "No email available"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <StatusBadge status="Pending" />
                    </div>

                    <div className="my-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Requested Amount
                          </p>

                          <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                            {formatCurrency(appointment.amount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <Wallet size={17} className="text-indigo-600" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              Offline
                            </p>
                            <p className="text-xs text-slate-500">
                              Payment method
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <Stethoscope size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">
                            Appointment with
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                            {doctor.name || "Unknown doctor"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {doctor.speciality || "Speciality unavailable"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <CalendarDays size={17} />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Appointment schedule
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatDate(appointment.slotDate)}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock3 size={13} />
                            {appointment.slotTime || "Time unavailable"}
                          </p>
                        </div>
                      </div>

                      {patient.phone && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <Phone size={16} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">
                              Patient phone
                            </p>
                            <p className="mt-1 break-words text-sm font-medium text-slate-800">
                              {patient.phone}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleRejectPayment(appointment)}
                        disabled={isWorking || refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isWorking ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <X size={17} />
                        )}
                        {isWorking ? "Processing..." : "Reject Request"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprovePayment(appointment)}
                        disabled={isWorking || refreshing}
                        className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isWorking ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <Check size={18} />
                        )}
                        {isWorking ? "Processing..." : "Approve Payment"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
            <p className="text-xs leading-5 text-slate-500">
              Approving a request marks the payment as paid and triggers the
              notification and email logic configured in your backend. Rejected
              requests are removed from this pending-request list.
            </p>
          </div>
        </section>
        {/* FOOTER */}
        <footer className="flex flex-col justify-between gap-2 border-t border-slate-200/80 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} MediCare Hospital Management System
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            Secure admin dashboard
          </p>
        </footer>
      </div>
    </main>
  );
};
export default Dashboard;
