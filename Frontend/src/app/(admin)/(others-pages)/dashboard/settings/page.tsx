"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    userId: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile({
      name: localStorage.getItem("name") || "N/A",
      email: localStorage.getItem("email") || "N/A",
      role: localStorage.getItem("role") || "CANDIDATE",
      userId: localStorage.getItem("userId") || "N/A",
    });
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
      const res = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password updated successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to update password");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reset password due to network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">⚙ Settings</h2>
        <p className="text-xs text-gray-550 mt-1">Manage your account credentials, security configurations, and portal experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left pane - Account Info */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/60 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Information</h3>
          
          <div className="space-y-3">
            <div>
              <span className="block text-[10px] text-gray-450 uppercase font-semibold">User Role</span>
              <span className="text-xs font-bold text-gray-800 dark:text-white bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md inline-block mt-0.5">
                {profile.role}
              </span>
            </div>
            
            <div>
              <span className="block text-[10px] text-gray-450 uppercase font-semibold">Registered Email</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 break-all">{profile.email}</span>
            </div>

            <div>
              <span className="block text-[10px] text-gray-455 uppercase font-semibold">User ID</span>
              <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 break-all">{profile.userId}</span>
            </div>
          </div>
        </div>

        {/* Right pane - Password Form */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/60 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Update Account Security</h3>
          
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {loading ? "Updating password..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
