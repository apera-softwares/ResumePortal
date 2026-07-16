'use client';
import React, { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import toast from 'react-hot-toast';



interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  succes?: () => void;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  succes,
}) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { isOpen, openModal, closeModal } = useModal();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData)
    const token = localStorage.getItem("token")
    const loginUrl = `${API_URL}/users/create`;
    try {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save user");
      }
      const data = await response.json()
      console.log(data, "user create")
      toast.success('user created.');
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
      });
      closeModal();
      succes?.()
    } catch (error) {
      console.error("Error creating user:", error);
    }

  };

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      {/* Header */}
      <div className="px-6 py-5 flex justify-between items-center">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
          {desc && <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z"
            />
          </svg>
          Create User
        </button>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">

        <div className="relative w-full max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Enter User Information</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Add User details to make user appear in the list.</p>

          <form className="flex flex-col" onSubmit={handleSave}>


            <div className="gap-x-6 gap-y-5 pb-4">
              <Label>Role</Label>
              <select
                name="role"
                value={formData.role}
                onChange={handleOnChange}
                className="w-full py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                required
              >
                <option value="" disabled>
                  Select a role
                </option>
                <option value="HR">HR</option>
                <option value="CLIENT">Client</option>
                <option value="CANDIDATE">Candidate</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input name="name" value={formData.name} onChange={handleOnChange} type="text" required />
              </div>
              {/* <div>
                <Label>Last Name</Label>
                <Input name="name" value={formData.name} onChange={handleOnChange} type="text"  />
              </div> */}

              <div>
                <Label>Email Address</Label>
                <Input name="email" value={formData.email} onChange={handleOnChange} type="email" required />
              </div>

              <div>
                <Label>Password</Label>
                <Input name="password" value={formData.password} onChange={handleOnChange} type="password" required />
              </div>
              {/* <div>
                <Label>Mobile No</Label>
                <Input name="password" value={formData.password} onChange={handleOnChange} type="Number" />
              </div> */}
              {/* <div>
                <Label>Company Name </Label>
                <Input name="password" value={formData.password} onChange={handleOnChange} type="text" />
              </div> */}

            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button size="sm" variant="outline" type="button" onClick={closeModal}>Close</Button>
              <Button size="sm" type="submit">Save User</Button>
            </div>
          </form>
        </div>
      </Modal>


      {/* Body */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
