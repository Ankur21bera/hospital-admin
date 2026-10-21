import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  Filter,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { getDoctorAppointments } from "../../Redux/doctorSlice";

const PAGE_SIZE = 8;

const getErrorMessage = (error) =>
  typeof error === "string"
    ? error
    : error?.message || "Something went wrong. Please try again.";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";

const getAppointmentStatus = (appointment) => {
  if (appointment?.cancelled) return "Cancelled";
  if (appointment?.isCompleted) return "Completed";
  return "Upcoming";
};

const getPaymentStatus = (appointment) => {
  if (appointment?.paymentStatus === "paid" || appointment?.payment === true) {
    return "Paid";
  }

  if (appointment?.paymentStatus === "requested") {
    return "Requested";
  }

  if (appointment?.paymentStatus === "rejected") {
    return "Rejected";
  }

  return "Pending";
};

const statusClasses = {
  Upcoming: "border-blue-200 bg-blue-50 text-blue-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const paymentClasses = {
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Requested: "border-blue-200 bg-blue-50 text-blue-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
      statusClasses[status] || statusClasses.Upcoming
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        status === "Completed"
          ? "bg-emerald-500"
          : status === "Cancelled"
            ? "bg-rose-500"
            : "bg-blue-500"
      }`}
    />
    {status}
  </span>
);

const PaymentBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
      paymentClasses[status] || paymentClasses.Pending
    }`}
  >
    <CreditCard size={13} />
    {status}
  </span>
);

