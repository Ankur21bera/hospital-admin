
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Calendar from "react-calendar";
import toast from "react-hot-toast";
import {
  addHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
} from "../../Redux/adminSlice";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import "react-calendar/dist/Calendar.css";

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
  if (!value || typeof value !== "string") return null;

  const parts = value.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !part)) return null;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatDate = (value, options = {}) => {
  const date = parseLocalDate(value);
  if (!date) return value || "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

const getInitialForm = () => ({
  date: getLocalDateString(new Date()),
  reason: "",
});

const getErrorMessage = (error, fallback) => {
  if (typeof error === "string") return error;
  return error?.message || error?.response?.data?.message || fallback;
};

const Manageholiday = () => {
  const dispatch = useDispatch();

  const holidays = useSelector((state) =>
    Array.isArray(state.admin?.holidays) ? state.admin.holidays : []
  );

  const todayString = getLocalDateString(new Date());

  const [activeDate, setActiveDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState(getInitialForm);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHolidays = useCallback(async (showMessage = false) => {
    setLoadingHolidays(true);

    try {
      const result = await dispatch(getHolidays()).unwrap();

      if (result?.success === false) {
        throw new Error(result.message || "Unable to load holidays");
      }

      if (showMessage) toast.success("Holiday calendar refreshed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch holidays"));
    } finally {
      setLoadingHolidays(false);
      setInitialLoad(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const holidayByDate = useMemo(() => {
    const map = new Map();

    holidays.forEach((holiday) => {
      if (holiday?.date) map.set(String(holiday.date).slice(0, 10), holiday);
    });

    return map;
  }, [holidays]);

  const upcomingHolidays = useMemo(
    () =>
      [...holidays]
        .filter((holiday) => String(holiday.date || "").slice(0, 10) >= todayString)
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [holidays, todayString]
  );

  const currentMonthHolidays = useMemo(
    () =>
      holidays.filter((holiday) => {
        const date = parseLocalDate(holiday.date);

        return (
          date &&
          date.getFullYear() === activeDate.getFullYear() &&
          date.getMonth() === activeDate.getMonth()
        );
      }),
    [holidays, activeDate]
  );

  const selectedHoliday = holidayByDate.get(selectedDate) || null;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredHolidays = useMemo(
    () =>
      [...holidays]
        .filter((holiday) => {
          const date = String(holiday.date || "").slice(0, 10);
          const reason = String(holiday.reason || "").toLowerCase();

          return (
            !normalizedSearch ||
            date.toLowerCase().includes(normalizedSearch) ||
            reason.includes(normalizedSearch) ||
            formatDate(date).toLowerCase().includes(normalizedSearch)
          );
        })
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [holidays, normalizedSearch]
  );

  const openAddForm = (date = selectedDate) => {
    setEditingHoliday(null);
    setFormData({ date: date || todayString, reason: "" });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: String(holiday.date || "").slice(0, 10),
      reason: holiday.reason || "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;
    setShowForm(false);
    setEditingHoliday(null);
    setFormData(getInitialForm());
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    const date = parseLocalDate(formData.date);
    const reason = formData.reason.trim();

    if (!formData.date) {
      errors.date = "Please select a holiday date.";
    } else if (!date) {
      errors.date = "Please select a valid date.";
    }

    if (!reason) {
      errors.reason = "Please enter the holiday reason.";
    } else if (reason.length > 100) {
      errors.reason = "Reason must be 100 characters or fewer.";
    }

    const duplicate = holidays.find(
      (holiday) =>
        String(holiday.date).slice(0, 10) === formData.date &&
        String(holiday._id) !== String(editingHoliday?._id || "")
    );

    if (formData.date && duplicate) {
      errors.date = "A holiday already exists on this date.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      date: formData.date,
      reason: formData.reason.trim(),
    };

    setFormLoading(true);

    try {
      const result = editingHoliday
        ? await dispatch(
            updateHoliday({ id: editingHoliday._id, data: payload })
          ).unwrap()
        : await dispatch(addHoliday(payload)).unwrap();

      if (result?.success === false) {
        throw new Error(result.message || "Unable to save holiday");
      }

      toast.success(
        result?.message ||
          (editingHoliday
            ? "Holiday updated successfully"
            : "Holiday added successfully")
      );

      setSelectedDate(payload.date);
      setActiveDate(parseLocalDate(payload.date));
      setShowForm(false);
      setEditingHoliday(null);
      setFormData(getInitialForm());
      setFormErrors({});
      await fetchHolidays();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save holiday"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!holidayToDelete?._id || deletingId) return;

    const id = holidayToDelete._id;
    setDeletingId(id);

    try {
      const result = await dispatch(deleteHoliday(id)).unwrap();

      if (result?.success === false) {
        throw new Error(result.message || "Unable to delete holiday");
      }

      toast.success(result?.message || "Holiday deleted successfully");

      if (selectedDate === String(holidayToDelete.date).slice(0, 10)) {
        setSelectedDate(todayString);
      }

      setHolidayToDelete(null);
      await fetchHolidays();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete holiday"));
    } finally {
      setDeletingId(null);
    }
  };

  const selectHolidayDate = (holiday) => {
    const dateString = String(holiday.date).slice(0, 10);
    const date = parseLocalDate(dateString);

    if (!date) return;

    setSelectedDate(dateString);
    setActiveDate(date);
  };

  const StatCard = ({ icon: Icon, label, value, description, tone }) => (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fc] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <style>{`
        .premium-calendar { width: 100%; border: 0 !important; font-family: inherit; }
        .premium-calendar .react-calendar__navigation { display:flex; align-items:center; gap:8px; margin: 0 0 18px; }
        .premium-calendar .react-calendar__navigation button { min-width:36px; height:40px; border-radius:12px; background:#f8fafc; color:#334155; font-weight:700; transition:all .2s; }
        .premium-calendar .react-calendar__navigation button:hover:not(:disabled) { background:#eef2ff; color:#4f46e5; }
        .premium-calendar .react-calendar__navigation button:disabled { opacity:.35; }
        .premium-calendar .react-calendar__navigation__label { flex:1; background:transparent !important; color:#0f172a !important; font-size:17px; font-weight:800; }
        .premium-calendar .react-calendar__month-view__weekdays { margin-bottom:8px; text-align:center; text-transform:uppercase; font-size:10px; font-weight:800; color:#94a3b8; }
        .premium-calendar .react-calendar__month-view__weekdays abbr { text-decoration:none; }
        .premium-calendar .react-calendar__tile { position:relative; min-height:57px; padding:9px 2px; border-radius:12px; font-size:13px; font-weight:700; color:#334155; transition:all .18s; }
        .premium-calendar .react-calendar__tile:hover { background:#eef2ff; color:#4338ca; }
        .premium-calendar .react-calendar__tile--now { background:#f8fafc; box-shadow:inset 0 0 0 1.5px #818cf8; color:#4338ca; }
        .premium-calendar .react-calendar__tile--active,
        .premium-calendar .react-calendar__tile--active:hover { background:#4f46e5 !important; color:white !important; box-shadow:0 5px 12px #4f46e533; }
        .premium-calendar .react-calendar__tile--active abbr { color:white; }
        .premium-calendar .react-calendar__month-view__days__day--neighboringMonth { color:#cbd5e1; }
        .premium-calendar .react-calendar__tile:disabled { background:transparent; color:#cbd5e1; }
        .premium-calendar .holiday-dot { display:block; width:5px; height:5px; margin:4px auto 0; border-radius:99px; background:#f43f5e; }
        .premium-calendar .react-calendar__tile--active .holiday-dot { background:#fff; }
        @media (max-width: 480px) {
          .premium-calendar .react-calendar__tile { min-height:44px; padding:6px 0; font-size:12px; border-radius:9px; }
          .premium-calendar .react-calendar__navigation { gap:4px; }
          .premium-calendar .react-calendar__navigation button { height:36px; }
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Page header */}
        <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-5 text-white shadow-xl shadow-indigo-950/10 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-1/3 -z-10 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />

          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
                <ShieldCheck size={14} /> HOSPITAL ADMINISTRATION
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-[42px]">
                Holiday Management
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
                Manage hospital holidays, maintain your calendar, and keep appointment scheduling organized.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold sm:text-sm">
                  <CalendarDays size={15} />
                  {activeDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold sm:text-sm">
                  <CheckCircle2 size={15} /> {holidays.length} scheduled
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fetchHolidays(true)}
                disabled={loadingHolidays}
                className="inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw size={17} className={loadingHolidays ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => openAddForm(selectedDate)}
                className="inline-flex items-center justify-center cursor-pointer gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-800 shadow-lg transition hover:bg-indigo-50 active:scale-[.98]"
              >
                <Plus size={18} /> Add Holiday
              </button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarDays} label="Total Holidays" value={holidays.length} description="All saved holiday dates" tone="bg-indigo-50 text-indigo-600" />
          <StatCard icon={Clock3} label="Upcoming Holidays" value={upcomingHolidays.length} description="Today and future dates" tone="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Activity} label="This Month" value={currentMonthHolidays.length} description="Holidays in the displayed month" tone="bg-violet-50 text-violet-600" />
          <StatCard icon={CheckCircle2} label="Selected Date" value={selectedHoliday ? "Holiday" : "Working day"} description={formatDate(selectedDate)} tone={selectedHoliday ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600"} />
        </section>

        {/* Calendar and side panels */}
        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.8fr)]">
          <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Holiday Calendar</h2>
                  <p className="mt-1 text-xs text-slate-500">Select a date to view or schedule a holiday</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setActiveDate(today);
                  setSelectedDate(todayString);
                }}
                className="self-start rounded-xl cursor-pointer border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:self-auto"
              >
                Today
              </button>
            </div>

            <Calendar
              className="premium-calendar"
              value={parseLocalDate(selectedDate) || new Date()}
              activeStartDate={new Date(activeDate.getFullYear(), activeDate.getMonth(), 1)}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) setActiveDate(activeStartDate);
              }}
              onChange={(value) => {
                if (!(value instanceof Date)) return;
                setSelectedDate(getLocalDateString(value));
                setActiveDate(value);
              }}
              tileContent={({ date, view }) => {
                if (view !== "month") return null;
                const holiday = holidayByDate.get(getLocalDateString(date));
                return holiday ? (
                  <span className="holiday-dot" title={holiday.reason} />
                ) : null;
              }}
              tileClassName={({ date, view }) =>
                view === "month" && holidayByDate.has(getLocalDateString(date))
                  ? "has-holiday"
                  : undefined
              }
              prev2Label={null}
              next2Label={null}
              minDetail="month"
              maxDetail="month"
              showNeighboringMonth
            />

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Holiday</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Selected date</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border-2 border-indigo-400" /> Today</span>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold text-slate-500">Selected date</p>
                <p className="mt-1 font-extrabold text-slate-900">{formatDate(selectedDate, { weekday: "long" })}</p>
              </div>
              <button
                type="button"
                onClick={() => openAddForm(selectedDate)}
                className="inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                <Plus size={16} /> Add to this date
              </button>
            </div>
          </div>

          <aside className="space-y-5">
            {/* Selected date */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-indigo-100">Selected date</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  {formatDate(selectedDate, { weekday: "short", day: "numeric", month: "long" })}
                </h2>
                <p className="mt-2 text-sm text-indigo-100">
                  {selectedHoliday ? "A holiday is scheduled for this date." : "No holiday scheduled for this date."}
                </p>
              </div>

              <div className="p-5 sm:p-6">
                {selectedHoliday ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-extrabold text-slate-900">{selectedHoliday.reason}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(selectedHoliday.date)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => openEditForm(selectedHoliday)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 cursor-pointer bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
                        <Edit3 size={15} /> Edit
                      </button>
                      <button type="button" onClick={() => setHolidayToDelete(selectedHoliday)} className="inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer border border-rose-200 bg-white px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><CalendarDays size={26} /></div>
                    <h3 className="mt-4 font-extrabold text-slate-800">No holiday scheduled</h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">Add a holiday for this date to keep the hospital calendar up to date.</p>
                    <button type="button" onClick={() => openAddForm(selectedDate)} className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                      <Plus size={17} /> Schedule Holiday
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900">Upcoming Holidays</h3>
                  <p className="mt-1 text-xs text-slate-500">Next scheduled dates</p>
                </div>
                <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-emerald-50 px-2 text-sm font-black text-emerald-700">{upcomingHolidays.length}</span>
              </div>

              <div className="mt-5 space-y-3">
                {upcomingHolidays.slice(0, 5).map((holiday) => {
                  const date = parseLocalDate(holiday.date);
                  return (
                    <button key={holiday._id} type="button" onClick={() => selectHolidayDate(holiday)} className={`flex w-full items-center gap-3 cursor-pointer rounded-2xl border p-3 text-left transition ${selectedDate === String(holiday.date).slice(0, 10) ? "border-indigo-200 bg-indigo-50/70" : "border-slate-100 bg-slate-50/60 hover:border-indigo-100 hover:bg-indigo-50/40"}`}>
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">{date?.toLocaleDateString("en-IN", { month: "short" })}</span>
                        <span className="text-lg font-black leading-5 text-slate-800">{date?.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-slate-800">{holiday.reason}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(holiday.date, { weekday: "long" })}</p>
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-slate-400" />
                    </button>
                  );
                })}

                {upcomingHolidays.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center">
                    <CheckCircle2 size={25} className="mx-auto text-emerald-500" />
                    <p className="mt-2 text-sm font-bold text-slate-700">No upcoming holidays</p>
                    <p className="mt-1 text-xs text-slate-500">Your future calendar is clear.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>

        {/* Holiday directory */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><FileText size={21} /></div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">Holiday Directory</h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Search, edit and manage saved holidays</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-72">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search date or reason..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
                {searchTerm && (
                  <button type="button" aria-label="Clear search" onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 text-slate-400 hover:text-slate-700"><X size={16} /></button>
                )}
              </div>
              <button type="button" onClick={() => openAddForm(selectedDate)} className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-700">
                <Plus size={17} /> Add Holiday
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Showing <span className="font-extrabold text-slate-800">{filteredHolidays.length}</span> of <span className="font-extrabold text-slate-800">{holidays.length}</span> holidays
            </p>
            {loadingHolidays && <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600"><LoaderCircle size={15} className="animate-spin" /> Updating...</span>}
          </div>

          {initialLoad ? (
            <div className="flex flex-col items-center justify-center px-5 py-16">
              <LoaderCircle size={32} className="animate-spin text-indigo-600" />
              <p className="mt-4 text-sm font-bold text-slate-700">Loading holiday calendar...</p>
              <p className="mt-1 text-xs text-slate-500">Fetching the latest holiday records</p>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">{searchTerm ? <Search size={28} /> : <CalendarDays size={28} />}</div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">{searchTerm ? "No matching holidays" : "No holidays added yet"}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{searchTerm ? "Try another reason or date, or clear your search." : "Create your first holiday to start managing the hospital calendar."}</p>
              <button type="button" onClick={() => searchTerm ? setSearchTerm("") : openAddForm(selectedDate)} className="mt-5 cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                {searchTerm ? <X size={16} /> : <Plus size={17} />}{searchTerm ? "Clear search" : "Add Holiday"}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[650px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      {["Holiday Date", "Holiday Reason", "Status", "Actions"].map((heading) => (
                        <th key={heading} className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-500 ${heading === "Actions" ? "text-right" : ""}`}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHolidays.map((holiday) => {
                      const dateString = String(holiday.date).slice(0, 10);
                      const isPast = dateString < todayString;
                      const isSelected = selectedDate === dateString;

                      return (
                        <tr key={holiday._id} className={`border-b border-slate-100 last:border-0 transition hover:bg-slate-50/80 ${isSelected ? "bg-indigo-50/40" : ""}`}>
                          <td className="px-6 py-4">
                            <button type="button" onClick={() => selectHolidayDate(holiday)} className="flex items-center gap-3 text-left cursor-pointer">
                              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
                                <span className="text-[10px] font-extrabold uppercase text-slate-400">{parseLocalDate(dateString)?.toLocaleDateString("en-IN", { month: "short" })}</span>
                                <span className="text-sm font-black text-slate-800">{parseLocalDate(dateString)?.getDate()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-extrabold text-slate-800">{formatDate(dateString)}</p>
                                <p className="mt-1 text-xs text-slate-400">{formatDate(dateString, { weekday: "long", day: undefined, month: undefined, year: undefined })}</p>
                              </div>
                            </button>
                          </td>
                          <td className="max-w-xs px-6 py-4">
                            <p className="break-words text-sm font-semibold text-slate-800">{holiday.reason}</p>
                            <p className="mt-1 text-xs text-slate-400">ID: {String(holiday._id || "").slice(-8)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${isPast ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isPast ? "bg-slate-400" : "bg-emerald-500"}`} />{isPast ? "Past" : "Upcoming"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" title="Edit holiday" onClick={() => openEditForm(holiday)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><Edit3 size={16} /></button>
                              <button type="button" title="Delete holiday" onClick={() => setHolidayToDelete(holiday)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {filteredHolidays.map((holiday) => {
                  const dateString = String(holiday.date).slice(0, 10);
                  const date = parseLocalDate(dateString);
                  const isPast = dateString < todayString;

                  return (
                    <div key={holiday._id} className={`rounded-2xl border p-4 ${selectedDate === dateString ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-start gap-3">
                        <button type="button" onClick={() => selectHolidayDate(holiday)} className="flex h-12 w-12 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400">{date?.toLocaleDateString("en-IN", { month: "short" })}</span>
                          <span className="text-lg font-black text-slate-800">{date?.getDate()}</span>
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-extrabold text-slate-900">{holiday.reason}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(dateString, { weekday: "long" })}</p>
                          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${isPast ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{isPast ? "Past" : "Upcoming"}</span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => openEditForm(holiday)} className="inline-flex items-center justify-center cursor-pointer gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"><Edit3 size={15} /> Edit</button>
                        <button type="button" onClick={() => setHolidayToDelete(holiday)} className="inline-flex items-center justify-center cursor-pointer gap-2 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"><Trash2 size={15} /> Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add / edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="holiday-form-title" className="my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-indigo-700 to-violet-700 p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">{editingHoliday ? <Edit3 size={22} /> : <CalendarDays size={22} />}</div>
                  <h2 id="holiday-form-title" className="text-xl font-black sm:text-2xl">{editingHoliday ? "Edit Holiday" : "Add New Holiday"}</h2>
                  <p className="mt-1 text-sm text-indigo-100">{editingHoliday ? "Update the date or reason for this holiday." : "Add a holiday to your hospital calendar."}</p>
                </div>
                <button type="button" aria-label="Close form" disabled={formLoading} onClick={closeForm} className="flex cursor-pointer h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"><X size={20} /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label htmlFor="holiday-date" className="mb-2 block text-sm font-extrabold text-slate-700">Holiday Date <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <CalendarDays size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="holiday-date" type="date" required value={formData.date} onChange={(event) => {
                    setFormData((previous) => ({ ...previous, date: event.target.value }));
                    setFormErrors((previous) => ({ ...previous, date: "" }));
                  }} className={`w-full rounded-xl border bg-white py-3 pl-11 pr-3 text-sm text-slate-800 outline-none transition focus:ring-4 focus:ring-indigo-500/10 ${formErrors.date ? "border-rose-400" : "border-slate-200 focus:border-indigo-400"}`} />
                </div>
                {formErrors.date && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600"><AlertCircle size={14} />{formErrors.date}</p>}
                <p className="mt-2 text-xs text-slate-400">The date is saved in YYYY-MM-DD format.</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="holiday-reason" className="block text-sm font-extrabold text-slate-700">Holiday Reason <span className="text-rose-500">*</span></label>
                  <span className="text-xs text-slate-400">{formData.reason.length}/100</span>
                </div>
                <textarea id="holiday-reason" required maxLength={100} rows={3} value={formData.reason} onChange={(event) => {
                  setFormData((previous) => ({ ...previous, reason: event.target.value }));
                  setFormErrors((previous) => ({ ...previous, reason: "" }));
                }} placeholder="e.g. Diwali, Independence Day, Hospital Maintenance..." className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 ${formErrors.reason ? "border-rose-400" : "border-slate-200 focus:border-indigo-400"}`} />
                {formErrors.reason && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600"><AlertCircle size={14} />{formErrors.reason}</p>}
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3.5">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs leading-5 text-amber-800">Only one holiday can be scheduled per date. Check the date before saving.</p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" disabled={formLoading} onClick={closeForm} className="rounded-xl border border-slate-200 cursor-pointer px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={formLoading} className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {formLoading ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}
                  {formLoading ? "Saving..." : editingHoliday ? "Save Changes" : "Create Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {holidayToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deletingId) setHolidayToDelete(null);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-holiday-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><Trash2 size={25} /></div>
            <h2 id="delete-holiday-title" className="mt-5 text-xl font-black text-slate-900">Delete this holiday?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to remove <span className="font-extrabold text-slate-800">{holidayToDelete.reason}</span> scheduled for <span className="font-extrabold text-slate-800">{formatDate(holidayToDelete.date)}</span>. This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" disabled={Boolean(deletingId)} onClick={() => setHolidayToDelete(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Keep Holiday</button>
              <button type="button" disabled={Boolean(deletingId)} onClick={handleDelete} className="inline-flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
                {deletingId ? <LoaderCircle size={17} className="animate-spin" /> : <Trash2 size={17} />}
                {deletingId ? "Deleting..." : "Delete Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Manageholiday;
