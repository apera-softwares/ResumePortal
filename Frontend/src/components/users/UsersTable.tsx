'use client'

import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  succes: () => void;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  mobile?: string;       // optional if sometimes missing
  companyName?: string;  // likewise
}

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
export default function UsersTable(callApi: any) {
  const [data, setData] = useState<User[]>([]);
  const { isOpen, openModal, closeModal } = useModal();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });


  const fetchData = async () => {
    const token = localStorage.getItem("token")
    const fetchUrl = "http://192.168.1.48:3003/users";

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
      setData(userData.data)

    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  const handleDelete = async (userId: number) => {

    console.log(typeof (userId), "userId")

    const token = localStorage.getItem("token");
    const idUrl = `http://192.168.1.48:3003/users/${userId}`;
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

      // Remove the user from state after successful deletion
      setData(prevData => prevData.filter((user: any) => user.id !== userId));

    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

//edit form data 
const handleForm = (user: User) => {
  console.log(" Selected user data:", user); // <-- log entire user object

  setSelectedUser(user);
  setFormData({
    name: user.name,
    email: user.email,
    role: user.role,
  });

  console.log("Prefilled formData:", {
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

  // Create a new updated user list
  const updatedUsers = data.map((user) =>
    user.email === selectedUser.email
      ? { ...user, ...formData } // replace selected user's data
      : user
  );

  setData(updatedUsers);
  closeModal();

  console.log("User updated:", formData);
};

  useEffect(() => {
    fetchData();

  }, [callApi])



  //handle edit code here

  return (
    <div className="overflow-hidden rounded-xl  border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto ">
        <div className="max-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  User Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  User Role
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>
               
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Delete/Edit
                </TableCell>

              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] ">
              {data?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start ">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden flex items-center justify-center bg-blue-700 text-white rounded-full ">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {user.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {user.role}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="flex -space-x-2">
                      {user.email}
                    </div>
                  </TableCell>
                  

                  <TableCell className="px-4 py-3 text-gray-500 flex gap-2 text-theme-sm dark:text-gray-400">
                    <button onClick={() => handleDelete(user?.id)} className="px-[1vw] py-[.8vh] rounded-2xl text-xs  bg-red-500 text-white">
                      Delete
                    </button>
                    <button onClick={() => handleForm(user)}  className="px-[1vw] py-[.8vh] rounded-2xl text-xs  border text-gray-800">
                      Edit
                    </button>
                    {/* Modal */}
                   
                  </TableCell>
                </TableRow>
              ))}


            </TableBody>
          </Table>
  
        </div>
      </div>
                 <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
  <div className="relative w-full max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
      Edit User Information
    </h4>

    <form className="flex flex-col gap-4">
      {/* Role Dropdown */}
      <div className="gap-x-6 gap-y-5 pb-4">
        <Label>Role</Label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full py-2 border-2 rounded-md px-3 outline-gray-200"
        >
          <option value="">Select Role</option>
          <option value="HR">HR</option>
          <option value="CLIENT">Client</option>
        </select>
      </div>

      {/* Name and Email Fields */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label>Email Address</Label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <Button size="sm" variant="outline" onClick={closeModal}>
          Close
        </Button>
        <Button size="sm" onClick={handleSaveUser} >
          Save User
        </Button>
      </div>
    </form>
  </div>
                    </Modal>
    </div>
  );
}
