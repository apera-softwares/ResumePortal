"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { gsap } from "gsap";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll(".animate-item");
      gsap.fromTo(
        items,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.1,
        }
      );
    }
  }, []);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    let isValid = true;
    const tempErrors = { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" };

    if (!formData.firstName.trim()) {
      tempErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      tempErrors.lastName = "Last name is required";
      isValid = false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password.trim()) {
      tempErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long";
      isValid = false;
    }

    if (!formData.confirmPassword.trim()) {
      tempErrors.confirmPassword = "Confirm password is required";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const signupUrl = `${API_URL}/users/signup`;

    try {
      const response = await fetch(signupUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email,
          password: formData.password,
          role: "CANDIDATE",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Registration failed");
      }

      // Send OTP after successful signup
      await axios.post(`${API_URL}/otp/send`, { email: formData.email }).catch((err) => {
        console.error("Failed to send OTP", err);
      });

      toast.success("Account created! Please verify your email.");
      
      // Store temp email and redirect
      if (typeof window !== "undefined") {
        sessionStorage.setItem("tempEmail", formData.email);
      }
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex relative flex-col flex-1 lg:w-1/2 w-full px-4 sm:px-6 lg:px-8 justify-center py-12">
      <div className="w-full max-w-md mx-auto mb-6 animate-item">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-all hover:text-brand-500 hover:translate-x-[-4px] dark:text-gray-400 dark:hover:text-brand-400"
        >
          <ChevronLeftIcon />
          Back to Login
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/70 border border-gray-200/50 dark:border-white/[0.06] shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl p-6 sm:p-8 relative overflow-hidden animate-item">
          {/* Subtle light effects inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="mb-6 relative z-10 animate-item">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md tracking-tight">
              Create Candidate Account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join us to upload your resume and apply to jobs.
            </p>
          </div>

          <div className="relative z-10">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-item">
                  <div>
                    <Label>
                      First Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="John"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleOnChange}
                      required
                      className="transition-all focus:border-brand-500 dark:focus:border-brand-500"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-rose-500 mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Last Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="Doe"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleOnChange}
                      required
                      className="transition-all focus:border-brand-500 dark:focus:border-brand-500"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-rose-500 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="animate-item">
                  <Label>
                    Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="john.doe@example.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleOnChange}
                    required
                    className="transition-all focus:border-brand-500 dark:focus:border-brand-500"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="animate-item">
                  <Label>
                    Password <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      name="password"
                      value={formData.password}
                      onChange={handleOnChange}
                      required
                      className="transition-all focus:border-brand-500 dark:focus:border-brand-500"
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
                  {errors.password && (
                    <p className="text-xs text-rose-500 mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="animate-item">
                  <Label>
                    Confirm Password <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleOnChange}
                      required
                      className="transition-all focus:border-brand-500 dark:focus:border-brand-500"
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
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-2 animate-item">
                  <Button className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all duration-300 py-3" size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </div>

                <div className="text-center pt-2 animate-item">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-semibold transition-colors"
                    >
                      Log In
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
