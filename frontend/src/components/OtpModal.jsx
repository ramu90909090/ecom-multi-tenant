import React, { useState, useEffect, useRef } from "react";
import { KeyRound, RefreshCw, X, ShieldCheck, AlertCircle } from "lucide-react";

export default function OtpModal({
  isOpen = true,
  onClose,
  email,
  purpose = "registration",
  onVerify,
  onVerified,
  onResend
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(180); // 3-minute countdown window
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  // Auto focus first input on open
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 3-Minute Live Countdown Timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle Input Changes & Auto Advance
  const handleInputChange = (index, value) => {
    // Only allow numbers
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newOtp = [...otp];

    if (cleanVal.length > 1) {
      // User pasted or typed multiple digits
      const digits = cleanVal.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || "";
      }
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      if (inputRefs.current[nextFocus]) {
        inputRefs.current[nextFocus].focus();
      }
      return;
    }

    newOtp[index] = cleanVal;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (cleanVal !== "" && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle Backspace Key
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
        }
      }
    }
  };

  // Handle Paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (!pasteData) return;

    const digits = pasteData.slice(0, 6).split("");
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] || "";
    }
    setOtp(newOtp);
    const focusIdx = Math.min(digits.length, 5);
    if (inputRefs.current[focusIdx]) {
      inputRefs.current[focusIdx].focus();
    }
  };

  // Submit / Confirm Verification
  const handleConfirmSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join("").trim();

    if (fullOtp.length !== 6) {
      setError("Kripya poora 6-digit OTP enter karein.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Support both prop formats (onVerify or onVerified)
      if (typeof onVerify === "function") {
        await onVerify(fullOtp);
      } else if (typeof onVerified === "function") {
        await onVerified(fullOtp);
      } else {
        throw new Error("Verification handler missing!");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "OTP verification fail ho gayi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Resend Trigger
  const handleTriggerResend = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      if (typeof onResend === "function") {
        await onResend();
      }
      setTimer(180); // Reset timer to 3 minutes
      setOtp(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "OTP resend fail ho gaya.");
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
          <KeyRound className="w-7 h-7" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Enter Verification Code
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          6-digit OTP code humne aapke email <b className="text-slate-800">{email}</b> par bhej diya hai.
        </p>

        {/* Error Message Display */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-Digit PIN Boxes */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 my-6" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-2xl border transition-all duration-200 outline-none ${
                digit
                  ? "border-pink-500 bg-pink-50/30 text-slate-900 ring-2 ring-pink-500/20 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10"
              }`}
            />
          ))}
        </div>

        {/* Timer & Resend Option */}
        <div className="flex items-center justify-between text-xs font-bold mb-6 px-1">
          <div className="text-slate-500">
            Time Left:{" "}
            <span className={timer < 30 ? "text-rose-600 font-black animate-pulse" : "text-violet-600 font-black"}>
              {formatTimer()}
            </span>
          </div>

          <button
            type="button"
            disabled={timer > 0 || isResending}
            onClick={handleTriggerResend}
            className={`flex items-center space-x-1.5 transition ${
              timer === 0
                ? "text-pink-600 hover:text-violet-600 cursor-pointer underline"
                : "text-slate-300 cursor-not-allowed"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            <span>{isResending ? "Sending..." : "Resend Code"}</span>
          </button>
        </div>

        {/* Confirm / Verify Button */}
        <button
          type="button"
          disabled={!isOtpComplete || isSubmitting}
          onClick={handleConfirmSubmit}
          className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
            isOtpComplete && !isSubmitting
              ? "bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 shadow-pink-500/30 active:scale-95 cursor-pointer"
              : "bg-slate-300 shadow-none cursor-not-allowed opacity-60"
          }`}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Confirm</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}