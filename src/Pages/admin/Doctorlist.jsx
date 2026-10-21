import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  Award,
  BriefcaseMedical,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Filter,
  HeartPulse,
  ImagePlus,
  IndianRupee,
  LoaderCircle,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Trash2,
  UserRound,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";

import {
  listDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  changeDoctorAvailability,
} from "../../Redux/adminSlice";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const initialForm = {
  name: "",
  email: "",
  speciality: "",
  degree: "",
  experience: "",
  about: "",
  fees: "",
  addressLine1: "",
  addressLine2: "",
  password: "",
  available: true,
};

const parseAddress = (address) => {
  if (!address) return { line1: "", line2: "" };

  if (typeof address === "string") {
    try {
      const parsed = JSON.parse(address);
      return {
        line1: parsed?.line1 || "",
        line2: parsed?.line2 || "",
      };
    } catch {
      return { line1: address, line2: "" };
    }
  }

  return {
    line1: address.line1 || "",
    line2: address.line2 || "",
  };
};

const formatAddress = (address) => {
  const parsed = parseAddress(address);
  return (
    [parsed.line1, parsed.line2].filter(Boolean).join(", ") ||
    "Address not provided"
  );
};

const getBookedSlotsCount = (slotsBooked) => {
  if (!slotsBooked || typeof slotsBooked !== "object") return 0;

  return Object.values(slotsBooked).reduce(
    (total, slots) => total + (Array.isArray(slots) ? slots.length : 0),
    0,
  );
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "Doctor") =>
  name
    .replace(/^Dr\.?\s*/i, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const getErrorMessage = (error, fallback) =>
  typeof error === "string" ? error : error?.message || fallback;

const Doctorlist = () => {
  const dispatch = useDispatch();
  const doctors = useSelector((state) => state.admin.doctors || []);

  const [search, setSearch] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("All Specialities");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Loading and modal state
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [availabilityUpdating, setAvailabilityUpdating] = useState(null);

  // Edit form state
  const [form, setForm] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const imageInputRef = useRef(null);
  const objectUrlRef = useRef("");

  // Fetch doctor directory
  const fetchDoctors = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setPageLoading(true);

    try {
      await dispatch(listDoctors()).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load doctors."));
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
    };
  }, [dispatch]);

  // Available specialities
  const specialities = useMemo(
    () =>
      [
        ...new Set(
          doctors.map((doctor) => doctor.speciality?.trim()).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [doctors],
  );

  // Dashboard statistics
  const statistics = useMemo(() => {
    const available = doctors.filter((doctor) => doctor.available).length;

    const bookedSlots = doctors.reduce(
      (total, doctor) => total + getBookedSlotsCount(doctor.slots_booked),
      0,
    );

    return {
      total: doctors.length,
      available,
      unavailable: doctors.length - available,
      bookedSlots,
    };
  }, [doctors]);

  // Search, filter and sort before pagination
  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = doctors.filter((doctor) => {
      const searchableText = [
        doctor.name,
        doctor.email,
        doctor.speciality,
        doctor.degree,
        doctor.experience,
        formatAddress(doctor.address),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesSpeciality =
        specialityFilter === "All Specialities" ||
        doctor.speciality === specialityFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && doctor.available) ||
        (availabilityFilter === "unavailable" && !doctor.available);

      return matchesSearch && matchesSpeciality && matchesAvailability;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "fees-high") {
        return (Number(b.fees) || 0) - (Number(a.fees) || 0);
      }

      if (sortBy === "fees-low") {
        return (Number(a.fees) || 0) - (Number(b.fees) || 0);
      }

      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [doctors, search, specialityFilter, availabilityFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / pageSize));

  const startIndex = (currentPage - 1) * pageSize;

  const paginatedDoctors = filteredDoctors.slice(
    startIndex,
    startIndex + pageSize,
  );

  const firstRecord = filteredDoctors.length ? startIndex + 1 : 0;
  const lastRecord = Math.min(startIndex + pageSize, filteredDoctors.length);

  // Keep page valid when filtering or deleting doctors
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetPagination = () => setCurrentPage(1);

  const clearFilters = () => {
    setSearch("");
    setSpecialityFilter("All Specialities");
    setAvailabilityFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Image cleanup
  const clearSelectedImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    setSelectedImage(null);
  };

  // Modal cleanup
  const closeModal = () => {
    if (saving || deleting || modalLoading) return;

    setActiveModal(null);
    setSelectedDoctor(null);
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview("");
    setForm(initialForm);
    setShowPassword(false);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // View doctor profile
  const openDoctorDetails = async (doctor) => {
    setSelectedDoctor(doctor);
    setActiveModal("view");
    setModalLoading(true);

    try {
      const response = await dispatch(getDoctor(doctor._id)).unwrap();

      if (response?.doctor) {
        setSelectedDoctor(response.doctor);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load doctor details."));
    } finally {
      setModalLoading(false);
    }
  };

  // Open edit form and load complete doctor data
  const openEditModal = async (doctor) => {
    setSelectedDoctor(doctor);
    setActiveModal("edit");
    setModalLoading(true);
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(doctor.image || "");
    setForm(initialForm);
    setShowPassword(false);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    try {
      const response = await dispatch(getDoctor(doctor._id)).unwrap();
      const fullDoctor = response?.doctor || doctor;
      const address = parseAddress(fullDoctor.address);

      setSelectedDoctor(fullDoctor);

      setForm({
        name: fullDoctor.name || "",
        email: fullDoctor.email || "",
        speciality: fullDoctor.speciality || "",
        degree: fullDoctor.degree || "",
        experience: fullDoctor.experience || "",
        about: fullDoctor.about || "",
        fees: String(fullDoctor.fees ?? ""),
        addressLine1: address.line1,
        addressLine2: address.line2,
        password: "",
        available: Boolean(fullDoctor.available),
      });

      setImagePreview(fullDoctor.image || "");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load doctor details."));
      setActiveModal(null);
      setSelectedDoctor(null);
    } finally {
      setModalLoading(false);
    }
  };

  const openDeleteModal = (doctor) => {
    setSelectedDoctor(doctor);
    setActiveModal("delete");
  };

  // Edit form change handler
  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // Validate and preview selected image
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;

    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  // Edit form validation
  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Doctor name is required.";
    }

    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.speciality.trim()) {
      errors.speciality = "Speciality is required.";
    }

    if (!form.degree.trim()) {
      errors.degree = "Degree is required.";
    }

    if (!String(form.experience).trim()) {
      errors.experience = "Experience is required.";
    }

    if (!form.about.trim()) {
      errors.about = "Doctor description is required.";
    }

    if (String(form.fees).trim() === "") {
      errors.fees = "Consultation fee is required.";
    } else if (!Number.isFinite(Number(form.fees)) || Number(form.fees) <= 0) {
      errors.fees = "Enter a fee greater than zero.";
    }

    if (!form.addressLine1.trim()) {
      errors.addressLine1 = "Address line 1 is required.";
    }

    if (form.password) {
      const strongPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

      if (!strongPassword.test(form.password)) {
        errors.password =
          "Use 8+ characters with uppercase, lowercase, number and symbol.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update doctor profile
  const handleUpdateDoctor = async (event) => {
    event.preventDefault();

    if (!selectedDoctor?._id || !validateForm()) return;

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim());
      formData.append("speciality", form.speciality.trim());
      formData.append("degree", form.degree.trim());
      formData.append("experience", form.experience.trim());
      formData.append("about", form.about.trim());
      formData.append("fees", String(Number(form.fees)));

      formData.append(
        "address",
        JSON.stringify({
          line1: form.addressLine1.trim(),
          line2: form.addressLine2.trim(),
        }),
      );

      formData.append("available", String(form.available));

      if (form.password.trim()) {
        formData.append("password", form.password);
      }

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await dispatch(
        updateDoctor({
          id: selectedDoctor._id,
          formData,
        }),
      ).unwrap();

      toast.success("Doctor profile updated successfully.");

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }

      setActiveModal(null);
      setSelectedDoctor(null);
      setSelectedImage(null);
      setImagePreview("");
      setFormErrors({});
      setForm(initialForm);
      setShowPassword(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      await dispatch(listDoctors()).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update doctor profile."));
    } finally {
      setSaving(false);
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async () => {
    if (!selectedDoctor?._id) return;

    setDeleting(true);

    try {
      await dispatch(deleteDoctor(selectedDoctor._id)).unwrap();

      toast.success("Doctor deleted successfully.");
      setActiveModal(null);
      setSelectedDoctor(null);

      await dispatch(listDoctors()).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to delete doctor."));
    } finally {
      setDeleting(false);
    }
  };

  // Toggle doctor availability
  const handleAvailabilityChange = async (doctor) => {
    if (!doctor?._id) return;

    setAvailabilityUpdating(doctor._id);

    try {
      const response = await dispatch(
        changeDoctorAvailability(doctor._id),
      ).unwrap();

      toast.success(
        response?.message || "Doctor availability updated successfully.",
      );

      await dispatch(listDoctors()).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to change availability."));
    } finally {
      setAvailabilityUpdating(null);
    }
  };

  // Reusable UI components
  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    iconClass,
    iconBg,
  }) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon size={21} className={iconClass} />
        </div>
      </div>
    </div>
  );

  const FieldError = ({ children }) =>
    children ? (
      <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p>
    ) : null;

  const DoctorAvatar = ({ doctor, size = "large" }) => {
    const sizeClass =
      size === "small" ? "h-12 w-12 rounded-xl" : "h-16 w-16 rounded-2xl";

    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden border border-indigo-100 bg-indigo-50 text-sm font-extrabold text-indigo-700`}
      >
        {doctor?.image ? (
          <img
            src={doctor.image}
            alt={doctor.name || "Doctor"}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement.textContent = getInitials(
                doctor?.name,
              );
            }}
          />
        ) : (
          getInitials(doctor?.name)
        )}
      </div>
    );
  };

  const DoctorIdentity = ({ doctor }) => (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative shrink-0">
        <DoctorAvatar doctor={doctor} size="small" />
        <span
          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
            doctor?.available ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">
          {doctor?.name || "Unnamed doctor"}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {doctor?.email || "No email"}
        </p>
      </div>
    </div>
  );

  const AvailabilityBadge = ({ available }) => (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-semibold ${
        available
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          available ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {available ? "Available" : "Unavailable"}
    </span>
  );

  const ActionButtons = ({ doctor }) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => openDoctorDetails(doctor)}
        title="View doctor details"
        aria-label="View doctor details"
        className="flex h-9 w-9 items-center cursor-pointer justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Eye size={17} />
      </button>

      <button
        type="button"
        onClick={() => openEditModal(doctor)}
        title="Edit doctor"
        aria-label="Edit doctor"
        className="flex h-9 w-9 items-center justify-center cursor-pointer rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <Pencil size={16} />
      </button>

      <button
        type="button"
        onClick={() => openDeleteModal(doctor)}
        title="Delete doctor"
        aria-label="Delete doctor"
        className="flex h-9 w-9 items-center justify-center rounded-xl border cursor-pointer border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  // Pagination controls
  const Pagination = () => {
    if (!filteredDoctors.length) return null;

    const visiblePages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let page = startPage; page <= endPage; page += 1) {
      visiblePages.push(page);
    }

    return (
      <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-800">{firstRecord}</span>
            {" – "}
            <span className="font-bold text-slate-800">{lastRecord}</span>
            {" of "}
            <span className="font-bold text-slate-800">
              {filteredDoctors.length}
            </span>{" "}
            doctors
          </p>

          <div className="flex items-center gap-2">
            <label
              htmlFor="doctor-page-size"
              className="shrink-0 text-xs font-semibold text-slate-500"
            >
              Rows per page
            </label>
            <select
              id="doctor-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 cursor-pointer bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-9 items-center gap-1 rounded-lg border cursor-pointer border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="h-9 min-w-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold cursor-pointer text-slate-600 hover:bg-indigo-50"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="px-1 text-slate-400">...</span>
              )}
            </>
          )}

          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              aria-current={currentPage === page ? "page" : undefined}
              className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-bold transition cursor-pointer ${
                currentPage === page
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-1 text-slate-400">...</span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className="h-9 min-w-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold cursor-pointer text-slate-600 hover:bg-indigo-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold cursor-pointer text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* PAGE HEADER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 top-10 h-44 w-44 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-0 right-44 h-28 w-28 rounded-full bg-indigo-400/10 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-100">
                <ShieldCheck size={15} />
                ADMINISTRATION / DOCTOR DIRECTORY
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Doctor Management
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
                Manage your medical team, review professional profiles, control
                availability and keep your doctor directory up to date.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fetchDoctors(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 cursor-pointer text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Stethoscope size={21} />
                </div>
                <div>
                  <p className="text-xs text-indigo-100/70">Total registered</p>
                  <p className="text-xl font-extrabold">
                    {statistics.total} Doctors
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATISTICS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Doctors"
            value={statistics.total}
            description="Doctors registered in your directory"
            icon={UsersRound}
            iconClass="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <StatCard
            title="Available Doctors"
            value={statistics.available}
            description="Currently marked as available"
            icon={UserRoundCheck}
            iconClass="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Unavailable"
            value={statistics.unavailable}
            description="Doctors not accepting appointments"
            icon={Activity}
            iconClass="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatCard
            title="Booked Slots"
            value={statistics.bookedSlots}
            description="Slots recorded across all doctors"
            icon={CalendarDays}
            iconClass="text-violet-600"
            iconBg="bg-violet-50"
          />
        </div>

        {/* DOCTOR DIRECTORY */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BriefcaseMedical size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    Medical Team
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    {filteredDoctors.length} of {doctors.length} doctors shown
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                <div className="relative min-w-0 sm:min-w-[250px]">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      resetPagination();
                    }}
                    placeholder="Search name, email, location..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 sm:w-[290px]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        resetPagination();
                      }}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Filter
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={specialityFilter}
                    onChange={(event) => {
                      setSpecialityFilter(event.target.value);
                      resetPagination();
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 cursor-pointer bg-white py-3 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 sm:w-[190px]"
                  >
                    <option value="All Specialities">All Specialities</option>
                    {specialities.map((speciality) => (
                      <option key={speciality} value={speciality}>
                        {speciality}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  />
                </div>

                <div className="relative">
                  <SlidersHorizontal
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={availabilityFilter}
                    onChange={(event) => {
                      setAvailabilityFilter(event.target.value);
                      resetPagination();
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-9 text-sm cursor-pointer font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 sm:w-[180px]"
                  >
                    <option value="all">All Availability</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Filter and sort doctors by name, speciality, availability or
                consultation fee.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs cursor-pointer font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Clear filters
                </button>

                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs font-medium text-slate-500">
                    Sort by
                  </span>
                  <select
                    value={sortBy}
                    onChange={(event) => {
                      setSortBy(event.target.value);
                      resetPagination();
                    }}
                    className="max-w-full rounded-lg cursor-pointer border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                  >
                    <option value="newest">Recently added</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name">Name A–Z</option>
                    <option value="fees-high">Fee: High to low</option>
                    <option value="fees-low">Fee: Low to high</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* LOADING / EMPTY / DIRECTORY */}
          {pageLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
              <LoaderCircle
                size={30}
                className="animate-spin text-indigo-600"
              />
              <p className="mt-4 font-semibold text-slate-800">
                Loading doctor directory
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Fetching the latest doctor information...
              </p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <Stethoscope size={32} className="text-slate-400" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No doctors found
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                No doctors are currently registered in the directory.
              </p>
              <button
                type="button"
                onClick={() => fetchDoctors(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl cursor-pointer bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <RefreshCw size={16} />
                Reload directory
              </button>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
              <Search size={28} className="text-slate-400" />
              <h3 className="mt-4 font-bold text-slate-900">
                No matching doctors
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-bold cursor-pointer text-indigo-600 hover:text-indigo-800"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {[
                        "Doctor",
                        "Speciality",
                        "Experience",
                        "Consultation",
                        "Availability",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 ${
                            heading === "Doctor" ? "pl-6" : ""
                          } ${heading === "Actions" ? "text-right" : ""}`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedDoctors.map((doctor) => (
                      <tr
                        key={doctor._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <DoctorIdentity doctor={doctor} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <HeartPulse size={16} />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {doctor.speciality || "Not specified"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {doctor.degree || "Degree not specified"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                          {doctor.experience || "N/A"}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold text-slate-900">
                            ₹{Number(doctor.fees || 0).toLocaleString("en-IN")}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Per consultation
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleAvailabilityChange(doctor)}
                            disabled={availabilityUpdating === doctor._id}
                            title="Click to change availability"
                            className="disabled:cursor-not-allowed cursor-pointer disabled:opacity-60"
                          >
                            {availabilityUpdating === doctor._id ? (
                              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                                <LoaderCircle
                                  size={14}
                                  className="animate-spin"
                                />
                                Updating
                              </span>
                            ) : (
                              <AvailabilityBadge available={doctor.available} />
                            )}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <ActionButtons doctor={doctor} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE AND TABLET CARDS */}
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:hidden">
                {paginatedDoctors.map((doctor) => (
                  <article
                    key={doctor._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <DoctorIdentity doctor={doctor} />
                      <AvailabilityBadge available={doctor.available} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Speciality</p>
                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {doctor.speciality || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Experience</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {doctor.experience || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-indigo-50/70 p-3">
                        <p className="text-xs text-indigo-600">
                          Consultation fee
                        </p>
                        <p className="mt-1 text-lg font-extrabold text-indigo-700">
                          ₹{Number(doctor.fees || 0).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Booked slots</p>
                        <p className="mt-1 text-lg font-extrabold text-slate-800">
                          {getBookedSlotsCount(doctor.slots_booked)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => handleAvailabilityChange(doctor)}
                        disabled={availabilityUpdating === doctor._id}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      >
                        {availabilityUpdating === doctor._id
                          ? "Updating..."
                          : "Toggle availability"}
                      </button>
                      <ActionButtons doctor={doctor} />
                    </div>
                  </article>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Protected admin directory
                </div>
              </div>

              <Pagination />
            </>
          )}
        </section>
      </div>

      {/* VIEW DOCTOR DETAILS MODAL */}
      {activeModal === "view" && selectedDoctor && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-5 py-6 text-white sm:px-8 sm:py-7">
              <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border border-white/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
                    Medical professional
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                    Doctor Profile
                  </h2>
                  <p className="mt-1 text-sm text-indigo-100/80">
                    Complete professional information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close details"
                  className="flex h-10 w-10 shrink-0 items-center justify-center cursor-pointer rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">
              {modalLoading ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center">
                  <LoaderCircle
                    size={30}
                    className="animate-spin text-indigo-600"
                  />
                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Loading complete profile...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:p-5">
                    <div className="flex shrink-0 justify-center">
                      <DoctorAvatar doctor={selectedDoctor} />
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                          {selectedDoctor.speciality ||
                            "Speciality not specified"}
                        </span>
                        <AvailabilityBadge
                          available={selectedDoctor.available}
                        />
                      </div>

                      <h3 className="mt-3 break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
                        {selectedDoctor.name}
                      </h3>
                      <p className="mt-1 break-all text-sm text-slate-500">
                        {selectedDoctor.email}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        {selectedDoctor.degree || "Degree not specified"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center sm:min-w-[130px]">
                      <p className="text-xs font-medium text-slate-500">
                        Consultation fee
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-indigo-700">
                        ₹{Number(selectedDoctor.fees || 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Award size={17} className="text-indigo-600" />
                        <span className="text-xs font-semibold">
                          Experience
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-extrabold text-slate-900">
                        {selectedDoctor.experience || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays size={17} className="text-indigo-600" />
                        <span className="text-xs font-semibold">
                          Profile created
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-extrabold text-slate-900">
                        {formatDate(
                          selectedDoctor.createdAt || selectedDoctor.date,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={17} className="text-indigo-600" />
                        <span className="text-xs font-semibold">
                          Clinic / Address
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
                        {formatAddress(selectedDoctor.address)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <FileText size={17} className="text-indigo-600" />
                        <span className="text-xs font-semibold">
                          About the doctor
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {selectedDoctor.about || "No description provided."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays size={17} className="text-indigo-600" />
                        <span className="text-xs font-semibold">
                          Appointment slot summary
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-2xl font-extrabold text-slate-900">
                            {getBookedSlotsCount(selectedDoctor.slots_booked)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Recorded booked slots
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Clock3 size={23} />
                        </div>
                      </div>

                      {Object.keys(selectedDoctor.slots_booked || {}).length >
                        0 && (
                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                          {Object.entries(selectedDoctor.slots_booked)
                            .sort(([dateA], [dateB]) =>
                              dateA.localeCompare(dateB),
                            )
                            .map(([date, slots]) => (
                              <div
                                key={date}
                                className="flex flex-col justify-between gap-1 rounded-xl bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center"
                              >
                                <span className="text-xs font-semibold text-slate-700">
                                  {formatDate(date)}
                                </span>
                                <span className="break-words text-xs text-slate-500">
                                  {Array.isArray(slots)
                                    ? slots.join(", ")
                                    : "No slot details"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* FIXED VIEW MODAL FOOTER */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={closeModal}
                disabled={modalLoading}
                className="rounded-xl cursor-pointer border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => openEditModal(selectedDoctor)}
                disabled={modalLoading}
                className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {activeModal === "edit" && selectedDoctor && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* FIXED HEADER */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-8 sm:py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  <Pencil size={14} />
                  PROFILE MANAGEMENT
                </div>
                <h2 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Edit Doctor
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update professional details and profile information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving || modalLoading}
                aria-label="Close edit form"
                className="flex h-10 w-10 shrink-0 items-center justify-center cursor-pointer rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-indigo-600"
                />
                <p className="mt-4 text-sm font-semibold text-slate-600">
                  Preparing doctor profile...
                </p>
              </div>
            ) : (
              <>
                {/* SCROLLABLE FORM BODY */}
                <form
                  id="edit-doctor-form"
                  onSubmit={handleUpdateDoctor}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                >
                  <div className="space-y-7 p-5 sm:p-8">
                    {/* PROFILE IMAGE */}
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Profile picture
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Upload a JPG, PNG or other supported image up to 5 MB.
                      </p>

                      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Doctor preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound size={30} className="text-slate-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="break-all text-sm font-bold text-slate-800">
                            {selectedImage
                              ? selectedImage.name
                              : "Doctor profile image"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Choose a new image to replace the current profile
                            picture.
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 cursor-pointer bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
                            >
                              <ImagePlus size={15} />
                              Choose image
                            </button>

                            {selectedImage && (
                              <button
                                type="button"
                                onClick={() => {
                                  clearSelectedImage();
                                  setImagePreview(selectedDoctor.image || "");

                                  if (imageInputRef.current) {
                                    imageInputRef.current.value = "";
                                  }
                                }}
                                className="rounded-xl px-3 py-2.5 text-xs cursor-pointer font-semibold text-red-600 hover:bg-red-50"
                              >
                                Undo image change
                              </button>
                            )}
                          </div>

                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BASIC INFORMATION */}
                    <div>
                      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <UserRound size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Basic information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass} htmlFor="doctor-name">
                            Full name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="doctor-name"
                            name="name"
                            value={form.name}
                            onChange={handleFormChange}
                            className={inputClass}
                            placeholder="e.g. Dr. Sarah Kumar"
                          />
                          <FieldError>{formErrors.name}</FieldError>
                        </div>

                        <div>
                          <label className={labelClass} htmlFor="doctor-email">
                            Email address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="doctor-email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleFormChange}
                            className={inputClass}
                            placeholder="doctor@example.com"
                          />
                          <FieldError>{formErrors.email}</FieldError>
                        </div>

                        <div>
                          <label
                            className={labelClass}
                            htmlFor="doctor-speciality"
                          >
                            Speciality <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="doctor-speciality"
                            name="speciality"
                            value={form.speciality}
                            onChange={handleFormChange}
                            className={inputClass}
                            placeholder="e.g. Cardiologist"
                          />
                          <FieldError>{formErrors.speciality}</FieldError>
                        </div>

                        <div>
                          <label className={labelClass} htmlFor="doctor-degree">
                            Degree <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="doctor-degree"
                            name="degree"
                            value={form.degree}
                            onChange={handleFormChange}
                            className={inputClass}
                            placeholder="e.g. MBBS, MD"
                          />
                          <FieldError>{formErrors.degree}</FieldError>
                        </div>

                        <div>
                          <label
                            className={labelClass}
                            htmlFor="doctor-experience"
                          >
                            Experience <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="doctor-experience"
                            name="experience"
                            value={form.experience}
                            onChange={handleFormChange}
                            className={inputClass}
                            placeholder="e.g. 5 years"
                          />
                          <FieldError>{formErrors.experience}</FieldError>
                        </div>

                        <div>
                          <label className={labelClass} htmlFor="doctor-fees">
                            Consultation fee (₹){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <IndianRupee
                              size={16}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              id="doctor-fees"
                              type="number"
                              min="1"
                              name="fees"
                              value={form.fees}
                              onChange={handleFormChange}
                              className={`${inputClass} pl-9`}
                              placeholder="1000"
                            />
                          </div>
                          <FieldError>{formErrors.fees}</FieldError>
                        </div>
                      </div>
                    </div>

                    {/* ADDRESS */}
                    <div>
                      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <MapPin size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Clinic / Address information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass} htmlFor="address-line1">
                            Address line 1{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="address-line1"
                            name="addressLine1"
                            value={form.addressLine1}
                            onChange={handleFormChange}
                            className={inputClass}
                            placeholder="Street, area or locality"
                          />
                          <FieldError>{formErrors.addressLine1}</FieldError>
                        </div>

                        <div>
                          <label className={labelClass} htmlFor="address-line2">
                            Address line 2
                          </label>
                          <input
                            id="address-line2"
                            name="addressLine2"
                            value={form.addressLine2}
                            onChange={handleFormChange}
                            className={inputClass}
                            placeholder="City, state or postal code"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PROFESSIONAL DESCRIPTION */}
                    <div>
                      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <FileText size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Professional description
                        </h3>
                      </div>

                      <label className={labelClass} htmlFor="doctor-about">
                        About doctor <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="doctor-about"
                        name="about"
                        rows={5}
                        value={form.about}
                        onChange={handleFormChange}
                        className={`${inputClass} resize-y leading-6`}
                        placeholder="Write about the doctor's experience, expertise and approach to patient care..."
                      />
                      <div className="mt-1.5 flex items-start justify-between gap-3">
                        <FieldError>{formErrors.about}</FieldError>
                        <span className="ml-auto shrink-0 text-xs text-slate-400">
                          {form.about.length} characters
                        </span>
                      </div>
                    </div>

                    {/* ACCOUNT SETTINGS */}
                    <div>
                      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <ShieldCheck size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Account settings
                        </h3>
                      </div>

                      <label className={labelClass} htmlFor="doctor-password">
                        New password (optional)
                      </label>

                      {/* PASSWORD INPUT WITH SHOW / HIDE EYE ICON */}
                      <div className="relative">
                        <input
                          id="doctor-password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={form.password}
                          onChange={handleFormChange}
                          className={`${inputClass} pr-12`}
                          placeholder="Leave blank to keep the current password"
                          autoComplete="new-password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          title={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-3 top-1/2 flex h-9 w-9 cursor-pointer -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          {showPassword ? (
                            <EyeOff size={19} />
                          ) : (
                            <Eye size={19} />
                          )}
                        </button>
                      </div>

                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        Leave blank to keep the existing password. A new
                        password must have at least 8 characters, uppercase,
                        lowercase, a number and a special character.
                      </p>
                      <FieldError>{formErrors.password}</FieldError>

                      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200">
                        <input
                          type="checkbox"
                          name="available"
                          checked={form.available}
                          onChange={handleFormChange}
                          className="mt-0.5 h-4 w-4 accent-indigo-600"
                        />

                        <span className="flex-1">
                          <span className="block text-sm font-bold text-slate-800">
                            Doctor is available for appointments
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Enable this setting if the doctor should be marked
                            as available.
                          </span>
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            form.available
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {form.available ? "Available" : "Unavailable"}
                        </span>
                      </label>
                    </div>
                  </div>
                </form>

                {/* FIXED FOOTER: BUTTONS STAY VISIBLE */}
                <div className="relative z-20 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-8px_20px_rgba(15,23,42,0.04)] sm:flex-row sm:justify-end sm:px-8">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="edit-doctor-form"
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl cursor-pointer bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Saving changes...
                      </>
                    ) : (
                      <>
                        <Check size={17} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {activeModal === "delete" && selectedDoctor && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="p-6 text-center sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
                <AlertTriangle size={30} />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-slate-900">
                Delete doctor profile?
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                You are about to delete this doctor from the directory. This
                action cannot be undone from this screen.
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
                <DoctorAvatar doctor={selectedDoctor} size="small" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {selectedDoctor.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {selectedDoctor.email}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-indigo-600">
                    {selectedDoctor.speciality || "Doctor"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={deleting}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 cursor-pointer transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keep Doctor
                </button>

                <button
                  type="button"
                  onClick={handleDeleteDoctor}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 cursor-poin rounded-xl bg-red-600 px-4 py-3 cursor-pointer text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Doctor
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Doctorlist;
