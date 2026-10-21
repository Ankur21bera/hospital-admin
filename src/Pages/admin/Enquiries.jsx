import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  getAllEnquiries,
  getAllJobApplications,
  deleteEnquiry,
  deleteJobApplication,
} from "../../Redux/adminSlice";

const PAGE_SIZE = 8;

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  if (!name) return "NA";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getStatusClass = (status) => {
  const normalized = String(status || "new").toLowerCase();

  const styles = {
    new: "bg-blue-50 text-blue-700 ring-blue-600/15",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
    connected: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    closed: "bg-slate-100 text-slate-600 ring-slate-500/15",
    shortlisted: "bg-violet-50 text-violet-700 ring-violet-600/15",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/15",
  };

  return styles[normalized] || "bg-slate-100 text-slate-600 ring-slate-500/15";
};

const StatusBadge = ({ status }) => {
  const value = status || "new";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClass(
        value,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
};

const Avatar = ({ name }) => (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 text-sm font-bold text-blue-800 ring-1 ring-blue-200/60">
    {getInitials(name)}
  </div>
);

const EmptyState = ({ isSearch, activeTab, onReset }) => (
  <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      {isSearch ? (
        <Search size={28} />
      ) : activeTab === "enquiries" ? (
        <MessageCircle size={28} />
      ) : (
        <BriefcaseBusiness size={28} />
      )}
    </div>

    <h3 className="text-base font-bold text-slate-800">
      {isSearch ? "No matching records" : "Nothing to display yet"}
    </h3>

    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
      {isSearch
        ? "Try another keyword or change the selected filters."
        : activeTab === "enquiries"
          ? "Hospital enquiries will appear here when someone contacts you."
          : "Job applications will appear here when candidates apply."}
    </p>

    {isSearch && (
      <button
        type="button"
        onClick={onReset}
        className="mt-4 cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Clear filters
      </button>
    )}
  </div>
);

const Enquiries = () => {
  const dispatch = useDispatch();

  // FIX: Redux slice mein actual state key "applications" hai.
  const { enquiries = [], applications = [] } = useSelector(
    (state) => state.admin || {},
  );

  const jobApplications = applications;

  const [activeTab, setActiveTab] = useState("enquiries");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const results = await Promise.allSettled([
          dispatch(getAllEnquiries()).unwrap(),
          dispatch(getAllJobApplications()).unwrap(),
        ]);

        const failedRequests = results.filter(
          (result) => result.status === "rejected",
        );

        results.forEach((result, index) => {
          const label = index === 0 ? "Enquiries" : "Job Applications";

          if (result.status === "fulfilled") {
            console.log(`${label} API response:`, result.value);
          } else {
            console.error(`${label} API error:`, result.reason);
          }
        });

        if (failedRequests.length === 2) {
          toast.error("Unable to load enquiries and job applications.");
        } else if (failedRequests.length === 1) {
          toast.error(
            "Some records could not be loaded. Check the browser console.",
          );
        } else if (showLoader) {
          toast.success("Records refreshed successfully.");
        }
      } catch (error) {
        console.error("Fetch records error:", error);
        toast.error("Unable to load records.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const isEnquiries = activeTab === "enquiries";

  const records = useMemo(
    () => (isEnquiries ? enquiries : jobApplications),
    [isEnquiries, enquiries, jobApplications],
  );

  const todayCount = useMemo(() => {
    const today = new Date();

    return records.filter((record) => {
      if (!record.createdAt) return false;

      const created = new Date(record.createdAt);

      return (
        !Number.isNaN(created.getTime()) &&
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [records]);

  const newCount = useMemo(
    () =>
      records.filter(
        (record) => String(record.status || "new").toLowerCase() === "new",
      ).length,
    [records],
  );

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = records.filter((record) => {
      const searchableFields = isEnquiries
        ? [
            record.name,
            record.email,
            record.phone,
            record.question,
            record.status,
          ]
        : [
            record.name,
            record.email,
            record.phone,
            record.jobType,
            record.resumeName,
            record.status,
          ];

      const matchesSearch =
        !keyword ||
        searchableFields.some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(keyword),
        );

      const status = String(record.status || "new").toLowerCase();

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }

      if (sortOrder === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return filtered;
  }, [records, search, statusFilter, sortOrder, isEnquiries]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;

    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, safePage]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");
    setSelectedRecord(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id || deleting) return;

    setDeleting(true);

    try {
      if (deleteTarget.recordType === "enquiry") {
        await dispatch(deleteEnquiry(deleteTarget._id)).unwrap();
      } else {
        await dispatch(deleteJobApplication(deleteTarget._id)).unwrap();
      }

      toast.success(
        deleteTarget.recordType === "enquiry"
          ? "Enquiry deleted successfully."
          : "Job application deleted successfully.",
      );

      if (
        selectedRecord?._id === deleteTarget._id &&
        selectedRecord?.recordType === deleteTarget.recordType
      ) {
        setSelectedRecord(null);
      }

      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Unable to delete this record.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (!filteredRecords.length) {
      toast.error("There are no records to export.");
      return;
    }

    const headers = isEnquiries
      ? ["Name", "Email", "Phone", "Question", "Status", "Created At"]
      : [
          "Name",
          "Email",
          "Phone",
          "Job Type",
          "Resume Name",
          "Resume URL",
          "Status",
          "Created At",
        ];

    const rows = filteredRecords.map((record) =>
      (isEnquiries
        ? [
            record.name,
            record.email,
            record.phone,
            record.question,
            record.status || "new",
            formatDateTime(record.createdAt),
          ]
        : [
            record.name,
            record.email,
            record.phone,
            record.jobType,
            record.resumeName,
            record.resume,
            record.status || "new",
            formatDateTime(record.createdAt),
          ]
      ).map((value) => {
        const safeValue = String(value ?? "").replace(/"/g, '""');
        return `"${safeValue}"`;
      }),
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = isEnquiries
      ? "hospital-enquiries.csv"
      : "hospital-job-applications.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully.");
  };

  const openDetails = (record) => {
    setSelectedRecord({
      ...record,
      recordType: isEnquiries ? "enquiry" : "application",
    });
  };

  const askDelete = (record) => {
    setDeleteTarget({
      ...record,
      recordType: isEnquiries ? "enquiry" : "application",
    });
  };

  const statusOptions = useMemo(() => {
    const statuses = new Set(
      records.map((record) => String(record.status || "new").toLowerCase()),
    );

    return ["all", ...Array.from(statuses).sort()];
  }, [records]);

  return (
    <div className="min-h-screen bg-slate-50/80 px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              <ShieldCheck size={15} />
              Hospital Administration
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Enquiries & Careers
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage patient enquiries and review job applications from one
              organized workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchRecords(true)}
              disabled={refreshing}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Enquiries
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {enquiries.length}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <MessageCircle size={21} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              All hospital enquiries
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Job Applications
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {jobApplications.length}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                <BriefcaseBusiness size={21} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Applications received</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  New Records
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {newCount}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                <Activity size={21} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              New in the selected tab
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Received Today
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {todayCount}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <CalendarDays size={21} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Today's records in the selected tab
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => changeTab("enquiries")}
              className={`flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition sm:justify-start sm:px-5 ${
                isEnquiries
                  ? "bg-blue-700 text-white shadow-md shadow-blue-700/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <MessageCircle size={18} />
              <span>Enquiries</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isEnquiries
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {enquiries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => changeTab("applications")}
              className={`flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition sm:justify-start sm:px-5 ${
                !isEnquiries
                  ? "bg-blue-700 text-white shadow-md shadow-blue-700/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <BriefcaseBusiness size={18} />
              <span>Job Applications</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  !isEnquiries
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {jobApplications.length}
              </span>
            </button>
          </div>
        </div>

        {/* Main list */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isEnquiries
                    ? "Enquiry Directory"
                    : "Job Application Directory"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredRecords.length}{" "}
                  {filteredRecords.length === 1 ? "record" : "records"} found
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
                <div className="relative sm:col-span-2 xl:w-72">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={
                      isEnquiries
                        ? "Search name, email, phone..."
                        : "Search applicant, job type..."
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="relative">
                  <SlidersHorizontal
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium capitalize text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status === "all" ? "All statuses" : status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <div className="relative">
                  <ArrowDownUp
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={sortOrder}
                    onChange={(event) => {
                      setSortOrder(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name">Name A–Z</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
              <p className="text-sm font-medium text-slate-500">
                Loading records...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              isSearch={Boolean(search || statusFilter !== "all")}
              activeTab={activeTab}
              onReset={resetFilters}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        {isEnquiries ? "Contact" : "Applicant"}
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        {isEnquiries ? "Question / Message" : "Job Type"}
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        {isEnquiries ? "Received" : "Resume"}
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedRecords.map((record) => (
                      <tr
                        key={record._id}
                        className="transition hover:bg-blue-50/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={record.name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {record.name || "Unnamed"}
                              </p>
                              <a
                                href={`mailto:${record.email || ""}`}
                                className="mt-1 block max-w-52 truncate text-xs text-slate-500 hover:text-blue-700"
                              >
                                {record.email || "No email provided"}
                              </a>
                              <p className="mt-1 text-xs text-slate-400">
                                {record.phone || "No phone provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          {isEnquiries ? (
                            <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                              {record.question || "No message provided"}
                            </p>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {record.jobType || "Job type not specified"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Job application
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {isEnquiries ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <CalendarDays
                                size={15}
                                className="text-slate-400"
                              />
                              {formatDate(record.createdAt)}
                            </div>
                          ) : record.resume ? (
                            <a
                              href={record.resume}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-48 items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <FileText size={15} />
                              <span className="max-w-28 truncate">
                                {record.resumeName || "View resume"}
                              </span>
                              <ExternalLink size={13} />
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">
                              No resume
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={record.status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openDetails(record)}
                              title="View details"
                              className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => askDelete(record)}
                              title="Delete record"
                              className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-3 md:hidden">
                {paginatedRecords.map((record) => (
                  <article
                    key={record._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={record.name} />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {record.name || "Unnamed"}
                        </h3>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {record.email || "No email provided"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.phone || "No phone provided"}
                        </p>
                      </div>

                      <StatusBadge status={record.status} />
                    </div>

                    <div className="my-4 rounded-xl bg-slate-50 p-3">
                      {isEnquiries ? (
                        <>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Message
                          </p>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {record.question || "No message provided"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Applied for
                          </p>
                          <p className="text-sm font-semibold text-slate-700">
                            {record.jobType || "Job type not specified"}
                          </p>

                          {record.resume && (
                            <a
                              href={record.resume}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-700"
                            >
                              <FileText size={16} />
                              {record.resumeName || "View resume"}
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 size={14} />
                        {formatDate(record.createdAt)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(record)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => askDelete(record)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-slate-500 sm:text-sm">
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(safePage - 1) * PAGE_SIZE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(safePage * PAGE_SIZE, filteredRecords.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredRecords.length}
                  </span>{" "}
                  records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={15} />
                    Previous
                  </button>

                  <span className="min-w-20 text-center text-xs font-semibold text-slate-500">
                    Page {safePage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <p className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-slate-400">
          <ShieldCheck size={14} />
          Hospital administration · Enquiry and recruitment records
        </p>
      </div>

      {/* Details modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="record-details-title"
                  className="text-lg font-extrabold text-slate-900"
                >
                  {selectedRecord.recordType === "enquiry"
                    ? "Enquiry Details"
                    : "Job Application Details"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Full record information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
                className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedRecord.name} />
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {selectedRecord.name || "Unnamed"}
                    </h3>
                    <p className="mt-1 break-all text-sm text-slate-500">
                      {selectedRecord.email || "No email provided"}
                    </p>
                  </div>
                </div>

                <div className="sm:ml-auto">
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Phone size={14} />
                    Phone
                  </div>
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {selectedRecord.phone || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <CalendarDays size={14} />
                    Received on
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDateTime(selectedRecord.createdAt)}
                  </p>
                </div>

                {selectedRecord.recordType === "application" && (
                  <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <BriefcaseBusiness size={14} />
                      Job Type
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedRecord.jobType || "Not specified"}
                    </p>
                  </div>
                )}

                {selectedRecord.recordType === "enquiry" ? (
                  <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <MessageCircle size={14} />
                      Question / Message
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                      {selectedRecord.question || "No message provided"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <FileText size={14} />
                      Resume
                    </div>

                    {selectedRecord.resume ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all text-sm font-medium text-slate-700">
                          {selectedRecord.resumeName || "Candidate resume"}
                        </p>

                        <a
                          href={selectedRecord.resume}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                        >
                          Open Resume
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No resume was attached to this application.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {selectedRecord.email && (
                  <a
                    href={`mailto:${selectedRecord.email}`}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Mail size={16} />
                    Send Email
                  </a>
                )}

                {selectedRecord.phone && (
                  <a
                    href={`tel:${selectedRecord.phone}`}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Phone size={16} />
                    Call
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(null);
                    setDeleteTarget({
                      ...selectedRecord,
                      recordType: selectedRecord.recordType,
                    });
                  }}
                  className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 size={16} />
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={25} />
            </div>

            <h3 className="mt-4 text-center text-lg font-extrabold text-slate-900">
              Delete this{" "}
              {deleteTarget.recordType === "enquiry"
                ? "enquiry"
                : "job application"}
              ?
            </h3>

            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              This will permanently remove the record for{" "}
              <span className="font-semibold text-slate-800">
                {deleteTarget.name || "this person"}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Record
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;
