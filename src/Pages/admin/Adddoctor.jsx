
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  FileText,
  ImagePlus,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserRound,
  X,
  Eye,
  EyeOff,
  LoaderCircle,
  Sparkles,
  Trash2,
} from "lucide-react";

import { addDoctor } from "../../Redux/adminSlice";

const initialForm = {
  name: "",
  email: "",
  password: "",
  speciality: "",
  degree: "",
  experience: "",
  about: "",
  fees: "",
  addressLine1: "",
  addressLine2: "",
};

const specialities = [
  "General physician",
  "Gynecologist",
  "Dermatologist",
  "Pediatricians",
  "Neurologist",
  "Gastroenterologist",
  "Cardiologist",
  "Orthopedic surgeon",
  "Psychiatrist",
  "Dentist",
  "ENT specialist",
  "Ophthalmologist",
  "Urologist",
  "Pulmonologist",
  "Endocrinologist",
  "Oncologist",
  "Other",
];

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 hover:border-slate-300 focus:border-cyan-500 focus:ring-cyan-50"
  }`;

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

const Adddoctor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdDoctor, setCreatedDoctor] = useState(null);

  useEffect(() => {
    if (!image) {
      setPreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  useEffect(() => {
    if (!successOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSuccessOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [successOpen]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  const validateField = (name, value) => {
    const val = String(value ?? "").trim();

    switch (name) {
      case "name":
        if (!val) return "Doctor name is required.";
        if (val.length < 3) return "Name must contain at least 3 characters.";
        if (val.length > 80) return "Name cannot exceed 80 characters.";
        if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(val)) {
          return "Enter a valid name using letters only.";
        }
        return "";

      case "email":
        if (!val) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return "Enter a valid email address.";
        }
        return "";

      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Use at least 8 characters.";
        if (!/[a-z]/.test(value)) return "Add at least one lowercase letter.";
        if (!/[A-Z]/.test(value)) return "Add at least one uppercase letter.";
        if (!/[0-9]/.test(value)) return "Add at least one number.";
        if (!/[^A-Za-z0-9]/.test(value)) {
          return "Add at least one special character.";
        }
        return "";

      case "speciality":
        return val ? "" : "Please select a speciality.";

      case "degree":
        if (!val) return "Doctor's degree is required.";
        if (val.length > 100) return "Degree cannot exceed 100 characters.";
        return "";

      case "experience":
        if (val === "") return "Please enter experience.";
        if (!Number.isInteger(Number(val)) || Number(val) < 0 || Number(val) > 60) {
          return "Experience must be a whole number from 0 to 60.";
        }
        return "";

      case "about":
        if (!val) return "Please add a short professional bio.";
        if (val.length < 20) return "Bio must contain at least 20 characters.";
        if (val.length > 1000) return "Bio cannot exceed 1000 characters.";
        return "";

      case "fees":
        if (val === "") return "Consultation fee is required.";
        if (!Number.isFinite(Number(val)) || Number(val) <= 0) {
          return "Enter a fee greater than zero.";
        }
        if (Number(val) > 1000000) return "Please enter a reasonable fee.";
        return "";

      case "addressLine1":
        if (!val) return "Clinic address is required.";
        if (val.length < 5) return "Enter a more complete address.";
        if (val.length > 200) return "Address cannot exceed 200 characters.";
        return "";

      case "addressLine2":
        return val.length > 200
          ? "Additional address cannot exceed 200 characters."
          : "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    Object.keys(initialForm).forEach((key) => {
      nextErrors[key] = validateField(key, form[key]);
    });

    if (!image) {
      nextErrors.image = "Please upload the doctor's profile image.";
    }

    setErrors(nextErrors);
    setTouched(
      Object.keys(initialForm).reduce((result, key) => {
        result[key] = true;
        return result;
      }, {})
    );

    return !Object.values(nextErrors).some(Boolean);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrors((previous) => ({
        ...previous,
        image: "Choose a JPG, PNG or WEBP image.",
      }));
      toast.error("Unsupported image format.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        image: "Image size must be 5 MB or less.",
      }));
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    setImage(file);
    setErrors((previous) => ({ ...previous, image: "" }));
  };

  const removeImage = () => {
    setImage(null);
    setErrors((previous) => ({
      ...previous,
      image: "Please upload the doctor's profile image.",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields.");
      const firstError = document.querySelector(
        '[aria-invalid="true"]'
      );
      firstError?.focus();
      return;
    }

    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("email", form.email.trim().toLowerCase());
    formData.append("password", form.password);
    formData.append("speciality", form.speciality);
    formData.append("degree", form.degree.trim());
    formData.append("experience", form.experience);
    formData.append("about", form.about.trim());
    formData.append("fees", form.fees);

    formData.append(
      "address",
      JSON.stringify({
        line1: form.addressLine1.trim(),
        line2: form.addressLine2.trim(),
      })
    );

    formData.append("image", image);

    setSubmitting(true);

    try {
      const result = await dispatch(addDoctor(formData)).unwrap();

      setCreatedDoctor(result.doctor || null);
      setSuccessOpen(true);
      setForm(initialForm);
      setImage(null);
      setErrors({});
      setTouched({});
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Unable to add doctor. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (name) =>
    touched[name] && errors[name] ? errors[name] : "";

  const renderError = (name) =>
    fieldError(name) ? (
      <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600">
        <X size={14} className="mt-0.5 shrink-0" />
        {fieldError(name)}
      </p>
    ) : null;

  const completedCount = [
    form.name.trim(),
    form.email.trim(),
    form.password,
    form.speciality,
    form.degree.trim(),
    form.experience !== "",
    form.about.trim().length >= 20,
    form.fees !== "",
    form.addressLine1.trim(),
    Boolean(image),
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-3 py-5 sm:px-6 sm:py-8 lg:px-9">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 shadow-sm">
              <Stethoscope size={24} />
            </div>

            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                  MediCare Admin
                </span>
                <span className="rounded-full border border-cyan-100 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Doctor management
                </span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Add New Doctor
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Create a professional doctor profile and make it available
                for appointment bookings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/doctor-list")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 sm:self-center"
          >
            <ArrowLeft size={17} />
            Doctor Directory
          </button>
        </div>

        {/* Hero banner */}
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-[#083344] via-[#0e7490] to-[#0891b2] p-5 text-white shadow-lg shadow-cyan-950/10 sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-20 right-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-50">
                <Sparkles size={14} />
                New medical professional
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Build a trusted doctor profile
              </h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                Keep credentials, consultation details and clinic information
                accurate so patients can make informed bookings.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck size={26} />
              </div>
              <div>
                <p className="text-sm font-bold">Secure registration</p>
                <p className="mt-1 text-xs text-cyan-50/80">
                  Admin authenticated
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="min-w-0 space-y-6">
              {/* Profile section */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <UserRound size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Personal information
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Basic details used in the doctor directory
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                  <div>
                    <label className={labelClass} htmlFor="name">
                      Full name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={updateField}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, name: true }));
                        setErrors((p) => ({
                          ...p,
                          name: validateField("name", form.name),
                        }));
                      }}
                      aria-invalid={Boolean(fieldError("name"))}
                      placeholder="e.g. Dr. Rahul Sharma"
                      className={inputClass(Boolean(fieldError("name")))}
                    />
                    {renderError("name")}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="email">
                      Email address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="off"
                        value={form.email}
                        onChange={updateField}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, email: true }));
                          setErrors((p) => ({
                            ...p,
                            email: validateField("email", form.email),
                          }));
                        }}
                        aria-invalid={Boolean(fieldError("email"))}
                        placeholder="doctor@medicare.com"
                        className={`${inputClass(Boolean(fieldError("email")))} pl-10`}
                      />
                    </div>
                    {renderError("email")}
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="password">
                      Account password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={updateField}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, password: true }));
                          setErrors((p) => ({
                            ...p,
                            password: validateField("password", form.password),
                          }));
                        }}
                        aria-invalid={Boolean(fieldError("password"))}
                        placeholder="Create a strong password"
                        className={`${inputClass(Boolean(fieldError("password")))} pl-10 pr-12`}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {renderError("password")}
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Minimum 8 characters, including uppercase, lowercase,
                      number and special character.
                    </p>
                  </div>
                </div>
              </section>

              {/* Professional section */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Activity size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Professional details
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Speciality, qualifications and consultation charges
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                  <div>
                    <label className={labelClass} htmlFor="speciality">
                      Medical speciality <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="speciality"
                        name="speciality"
                        value={form.speciality}
                        onChange={updateField}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, speciality: true }));
                          setErrors((p) => ({
                            ...p,
                            speciality: validateField("speciality", form.speciality),
                          }));
                        }}
                        aria-invalid={Boolean(fieldError("speciality"))}
                        className={`${inputClass(Boolean(fieldError("speciality")))} appearance-none pr-10 ${form.speciality ? "" : "text-slate-400"}`}
                      >
                        <option value="">Select speciality</option>
                        {specialities.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={17}
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                    {renderError("speciality")}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="degree">
                      Qualification / degree <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="degree"
                      name="degree"
                      value={form.degree}
                      onChange={updateField}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, degree: true }));
                        setErrors((p) => ({
                          ...p,
                          degree: validateField("degree", form.degree),
                        }));
                      }}
                      aria-invalid={Boolean(fieldError("degree"))}
                      placeholder="e.g. MBBS, MD"
                      className={inputClass(Boolean(fieldError("degree")))}
                    />
                    {renderError("degree")}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="experience">
                      Experience (years) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock3
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        max="60"
                        step="1"
                        value={form.experience}
                        onChange={updateField}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, experience: true }));
                          setErrors((p) => ({
                            ...p,
                            experience: validateField("experience", form.experience),
                          }));
                        }}
                        aria-invalid={Boolean(fieldError("experience"))}
                        placeholder="e.g. 5"
                        className={`${inputClass(Boolean(fieldError("experience")))} pl-10`}
                      />
                    </div>
                    {renderError("experience")}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="fees">
                      Consultation fee (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="fees"
                        name="fees"
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        value={form.fees}
                        onChange={updateField}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, fees: true }));
                          setErrors((p) => ({
                            ...p,
                            fees: validateField("fees", form.fees),
                          }));
                        }}
                        aria-invalid={Boolean(fieldError("fees"))}
                        placeholder="e.g. 500"
                        className={`${inputClass(Boolean(fieldError("fees")))} pl-10`}
                      />
                    </div>
                    {renderError("fees")}
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="about">
                      Professional biography <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="about"
                      name="about"
                      rows={5}
                      maxLength={1000}
                      value={form.about}
                      onChange={updateField}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, about: true }));
                        setErrors((p) => ({
                          ...p,
                          about: validateField("about", form.about),
                        }));
                      }}
                      aria-invalid={Boolean(fieldError("about"))}
                      placeholder="Describe the doctor's expertise, experience, approach to patient care and areas of special interest..."
                      className={`${inputClass(Boolean(fieldError("about")))} min-h-32 resize-y leading-6`}
                    />
                    <div className="mt-1.5 flex items-start justify-between gap-3">
                      {renderError("about")}
                      <span className="ml-auto shrink-0 text-xs text-slate-400">
                        {form.about.length}/1000
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Address section */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <MapPin size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Clinic address
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Where patients can visit the doctor
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <label className={labelClass} htmlFor="addressLine1">
                      Address line 1 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="addressLine1"
                      name="addressLine1"
                      autoComplete="street-address"
                      value={form.addressLine1}
                      onChange={updateField}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, addressLine1: true }));
                        setErrors((p) => ({
                          ...p,
                          addressLine1: validateField("addressLine1", form.addressLine1),
                        }));
                      }}
                      aria-invalid={Boolean(fieldError("addressLine1"))}
                      placeholder="Building, street, clinic or hospital name"
                      className={inputClass(Boolean(fieldError("addressLine1")))}
                    />
                    {renderError("addressLine1")}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="addressLine2">
                      Address line 2
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>
                    <input
                      id="addressLine2"
                      name="addressLine2"
                      autoComplete="address-line2"
                      value={form.addressLine2}
                      onChange={updateField}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, addressLine2: true }));
                        setErrors((p) => ({
                          ...p,
                          addressLine2: validateField("addressLine2", form.addressLine2),
                        }));
                      }}
                      aria-invalid={Boolean(fieldError("addressLine2"))}
                      placeholder="Area, city, state and PIN code"
                      className={inputClass(Boolean(fieldError("addressLine2")))}
                    />
                    {renderError("addressLine2")}
                  </div>
                </div>
              </section>

              {/* Mobile form actions */}
              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 xl:hidden">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setForm(initialForm);
                    setImage(null);
                    setErrors({});
                    setTouched({});
                  }}
                  className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  Clear form
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer bg-gradient-to-r from-cyan-700 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Adding doctor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Add Doctor
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="space-y-5 xl:sticky xl:top-6">
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-bold text-slate-900">Doctor portrait</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Upload a clear, professional profile photo.
                  </p>
                </div>

                <div className="p-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Upload doctor profile image"
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`group relative flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
                      errors.image
                        ? "border-rose-300 bg-rose-50/50"
                        : "border-cyan-200 bg-gradient-to-b from-cyan-50/80 to-white hover:border-cyan-400 hover:bg-cyan-50"
                    }`}
                  >
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          alt="Doctor profile preview"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/55 opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
                          <ImagePlus size={27} className="text-white" />
                          <span className="mt-2 text-sm font-semibold text-white">
                            Change photo
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-100 bg-white text-cyan-700 shadow-sm transition group-hover:scale-105">
                          <UserRound size={36} strokeWidth={1.5} />
                        </div>
                        <div className="mb-3 flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-700/15">
                          <Upload size={16} />
                          Upload photo
                        </div>
                        <p className="px-4 text-center text-xs leading-5 text-slate-500">
                          Click to browse or select an image
                        </p>
                      </>
                    )}
                  </div>

                  {errors.image && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-rose-600">
                      <X size={14} className="mt-0.5 shrink-0" />
                      {errors.image}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>JPG, PNG, WEBP</span>
                    <span>Maximum 5 MB</span>
                  </div>

                  {image && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                        <img
                          src={preview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {image.name}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {(image.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        aria-label="Remove image"
                        className="rounded-lg p-2 text-slate-400 cursor-pointer transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Profile checklist</h3>
                  <BadgeCheck size={20} className="text-cyan-700" />
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Complete the required details before submitting.
                </p>

                <div className="mt-4 flex items-end justify-between">
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {completedCount}
                    <span className="text-sm font-medium text-slate-400">
                      /10
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-cyan-700">
                    {completedCount * 10}% complete
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-400 transition-all duration-300"
                    style={{ width: `${completedCount * 10}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ["name", "Personal details"],
                    ["speciality", "Professional details"],
                    ["addressLine1", "Clinic address"],
                  ].map(([key, title]) => {
                    const isDone =
                      key === "name"
                        ? Boolean(form.name.trim())
                        : key === "speciality"
                          ? Boolean(form.speciality && form.degree.trim())
                          : Boolean(form.addressLine1.trim());

                    return (
                      <div key={key} className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            isDone
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isDone ? <Check size={14} /> : <span className="text-xs">•</span>}
                        </span>
                        <span className={`text-xs font-medium ${isDone ? "text-slate-700" : "text-slate-400"}`}>
                          {title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-950">
                      Before you submit
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-900/75">
                      Double-check the doctor's email, qualifications and
                      consultation fee. The password will be used for doctor
                      account login.
                    </p>
                  </div>
                </div>
              </section>

              {/* Desktop submit actions */}
              <div className="hidden space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm xl:block">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Adding doctor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Add Doctor
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setForm(initialForm);
                    setImage(null);
                    setErrors({});
                    setTouched({});
                  }}
                  className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Clear form
                </button>

                <p className="pt-1 text-center text-[11px] leading-5 text-slate-400">
                  <ShieldCheck size={13} className="mr-1 inline-block" />
                  Protected by admin authentication
                </p>
              </div>
            </aside>
          </div>
        </form>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} MediCare Hospital Management</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Secure doctor registration
          </p>
        </div>
      </div>

      {/* Premium success modal */}
      {successOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSuccessOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
            className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/30"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pb-9 pt-8 text-center text-white">
              <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/15" />
              <div className="pointer-events-none absolute -left-10 -bottom-20 h-44 w-44 rounded-full bg-white/10 blur-xl" />

              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                aria-label="Close success popup"
                className="absolute right-4 top-4 rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <X size={18} />
              </button>

              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-inner">
                <CheckCircle2 size={43} strokeWidth={1.8} />
                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600 shadow-md">
                  <Check size={16} strokeWidth={3} />
                </span>
              </div>

              <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-emerald-50">
                Registration complete
              </p>
              <h2
                id="success-title"
                className="relative mt-2 text-2xl font-extrabold tracking-tight"
              >
                Doctor Added!
              </h2>
              <p className="relative mx-auto mt-2 max-w-xs text-sm leading-6 text-white/85">
                The doctor profile has been saved successfully.
              </p>
            </div>

            <div className="p-6 sm:p-7">
              {createdDoctor && (
                <div className="mb-5 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cyan-100 text-cyan-700">
                    {createdDoctor.image ? (
                      <img
                        src={createdDoctor.image}
                        alt={createdDoctor.name || "Doctor"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={25} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">
                      {createdDoctor.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {createdDoctor.speciality}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {createdDoctor.email}
                    </p>
                  </div>
                  <BadgeCheck size={22} className="shrink-0 text-emerald-600" />
                </div>
              )}

              <div className="mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check size={14} />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">
                    Doctor information has been saved.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check size={14} />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">
                    Profile image has been uploaded.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/doctor-list")}
                className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                View Doctor Directory
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessOpen(false);
                  setCreatedDoctor(null);
                }}
                className="mt-3 w-full rounded-xl cursor-pointer px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                Add another doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Adddoctor;