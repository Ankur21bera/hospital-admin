import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  adminLogin,
  adminForgotPassword,
  adminVerifyOtp,
  resendAdminOtp,
  adminResetPassword,
  clearAdminError,
  clearAdminMessage,
} from "../Redux/adminSlice";

import {
  doctorLogin,
  clearDoctorError,
  clearDoctorMessage,
} from "../Redux/doctorSlice";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN_LENGTH = 8;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading: adminLoading, isAdminAuthenticated } = useSelector(
    (state) => state.admin
  );

  const { loading: doctorLoading, isDoctorAuthenticated } = useSelector(
    (state) => state.doctor
  );

  const [role, setRole] = useState("admin");
  const [step, setStep] = useState("login");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    otp: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const loading = adminLoading || doctorLoading;

  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate("/admin-dashboard", { replace: true });
    } else if (isDoctorAuthenticated) {
      navigate("/doctor-dashboard", { replace: true });
    }
  }, [isAdminAuthenticated, isDoctorAuthenticated, navigate]);

  // Toast IDs prevent duplicate messages with the same ID.
  const showError = (message) => {
    toast.error(message, { id: "hms-login-error" });
  };

  const showSuccess = (message) => {
    toast.success(message, { id: "hms-login-success" });
  };

  const clearMessages = () => {
    dispatch(clearAdminError());
    dispatch(clearDoctorError());
    dispatch(clearAdminMessage());
    dispatch(clearDoctorMessage());
  };

  const getFailureMessage = (result, fallback) => {
    return (
      result.payload?.message ||
      (typeof result.payload === "string" ? result.payload : null) ||
      result.error?.message ||
      fallback
    );
  };

  const getEmail = () => form.email.trim().toLowerCase();

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email address is required.";
    }

    if (email.length > 254) {
      return "Email address is too long.";
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const validateLoginPassword = (password) => {
    if (!password) {
      return "Password is required.";
    }

    if (!password.trim()) {
      return "Password cannot contain only spaces.";
    }

    if (password.length > 128) {
      return "Password cannot exceed 128 characters.";
    }

    return "";
  };

  const validateNewPassword = (password) => {
    if (!password) {
      return "New password is required.";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return "Password must contain at least 8 characters.";
    }

    if (password.length > 128) {
      return "Password cannot exceed 128 characters.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Include at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
      return "Include at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
      return "Include at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Include at least one special character.";
    }

    return "";
  };

  const updateField = (e) => {
    const { name, value } = e.target;

    const updatedValue =
      name === "otp" ? value.replace(/\D/g, "").slice(0, 6) : value;

    setForm((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];

      // Keep the confirm-password validation synchronized.
      if (name === "password" && prev.confirmPassword) {
        if (updatedValue !== form.confirmPassword) {
          next.confirmPassword = "Passwords do not match.";
        } else {
          delete next.confirmPassword;
        }
      }

      if (name === "confirmPassword" && updatedValue === form.password) {
        delete next.confirmPassword;
      }

      return next;
    });
  };

  const setFieldError = (field, message) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  };

  const validateLoginForm = () => {
    const nextErrors = {};

    const emailError = validateEmail(form.email);
    const passwordError = validateLoginPassword(form.password);

    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showError("Please correct the highlighted fields.");
      return false;
    }

    return true;
  };

  const changeRole = (newRole) => {
    if (role === newRole) return;

    setRole(newRole);
    setStep("login");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setErrors({});
    clearMessages();

    setForm((prev) => ({
      ...prev,
      password: "",
      otp: "",
      confirmPassword: "",
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validateLoginForm()) return;

    clearMessages();

    const credentials = {
      email: getEmail(),
      password: form.password,
    };

    try {
      const result =
        role === "admin"
          ? await dispatch(adminLogin(credentials))
          : await dispatch(doctorLogin(credentials));

      const isFulfilled =
        role === "admin"
          ? adminLogin.fulfilled.match(result)
          : doctorLogin.fulfilled.match(result);

      if (!isFulfilled) {
        showError(
          getFailureMessage(result, "Unable to sign in. Please try again.")
        );
        return;
      }

      if (result.payload?.success === false || !result.payload?.token) {
        showError(
          result.payload?.message ||
            `${role === "admin" ? "Admin" : "Doctor"} login failed.`
        );
        return;
      }

      showSuccess(
        result.payload?.message ||
          `Welcome back, ${role === "admin" ? "Admin" : "Doctor"}!`
      );

      navigate(
        role === "admin" ? "/admin-dashboard" : "/doctor-dashboard",
        { replace: true }
      );
    } catch {
      showError("Something went wrong. Please try again.");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (loading) return;

    const emailError = validateEmail(form.email);

    if (emailError) {
      setFieldError("email", emailError);
      showError("Please enter a valid registered admin email.");
      return;
    }

    clearMessages();

    try {
      const result = await dispatch(adminForgotPassword(getEmail()));

      if (!adminForgotPassword.fulfilled.match(result)) {
        showError(getFailureMessage(result, "Unable to send OTP."));
        return;
      }

      if (result.payload?.success === false) {
        showError(result.payload.message || "Unable to send OTP.");
        return;
      }

      setErrors({});
      setStep("verify");

      showSuccess(result.payload?.message || "OTP sent to your email.");
    } catch {
      showError("Unable to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!/^\d{6}$/.test(form.otp)) {
      setFieldError("otp", "Enter the complete 6-digit OTP.");
      showError("Please enter the complete 6-digit OTP.");
      return;
    }

    clearMessages();

    try {
      const result = await dispatch(
        adminVerifyOtp({
          email: getEmail(),
          otp: form.otp,
        })
      );

      if (!adminVerifyOtp.fulfilled.match(result)) {
        showError(getFailureMessage(result, "OTP verification failed."));
        return;
      }

      if (result.payload?.success === false) {
        showError(result.payload.message || "OTP verification failed.");
        return;
      }

      setErrors({});
      setForm((prev) => ({ ...prev, otp: "" }));
      setStep("reset");

      showSuccess(
        result.payload?.message || "OTP verified successfully."
      );
    } catch {
      showError("OTP verification failed. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (loading) return;

    const emailError = validateEmail(form.email);

    if (emailError) {
      setFieldError("email", emailError);
      showError("Enter a valid admin email first.");
      return;
    }

    clearMessages();

    try {
      const result = await dispatch(resendAdminOtp(getEmail()));

      if (!resendAdminOtp.fulfilled.match(result)) {
        showError(getFailureMessage(result, "Unable to resend OTP."));
        return;
      }

      if (result.payload?.success === false) {
        showError(result.payload.message || "Unable to resend OTP.");
        return;
      }

      setErrors({});
      setForm((prev) => ({ ...prev, otp: "" }));

      showSuccess(result.payload?.message || "New OTP sent successfully.");
    } catch {
      showError("Unable to resend OTP. Please try again.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (loading) return;

    const nextErrors = {};

    const passwordError = validateNewPassword(form.password);

    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showError("Please correct the highlighted password fields.");
      return;
    }

    clearMessages();

    try {
      const result = await dispatch(
        adminResetPassword({
          email: getEmail(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        })
      );

      if (!adminResetPassword.fulfilled.match(result)) {
        showError(getFailureMessage(result, "Password reset failed."));
        return;
      }

      if (result.payload?.success === false) {
        showError(result.payload.message || "Password reset failed.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        password: "",
        otp: "",
        confirmPassword: "",
      }));

      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setStep("login");

      showSuccess(
        result.payload?.message || "Password reset successfully."
      );
    } catch {
      showError("Password reset failed. Please try again.");
    }
  };

  const backToLogin = () => {
    setStep("login");

    setForm((prev) => ({
      ...prev,
      password: "",
      otp: "",
      confirmPassword: "",
    }));

    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);

    clearMessages();
  };

  const inputClass = (field, extra = "") =>
    `w-full rounded-xl border bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
    } ${extra}`;

  const primaryButton =
    "flex w-full items-center justify-center cursor-pointer gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

  const renderFieldError = (field) =>
    errors[field] ? (
      <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
        <span aria-hidden="true">•</span>
        <span>{errors[field]}</span>
      </p>
    ) : null;

  const renderEmailInput = () => (
    <>
      <div className="relative">
        <Mail
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          className={inputClass("email")}
          type="email"
          name="email"
          value={form.email}
          onChange={updateField}
          placeholder="Enter your email address"
          autoComplete="email"
          maxLength={254}
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
      </div>

      {errors.email && (
        <div id="email-error">{renderFieldError("email")}</div>
      )}
    </>
  );

  const renderPasswordInput = (
    name,
    placeholder,
    visible,
    toggle,
    autoComplete = "current-password"
  ) => (
    <>
      <div className="relative">
        <LockKeyhole
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          className={inputClass(name, "pr-12")}
          type={visible ? "text" : "password"}
          name={name}
          value={form[name]}
          onChange={updateField}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={128}
          required
          aria-invalid={Boolean(errors[name])}
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-blue-600"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {renderFieldError(name)}
    </>
  );

  const titles = {
    login: {
      eyebrow: role === "admin" ? "ADMINISTRATOR ACCESS" : "DOCTOR PORTAL",
      title: role === "admin" ? "Welcome back" : "Welcome, Doctor",
      subtitle:
        role === "admin"
          ? "Sign in to manage your hospital operations."
          : "Sign in to manage your appointments and patients.",
    },
    forgot: {
      eyebrow: "ACCOUNT RECOVERY",
      title: "Forgot password?",
      subtitle:
        "Enter your registered admin email to receive a recovery OTP.",
    },
    verify: {
      eyebrow: "EMAIL VERIFICATION",
      title: "Verify your email",
      subtitle:
        "Enter the 6-digit code sent to your registered email address.",
    },
    reset: {
      eyebrow: "SECURE YOUR ACCOUNT",
      title: "Create new password",
      subtitle:
        "Choose a strong password for your administrator account.",
    },
  };

  const currentTitle = titles[step];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f8fc] px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_30px_100px_-35px_rgba(15,53,91,0.28)] lg:min-h-[680px] lg:grid-cols-[1.02fr_0.98fr]">
        {/* Left branding panel */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#082b52] via-[#104c83] to-[#087da3] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-12 top-32 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-cyan-300/10 blur-2xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <HeartPulse size={28} />
            </div>

            <div>
              <p className="text-xl font-extrabold tracking-tight">MediCare</p>
              <p className="text-xs font-medium tracking-[0.18em] text-blue-100">
                HOSPITAL MANAGEMENT
              </p>
            </div>
          </div>

          <div className="relative z-10 my-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-blue-50 backdrop-blur">
              <ShieldCheck size={15} />
              Secure healthcare workspace
            </div>

            <h1 className="max-w-lg text-4xl font-extrabold leading-[1.15] tracking-tight xl:text-5xl">
              Better care starts with{" "}
              <span className="text-cyan-200">better management.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
              One secure workspace for hospital administration, doctors,
              appointments and everyday patient care.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Centralized appointment management",
                "Secure role-based access",
                "A smoother experience for every patient",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-blue-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200">
                    <BadgeCheck size={15} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5 text-xs text-blue-100">
            <span>Designed for better healthcare</span>
            <span className="flex items-center gap-1.5">
              <Activity size={14} />
              Care · Trust · Security
            </span>
          </div>
        </section>

        {/* Login and recovery panel */}
        <section className="flex items-center justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <HeartPulse size={25} />
              </div>

              <div>
                <p className="text-lg font-extrabold text-slate-900">
                  MediCare
                </p>
                <p className="text-[10px] font-bold tracking-[0.15em] text-slate-500">
                  HOSPITAL MANAGEMENT
                </p>
              </div>
            </div>

            {step === "login" && (
              <div className="mb-8 rounded-2xl bg-slate-100 p-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => changeRole("admin")}
                    className={`flex items-center justify-center gap-2 rounded-xl cursor-pointer px-3 py-3 text-sm font-bold transition ${
                      role === "admin"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ShieldCheck size={17} />
                    Admin Login
                  </button>

                  <button
                    type="button"
                    onClick={() => changeRole("doctor")}
                    className={`flex items-center justify-center gap-2 cursor-pointer rounded-xl px-3 py-3 text-sm font-bold transition ${
                      role === "doctor"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Stethoscope size={17} />
                    Doctor Login
                  </button>
                </div>
              </div>
            )}

            {step !== "login" && (
              <button
                type="button"
                onClick={backToLogin}
                className="mb-7 inline-flex items-center gap-2 text-sm cursor-pointer font-semibold text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeft size={17} />
                Back to login
              </button>
            )}

            <div className="mb-7">
              <p className="mb-3 text-[11px] font-extrabold tracking-[0.18em] text-blue-600">
                {currentTitle.eyebrow}
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {currentTitle.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {currentTitle.subtitle}
              </p>
            </div>

            {step === "login" && (
              <form onSubmit={handleLogin} noValidate className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email address
                  </label>

                  <div id="login-email">
                    {renderEmailInput()}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="login-password"
                      className="text-sm font-bold text-slate-700"
                    >
                      Password
                    </label>

                    {role === "admin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrors({});
                          clearMessages();
                          setStep("forgot");
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div id="login-password">
                    {renderPasswordInput(
                      "password",
                      "Enter your password",
                      showPassword,
                      () => setShowPassword((prev) => !prev)
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButton}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in securely
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <ShieldCheck
                    className="mt-0.5 shrink-0 text-blue-600"
                    size={19}
                  />
                  <p className="text-xs leading-5 text-slate-600">
                    Your account is protected by role-based access. Use your
                    registered {role} credentials to continue.
                  </p>
                </div>
              </form>
            )}

            {step === "forgot" && (
              <form
                onSubmit={handleForgotPassword}
                noValidate
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Registered admin email
                  </label>
                  {renderEmailInput()}
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={primaryButton}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send recovery OTP
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "verify" && (
              <form
                onSubmit={handleVerifyOtp}
                noValidate
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    6-digit verification code
                  </label>

                  <input
                    className={inputClass(
                      "otp",
                      "pl-4 text-center text-xl font-extrabold tracking-[0.45em]"
                    )}
                    type="text"
                    name="otp"
                    value={form.otp}
                    onChange={updateField}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    aria-invalid={Boolean(errors.otp)}
                  />

                  {renderFieldError("otp")}

                  <p className="mt-2 text-xs text-slate-500">
                    Sent to{" "}
                    <span className="font-semibold text-slate-700">
                      {form.email}
                    </span>
                  </p>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={primaryButton}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendOtp}
                  className="w-full rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold cursor-pointer text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60"
                >
                  Resend OTP
                </button>

                <p className="text-center text-xs text-slate-500">
                  Your OTP expires after 1 minute.
                </p>
              </form>
            )}

            {step === "reset" && (
              <form
                onSubmit={handleResetPassword}
                noValidate
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    New password
                  </label>

                  {renderPasswordInput(
                    "password",
                    "Create a strong password",
                    showPassword,
                    () => setShowPassword((prev) => !prev),
                    "new-password"
                  )}

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Minimum 8 characters, including uppercase, lowercase, a
                    number and a special character.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Confirm new password
                  </label>

                  {renderPasswordInput(
                    "confirmPassword",
                    "Re-enter your new password",
                    showConfirmPassword,
                    () => setShowConfirmPassword((prev) => !prev),
                    "new-password"
                  )}
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={primaryButton}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      Reset password
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-9 border-t border-slate-100 pt-5 text-center">
              <p className="text-xs leading-5 text-slate-400">
                <LockKeyhole size={13} className="mr-1 inline-block" />
                Secure access · Hospital Management System
              </p>

              <p className="mt-2 text-[11px] text-slate-400">
                Authorized personnel only
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
