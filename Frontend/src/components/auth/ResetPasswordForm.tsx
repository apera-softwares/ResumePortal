"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

export default function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"SEND_OTP" | "VERIFY_OTP" | "SET_NEW_PASSWORD">("SEND_OTP");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send OTP");
      }

      toast.success("OTP sent to your email!");
      setStep("VERIFY_OTP");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return toast.error("Please enter the OTP");

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid OTP");
      }

      toast.success("OTP verified! Please set your new password.");
      setStep("SET_NEW_PASSWORD");
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return toast.error("Please enter your new password");
    if (newPassword.length < 12 || newPassword.length > 16) {
      return toast.error("Password must be between 12 and 16 characters long");
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSymbol) {
      return toast.error("Password must contain a mix of letters, numbers, and symbols");
    }
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      toast.success("Password reset successfully!");
      window.location.href = "/login";
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex relative flex-col flex-1 lg:w-1/2 w-full justify-center py-12">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-150/80 dark:border-gray-800/80 shadow-xl rounded-3xl p-6 sm:p-8">
          
          {/* Key Icon Badge */}
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-950 dark:bg-gray-800 text-white rounded-2xl flex items-center justify-center shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          {/* Header Title & Subtitle */}
          <div className="mb-6 text-center">
            <h1 className="mb-1 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md">
              {step === "SEND_OTP"
                ? "Reset Password"
                : step === "VERIFY_OTP"
                ? "Verify Code"
                : "Set New Password"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {step === "SEND_OTP"
                ? "Enter your email to receive a reset code"
                : step === "VERIFY_OTP"
                ? "Enter the 6-digit code sent to your email"
                : "Choose a strong password for your account"}
            </p>
          </div>

          <div>
            {/* STEP 1: SEND RESET CODE */}
            {step === "SEND_OTP" && (
              <form onSubmit={handleSendOtp}>
                <div className="space-y-5">
                  <div>
                    <Label>Email</Label>
                    <Input
                      placeholder="name@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Button className="w-full rounded-xl bg-black hover:bg-gray-800 text-white font-semibold py-3" size="sm" type="submit" disabled={isLoading}>
                      {isLoading ? "Sending Code..." : "Send Reset Code"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY CODE */}
            {step === "VERIFY_OTP" && (
              <form onSubmit={handleVerifyOtp}>
                <div className="space-y-5">
                  <div>
                    <Label>Verification Code (OTP)</Label>
                    <Input
                      placeholder="123456"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Button className="w-full rounded-xl bg-black hover:bg-gray-800 text-white font-semibold py-3" size="sm" type="submit" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>
                  </div>
                  <div className="text-center pt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Didn't receive the code?{" "}
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-semibold"
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: SET NEW PASSWORD */}
            {step === "SET_NEW_PASSWORD" && (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-5">
                  <div>
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="12-16 characters (e.g. Secret123!@#)"
                        maxLength={16}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 p-1 hover:text-brand-500 transition-colors"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Must be 12-16 characters with letters, numbers & symbols.
                    </p>
                  </div>

                  <div>
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Button className="w-full rounded-xl bg-black hover:bg-gray-800 text-white font-semibold py-3" size="sm" type="submit" disabled={isLoading}>
                      {isLoading ? "Updating Password..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Back to Login Link (Centered at bottom of card) */}
            <div className="mt-6 text-center border-t border-gray-100 dark:border-gray-800/60 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <span>&larr;</span> Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
