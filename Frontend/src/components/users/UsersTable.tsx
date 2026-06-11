'use client';

import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import toast from "react-hot-toast";

interface User {
  id: number;
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

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const fetchUrl = `${API_URL}/users`;

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
      setData(userData.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const executeDelete = async (userId: number) => {
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
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const handleDelete = (userId: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-medium text-gray-900">
          Are you sure you want to delete this user?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await executeDelete(userId);
            }}
            className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: "top-center",
    });
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
  }, [callApi]);

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
    return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
      <div className="max-w-full overflow-x-auto">
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
                    <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all border-b border-gray-100 dark:border-gray-850">
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
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleForm(user)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all duration-200"
                          >
                            Delete
                          </button>
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
                className="w-full py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                required
              >
                <option value="">Select Role</option>
                <option value="HR">HR</option>
                <option value="CLIENT">Client</option>
                <option value="ADMIN">Admin</option>
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
    </div>
  );
}
