"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { gsap } from "gsap";

import { loginUser } from "@/services/auth.api";

export default function LogInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.1,
        }
      );
    }
  }, []);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    let isValid = true;
    const tempErrors = { email: "", password: "" };

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      tempErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const data = await loginUser(formData);

      toast.success("Login successful! Redirecting to dashboard...");

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.data.token);
        const maxAgeStr = isChecked ? `max-age=${7 * 24 * 60 * 60}; ` : "";
        document.cookie = `token=${data.data.token}; path=/; ${maxAgeStr}SameSite=Lax`;
        
        // Save complete user object to localStorage
        const userObj = {
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        if (data.data.name) localStorage.setItem("name", data.data.name);
        if (data.data.role) localStorage.setItem("role", data.data.role);
        if (data.data.email) localStorage.setItem("email", data.data.email);
        if (data.data.id) localStorage.setItem("userId", data.data.id);

        window.dispatchEvent(new CustomEvent("user-updated", { detail: userObj }));
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error during login:", error);
      toast.error(error.message || "Failed to log in. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex relative flex-col flex-1 lg:w-1/2 w-full px-4 sm:px-6 lg:px-8 justify-center py-12">
      <div className="w-full max-w-md mx-auto mb-6 animate-item">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-all hover:text-brand-500 hover:translate-x-[-4px] dark:text-gray-400 dark:hover:text-brand-400"
        >
          <ChevronLeftIcon />
          Back to home
        </Link>
      </div>
      <div className="w-full max-w-md mx-auto">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/70 border border-gray-200/50 dark:border-white/[0.06] shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl p-6 sm:p-8 relative overflow-hidden animate-item">
          {/* Subtle light effects inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="mb-8 relative z-10 animate-item">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md tracking-tight">
              Log In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to Log in!
            </p>
          </div>
          <div className="relative z-10">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="animate-item">
                  <Label>
                    Email <span className="text-rose-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleOnChange}
                    error={!!errors.email}
                    className="transition-all focus:border-brand-500 dark:focus:border-brand-500"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="animate-item">
                  <Label>
                    Password <span className="text-rose-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password"
                      value={formData.password}
                      onChange={handleOnChange}
                      error={!!errors.password}
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
                <div className="flex items-center justify-between animate-item">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span
                      onClick={() => setIsChecked(!isChecked)}
                      className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400 cursor-pointer select-none"
                    >
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="animate-item pt-2">
                  <Button className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all duration-300 py-3" size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </div>

                <div className="text-center pt-2 animate-item">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-semibold transition-colors"
                    >
                      Sign Up
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
