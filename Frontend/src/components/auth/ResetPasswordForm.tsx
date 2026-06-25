"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"SEND_OTP" | "VERIFY_OTP">("SEND_OTP");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send OTP");
      }

      toast.success("OTP sent to your email!");
      setStep("VERIFY_OTP");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid OTP");
      }

      toast.success("OTP verified successfully!");
      // Here you would typically show a "New Password" form, 
      // but for now we'll just redirect to login
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="mb-6">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === "SEND_OTP"
                ? "Enter your email to receive a verification code."
                : "Enter the 6-digit code sent to your email."}
            </p>
          </div>
          <div>
            {step === "SEND_OTP" ? (
              <form onSubmit={handleSendOtp}>
                <div className="space-y-6">
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      placeholder="info@gmail.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Button className="w-full rounded-xl" size="sm" type="submit" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="space-y-6">
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
                    <Button className="w-full rounded-xl" size="sm" type="submit" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Didn't receive the code?{" "}
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
