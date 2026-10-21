
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  Ban,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileClock,
  FileText,
  Filter,
  Info,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Stethoscope,
  X,
  XCircle,
} from "lucide-react";

import {
  applyLeave,
  getMyLeaves,
  getSingleLeave,
  cancelLeave,
} from "../../Redux/doctorSlice";

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Personal Leave",
  "Other",
];

const STATUS_OPTIONS = [
  "All Status",
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
];

// --------------------------------------------------
// DATE HELPERS
// --------------------------------------------------

const getLocalDate = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

// Validates the actual calendar date without using toISOString().
const isValidCalendarDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  const dateString = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    if (!isValidCalendarDate(dateString)) return "—";

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getLeaveDays = (startDate, endDate) => {
  if (
    !isValidCalendarDate(startDate) ||
    !isValidCalendarDate(endDate) ||
    startDate > endDate
  ) {
    return 0;
  }

  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);

  return Math.round((end - start) / 86400000) + 1;
};

const getStatusConfig = (status) => {
  const configs = {
    Pending: {
      label: "Pending Review",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      icon: Clock3,
    },
    Approved: {
      label: "Approved",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      icon: CheckCircle2,
    },
    Rejected: {
      label: "Rejected",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
      icon: XCircle,
    },
    Cancelled: {
      label: "Cancelled",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
      icon: Ban,
    },
  };

  return configs[status] || configs.Pending;
};

const getLeaveTypeStyle = (type) => {
  const styles = {
    "Casual Leave": "bg-blue-50 text-blue-700",
    "Sick Leave": "bg-rose-50 text-rose-700",
    "Emergency Leave": "bg-orange-50 text-orange-700",
    "Personal Leave": "bg-violet-50 text-violet-700",
    Other: "bg-slate-100 text-slate-700",
  };

  return styles[type] || styles.Other;
};

// --------------------------------------------------
// REUSABLE COMPONENTS
// --------------------------------------------------

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
};

const TypeBadge = ({ type }) => (
  <span
    className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold ${getLeaveTypeStyle(
      type
    )}`}
  >
    {type || "Other"}
  </span>
);

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconClass,
}) => (
  <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
      >
        <Icon size={22} className={iconClass} />
      </div>
    </div>
  </div>
);

const FieldLabel = ({ children, required = false }) => (
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    {children}
    {required && <span className="ml-1 text-rose-500">*</span>}
  </label>
);

const EmptyState = ({ onApply }) => (
  <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <CalendarDays size={30} />
    </div>

    <h3 className="mt-5 text-lg font-bold text-slate-800">
      No leave applications found
    </h3>

    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
      Your leave history will appear here. Apply for leave whenever you need
      time away from your hospital duties.
    </p>

    <button
      type="button"
      onClick={onApply}
      className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
    >
      <Plus size={17} />
      Apply for Leave
    </button>
  </div>
);

// --------------------------------------------------
// MODAL SHELL
// --------------------------------------------------

const ModalShell = ({
  children,
  onClose,
  labelledBy,
  maxWidth = "max-w-2xl",
}) => (
  <div
    className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div className="flex min-h-full items-center justify-center py-1 sm:py-2">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative flex w-full ${maxWidth} max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl`}
      >
        {children}
      </div>
    </div>
  </div>
);

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

