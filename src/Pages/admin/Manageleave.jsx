
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Ban,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  LoaderCircle,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Stethoscope,
  UserRound,
  X,
  XCircle,
  Eye,
} from "lucide-react";

import {
  getAllLeaves,
  getAdminSingleLeave,
  approveLeave,
  rejectLeave,
  cancelApprovedLeave,
} from "../../Redux/adminSlice";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  Cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
};

const STATUS_DOT = {
  Pending: "bg-amber-500",
  Approved: "bg-emerald-500",
  Rejected: "bg-rose-500",
  Cancelled: "bg-slate-400",
};

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Medical Leave",
  "Earned Leave",
  "Emergency Leave",
  "Other",
];

const formatDate = (value) => {
  if (!value) return "—";

  // Date-only strings ko local timezone mein shift hone se bachata hai.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  const date = dateOnly
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  return Math.floor((end - start) / 86400000) + 1;
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DR";

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  return error?.message || error?.data?.message || "Something went wrong.";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
      STATUS_STYLES[status] || STATUS_STYLES.Cancelled
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        STATUS_DOT[status] || STATUS_DOT.Cancelled
      }`}
    />
    {status || "Unknown"}
  </span>
);

const StatCard = ({ title, count, icon: Icon, color, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {count}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>

      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={21} strokeWidth={2} />
      </div>
    </div>
  </div>
);

const DetailItem = ({ icon: Icon, label, children }) => (
  <div className="flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
    <div className="mt-0.5 shrink-0 text-slate-400">
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {children || "—"}
      </div>
    </div>
  </div>
);

const Manageleave = () => {
  const dispatch = useDispatch();

  const { leaves = [], loading = false } = useSelector(
    (state) => state.admin || {}
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [adminRemark, setAdminRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [showConflictConfirmation, setShowConflictConfirmation] =
    useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);

  const fetchLeaves = useCallback(async () => {
    try {
      await dispatch(getAllLeaves({})).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const safeLeaves = Array.isArray(leaves) ? leaves : [];

  const stats = useMemo(() => {
    const count = (status) =>
      safeLeaves.filter((leave) => leave.status === status).length;

    return {
      total: safeLeaves.length,
      pending: count("Pending"),
      approved: count("Approved"),
      rejected: count("Rejected"),
      cancelled: count("Cancelled"),
    };
  }, [safeLeaves]);

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeLeaves
      .filter((leave) => {
        const matchesSearch =
          !query ||
          [
            leave.doctorName,
            leave.doctorEmail,
            leave.reason,
            leave.leaveType,
          ].some((value) => String(value || "").toLowerCase().includes(query));

        const matchesStatus =
          statusFilter === "All" || leave.status === statusFilter;

        const matchesType =
          typeFilter === "All" || leave.leaveType === typeFilter;

        const matchesTab =
          activeTab === "All" || leave.status === activeTab;

        return matchesSearch && matchesStatus && matchesType && matchesTab;
      })
      .sort(
        (a, b) =>
          new Date(b.appliedAt || b.createdAt || 0) -
          new Date(a.appliedAt || a.createdAt || 0)
      );
  }, [safeLeaves, search, statusFilter, typeFilter, activeTab]);

  const openDetails = async (leave) => {
    setSelectedLeave(leave);
    setAdminRemark(leave.adminRemark || "");
    setConflicts([]);
    setShowConflictConfirmation(false);
    setPendingApproval(null);

    // List data immediately dikhate hain; detail API se latest record laate hain.
    setDetailLoading(true);

    try {
      const result = await dispatch(
        getAdminSingleLeave(leave._id)
      ).unwrap();

      if (result?.leave) {
        setSelectedLeave(result.leave);
        setAdminRemark(result.leave.adminRemark || "");
      }

      const conflictList =
        result?.conflicts || result?.appointments || [];

      if (Array.isArray(conflictList)) {
        setConflicts(conflictList);
      }
    } catch (error) {
      // Agar detail endpoint fail ho, list se available data phir bhi dikhega.
      console.error("Unable to load leave details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    if (actionLoading) return;

    setSelectedLeave(null);
    setAdminRemark("");
    setConflicts([]);
    setShowConflictConfirmation(false);
    setPendingApproval(null);
  };

  const updateSelectedLeave = (updatedLeave) => {
    if (updatedLeave) {
      setSelectedLeave(updatedLeave);
      setAdminRemark(updatedLeave.adminRemark || "");
    }
  };

  const handleApprove = async (forceApprove = false) => {
    if (!selectedLeave?._id) return;

    setActionLoading(true);

    try {
      const result = await dispatch(
        approveLeave({
          leaveId: selectedLeave._id,
          adminRemark: adminRemark.trim(),
          forceApprove,
        })
      ).unwrap();

      if (result?.leave) {
        updateSelectedLeave(result.leave);
      }

      setShowConflictConfirmation(false);
      setPendingApproval(null);
      toast.success(result?.message || "Leave approved successfully.");

      await fetchLeaves();

      if (result?.leave) {
        setSelectedLeave(result.leave);
      } else {
        setSelectedLeave(null);
      }
    } catch (error) {
      /*
       * Conflict confirmation tabhi chalega jab Redux thunk
       * rejectWithValue mein complete response object return kare.
       */
      if (error?.requireForceApprove === true && !forceApprove) {
        setPendingApproval({
          leaveId: selectedLeave._id,
          remark: adminRemark.trim(),
        });

        const conflictList =
          error?.conflicts || error?.appointments || [];

        setConflicts(Array.isArray(conflictList) ? conflictList : []);
        setShowConflictConfirmation(true);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmForceApprove = async () => {
    if (!pendingApproval) return;

    setActionLoading(true);

    try {
      const result = await dispatch(
        approveLeave({
          leaveId: pendingApproval.leaveId,
          adminRemark: pendingApproval.remark,
          forceApprove: true,
        })
      ).unwrap();

      toast.success(result?.message || "Leave approved successfully.");
      setShowConflictConfirmation(false);
      setPendingApproval(null);

      await fetchLeaves();
      setSelectedLeave(result?.leave || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLeave?._id) return;

    if (!adminRemark.trim()) {
      toast.error("Please enter an admin remark before rejecting.");
      return;
    }

    if (
      !window.confirm(
        `Reject the leave request of ${selectedLeave.doctorName || "this doctor"}?`
      )
    ) {
      return;
    }

    setActionLoading(true);

    try {
      const result = await dispatch(
        rejectLeave({
          leaveId: selectedLeave._id,
          adminRemark: adminRemark.trim(),
        })
      ).unwrap();

      toast.success(result?.message || "Leave rejected successfully.");
      await fetchLeaves();
      setSelectedLeave(result?.leave || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelApproved = async () => {
    if (!selectedLeave?._id) return;

    if (!adminRemark.trim()) {
      toast.error("Please enter a remark for cancelling this leave.");
      return;
    }

    if (
      !window.confirm(
        `Cancel the approved leave of ${selectedLeave.doctorName || "this doctor"}?`
      )
    ) {
      return;
    }

    setActionLoading(true);

    try {
      const result = await dispatch(
        cancelApprovedLeave({
          leaveId: selectedLeave._id,
          adminRemark: adminRemark.trim(),
        })
      ).unwrap();

      toast.success(result?.message || "Approved leave cancelled.");
      await fetchLeaves();
      setSelectedLeave(result?.leave || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setActiveTab("All");
  };

  const tabs = [
    { label: "All leaves", value: "All", count: stats.total },
    { label: "Pending", value: "Pending", count: stats.pending },
    { label: "Approved", value: "Approved", count: stats.approved },
    { label: "Rejected", value: "Rejected", count: stats.rejected },
    { label: "Cancelled", value: "Cancelled", count: stats.cancelled },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50">
                <CalendarRange size={16} />
              </span>
              Administration / Leave management
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Doctor Leave Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review leave applications, manage approvals and track doctor
              leave history from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLeaves}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh data
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total applications"
            count={stats.total}
            icon={FileText}
            color="bg-blue-50 text-blue-600"
            description="All recorded requests"
          />
          <StatCard
            title="Pending review"
            count={stats.pending}
            icon={Clock3}
            color="bg-amber-50 text-amber-600"
            description="Awaiting admin action"
          />
          <StatCard
            title="Approved"
            count={stats.approved}
            icon={CheckCircle2}
            color="bg-emerald-50 text-emerald-600"
            description="Approved leave requests"
          />
          <StatCard
            title="Rejected"
            count={stats.rejected}
            icon={XCircle}
            color="bg-rose-50 text-rose-600"
            description="Rejected applications"
          />
          <StatCard
            title="Cancelled"
            count={stats.cancelled}
            icon={Ban}
            color="bg-slate-100 text-slate-600"
            description="Cancelled leave records"
          />
        </div>

        {/* Main content */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Leave applications
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search, filter and review submitted applications.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:min-w-[260px]">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search doctor, email, reason..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw size={15} />
                  Reset filters
                </button>
              </div>
            </div>

            {/* Status tabs */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.value);
                    setStatusFilter("All");
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    activeTab === tab.value
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs ${
                      activeTab === tab.value
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter controls */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Filter size={14} />
                  Filter by status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <SlidersHorizontal size={14} />
                  Filter by leave type
                </label>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  >
                    <option value="All">All leave types</option>
                    {LEAVE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/65 pt-16 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                  <LoaderCircle
                    size={18}
                    className="animate-spin text-teal-600"
                  />
                  Loading leave applications...
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Doctor
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Leave details
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Leave period
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Applied on
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {!loading && filteredLeaves.map((leave) => {
                    const days = getLeaveDays(
                      leave.startDate,
                      leave.endDate
                    );

                    return (
                      <tr
                        key={leave._id}
                        className="transition hover:bg-teal-50/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700 ring-1 ring-teal-100">
                              {getInitials(leave.doctorName)}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate text-sm font-bold text-slate-800">
                                {leave.doctorName || "Unknown doctor"}
                              </p>
                              <p className="mt-1 flex max-w-[200px] items-center gap-1.5 truncate text-xs text-slate-500">
                                <Mail size={12} className="shrink-0" />
                                {leave.doctorEmail || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {leave.leaveType || "—"}
                          </p>
                          <p
                            className="mt-1 max-w-[200px] truncate text-xs text-slate-500"
                            title={leave.reason || ""}
                          >
                            {leave.reason || "No reason provided"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            <CalendarDays
                              size={16}
                              className="mt-0.5 shrink-0 text-teal-600"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {formatDate(leave.startDate)}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                to {formatDate(leave.endDate)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-teal-700">
                                {days} {days === 1 ? "day" : "days"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {formatDate(leave.appliedAt || leave.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Application date
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={leave.status} />
                          {leave.approvedBy && (
                            <p className="mt-1.5 max-w-[130px] truncate text-xs text-slate-400">
                              By {leave.approvedBy}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openDetails(leave)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Eye size={15} />
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && filteredLeaves.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <CalendarRange size={26} />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-800">
                          No leave applications found
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                          Try changing your search or filters. New leave
                          applications will appear here.
                        </p>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
                        >
                          Clear all filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredLeaves.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {safeLeaves.length}
                </span>{" "}
                applications
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Activity size={13} />
                Data from Hospital Management System
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Leave details modal */}
      {selectedLeave && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
          >
            {/* Modal header */}
            <div className="relative shrink-0 bg-gradient-to-r from-teal-700 to-cyan-700 px-5 py-5 text-white sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <CalendarRange size={23} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-teal-100">
                      Leave application details
                    </p>
                    <h2
                      id="leave-modal-title"
                      className="mt-1 truncate text-lg font-bold sm:text-xl"
                    >
                      {selectedLeave.doctorName || "Doctor leave"}
                    </h2>
                    <p className="mt-1 text-xs text-teal-100">
                      ID: {selectedLeave._id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  disabled={actionLoading}
                  aria-label="Close leave details"
                  className="shrink-0 rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedLeave.status} />
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                  {selectedLeave.leaveType || "Leave"}
                </span>
              </div>
            </div>

            {/* Modal content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {detailLoading && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2.5 text-sm text-teal-700">
                  <LoaderCircle size={16} className="animate-spin" />
                  Refreshing application details...
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem icon={UserRound} label="Doctor name">
                  {selectedLeave.doctorName}
                </DetailItem>

                <DetailItem icon={Mail} label="Doctor email">
                  {selectedLeave.doctorEmail}
                </DetailItem>

                <DetailItem icon={CalendarDays} label="Leave starts">
                  {formatDate(selectedLeave.startDate)}
                </DetailItem>

                <DetailItem icon={CalendarDays} label="Leave ends">
                  {formatDate(selectedLeave.endDate)}
                </DetailItem>

                <DetailItem icon={Clock3} label="Total duration">
                  {getLeaveDays(
                    selectedLeave.startDate,
                    selectedLeave.endDate
                  )}{" "}
                  days
                </DetailItem>

                <DetailItem icon={CalendarRange} label="Applied on">
                  {formatDate(
                    selectedLeave.appliedAt || selectedLeave.createdAt
                  )}
                </DetailItem>

                {selectedLeave.approvedAt && (
                  <DetailItem icon={CheckCircle2} label="Approved on">
                    {formatDate(selectedLeave.approvedAt)}
                  </DetailItem>
                )}

                {selectedLeave.rejectedAt && (
                  <DetailItem icon={XCircle} label="Rejected on">
                    {formatDate(selectedLeave.rejectedAt)}
                  </DetailItem>
                )}

                {selectedLeave.cancelledAt && (
                  <DetailItem icon={Ban} label="Cancelled on">
                    {formatDate(selectedLeave.cancelledAt)}
                  </DetailItem>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <FileText size={17} className="text-teal-600" />
                  Doctor's reason
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedLeave.reason || "No reason provided."}
                </p>
              </div>

              {selectedLeave.approvedBy && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-xs font-semibold text-emerald-800">
                    Approved by
                  </p>
                  <p className="mt-1 break-all text-sm text-emerald-700">
                    {selectedLeave.approvedBy}
                  </p>
                </div>
              )}

              {selectedLeave.adminRemark && (
                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <MessageSquareText size={16} className="text-teal-600" />
                    Existing admin remark
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedLeave.adminRemark}
                  </p>
                </div>
              )}

              {/* Appointment conflict confirmation */}
              {showConflictConfirmation && (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={21}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-amber-900">
                        Appointment conflicts detected
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Approving this leave may affect scheduled appointments.
                        Review the conflicts before choosing to force approve.
                      </p>
                    </div>
                  </div>

                  {conflicts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {conflicts.map((conflict, index) => (
                        <div
                          key={conflict._id || conflict.id || index}
                          className="rounded-lg border border-amber-200 bg-white p-3 text-sm"
                        >
                          <p className="font-semibold text-slate-800">
                            {conflict.patientName ||
                              conflict.patient?.name ||
                              conflict.userData?.name ||
                              conflict.doctorName ||
                              `Appointment ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(
                              conflict.date ||
                                conflict.appointmentDate ||
                                conflict.appointment?.date
                            )}
                            {conflict.slotTime || conflict.time
                              ? ` · ${conflict.slotTime || conflict.time}`
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        setShowConflictConfirmation(false);
                        setPendingApproval(null);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Go back
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmForceApprove}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                      Force approve anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Admin action area */}
              {["Pending", "Approved"].includes(selectedLeave.status) && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <label
                    htmlFor="adminRemark"
                    className="flex items-center gap-2 text-sm font-bold text-slate-800"
                  >
                    <MessageSquareText size={17} className="text-teal-600" />
                    Admin remark
                    {selectedLeave.status === "Pending" && (
                      <span className="text-xs font-normal text-slate-400">
                        (optional for approval)
                      </span>
                    )}
                  </label>

                  <textarea
                    id="adminRemark"
                    value={adminRemark}
                    onChange={(event) => setAdminRemark(event.target.value)}
                    disabled={actionLoading || showConflictConfirmation}
                    rows={3}
                    maxLength={1000}
                    placeholder={
                      selectedLeave.status === "Pending"
                        ? "Write an approval or rejection remark..."
                        : "Enter the reason for cancelling this approved leave..."
                    }
                    className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-100"
                  />

                  <p className="mt-1.5 text-right text-xs text-slate-400">
                    {adminRemark.length}/1000 characters
                  </p>

                  {!showConflictConfirmation && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {selectedLeave.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(false)}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Check size={17} />
                            )}
                            Approve leave
                          </button>

                          <button
                            type="button"
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={17} />
                            Reject leave
                          </button>
                        </>
                      )}

                      {selectedLeave.status === "Approved" && (
                        <button
                          type="button"
                          onClick={handleCancelApproved}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <LoaderCircle
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Ban size={17} />
                          )}
                          Cancel approved leave
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {["Rejected", "Cancelled"].includes(selectedLeave.status) && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-slate-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      This application is {selectedLeave.status.toLowerCase()}.
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      No further actions are available for this status.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
              <p className="hidden text-xs text-slate-400 sm:block">
                Hospital Management System
              </p>
              <button
                type="button"
                onClick={closeDetails}
                disabled={actionLoading}
                className="ml-auto rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Manageleave;
