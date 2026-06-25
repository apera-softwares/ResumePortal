import React from "react";
import VerifyOtpForm from "@/components/auth/VerifyOtpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify OTP",
  description: "Verify your email address using the one-time password.",
};

export default function VerifyOtpPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpForm />
    </React.Suspense>
  );
}
