
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  doctorProfile,
  updateDoctorProfile,
  changeDoctorAvailability,
} from "../../Redux/doctorSlice";
import {
  Activity,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BriefcaseMedical,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  IndianRupee,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
  Sparkles,
  RefreshCw,
  FileText,
} from "lucide-react";

const initialForm = {
  name: "",
  phone: "",
  speciality: "",
  degree: "",
  experience: "",
  about: "",
  fees: "",
  addressLine1: "",
  addressLine2: "",
};

const specialties = [
  "General physician",
  "Gynecologist",
  "Dermatologist",
  "Pediatricians",
  "Neurologist",
  "Gastroenterologist",
  "Cardiologist",
  "Orthopedic",
  "Ophthalmologist",
  "Dentist",
  "Urologist",
  "Psychiatrist",
  "ENT Specialist",
  "Other",
];

const getAddress = (address) => {
  if (!address) return { line1: "", line2: "" };

  if (typeof address === "string") {
    return { line1: address, line2: "" };
  }

  return {
    line1: address.line1 || "",
    line2: address.line2 || "",
  };
};

const getInitials = (name = "Doctor") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

const Doctorprofile = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { doctor, loading, error } = useSelector(
    (state) => state.doctor
  );

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    dispatch(doctorProfile())
      .unwrap()
      .catch((err) => {
        toast.error(
          typeof err === "string"
            ? err
            : err?.message || "Unable to load your profile."
        );
      });
  }, [dispatch]);

  useEffect(() => {
    if (!doctor) return;

    const address = getAddress(doctor.address);

    setForm({
      name: doctor.name || "",
      phone: doctor.phone || "",
      speciality: doctor.speciality || "",
      degree: doctor.degree || "",
      experience: doctor.experience ?? "",
      about: doctor.about || "",
      fees: doctor.fees ?? "",
      addressLine1: address.line1,
      addressLine2: address.line2,
    });

    setImagePreview(doctor.image || "");
  }, [doctor]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Close popup with Escape key.
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        handleCancelEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditing, saving, doctor]);

  const populateForm = () => {
    if (!doctor) return;

    const address = getAddress(doctor.address);

    setForm({
      name: doctor.name || "",
      phone: doctor.phone || "",
      speciality: doctor.speciality || "",
      degree: doctor.degree || "",
      experience: doctor.experience ?? "",
      about: doctor.about || "",
      fees: doctor.fees ?? "",
      addressLine1: address.line1,
      addressLine2: address.line2,
    });

    setSelectedImage(null);
    setImagePreview(doctor.image || "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditModal = () => {
    populateForm();
    setIsEditing(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    if (saving) return;

    populateForm();
    setIsEditing(false);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Doctor name is required.");
      return;
    }

    if (
      form.phone.trim() &&
      !/^[+\d\s()-]{7,20}$/.test(form.phone.trim())
    ) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    if (
      form.fees !== "" &&
      (!Number.isFinite(Number(form.fees)) ||
        Number(form.fees) < 0)
    ) {
      toast.error("Please enter valid consultation fees.");
      return;
    }

    if (
      form.experience !== "" &&
      (!Number.isFinite(Number(form.experience)) ||
        Number(form.experience) < 0)
    ) {
      toast.error("Please enter valid experience.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());

      if (form.phone.trim()) {
        formData.append("phone", form.phone.trim());
      }

      formData.append("speciality", form.speciality);
      formData.append("degree", form.degree);
      formData.append("experience", form.experience);
      formData.append("about", form.about);
      formData.append("fees", form.fees);

      formData.append(
        "address",
        JSON.stringify({
          line1: form.addressLine1.trim(),
          line2: form.addressLine2.trim(),
        })
      );

      // Keep the existing backend image field unchanged.
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const result = await dispatch(
        updateDoctorProfile(formData)
      ).unwrap();

      if (result?.success === false) {
        throw new Error(
          result.message || "Profile update failed."
        );
      }

      // Close only after the update request succeeds.
      setIsEditing(false);
      setSelectedImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(
        result?.message || "Profile updated successfully."
      );

      // Refresh saved profile data.
      try {
        await dispatch(doctorProfile()).unwrap();
      } catch {
        // The update succeeded; do not show a misleading update failure.
        toast.error("Profile saved, but refreshing the details failed.");
      }
    } catch (err) {
      toast.error(
        typeof err === "string"
          ? err
          : err?.message || "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvailability = async () => {
    if (!doctor || availabilityLoading) return;

    setAvailabilityLoading(true);

    try {
      const result = await dispatch(
        changeDoctorAvailability(!doctor.available)
      ).unwrap();

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to change availability."
        );
      }

      toast.success(
        result?.message || "Availability updated successfully."
      );
    } catch (err) {
      toast.error(
        typeof err === "string"
          ? err
          : err?.message || "Unable to change availability."
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  const labelClass =
    "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500";

  const address = getAddress(doctor?.address);

  const formattedFees = Number(
    doctor?.fees || 0
  ).toLocaleString("en-IN");

  if (loading && !doctor) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <LoaderCircle
              size={30}
              className="animate-spin text-indigo-600"
            />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-slate-900">
            Loading your profile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Preparing your professional dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <UserRound size={30} />
          </div>

          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
            Profile unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "We couldn't load your doctor profile."}
          </p>

          <button
            type="button"
            onClick={() =>
              dispatch(doctorProfile())
                .unwrap()
                .catch((err) =>
                  toast.error(
                    typeof err === "string"
                      ? err
                      : "Unable to load profile."
                  )
                )
            }
            className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fc] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Page heading */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
              <Sparkles size={14} />
              MEDICARE / DOCTOR PORTAL
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              My Profile<span className="text-indigo-600">.</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage your personal details, professional credentials,
              clinic address and appointment availability.
            </p>
          </div>

          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0"
          >
            <Edit3 size={17} />
            Edit profile
            <ArrowUpRight size={16} />
          </button>
        </header>

        {/* Profile banner */}
        <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#101b46] via-[#242b70] to-[#5145d9] p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full border-[60px] border-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-10 -z-10 hidden opacity-10 lg:block">
            <Stethoscope size={150} strokeWidth={1} />
          </div>

          <div className="relative grid gap-8 xl:grid-cols-[1fr_300px] xl:items-center">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[26px] border-4 border-white/20 bg-white/10 shadow-2xl sm:h-36 sm:w-36">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={doctor.name || "Doctor profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-black">
                      {getInitials(doctor.name)}
                    </span>
                  )}
                </div>

                <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-4 border-[#252b72] bg-emerald-400 text-emerald-950">
                  <BadgeCheck size={19} />
                </span>
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                      doctor.available
                        ? "border-emerald-300/20 bg-emerald-400/15 text-emerald-200"
                        : "border-amber-300/20 bg-amber-400/15 text-amber-100"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        doctor.available
                          ? "bg-emerald-300"
                          : "bg-amber-300"
                      }`}
                    />
                    {doctor.available ? "Available" : "Unavailable"}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
                    <ShieldCheck size={14} />
                    Doctor account
                  </span>
                </div>

                <h2 className="mt-4 break-words text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                  {doctor.name || "Doctor Name"}
                </h2>

                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-indigo-100 sm:justify-start sm:text-base">
                  <Stethoscope size={18} />
                  {doctor.speciality || "Speciality not added"}
                </p>

                <p className="mt-2 flex items-center justify-center gap-2 text-sm text-indigo-200 sm:justify-start">
                  <Award size={17} />
                  {doctor.degree || "Qualification not added"}
                </p>
              </div>
            </div>

            {/* Availability */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">
                    Appointment settings
                  </p>

                  <h3 className="mt-3 text-xl font-extrabold">
                    {doctor.available
                      ? "You're available"
                      : "You're unavailable"}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-indigo-100/80">
                    {doctor.available
                      ? "Patients can find you for appointments."
                      : "You are currently not accepting appointments."}
                  </p>
                </div>

                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    doctor.available
                      ? "bg-emerald-400/15 text-emerald-200"
                      : "bg-amber-400/15 text-amber-200"
                  }`}
                >
                  <Activity size={21} />
                </span>
              </div>

              <button
                type="button"
                onClick={handleAvailability}
                disabled={availabilityLoading}
                className={`mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  doctor.available
                    ? "bg-white text-indigo-800 hover:bg-indigo-50"
                    : "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
                }`}
              >
                {availabilityLoading ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : doctor.available ? (
                  <X size={17} />
                ) : (
                  <Check size={17} />
                )}

                {availabilityLoading
                  ? "Updating status..."
                  : doctor.available
                    ? "Set as unavailable"
                    : "Set as available"}
              </button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Stethoscope size={20} />}
            title="Speciality"
            value={doctor.speciality || "Not added"}
            subtitle="Medical department"
            color="indigo"
          />

          <StatCard
            icon={<BriefcaseMedical size={20} />}
            title="Experience"
            value={`${doctor.experience || 0} years`}
            subtitle="Professional experience"
            color="amber"
          />

          <StatCard
            icon={<IndianRupee size={20} />}
            title="Consultation fee"
            value={`₹${formattedFees}`}
            subtitle="Fee per consultation"
            color="emerald"
          />

          <StatCard
            icon={<CheckCircle2 size={20} />}
            title="Profile status"
            value="Profile loaded"
            subtitle="Account details available"
            color="sky"
          />
        </section>

        {/* Read-only profile overview */}
        <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
          <SectionHeader
            icon={<UserRound size={21} />}
            title="Professional overview"
            subtitle="Your saved personal and professional information"
            iconClass="bg-indigo-50 text-indigo-600"
            action={
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Edit3 size={15} />
                Edit details
              </button>
            }
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:p-8">
            <InfoItem
              label="Full name"
              value={doctor.name || "Not added"}
              icon={<UserRound size={18} />}
            />

            <InfoItem
              label="Phone number"
              value={doctor.phone || "Not added"}
              icon={<Phone size={18} />}
            />

            <InfoItem
              label="Speciality"
              value={doctor.speciality || "Not added"}
              icon={<Stethoscope size={18} />}
            />

            <InfoItem
              label="Degree / qualification"
              value={doctor.degree || "Not added"}
              icon={<Award size={18} />}
            />

            <InfoItem
              label="Experience"
              value={`${doctor.experience || 0} years`}
              icon={<BriefcaseMedical size={18} />}
            />

            <InfoItem
              label="Consultation fee"
              value={`₹${formattedFees}`}
              icon={<IndianRupee size={18} />}
            />

            <div className="sm:col-span-2">
              <InfoItem
                label="Professional introduction"
                value={doctor.about || "No introduction added yet."}
                icon={<FileText size={18} />}
              />
            </div>
          </div>
        </section>

        {/* Clinic address */}
        <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
          <SectionHeader
            icon={<MapPin size={21} />}
            title="Clinic address"
            subtitle="Address associated with your doctor profile"
            iconClass="bg-rose-50 text-rose-600"
            action={
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Edit3 size={15} />
                Edit address
              </button>
            }
          />

          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex items-start gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <MapPin size={21} />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Registered address
                </p>

                <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                  {[address.line1, address.line2]
                    .filter(Boolean)
                    .join(", ") || "No address added yet."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account information */}
        <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
          <SectionHeader
            icon={<ShieldCheck size={21} />}
            title="Account information"
            subtitle="Registered email and appointment settings"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:p-8">
            <InfoCard
              icon={<Mail size={19} />}
              title="Registered email"
              value={doctor.email || "Not available"}
              color="indigo"
            />

            <InfoCard
              icon={<Clock3 size={19} />}
              title="Appointment availability"
              value={
                doctor.available
                  ? "Accepting appointments"
                  : "Not accepting appointments"
              }
              color={doctor.available ? "emerald" : "amber"}
            />
          </div>

          <div className="mx-5 mb-5 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 sm:mx-7 sm:mb-7 sm:p-5 lg:mx-8 lg:mb-8">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-indigo-600"
            />
            <p className="text-xs leading-6 text-indigo-900/80 sm:text-sm">
              Your profile is connected to your doctor account. Profile
              updates use your existing doctor API, and availability can
              be managed separately.
            </p>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-center gap-2 pb-4 text-xs font-medium text-slate-400">
          <ShieldCheck size={14} />
          <span>Prescripto Doctor Portal</span>
          <span>•</span>
          <span>Profile & Settings</span>
          <ArrowUpRight size={13} />
        </footer>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              handleCancelEdit();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="my-auto flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl shadow-slate-950/30 sm:rounded-[28px]"
          >
            {/* Modal header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#172554] via-[#3730a3] to-[#4f46e5] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute -right-8 -top-20 h-48 w-48 rounded-full border-[28px] border-white/[0.06]" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                    <Edit3 size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">
                      Profile settings
                    </p>

                    <h2
                      id="edit-profile-title"
                      className="mt-1 text-xl font-black sm:text-2xl"
                    >
                      Edit your profile
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-indigo-100/80 sm:text-sm">
                      Update your professional information below.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  aria-label="Close edit profile"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal form */}
            <form
              onSubmit={handleSaveProfile}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-7 overflow-y-auto p-5 sm:p-7">
                {/* Profile photo */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-xl font-black text-indigo-700 shadow-sm">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(form.name)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900">
                      Profile picture
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      JPG, PNG or another image format. Maximum size 5 MB.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Camera size={15} />
                        Change photo
                      </button>

                      {selectedImage && (
                        <button
                          type="button"
                          onClick={() => {
                            if (imagePreview?.startsWith("blob:")) {
                              URL.revokeObjectURL(imagePreview);
                            }

                            setSelectedImage(null);
                            setImagePreview(doctor.image || "");

                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          disabled={saving}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X size={14} />
                          Remove new photo
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Personal information */}
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <UserRound size={19} />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900">
                        Personal information
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Your basic contact details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField label="Full name" required>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        disabled={saving}
                        required
                        maxLength={100}
                        placeholder="Enter your full name"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Phone number">
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          disabled={saving}
                          placeholder="Enter phone number"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* Professional information */}
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Stethoscope size={19} />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900">
                        Professional information
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Qualifications, experience and consultation fee
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField label="Speciality">
                      <select
                        name="speciality"
                        value={form.speciality}
                        onChange={handleChange}
                        disabled={saving}
                        className={inputClass}
                      >
                        <option value="">Select speciality</option>
                        {[
                          ...new Set([
                            ...specialties,
                            ...(form.speciality &&
                            !specialties.includes(form.speciality)
                              ? [form.speciality]
                              : []),
                          ]),
                        ].map((speciality) => (
                          <option key={speciality} value={speciality}>
                            {speciality}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Degree / qualification">
                      <input
                        name="degree"
                        value={form.degree}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="e.g. MBBS, MD"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Years of experience">
                      <input
                        name="experience"
                        type="number"
                        min="0"
                        value={form.experience}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="Enter experience in years"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Consultation fee (₹)">
                      <div className="relative">
                        <IndianRupee
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          name="fees"
                          type="number"
                          min="0"
                          value={form.fees}
                          onChange={handleChange}
                          disabled={saving}
                          placeholder="Enter consultation fee"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField label="Professional introduction">
                        <textarea
                          name="about"
                          rows={4}
                          value={form.about}
                          onChange={handleChange}
                          disabled={saving}
                          maxLength={2000}
                          placeholder="Describe your expertise and approach to patient care..."
                          className={`${inputClass} resize-y leading-6`}
                        />
                        <p className="mt-1.5 text-right text-xs text-slate-400">
                          {form.about.length}/2000 characters
                        </p>
                      </FormField>
                    </div>
                  </div>
                </div>

                {/* Address information */}
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <MapPin size={19} />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900">
                        Clinic address
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Your registered clinic location
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <FormField label="Address line 1">
                      <input
                        name="addressLine1"
                        value={form.addressLine1}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="Building, street or clinic name"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Address line 2">
                      <input
                        name="addressLine2"
                        value={form.addressLine2}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="Area, city, state or PIN code"
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                    <ShieldCheck size={15} className="text-emerald-600" />
                    Your changes are saved to your doctor profile.
                  </p>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={17} />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={17} />
                      )}
                      {saving ? "Saving changes..." : "Save profile"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({
  icon,
  title,
  subtitle,
  iconClass,
  action,
}) => (
  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
    <div className="flex items-center gap-3">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </span>
      <div>
        <h3 className="font-extrabold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          {subtitle}
        </p>
      </div>
    </div>
    {action}
  </div>
);

const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-200/50">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-500">
          {title}
        </span>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${colors[color]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-5 truncate text-xl font-black tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/3 rounded-full bg-indigo-500/70 transition-all duration-500 group-hover:w-2/3" />
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, icon }) => (
  <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-indigo-100 hover:bg-indigo-50/30">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
        {value}
      </p>
    </div>
  </div>
);
const InfoCard = ({ icon, title, value, color }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 hover:bg-slate-50 sm:p-5">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-1.5 break-words text-sm font-bold leading-5 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
};
const FormField = ({ label, required = false, children }) => (
  <div className="min-w-0">
    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
    {children}
  </div>
);
export default Doctorprofile;
