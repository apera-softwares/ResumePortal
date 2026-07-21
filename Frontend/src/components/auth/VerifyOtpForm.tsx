"use client";

import React, { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@/icons";
import Button from "@/components/ui/button/Button";

// Environment setup
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

// Zod Schema
const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must only contain numbers"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

export default function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // We'll look for an email in the query params first, or fallback to localStorage
  const [email, setEmail] = useState<string | null>(null);

  // Resend Timer State
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Array to map 6 input refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  useEffect(() => {
    // Get email from URL query param or localStorage
    const queryEmail = searchParams?.get("email");
    const storedEmail = typeof window !== "undefined" ? sessionStorage.getItem("tempEmail") : null;

    const targetEmail = queryEmail || storedEmail;
    if (targetEmail) {
      setEmail(targetEmail);
    } else {
      toast.error("No email found. Please login or signup again.");
      router.push("/login");
    }
  }, [searchParams, router]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: OtpFormValues) => {
    if (!email) return;

    setIsVerifying(true);
    try {
      // Use Axios as requested
      const response = await axios.post(`${API_URL}/otp/verify`, {
        email,
        otp: data.otp,
      });

      // Show success
      toast.success(response.data.message || "OTP verified successfully!");

      if (typeof window !== "undefined") {
        const userData = response.data.data;

        let tokenToUse = "";
        if (userData && userData.token) {
          tokenToUse = userData.token;
          localStorage.setItem("token", userData.token);
          
          // Save complete user object
          const userObj = {
            id: userData.id,
            name: userData.name,
            email: userData.email || email,
            role: userData.role,
          };
          localStorage.setItem("user", JSON.stringify(userObj));
        } else {
          // Finalize login (if user came from Login and backend didn't send token)
          const tempRole = localStorage.getItem("tempRole");
          const tempName = localStorage.getItem("tempName");
          const tempUserId = localStorage.getItem("tempUserId");
          const tempToken = localStorage.getItem("tempToken");
          const existingToken = localStorage.getItem("token");
          tokenToUse = tempToken || existingToken || "";
          
          if (tempToken && !existingToken) {
            localStorage.setItem("token", tempToken);
          }

          if (tempRole) {
            localStorage.removeItem("tempRole");
          }
          if (tempName) {
            localStorage.removeItem("tempName");
          }
          if (tempUserId) {
            localStorage.removeItem("tempUserId");
          }
          
          // Save complete user object
          const userObj = {
            id: tempUserId || "",
            name: tempName || "",
            email: email || "",
            role: tempRole || "",
          };
          localStorage.setItem("user", JSON.stringify(userObj));
        }

        if (tokenToUse) {
          document.cookie = `token=${tokenToUse}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }

        sessionStorage.removeItem("tempEmail");
        localStorage.removeItem("tempToken");
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Verification failed:", error);
      const errMessage = error.response?.data?.message || "Invalid or expired OTP. Please try again.";
      toast.error(errMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      await axios.post(`${API_URL}/otp/send`, { email });
      toast.success("A new OTP has been sent to your email!");
      setTimer(60);
      setCanResend(false);
      // Reset inputs
      setValue("otp", "");
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    // allow only numbers
    if (!/^\d*$/.test(value)) return;

    const currentOtpArray = getValues("otp").split("").concat(Array(6).fill("")).slice(0, 6);
    currentOtpArray[index] = value.substring(value.length - 1); // Only take last character

    const newOtp = currentOtpArray.join("");
    setValue("otp", newOtp, { shouldValidate: true });

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace and keyboard events
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const currentOtpArray = getValues("otp").split("").concat(Array(6).fill("")).slice(0, 6);

      if (currentOtpArray[index] !== "") {
        // Current input has value -> clear it
        currentOtpArray[index] = "";
        setValue("otp", currentOtpArray.join(""), { shouldValidate: true });
      } else if (index > 0) {
        // Current input is empty -> clear previous and focus previous
        currentOtpArray[index - 1] = "";
        setValue("otp", currentOtpArray.join(""), { shouldValidate: true });
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedData) {
      setValue("otp", pastedData, { shouldValidate: true });

      // Focus the right-most available input
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex relative flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to login
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-150/80 dark:border-gray-800/80 shadow-xl rounded-3xl p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md">
              Verify your Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              An OTP has been sent to <br />
              <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3">
                {/* 6 Digit Input Fields */}
                <Controller
                  name="otp"
                  control={control}
                  render={({ field }) => (
                    <>
                      {Array.from({ length: 6 }).map((_, index) => {
                        const digit = field.value.split("")[index] || "";
                        return (
                          <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="\d{1}"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold bg-transparent border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${errors.otp
                              ? "border-rose-500 text-rose-500 dark:border-rose-500"
                              : "border-gray-300 text-gray-900 dark:border-gray-700 dark:text-white dark:focus:border-brand-500"
                              }`}
                          />
                        );
                      })}
                    </>
                  )}
                />
              </div>

              {errors.otp && (
                <p className="text-xs text-center text-rose-500 font-medium">
                  {errors.otp.message}
                </p>
              )}

              <div>
                <Button
                  className="w-full rounded-xl"
                  size="sm"
                  type="submit"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white animate-infinite" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isResending}
                    className={`font-semibold transition-colors ${canResend && !isResending
                      ? "text-brand-500 hover:text-brand-600 dark:text-brand-400 cursor-pointer"
                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      }`}
                  >
                    {isResending ? "Sending..." : "Resend OTP"}
                  </button>
                </p>
                {!canResend && timer > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Wait {timer} seconds before resending
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
