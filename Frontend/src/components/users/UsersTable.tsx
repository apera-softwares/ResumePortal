'use client';

import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import toast from "react-hot-toast";
import { Trash, SquarePen } from "lucide-react";

interface User {
  id: string;
  name: string;
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

export default function UsersTable({ callApi }: { callApi: boolean }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [data, setData] = useState<User[]>([]);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 8;

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const fetchUrl = `${API_URL}/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;

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
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    openModal();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    const updatedUsers = data.map((user) =>
      user.email === selectedUser.email
        ? { ...user, ...formData }
        : user
    );

    setData(updatedUsers);
    closeModal();
    toast.success("User updated successfully!");
  };

  useEffect(() => {
    fetchData();
  }, [callApi, currentPage]);

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

  return (
    <div className="min-h-[70vh] flex flex-col justify-between bg-transparent">
      <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex-1 flex flex-col justify-between">
        <div className="max-w-full overflow-x-auto flex-1">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow className="h-14">
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                    User Details
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                    User Role
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                    Email Address
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
                                {user.role?.toLowerCase()} Account
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
                                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-205 hover:bg-gray-55 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                              >
                                <SquarePen className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                edit user
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-gray-800" />
                              </div>
                            </div>

                            {/* Delete Tooltip Wrapper */}
                            <div className="relative group">
                              <button
                                onClick={() => setDeleteConfirmId(user.id)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-rose-400 hover:bg-gray-55 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                delete user
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
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-55 dark:hover:bg-gray-800"
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
            Edit User Information
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
                <option value="ADMIN">Admin</option>
                <option value="CANDIDATE">Candidate</option>
              </select>
            </div>

            {/* Name and Email Fields */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Email Address</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

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