const DetailItem = ({ icon: Icon, label, value, full = false }) => (
  <div
    className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 ${
      full ? "sm:col-span-2" : ""
    }`}
  >
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={16} className="shrink-0 text-indigo-500" />
      <span className="text-xs font-semibold">{label}</span>
    </div>

    <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
      {value || "Not provided"}
    </p>
  </div>
);

const SectionHeading = ({ icon: Icon, title, description }) => (
  <div className="mb-4 flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
      <Icon size={19} />
    </div>

    <div className="min-w-0">
      <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      )}
    </div>
  </div>
);

const Doctorappointment = () => {
  const dispatch = useDispatch();

  const doctorState = useSelector((state) => state.doctor || {});

  const reduxAppointments =
    doctorState.appointments || doctorState.doctorAppointments || [];

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchAppointments = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await dispatch(getDoctorAppointments()).unwrap();

        const receivedAppointments = Array.isArray(response)
          ? response
          : response?.appointments || response?.data?.appointments || [];

        setAppointments(receivedAppointments);

        if (showRefresh) {
          toast.success("Appointments refreshed successfully.");
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Keep the list in sync if the Redux slice updates it elsewhere.
  useEffect(() => {
    if (Array.isArray(reduxAppointments) && reduxAppointments.length) {
      setAppointments((current) =>
        current.length ? current : reduxAppointments,
      );
    }
  }, [reduxAppointments]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = appointments.filter((appointment) => {
      const patient = appointment?.userData || {};
      const status = getAppointmentStatus(appointment);

      const searchableText = [
        patient.name,
        patient.email,
        patient.phone,
        appointment?._id,
        appointment?.slotDate,
        appointment?.slotTime,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus = statusFilter === "All" || status === statusFilter;

      const matchesDate = !dateFilter || appointment?.slotDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });

    result.sort((a, b) => {
      const dateA = new Date(
        `${a?.slotDate || ""} ${a?.slotTime || ""}`,
      ).getTime();

      const dateB = new Date(
        `${b?.slotDate || ""} ${b?.slotTime || ""}`,
      ).getTime();

      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "patient") {
        return String(a?.userData?.name || "").localeCompare(
          String(b?.userData?.name || ""),
        );
      }

      return dateB - dateA;
    });

    return result;
  }, [appointments, search, statusFilter, dateFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedAppointments = filteredAppointments.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const stats = useMemo(
    () => ({
      total: appointments.length,
      upcoming: appointments.filter(
        (item) => getAppointmentStatus(item) === "Upcoming",
      ).length,
      completed: appointments.filter(
        (item) => getAppointmentStatus(item) === "Completed",
      ).length,
      cancelled: appointments.filter(
        (item) => getAppointmentStatus(item) === "Cancelled",
      ).length,
    }),
    [appointments],
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDateFilter("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (!filteredAppointments.length) {
      toast.error("There are no appointments to export.");
      return;
    }

    const headers = [
      "Appointment ID",
      "Patient Name",
      "Email",
      "Phone",
      "Date",
      "Time",
      "Appointment Status",
      "Payment Status",
      "Payment Method",
      "Amount",
    ];

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredAppointments.map((appointment) => [
      appointment?._id,
      appointment?.userData?.name,
      appointment?.userData?.email,
      appointment?.userData?.phone,
      appointment?.slotDate,
      appointment?.slotTime,
      getAppointmentStatus(appointment),
      getPaymentStatus(appointment),
      appointment?.paymentMethod,
      appointment?.amount ?? appointment?.docData?.fees,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "doctor-appointments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully.");
  };

  const closeDetails = () => setSelectedAppointment(null);

  useEffect(() => {
    if (!selectedAppointment) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeDetails();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedAppointment]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <RefreshCw size={26} className="animate-spin" />
          </div>
          <h2 className="mt-5 text-lg font-extrabold text-slate-900">
            Loading appointments
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please wait while we retrieve your appointment list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80">
      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* PAGE HEADER */}
        <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
              <CalendarDays size={26} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                Doctor Portal
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Appointment Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review patient appointments, check schedules and access patient
                information from one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchAppointments(true)}
              disabled={refreshing}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total appointments",
              value: stats.total,
              icon: CalendarDays,
              color: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "Upcoming",
              value: stats.upcoming,
              icon: Clock3,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle2,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Cancelled",
              value: stats.cancelled,
              icon: XCircle,
              color: "bg-rose-50 text-rose-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={21} />
                  </div>
                  <Activity size={17} className="text-slate-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* FILTERS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={18} className="text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Search and filters
            </h2>
            <span className="ml-auto text-xs font-medium text-slate-500">
              {filteredAppointments.length} result
              {filteredAppointments.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.6fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, email, phone, ID..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="All">All statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter by appointment date"
              className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="patient">Patient name A–Z</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <X size={15} />
              Reset
            </button>
          </div>
        </section>

        {/* APPOINTMENT TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Patient appointments
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Open an appointment to view its complete details.
              </p>
            </div>
            <span className="w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              Page {safePage} of {totalPages}
            </span>
          </div>

          {paginatedAppointments.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={28} />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">
                No appointments found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try changing your search or filters to see more appointments.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      {[
                        "Patient",
                        "Appointment",
                        "Contact",
                        "Status",
                        "Payment",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedAppointments.map((appointment) => {
                      const patient = appointment?.userData || {};
                      const status = getAppointmentStatus(appointment);
                      const paymentStatus = getPaymentStatus(appointment);

                      return (
                        <tr
                          key={appointment?._id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <div className="flex min-w-[190px] items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-sm font-extrabold text-indigo-700">
                                {patient?.image ? (
                                  <img
                                    src={patient.image}
                                    alt={patient?.name || "Patient"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  getInitials(patient?.name)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {patient?.name || "Unknown patient"}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  ID: {appointment?._id || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {formatDate(appointment?.slotDate)}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock3 size={13} />
                              {appointment?.slotTime || "Time not set"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[210px] truncate text-sm text-slate-700">
                              {patient?.email || "No email"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {patient?.phone || "No phone"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={status} />
                          </td>

                          <td className="px-5 py-4">
                            <PaymentBadge status={paymentStatus} />
                            <p className="mt-2 text-xs font-bold text-slate-700">
                              {formatCurrency(
                                appointment?.amount ??
                                  appointment?.docData?.fees,
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAppointment(appointment)
                              }
                              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-600 hover:text-white"
                            >
                              <Eye size={15} />
                              View details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile and tablet cards */}
              <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:hidden">
                {paginatedAppointments.map((appointment) => {
                  const patient = appointment?.userData || {};
                  const status = getAppointmentStatus(appointment);
                  const paymentStatus = getPaymentStatus(appointment);

                  return (
                    <article
                      key={appointment?._id}
                      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 font-extrabold text-indigo-700">
                          {patient?.image ? (
                            <img
                              src={patient.image}
                              alt={patient?.name || "Patient"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(patient?.name)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-extrabold text-slate-900">
                            {patient?.name || "Unknown patient"}
                          </h3>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {patient?.email || "No email provided"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Appointment ID: {appointment?._id || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="my-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                            <CalendarDays size={13} />
                            Date
                          </p>
                          <p className="mt-1.5 break-words text-sm font-bold text-slate-800">
                            {formatDate(appointment?.slotDate)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                            <Clock3 size={13} />
                            Time
                          </p>
                          <p className="mt-1.5 break-words text-sm font-bold text-slate-800">
                            {appointment?.slotTime || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={status} />
                        <PaymentBadge status={paymentStatus} />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">
                            Appointment fee
                          </p>
                          <p className="mt-1 text-base font-black text-slate-900">
                            {formatCurrency(
                              appointment?.amount ?? appointment?.docData?.fees,
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedAppointment(appointment)}
                          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                        >
                          <Eye size={15} />
                          Details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs font-medium text-slate-500">
                  Showing{" "}
                  {filteredAppointments.length
                    ? (safePage - 1) * PAGE_SIZE + 1
                    : 0}{" "}
                  –{" "}
                  {Math.min(safePage * PAGE_SIZE, filteredAppointments.length)}{" "}
                  of {filteredAppointments.length} appointments
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={safePage === 1}
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-extrabold text-white">
                    {safePage}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safePage >= totalPages}
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* ======================================================
          PREMIUM APPOINTMENT DETAILS MODAL
      ======================================================= */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-0 backdrop-blur-sm sm:p-4 md:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-details-title"
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-slate-50 shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-4xl sm:rounded-3xl lg:max-w-5xl"
          >
            {/* FIXED MODAL HEADER */}
            <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-5 pb-6 pt-5 text-white sm:px-7 sm:pb-7 sm:pt-6">
              <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-2 -top-10 h-40 w-40 rounded-full border border-white/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-sm sm:h-14 sm:w-14">
                    <FileText size={25} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200 sm:text-xs">
                      Appointment overview
                    </p>

                    <h2
                      id="appointment-details-title"
                      className="mt-1.5 break-words text-xl font-black tracking-tight sm:text-2xl"
                    >
                      Appointment details
                    </h2>

                    <p className="mt-1.5 break-all text-xs leading-5 text-indigo-100/80 sm:text-sm">
                      Reference ID:{" "}
                      {selectedAppointment?._id || "Not available"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close appointment details"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={getAppointmentStatus(selectedAppointment)}
                />
                <PaymentBadge status={getPaymentStatus(selectedAppointment)} />
              </div>
            </header>

            {/* SCROLLABLE MODAL BODY */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-7">
              {/* PATIENT PROFILE */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                  <Users size={17} className="text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Patient information
                  </h3>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 text-xl font-black text-indigo-700 sm:h-20 sm:w-20">
                      {selectedAppointment?.userData?.image ? (
                        <img
                          src={selectedAppointment.userData.image}
                          alt={selectedAppointment?.userData?.name || "Patient"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(selectedAppointment?.userData?.name)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-black text-slate-900 sm:text-xl">
                        {selectedAppointment?.userData?.name ||
                          "Patient name unavailable"}
                      </h3>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {selectedAppointment?.userData?.email ||
                          "Email not provided"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedAppointment?.userData?.gender && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                            {selectedAppointment.userData.gender}
                          </span>
                        )}

                        {selectedAppointment?.userData?.dob && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                            DOB: {formatDate(selectedAppointment.userData.dob)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem
                      icon={Phone}
                      label="Phone number"
                      value={selectedAppointment?.userData?.phone}
                    />

                    <DetailItem
                      icon={Mail}
                      label="Email address"
                      value={selectedAppointment?.userData?.email}
                    />

                    <DetailItem
                      icon={MapPin}
                      label="Patient address"
                      value={[
                        selectedAppointment?.userData?.address?.line1,
                        selectedAppointment?.userData?.address?.line2,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      full
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedAppointment?.userData?.phone && (
                      <a
                        href={`tel:${selectedAppointment.userData.phone}`}
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Phone size={15} />
                        Call patient
                      </a>
                    )}

                    {selectedAppointment?.userData?.email && (
                      <a
                        href={`mailto:${selectedAppointment.userData.email}`}
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Mail size={15} />
                        Email patient
                      </a>
                    )}
                  </div>
                </div>
              </section>

              {/* APPOINTMENT SCHEDULE */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <SectionHeading
                  icon={CalendarDays}
                  title="Schedule information"
                  description="Date, time and appointment reference"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <CalendarDays size={17} />
                      <span className="text-xs font-bold">
                        Appointment date
                      </span>
                    </div>
                    <p className="mt-3 break-words text-lg font-black text-slate-900">
                      {formatDate(selectedAppointment?.slotDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                    <div className="flex items-center gap-2 text-violet-600">
                      <Clock3 size={17} />
                      <span className="text-xs font-bold">
                        Appointment time
                      </span>
                    </div>
                    <p className="mt-3 break-words text-lg font-black text-slate-900">
                      {selectedAppointment?.slotTime || "Not specified"}
                    </p>
                  </div>

                  <DetailItem
                    icon={FileText}
                    label="Appointment ID"
                    value={selectedAppointment?._id}
                    full
                  />
                </div>
              </section>

              {/* PAYMENT DETAILS */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <SectionHeading
                  icon={CreditCard}
                  title="Payment information"
                  description="Consultation fee and payment status"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <p className="text-xs font-bold text-emerald-700">
                      Consultation amount
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {formatCurrency(
                        selectedAppointment?.amount ??
                          selectedAppointment?.docData?.fees,
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Payment method
                    </p>
                    <p className="mt-2 break-words text-base font-extrabold capitalize text-slate-900">
                      {selectedAppointment?.paymentMethod || "Not specified"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Current payment status
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {getPaymentStatus(selectedAppointment)}
                      </p>
                    </div>
                    <PaymentBadge
                      status={getPaymentStatus(selectedAppointment)}
                    />
                  </div>
                </div>
              </section>

              {/* CANCELLATION INFORMATION */}
              {selectedAppointment?.cancelled && (
                <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                      <AlertCircle size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-rose-800">
                        Appointment cancelled
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-rose-700">
                        This appointment has been cancelled.
                      </p>
                      <p className="mt-3 text-xs font-semibold text-rose-700">
                        Cancelled by:{" "}
                        {selectedAppointment?.cancelledBy || "Not specified"}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* NOTIFICATIONS */}
              {Array.isArray(selectedAppointment?.notifications) &&
                selectedAppointment.notifications.length > 0 && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <SectionHeading
                      icon={ShieldCheck}
                      title="Appointment notifications"
                      description="Updates associated with this appointment"
                    />

                    <div className="space-y-3">
                      {selectedAppointment.notifications.map(
                        (notification, index) => (
                          <div
                            key={notification?._id || index}
                            className="flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <Activity size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm leading-6 text-slate-700">
                                {notification?.message || "Appointment update"}
                              </p>

                              {notification?.date && (
                                <p className="mt-2 text-xs font-medium text-slate-400">
                                  {formatDate(notification.date)}
                                </p>
                              )}
                            </div>

                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                notification?.read
                                  ? "bg-slate-300"
                                  : "bg-indigo-500"
                              }`}
                              title={notification?.read ? "Read" : "Unread"}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                )}
            </div>

            {/* FIXED MODAL FOOTER */}
            <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="hidden text-xs text-slate-500 sm:block">
                Review patient information before the consultation.
              </p>

              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:ml-auto sm:w-auto"
              >
                <X size={16} />
                Close details
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default Doctorappointment;