const Doctorleave = () => {
  const dispatch = useDispatch();
  const { leaves = [] } = useSelector((state) => state.doctor);
  const safeLeaves = Array.isArray(leaves) ? leaves : [];

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [sortOrder, setSortOrder] = useState("newest");

  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // --------------------------------------------------
  // LOAD LEAVES
  // --------------------------------------------------

  const loadLeaves = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setPageLoading(true);

      try {
        await dispatch(getMyLeaves()).unwrap();
      } catch (error) {
        toast.error(
          typeof error === "string"
            ? error
            : "Unable to load your leave applications."
        );
      } finally {
        setPageLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const stats = useMemo(
    () => ({
      total: safeLeaves.length,
      pending: safeLeaves.filter((item) => item.status === "Pending").length,
      approved: safeLeaves.filter((item) => item.status === "Approved").length,
      closed: safeLeaves.filter((item) =>
        ["Rejected", "Cancelled"].includes(item.status)
      ).length,
    }),
    [safeLeaves]
  );

  // --------------------------------------------------
  // FILTERS AND SORTING
  // --------------------------------------------------

  const filteredLeaves = useMemo(() => {
    let result = [...safeLeaves];

    if (statusFilter !== "All Status") {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (typeFilter !== "All Types") {
      result = result.filter((item) => item.leaveType === typeFilter);
    }

    const term = search.trim().toLowerCase();

    if (term) {
      result = result.filter((item) =>
        [
          item.leaveType,
          item.reason,
          item.status,
          item.adminRemark,
          item.startDate,
          item.endDate,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.appliedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.appliedAt || 0).getTime();

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [safeLeaves, statusFilter, typeFilter, search, sortOrder]);

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setFormError("");
  };

  const openApplyForm = () => {
    setForm({
      leaveType: "Casual Leave",
      startDate: "",
      endDate: "",
      reason: "",
    });

    setFormError("");
    setShowForm(true);
  };

  const closeApplyForm = () => {
    if (submitting) return;
    setShowForm(false);
    setFormError("");
  };

  const handleApplyLeave = async (event) => {
    event.preventDefault();
    setFormError("");

    const { leaveType, startDate, endDate, reason } = form;

    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (!LEAVE_TYPES.includes(leaveType)) {
      setFormError("Please select a valid leave type.");
      return;
    }

    // FIX: validate real calendar dates without toISOString().
    if (
      !isValidCalendarDate(startDate) ||
      !isValidCalendarDate(endDate)
    ) {
      setFormError("Please enter valid calendar dates.");
      return;
    }

    // YYYY-MM-DD strings can be safely compared lexicographically.
    const today = getLocalDate();

    if (startDate < today) {
      setFormError("Leave start date cannot be in the past.");
      return;
    }

    if (startDate > endDate) {
      setFormError("Start date cannot be after the end date.");
      return;
    }

    if (reason.trim().length < 3) {
      setFormError("Please provide a more detailed leave reason.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await dispatch(
        applyLeave({
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
        })
      ).unwrap();

      if (!result?.success) {
        throw new Error(result?.message || "Unable to submit leave.");
      }

      setShowForm(false);
      setForm({
        leaveType: "Casual Leave",
        startDate: "",
        endDate: "",
        reason: "",
      });

      if (result.appointmentConflict) {
        toast(
          `Leave submitted, but ${result.conflictCount} active appointment(s) conflict with these dates.`,
          { icon: "⚠️", duration: 6000 }
        );
      } else {
        toast.success(result.message || "Leave application submitted.");
      }

      await loadLeaves(true);
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Failed to submit leave application.";

      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // LEAVE DETAILS
  // --------------------------------------------------

  const openLeaveDetails = async (item) => {
    setSelectedLeave(item);
    setShowDetails(true);
    setDetailsLoading(true);

    try {
      const result = await dispatch(getSingleLeave(item._id)).unwrap();

      if (result?.leave) {
        setSelectedLeave(result.leave);
      }
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Unable to load complete leave details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedLeave(null);
  };

  // --------------------------------------------------
  // CANCEL LEAVE
  // --------------------------------------------------

  const handleCancelLeave = async (item) => {
    if (item.status !== "Pending") {
      toast.error("Only pending leave applications can be cancelled.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to cancel this leave application?"
      )
    ) {
      return;
    }

    setCancellingId(item._id);

    try {
      const result = await dispatch(cancelLeave(item._id)).unwrap();

      if (!result?.success) {
        throw new Error(result?.message || "Unable to cancel this leave.");
      }

      if (result.leave) {
        setSelectedLeave((previous) =>
          previous && String(previous._id) === String(result.leave._id)
            ? result.leave
            : previous
        );
      }

      toast.success(result.message || "Leave cancelled successfully.");
      await loadLeaves(true);
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to cancel leave."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All Status");
    setTypeFilter("All Types");
    setSortOrder("newest");
  };

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <CalendarDays size={25} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  My Leave
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100">
                  Doctor Portal
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Manage your leave requests and track approval status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadLeaves(true)}
              disabled={refreshing || pageLoading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openApplyForm}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus size={18} />
              Apply for Leave
            </button>
          </div>
        </header>

        {/* HERO */}

        <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-5 py-7 text-white shadow-lg sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[35px] border-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
                <ShieldCheck size={15} />
                Leave Management Center
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Plan your time off with confidence.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100/85 sm:text-base">
                Submit leave requests, review your application history and
                track decisions from your hospital administrator.
              </p>

              <button
                type="button"
                onClick={openApplyForm}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
              >
                <Send size={16} />
                Submit a Request
              </button>
            </div>

            <div className="hidden shrink-0 items-center justify-center md:flex">
              <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10">
                <CalendarDays size={62} strokeWidth={1.25} />
              </div>
            </div>
          </div>
        </section>

        {/* STATISTICS */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Applications"
            value={stats.total}
            description="All your submitted leave requests"
            icon={FileText}
            iconBg="bg-blue-50"
            iconClass="text-blue-600"
          />
          <StatCard
            title="Awaiting Review"
            value={stats.pending}
            description="Requests waiting for a decision"
            icon={Clock3}
            iconBg="bg-amber-50"
            iconClass="text-amber-600"
          />
          <StatCard
            title="Approved Leaves"
            value={stats.approved}
            description="Requests approved by administration"
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconClass="text-emerald-600"
          />
          <StatCard
            title="Closed Requests"
            value={stats.closed}
            description="Rejected or cancelled applications"
            icon={FileClock}
            iconBg="bg-slate-100"
            iconClass="text-slate-600"
          />
        </section>

        {/* LEAVE HISTORY */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileClock size={19} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Leave History
                </h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {filteredLeaves.length} of {safeLeaves.length} application
                {safeLeaves.length === 1 ? "" : "s"} displayed
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Activity size={15} className="text-blue-600" />
              Your applications at a glance
            </div>
          </div>

          {/* FILTERS */}

          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto] lg:p-5">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reason or leave type..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="relative">
              <Calendar
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="All Types">All Leave Types</option>
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setSortOrder((previous) =>
                    previous === "newest" ? "oldest" : "newest"
                  )
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <ArrowDownUp size={16} />
                {sortOrder === "newest" ? "Newest" : "Oldest"}
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Reset
              </button>
            </div>
          </div>

          {/* DATA */}

          {pageLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-4 py-12">
              <LoaderCircle size={34} className="animate-spin text-blue-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading your leave applications...
              </p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <EmptyState onApply={openApplyForm} />
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Leave Details
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Duration
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Applied On
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredLeaves.map((item) => {
                      const days = getLeaveDays(item.startDate, item.endDate);

                      return (
                        <tr
                          key={item._id}
                          className="transition-colors hover:bg-blue-50/30"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                <Stethoscope size={19} />
                              </div>
                              <div className="min-w-0 max-w-[230px]">
                                <TypeBadge type={item.leaveType} />
                                <p
                                  className="mt-2 truncate text-sm font-semibold text-slate-800"
                                  title={item.reason}
                                >
                                  {item.reason}
                                </p>
                                {item.adminRemark && (
                                  <p className="mt-1 truncate text-xs text-slate-500">
                                    Admin: {item.adminRemark}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(item.startDate)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              to {formatDate(item.endDate)}
                            </p>
                            <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                              {days} day{days === 1 ? "" : "s"}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-sm font-medium text-slate-700">
                              {formatDate(item.appliedAt || item.createdAt)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Application date
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openLeaveDetails(item)}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Eye size={14} />
                                Details
                              </button>

                              {item.status === "Pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelLeave(item)}
                                  disabled={cancellingId === item._id}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {cancellingId === item._id ? (
                                    <LoaderCircle size={14} className="animate-spin" />
                                  ) : (
                                    <X size={14} />
                                  )}
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-3 p-4 md:hidden">
                {filteredLeaves.map((item) => (
                  <article
                    key={item._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <CalendarDays size={19} />
                        </div>
                        <div className="min-w-0">
                          <TypeBadge type={item.leaveType} />
                          <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                            {item.reason}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openLeaveDetails(item)}
                        title="View details"
                        aria-label="View leave details"
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={17} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Start Date
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formatDate(item.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          End Date
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formatDate(item.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Duration
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {getLeaveDays(item.startDate, item.endDate)} day(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Applied On
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formatDate(item.appliedAt || item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <StatusBadge status={item.status} />

                      {item.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => handleCancelLeave(item)}
                          disabled={cancellingId === item._id}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId === item._id ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <X size={14} />
                          )}
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!pageLoading && filteredLeaves.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredLeaves.length}
                </span>{" "}
                application(s)
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                Leave status is updated by your administrator.
              </p>
            </div>
          )}
        </section>

        {/* INFORMATION */}

        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Info size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900">
              Important information
            </h3>
            <p className="mt-1 text-sm leading-6 text-blue-800/80">
              Leave applications remain pending until your administrator
              reviews them. Only pending applications can be cancelled from
              this page. Please check existing appointments before requesting
              leave.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          APPLY LEAVE MODAL
      ================================================= */}

      {showForm && (
        <ModalShell onClose={closeApplyForm} labelledBy="apply-leave-title">
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-5 text-white sm:px-7 sm:py-6">
            <div className="pointer-events-none absolute -right-5 -top-10 h-36 w-36 rounded-full border-[20px] border-white/10" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <CalendarDays size={23} />
                </div>
                <div className="min-w-0">
                  <h2 id="apply-leave-title" className="text-lg font-bold sm:text-xl">
                    Apply for Leave
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-blue-100">
                    Fill in the details of your leave request.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeApplyForm}
                disabled={submitting}
                aria-label="Close form"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleApplyLeave}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-7">
              <div>
                <FieldLabel required>Leave Type</FieldLabel>
                <div className="relative">
                  <select
                    name="leaveType"
                    value={form.leaveType}
                    onChange={updateForm}
                    required
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  >
                    {LEAVE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <FieldLabel required>Start Date</FieldLabel>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={updateForm}
                    min={getLocalDate()}
                    max={form.endDate || undefined}
                    required
                    className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:px-4"
                  />
                </div>

                <div className="min-w-0">
                  <FieldLabel required>End Date</FieldLabel>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={updateForm}
                    min={form.startDate || getLocalDate()}
                    required
                    className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:px-4"
                  />
                </div>
              </div>

              {form.startDate &&
                form.endDate &&
                isValidCalendarDate(form.startDate) &&
                isValidCalendarDate(form.endDate) &&
                form.startDate <= form.endDate && (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <Calendar size={19} className="shrink-0 text-blue-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-blue-900">
                        {getLeaveDays(form.startDate, form.endDate)} day(s)
                        requested
                      </p>
                      <p className="mt-0.5 text-xs text-blue-700">
                        {formatDate(form.startDate)} – {formatDate(form.endDate)}
                      </p>
                    </div>
                  </div>
                )}

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <FieldLabel required>Reason for Leave</FieldLabel>
                  <span className="shrink-0 text-xs text-slate-400">
                    {form.reason.length}/500
                  </span>
                </div>

                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={updateForm}
                  rows={4}
                  maxLength={500}
                  required
                  placeholder="Please explain why you need leave..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                />
                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  Provide enough detail to help your administrator review the
                  request.
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="break-words leading-5">{formError}</p>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3.5">
                <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs leading-5 text-amber-800">
                  Your request will be submitted as Pending. Please check for
                  conflicting patient appointments during your requested dates.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={closeApplyForm}
                disabled={submitting}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* =================================================
          LEAVE DETAILS MODAL
      ================================================= */}

      {showDetails && selectedLeave && (
        <ModalShell
          onClose={closeDetails}
          labelledBy="leave-details-title"
          maxWidth="max-w-xl"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <h2 id="leave-details-title" className="text-lg font-bold text-slate-900 sm:text-xl">
                  Leave Details
                </h2>
                <p className="mt-1 break-all text-xs leading-5 text-slate-500">
                  Application ID: {selectedLeave._id}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeDetails}
              aria-label="Close details"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {detailsLoading && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <LoaderCircle size={17} className="animate-spin" />
                Loading latest application details...
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <TypeBadge type={selectedLeave.leaveType} />
              <StatusBadge status={selectedLeave.status} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={16} />
                  <span className="text-xs font-medium">Start Date</span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {formatDate(selectedLeave.startDate)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarDays size={16} />
                  <span className="text-xs font-medium">End Date</span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {formatDate(selectedLeave.endDate)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock3 size={16} />
                  <span className="text-xs font-medium">Total Duration</span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {getLeaveDays(selectedLeave.startDate, selectedLeave.endDate)} day(s)
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <FileClock size={16} />
                  <span className="text-xs font-medium">Applied On</span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {formatDateTime(selectedLeave.appliedAt || selectedLeave.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                <MessageSquareText size={17} className="text-blue-600" />
                Reason for Leave
              </h3>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {selectedLeave.reason || "No reason provided."}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800">
                Administrator Response
              </h3>
              <div
                className={`rounded-xl border p-4 ${
                  selectedLeave.adminRemark
                    ? "border-blue-100 bg-blue-50/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="break-words text-sm leading-6 text-slate-600">
                  {selectedLeave.adminRemark ||
                    "No administrator remark has been added yet."}
                </p>

                {selectedLeave.approvedAt && (
                  <p className="mt-3 text-xs text-emerald-700">
                    Approved on: {formatDateTime(selectedLeave.approvedAt)}
                  </p>
                )}
                {selectedLeave.rejectedAt && (
                  <p className="mt-3 text-xs text-rose-700">
                    Rejected on: {formatDateTime(selectedLeave.rejectedAt)}
                  </p>
                )}
                {selectedLeave.cancelledAt && (
                  <p className="mt-3 text-xs text-slate-500">
                    Cancelled on: {formatDateTime(selectedLeave.cancelledAt)}
                  </p>
                )}
              </div>
            </div>

            {selectedLeave.status === "Pending" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3.5">
                <Clock3 size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs leading-5 text-amber-800">
                  This application is awaiting administrator review. You can
                  cancel it while its status remains Pending.
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={closeDetails}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Close
            </button>

            {selectedLeave.status === "Pending" && (
              <button
                type="button"
                onClick={() => handleCancelLeave(selectedLeave)}
                disabled={cancellingId === selectedLeave._id}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancellingId === selectedLeave._id ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Cancel Application
              </button>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
};
export default Doctorleave;
