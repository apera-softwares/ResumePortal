"use client";

import React, { useEffect, useState } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "success" | "info" | "warning";
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("name") || "Candidate");
    // Generate dummy contextual notifications for the candidate
    setNotifications([
      {
        id: "1",
        title: "Welcome to Resume Portal!",
        message: "Your profile has been created. Start exploring career opportunities and upload your resume.",
        time: "Just now",
        type: "success",
        read: false,
      },
      {
        id: "2",
        title: "Complete Your Profile Information",
        message: "Make sure your contact information, education history, and skills list are fully updated.",
        time: "1 hour ago",
        type: "info",
        read: false,
      },
      {
        id: "3",
        title: "Real-time Skill Extraction Enabled",
        message: "You can upload files in PDF format. Our engine automatically parses details and calculates matching scores.",
        time: "2 hours ago",
        type: "success",
        read: true,
      },
    ]);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl shadow-xs gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">🔔 Notifications</h2>
          <p className="text-xs text-gray-500 mt-1">Hello, {name}. Review updates regarding your applications and profile status.</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/60 rounded-3xl overflow-hidden shadow-xs">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 flex gap-4 items-start transition-colors duration-200 ${
                  notif.read ? "bg-transparent" : "bg-blue-50/20 dark:bg-blue-950/10"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {notif.type === "success" && (
                    <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      ✓
                    </span>
                  )}
                  {notif.type === "info" && (
                    <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      ℹ
                    </span>
                  )}
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-xs font-bold ${notif.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-semibold">{notif.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-650" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-xs font-semibold">You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
