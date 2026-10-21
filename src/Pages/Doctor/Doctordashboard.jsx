import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
  XCircle,
  CalendarCheck,
  Wallet,
  Sparkles,
  CircleAlert,
} from "lucide-react";
import { doctorDashboard } from "../../Redux/doctorSlice";

// ---------------- HELPERS ----------------

const formatDate = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatTime = (time) => time || "Time not set";

const getInitials = (name = "Doctor") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getAppointmentStatus = (appointment) => {
  if (appointment.cancelled) {
    return {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
      dotClass: "bg-rose-500",
    };
  }

  if (appointment.isCompleted) {
    return {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dotClass: "bg-emerald-500",
    };
  }

  return {
    label: "Pending",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    dotClass: "bg-blue-500",
  };
};

// ---------------- STAT CARD ----------------

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBackground,
  trendIcon: TrendIcon,
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 sm:p-6">
    <div className="relative z-10 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </h3>
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBackground}`}
      >
        <Icon size={23} className={iconClass} />
      </div>
    </div>

    <div className="relative z-10 mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
      {TrendIcon && <TrendIcon size={15} className={iconClass} />}

      <p className="text-xs leading-5 text-slate-500">{description}</p>
    </div>

    <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-slate-50/80 transition-transform duration-300 group-hover:scale-150" />
  </div>
);

// ---------------- STATUS BADGES ----------------

const AppointmentStatus = ({ appointment }) => {
  const status = getAppointmentStatus(appointment);

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
      {status.label}
    </span>
  );
};

const PaymentStatus = ({ appointment }) => {
  const paymentStatus = appointment.paymentStatus?.toLowerCase();

  const status =
    appointment.payment === true || paymentStatus === "paid"
      ? "Paid"
      : paymentStatus === "failed"
        ? "Failed"
        : "Pending";

  const styles = {
    Paid: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
    Failed: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
};

// ---------------- MAIN DASHBOARD ----------------

const Doctordashboard = () => {
  const dispatch = useDispatch();

  const doctor = useSelector((state) => state.doctor.doctor);
  const dashboard = useSelector((state) => state.doctor.dashboard);

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setPageLoading(true);
      }

      setError("");

      try {
        const result = await dispatch(doctorDashboard()).unwrap();

        if (result?.success === false) {
          throw new Error(result.message || "Unable to load dashboard.");
        }

        setRecentAppointments(
          Array.isArray(result?.recentAppointments)
            ? result.recentAppointments
            : [],
        );
      } catch (err) {
        const message =
          typeof err === "string"
            ? err
            : err?.message || "Unable to load dashboard data.";

        setError(message);
        toast.error(message);
      } finally {
        setPageLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard || {};

  const doctorName =
    doctor?.name || recentAppointments?.[0]?.docData?.name || "Doctor";

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const appointmentsToday = Number(stats.todayAppointments) || 0;
  const totalAppointments = Number(stats.totalAppointments) || 0;
  const upcomingAppointments = Number(stats.upcomingAppointments) || 0;
  const completedAppointments = Number(stats.completedAppointments) || 0;
  const cancelledAppointments = Number(stats.cancelledAppointments) || 0;
  const pendingAppointments = Number(stats.pendingAppointments) || 0;
  const totalPatients = Number(stats.totalPatients) || 0;
  const totalRevenue = Number(stats.totalRevenue) || 0;

  const completionRate =
    totalAppointments > 0
      ? Math.min(
          100,
          Math.round((completedAppointments / totalAppointments) * 100),
        )
      : 0;

  const pendingRate =
    totalAppointments > 0
      ? Math.min(
          100,
          Math.round((pendingAppointments / totalAppointments) * 100),
        )
      : 0;

  const cancelledRate =
    totalAppointments > 0
      ? Math.min(
          100,
          Math.round((cancelledAppointments / totalAppointments) * 100),
        )
      : 0;

  const handleRefresh = () => {
    loadDashboard(true);
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* ================= WELCOME HEADER ================= */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#102b52] via-[#164777] to-[#087f8c] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />

          <div className="pointer-events-none absolute -bottom-28 right-36 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-bold shadow-inner backdrop-blur-sm sm:h-16 sm:w-16 sm:text-2xl">
                {getInitials(doctorName)}
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  <Sparkles size={13} />
                  Doctor workspace
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {getGreeting()}, Dr. {doctorName.replace(/^Dr\.?\s*/i, "")}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                  Here is your practice overview. Stay updated with your
                  appointments, patients and earnings.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100 sm:text-sm">
                  <CalendarDays size={15} />
                  <span>{todayLabel}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-center"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh dashboard"}
            </button>
          </div>

          <div className="relative z-10 mt-7 grid grid-cols-1 gap-3 border-t border-white/15 pt-5 sm:grid-cols-3 sm:gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <CalendarCheck size={19} />
              </div>

              <div>
                <p className="text-xs text-blue-100">Today's appointments</p>
                <p className="mt-0.5 text-xl font-bold">
                  {pageLoading ? "—" : appointmentsToday}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Users size={19} />
              </div>

              <div>
                <p className="text-xs text-blue-100">Total patients</p>
                <p className="mt-0.5 text-xl font-bold">
                  {pageLoading ? "—" : totalPatients}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Wallet size={19} />
              </div>

              <div>
                <p className="text-xs text-blue-100">Recorded revenue</p>
                <p className="mt-0.5 text-xl font-bold">
                  {pageLoading ? "—" : formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ERROR STATE ================= */}

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CircleAlert
                className="mt-0.5 shrink-0 text-rose-600"
                size={20}
              />

              <div>
                <p className="font-semibold text-rose-800">
                  Dashboard data could not be refreshed
                </p>
                <p className="mt-1 break-words text-sm text-rose-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="cursor-pointer rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Try again
            </button>
          </div>
        )}

        {/* ================= STATISTICS ================= */}

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Practice overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your appointment activity at a glance
              </p>
            </div>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              Live API data
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total appointments"
              value={pageLoading ? "—" : totalAppointments}
              description="All appointments in your records"
              icon={CalendarDays}
              iconClass="text-blue-700"
              iconBackground="bg-blue-50"
              trendIcon={Activity}
            />

            <StatCard
              title="Upcoming appointments"
              value={pageLoading ? "—" : upcomingAppointments}
              description="Appointments scheduled for future dates"
              icon={Clock3}
              iconClass="text-violet-700"
              iconBackground="bg-violet-50"
              trendIcon={ArrowUpRight}
            />

            <StatCard
              title="Completed appointments"
              value={pageLoading ? "—" : completedAppointments}
              description={`${completionRate}% of all recorded appointments`}
              icon={CheckCircle2}
              iconClass="text-emerald-700"
              iconBackground="bg-emerald-50"
              trendIcon={TrendingUp}
            />

            <StatCard
              title="Cancelled appointments"
              value={pageLoading ? "—" : cancelledAppointments}
              description="Appointments cancelled in your records"
              icon={XCircle}
              iconClass="text-rose-700"
              iconBackground="bg-rose-50"
              trendIcon={ArrowDownRight}
            />
          </div>
        </section>

        {/* ================= INSIGHTS AND REVENUE ================= */}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Appointment insights
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Overview of your recorded appointments
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Activity size={20} />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Completed */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Completed
                  </div>

                  <span className="text-sm font-bold text-slate-900">
                    {pageLoading ? "—" : completedAppointments}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Pending */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Pending / active
                  </div>

                  <span className="text-sm font-bold text-slate-900">
                    {pageLoading ? "—" : pendingAppointments}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${pendingRate}%` }}
                  />
                </div>
              </div>

              {/* Cancelled */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Cancelled
                  </div>

                  <span className="text-sm font-bold text-slate-900">
                    {pageLoading ? "—" : cancelledAppointments}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-700"
                    style={{ width: `${cancelledRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Today's appointments
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {pageLoading ? "—" : appointmentsToday}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Unique patients
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {pageLoading ? "—" : totalPatients}
                </p>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12385e] to-[#087f8c] p-6 text-white shadow-lg shadow-cyan-950/10">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border-[22px] border-white/5" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <IndianRupee size={24} />
              </div>

              <p className="mt-5 text-sm font-medium text-cyan-100">
                Recorded paid revenue
              </p>

              <h2 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                {pageLoading ? "—" : formatCurrency(totalRevenue)}
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100">
                Total amount from appointments marked as paid in your records.
              </p>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-blue-100">
                    Completed appointments
                  </span>
                  <span className="font-bold">
                    {pageLoading ? "—" : completedAppointments}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-blue-100">Total patients</span>
                  <span className="font-bold">
                    {pageLoading ? "—" : totalPatients}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-cyan-100">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <p>
                  Revenue is based on payment records, not necessarily on
                  appointment completion alone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= RECENT APPOINTMENTS ================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Recent appointments
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest appointments from your records
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              <Activity size={15} className="text-cyan-700" />
              {recentAppointments.length} records
            </div>
          </div>

          {pageLoading ? (
            <div className="space-y-4 p-5 sm:p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : recentAppointments.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays size={25} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No appointments found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your recent appointments will appear here when available.
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#12385e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b4e79] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                Reload data
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-semibold">Patient</th>
                      <th className="px-6 py-4 font-semibold">Appointment</th>
                      <th className="px-6 py-4 font-semibold">Amount</th>
                      <th className="px-6 py-4 font-semibold">Payment</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentAppointments.map((appointment) => {
                      const patientName =
                        appointment.userData?.name || "Unknown patient";

                      return (
                        <tr
                          key={appointment._id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {appointment.userData?.image ? (
                                <img
                                  src={appointment.userData.image}
                                  alt={patientName}
                                  className="h-11 w-11 rounded-xl border border-slate-200 object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                  <UserRound size={20} />
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="max-w-[200px] truncate text-sm font-semibold text-slate-900">
                                  {patientName}
                                </p>
                                <p className="mt-1 max-w-[200px] truncate text-xs text-slate-500">
                                  {appointment.userData?.email || "No email"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(appointment.slotDate)}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock3 size={13} />
                              {formatTime(appointment.slotTime)}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-900">
                              {formatCurrency(appointment.amount)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <PaymentStatus appointment={appointment} />
                          </td>

                          <td className="px-6 py-4">
                            <AppointmentStatus appointment={appointment} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Cards */}
              <div className="grid grid-cols-1 gap-3 p-4 md:hidden sm:p-5">
                {recentAppointments.map((appointment) => {
                  const patientName =
                    appointment.userData?.name || "Unknown patient";

                  return (
                    <article
                      key={appointment._id}
                      className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {appointment.userData?.image ? (
                            <img
                              src={appointment.userData.image}
                              alt={patientName}
                              className="h-11 w-11 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                              <UserRound size={20} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-slate-900">
                              {patientName}
                            </h3>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {appointment.userData?.email || "No email"}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-sm font-bold text-slate-900">
                          {formatCurrency(appointment.amount)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600">
                          <CalendarDays size={13} />
                          {formatDate(appointment.slotDate)}
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600">
                          <Clock3 size={13} />
                          {formatTime(appointment.slotTime)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <AppointmentStatus appointment={appointment} />
                        <PaymentStatus appointment={appointment} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">
              Showing the latest {recentAppointments.length} appointment records
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex cursor-pointer items-center gap-2 self-start text-sm font-semibold text-[#164777] transition hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Update dashboard
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* ================= FOOTER ================= */}

        <footer className="flex flex-col items-center justify-between gap-2 pb-2 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
          <p className="flex items-center gap-2">
            <Stethoscope size={15} />
            Prescripto Hospital Management System
          </p>

          <p>Doctor dashboard · Data loaded from your account</p>
        </footer>
      </div>
    </main>
  );
};

export default Doctordashboard;
