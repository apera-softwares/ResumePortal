"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "@/context/ThemeContext";
import { useFont, AVAILABLE_FONTS } from "@/context/FontContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "billing">("preferences");
  
  // User profile state
  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
    mobile: "",
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);

  const { theme, setTheme } = useTheme();
  const { currentFont, changeFont } = useFont();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

  // Load profile from local storage and backend if needed
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      toast.error("Access denied. Settings are only accessible by Administrators.");
      router.replace("/dashboard");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setProfile({
          id: parsed.id || "",
          name: parsed.name || "",
          email: parsed.email || "",
          role: parsed.role || "USER",
          mobile: "",
        });
        
        // Split name into first and last
        const nameParts = (parsed.name || "").split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
      } catch (e) {
        console.error("Failed to parse user object from localStorage", e);
      }
    }
    
    // Also fetch latest profile details from backend to get phone number if available
    const fetchLatestProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          const { user, candidate } = result.data;
          if (user) {
            const nameParts = (user.name || "").split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setProfile((prev) => ({
              ...prev,
              name: user.name || "",
              email: user.email || "",
            }));
          }
          if (candidate) {
            setMobile(candidate.mobile || "");
            setProfile((prev) => ({
              ...prev,
              mobile: candidate.mobile || "",
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching latest profile:", err);
      }
    };
    
    fetchLatestProfile();
  }, [API_URL]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading("Saving profile changes...");

    try {
      const token = localStorage.getItem("token");
      const fullName = `${firstName} ${lastName}`.trim();
      
      const payload: any = {
        name: fullName,
      };

      // If user is a candidate, we can also update their phone/mobile
      if (profile.role === "CANDIDATE" || profile.role === "USER") {
        payload.candidate = {
          mobile: mobile,
        };
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.dismiss(saveToast);
        toast.success("Profile updated successfully!");
        
        // Sync user object in localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.name = fullName;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        
        setProfile((prev) => ({
          ...prev,
          name: fullName,
        }));
      } else {
        const errData = await response.json();
        toast.dismiss(saveToast);
        toast.error(errData.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.dismiss(saveToast);
      toast.error("An error occurred while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title & Description */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          Manage your personal account, system preferences, and subscription options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: NAVIGATION LIST */}
        <div className="lg:col-span-3 space-y-2">
          {/* My Profile Tab */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left flex items-center gap-3.5 p-4 rounded-xl transition-all ${
              activeTab === "profile"
                ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-md"
                : "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <div className="font-semibold text-sm">My Profile</div>
              <div className={`text-[10px] ${activeTab === "profile" ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"} mt-0.5`}>
                Personal info & details
              </div>
            </div>
          </button>

          {/* Preferences Tab */}
          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full text-left flex items-center gap-3.5 p-4 rounded-xl transition-all ${
              activeTab === "preferences"
                ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-md"
                : "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <div className="font-semibold text-sm">Preferences</div>
              <div className={`text-[10px] ${activeTab === "preferences" ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"} mt-0.5`}>
                Theme & typography
              </div>
            </div>
          </button>

          {/* Plans & Billing Tab */}
          <button
            onClick={() => setActiveTab("billing")}
            className={`w-full text-left flex items-center gap-3.5 p-4 rounded-xl transition-all ${
              activeTab === "billing"
                ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-md"
                : "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div>
              <div className="font-semibold text-sm">Plans & Billing</div>
              <div className={`text-[10px] ${activeTab === "billing" ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"} mt-0.5`}>
                Manage subscriptions
              </div>
            </div>
          </button>
        </div>

        {/* RIGHT COLUMN: CONTENT PANELS */}
        <div className="lg:col-span-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* TAB 1: PREFERENCES (THEME & TYPOGRAPHY) */}
          {activeTab === "preferences" && (
            <div className="space-y-10">
              {/* APPEARANCE SECTION */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choose between a light or dark aesthetic for your workspace interface.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Light Mode Card */}
                  <div
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer group flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                      theme === "light"
                        ? "border-gray-950 bg-white dark:bg-gray-950/20"
                        : "border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m14.072-4.072l-.707.707M6.343 17.657l-.707.707m2.122-14.222l.707.707m9.9 9.9l.707.707M10 12a2 2 0 114 0 2 2 0 01-4 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white">Light Mode</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Crisp, high-contrast, clean UI suited for bright workspaces.
                          </div>
                        </div>
                      </div>
                      {/* Checkmark Indicator */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        theme === "light"
                          ? "bg-gray-950 border-gray-950 text-white"
                          : "border-gray-300 dark:border-gray-700"
                      }`}>
                        {theme === "light" && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Mock Light UI Screen */}
                    <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-200/60 dark:border-gray-800/60 rounded-xl p-3.5 space-y-2">
                      <div className="w-1/3 h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                      <div className="w-5/6 h-1.5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                  </div>

                  {/* Dark Mode Card */}
                  <div
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer group flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                      theme === "dark"
                        ? "border-gray-950 dark:border-white bg-white dark:bg-gray-950/20"
                        : "border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white">Dark Mode</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Easy on the eyes, sleek, high-end, and power-efficient.
                          </div>
                        </div>
                      </div>
                      {/* Checkmark Indicator */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        theme === "dark"
                          ? "bg-gray-950 dark:bg-white border-gray-950 dark:border-white text-white dark:text-gray-950"
                          : "border-gray-300 dark:border-gray-700"
                      }`}>
                        {theme === "dark" && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Mock Dark UI Screen */}
                    <div className="bg-gray-950 dark:bg-gray-950 border border-gray-850 dark:border-gray-800/80 rounded-xl p-3.5 space-y-2">
                      <div className="w-1/3 h-2 bg-gray-800 dark:bg-gray-700 rounded"></div>
                      <div className="w-full h-1.5 bg-gray-900 dark:bg-gray-800 rounded"></div>
                      <div className="w-5/6 h-1.5 bg-gray-900 dark:bg-gray-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TYPOGRAPHY SECTION */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Typography</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Select the font style to render text and labels across your workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {AVAILABLE_FONTS.map((f) => {
                    const isActive = currentFont.name === f.name;
                    return (
                      <div
                        key={f.name}
                        onClick={() => changeFont(f.name)}
                        className={`cursor-pointer flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isActive
                            ? "border-gray-950 dark:border-white bg-gray-50/50 dark:bg-gray-950/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white/30 dark:bg-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center font-semibold text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            Aa
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {f.name}
                          </span>
                        </div>

                        {isActive && (
                          <span className="text-[9px] font-bold tracking-wider text-gray-900 dark:text-gray-100 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">My Profile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Update your contact details and basic information.
                </p>
              </div>

              {/* Avatar, Status & Date */}
              <div className="flex items-center gap-5 p-5 bg-gray-50 dark:bg-gray-950/40 rounded-2xl border border-gray-200/50 dark:border-gray-800/40">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-2xl font-bold">
                  {getInitials(profile.name)}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                    {profile.name || "User Name"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Status: Active
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Joined {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-950 dark:focus:ring-white/40"
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-950 dark:focus:ring-white/40"
                      required
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-800/80 rounded-xl text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Not specified (Managed by Workspace)"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-950 dark:focus:ring-white/40"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-gray-950 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 font-semibold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PLANS & BILLING */}
          {activeTab === "billing" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Plans & Billing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your subscription plans, billing periods, and invoices.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="p-6 bg-gray-50 dark:bg-gray-950/40 border border-gray-200/50 dark:border-gray-800/40 rounded-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded">
                      Current Plan
                    </span>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-2.5">
                      Enterprise Suite Pro
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Full access to all candidate profiles, automated parsing, and custom resume layouts.
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">$149<span className="text-sm font-normal text-gray-500">/mo</span></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Billed annually ($1,788)</div>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-800" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Your subscription will automatically renew on April 23, 2027
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-transparent hover:bg-gray-105 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold transition-all">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
