'use client';

import React, { useEffect, useState, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import toast from "react-hot-toast";
import { Trash, SquarePen } from "lucide-react";
import Select from "react-select";
import { useTheme } from "@/context/ThemeContext";

interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  mobile?: string;
  companyName?: string;
}

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

const ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "HR", label: "HR" },
  { value: "CLIENT", label: "Client" },
];

export default function UsersTable({
  callApi,
  setCallApi,
}: {
  callApi: boolean;
  setCallApi?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<User[]>([]);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    companyName: "",
    role: "",
    password: "",
  });

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<{ value: string; label: string } | null>({ value: "ALL", label: "All Roles" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 8;

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const warningTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    let fetchUrl = `${API_URL}/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;

    if (debouncedSearch.trim()) {
      fetchUrl += `&search=${encodeURIComponent(debouncedSearch)}`;
    }
    if (selectedRole && selectedRole.value !== "ALL") {
      fetchUrl += `&role=${encodeURIComponent(selectedRole.value)}`;
    }

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }
      const userData = await response.json();
      setData(userData.data || []);
      setTotalCount(userData.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const executeDelete = async (userId: string) => {
    const token = localStorage.getItem("token");
    const idUrl = `${API_URL}/users/${userId}`;
    try {
      const response = await fetch(idUrl, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setData(prevData => prevData.filter((user) => user.id !== userId));
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const handleForm = (user: User) => {
    setSelectedUser(user);
    const parts = (user.name || "").trim().split(/\s+/);
    const fName = user.firstName || parts[0] || "";
    const lName = user.lastName || parts.slice(1).join(" ") || "";

    setFormData({
      firstName: fName,
      lastName: lName,
      email: user.email,
      mobile: user.mobile || "",
      companyName: user.companyName || "",
      role: user.role,
      password: "",
    });
    setShowMobileWarning(false);
    openModal();
  };

  const handleCreateOpen = () => {
    setSelectedUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      companyName: "",
      role: "",
      password: "",
    });
    setShowMobileWarning(false);
    openModal();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length > 10) {
        setShowMobileWarning(true);
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        warningTimeoutRef.current = setTimeout(() => {
          setShowMobileWarning(false);
        }, 2000);
      } else {
        setShowMobileWarning(false);
      }
      setFormData(prev => ({ ...prev, [name]: cleaned.slice(0, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveUser = async () => {
    if (!formData.firstName || !formData.email || !formData.mobile) {
      toast.error("First Name, Email Address, and Mobile are required.");
      return;
    }

    if (formData.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.");
      return;
    }

    const token = localStorage.getItem("token");

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      mobile: formData.mobile,
      companyName: formData.role === "CLIENT" ? formData.companyName : undefined,
      role: formData.role,
    };

    if (selectedUser) {
      const updateUrl = `${API_URL}/users/${selectedUser.id}`;
      try {
        const response = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to update user");
        }
        toast.success("User updated successfully!");
        closeModal();
        fetchData();
        if (setCallApi) {
          setCallApi(prev => !prev);
        }
      } catch (error) {
        console.error("Error updating user:", error);
        toast.error("Failed to update user.");
      }
    } else {
      const createUrl = `${API_URL}/users/create`;
      try {
        const response = await fetch(createUrl, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...payload,
            password: formData.password || "Password123",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create user");
        }
        toast.success("User created successfully!");
        closeModal();
        fetchData();
        if (setCallApi) {
          setCallApi(prev => !prev);
        }
      } catch (error) {
        console.error("Error creating user:", error);
        toast.error("Failed to create user.");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [callApi, currentPage, debouncedSearch, selectedRole]);

  // Dynamic initial-based avatars
  const getAvatarStyle = (name: string) => {
    const gradients = [
      "from-blue-600 to-blue-700 text-white",
      "from-gray-700 to-gray-800 text-white dark:from-gray-800 dark:to-gray-900",
      "from-slate-800 to-slate-950 text-white border border-gray-700/50 dark:border-gray-800",
      "from-blue-505 to-indigo-600 text-white",
      "from-zinc-700 to-zinc-900 text-white",
      "from-blue-700 to-slate-900 text-white",
    ];
    let hash = 0;
    const cleanName = name || "User";
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradient = gradients[Math.abs(hash) % gradients.length];
    const initial = cleanName.charAt(0).toUpperCase();
    return { gradient, initial };
  };

  const getRoleBadge = (role: string) => {
    const r = role?.toUpperCase();
    if (r === 'ADMIN') {
      return 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30';
    }
    if (r === 'HR') {
      return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
    }
    if (r === 'CANDIDATE') {
      return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
    }
    return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: state.isFocused
        ? '#2563eb'
        : isDark
          ? '#374151'
          : '#d1d5db',
      color: isDark ? '#ffffff' : '#111827',
      borderRadius: '0.5rem',
      padding: '0 4px',
      fontSize: '0.875rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
      minHeight: '38px',
      height: '38px',
      '&:hover': {
        borderColor: isDark ? '#4b5563' : '#9ca3af',
      },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '0 8px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: '36px',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderRadius: '0.5rem',
      border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#111827' : '#ffffff',
      padding: '4px',
      borderRadius: '0.5rem',
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected
        ? '#2563eb'
        : isFocused
        ? (isDark ? '#1f2937' : '#f3f4f6')
        : (isDark ? '#111827' : '#ffffff'),
      color: isSelected ? '#ffffff' : (isDark ? '#f9fafb' : '#111827'),
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: '0.375rem',
      '&:active': {
        backgroundColor: isSelected ? '#2563eb' : (isDark ? '#1f2937' : '#e5e7eb'),
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDark ? '#f9fafb' : '#111827',
    }),
    input: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#111827',
    }),
  };

  return (
    <div className="min-h-[70vh] flex flex-col gap-6 bg-transparent">
      {/* Search, Filter and Create User in same line */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-3xl shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Users</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage all user accounts and system access roles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Dropdown */}
          <div className="w-full sm:w-48">
            <Select
              options={ROLE_OPTIONS}
              value={selectedRole}
              onChange={(selected: any) => {
                setSelectedRole(selected);
                setCurrentPage(1);
              }}
              styles={selectStyles}
              placeholder="Filter by Role"
              isSearchable
            />
          </div>

          {/* Create User Button */}
          <button
            onClick={handleCreateOpen}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer shrink-0"
          >
            <span>+</span> Create User
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex-1 flex flex-col justify-between">
        <div className="max-w-full overflow-x-auto flex-1">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow className="h-14">
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                    Name
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                    Roles
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                    Email
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data && data.length > 0 ? (
                  data.map((user: any) => {
                    const avatar = getAvatarStyle(user.name);
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all border-b border-gray-200/40 dark:border-gray-800/60">
                        {/* User Info / Avatar */}
                        <TableCell className="px-6 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold bg-gradient-to-br ${avatar.gradient}`}>
                              {avatar.initial}
                            </div>
                            <div>
                              <span className="block font-semibold text-gray-900 dark:text-white">
                                {user.name}
                              </span>
                              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                                {user.role === 'CLIENT' && user.companyName ? user.companyName : `${user.role?.toLowerCase()} Account`}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* User Role */}
                        <TableCell className="px-6 py-4 text-start">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                          {user.email}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-3">
                            {/* Edit Tooltip Wrapper */}
                            <div className="relative group">
                              <button
                                onClick={() => handleForm(user)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                              >
                                <SquarePen className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                Edit user
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-gray-800" />
                              </div>
                            </div>

                            {/* Delete Tooltip Wrapper */}
                            <div className="relative group">
                              <button
                                onClick={() => setDeleteConfirmId(user.id)}
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-rose-600 dark:text-rose-400 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-all shadow-xs cursor-pointer"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                Delete user
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-rose-600" />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No users found.
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Premium Pagination Bar */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row justify-end items-center border-t border-gray-200/40 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>

              {(() => {
                const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
                const pages: (number | string)[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("... ");
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (currentPage < totalPages - 2) pages.push(" ...");
                  pages.push(totalPages);
                }
                return pages.map((page, idx) => {
                  if (typeof page === "string") {
                    return (
                      <span key={`ellipse-${idx}`} className="text-gray-400 dark:text-gray-600 px-1.5 font-semibold text-xs select-none">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${currentPage === page
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalCount / ITEMS_PER_PAGE)))}
                disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {selectedUser ? "Edit User" : "Create HR/Client"}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Modify details and credentials for this portal account.
          </p>

          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
            {/* Role Dropdown */}
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                required
              >
                <option value="">Select Role</option>
                <option value="HR">HR</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>First Name <span className="text-rose-500">*</span></Label>
                <Input
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Last Name</Label>
                <Input
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email and Mobile Fields */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Email Address <span className="text-rose-500">*</span></Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Mobile <span className="text-rose-500">*</span></Label>
                <Input
                  name="mobile"
                  type="text"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter 10-digit number"
                  required
                />
                {showMobileWarning && (
                  <span className="text-xs font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-pulse">
                    ⚠️ Enter only 10 digits
                  </span>
                )}
              </div>
            </div>

            {/* Company Name (for CLIENT role) */}
            {formData.role === "CLIENT" && (
              <div className="flex flex-col gap-1.5">
                <Label>Company Name</Label>
                <Input
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-xs transition-all"
              >
                Save User
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDeleteConfirmId(null)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-center align-middle shadow-2xl transition-all border border-gray-100 dark:border-gray-800 scale-100 opacity-100 duration-300">
            {/* Warning Circle Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 mb-4">
              <Trash className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-6 mb-2">
              Are you sure?
            </h3>

            {/* Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Do you really want to delete this user? This action is permanent and cannot be undone.
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  await executeDelete(id);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
