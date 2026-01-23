import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";
import Image from "next/image";



// Define the table data using the interface
const users = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    password: "alice123",
    role: "admin",
  },
  {
    id: 2,
    name: "Brian Smith",
    email: "brian.smith@example.com",
    password: "brian456",
    role: "hr",
  },
  {
    id: 3,
    name: "Carla Williams",
    email: "carla.williams@example.com",
    password: "carla789",
    role: "client",
  },
  {
    id: 4,
    name: "David Brown",
    email: "david.brown@example.com",
    password: "david123",
    role: "admin",
  },
  {
    id: 5,
    name: "Ella Martinez",
    email: "ella.martinez@example.com",
    password: "ella456",
    role: "hr",
  },
  {
    id: 6,
    name: "Frank Thompson",
    email: "frank.thompson@example.com",
    password: "frank789",
    role: "client",
  },
];


export default function BasicTableOne() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto border-3">
        <div className="min-w-[1102px]">
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
                  email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Password
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Delete
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] ">
              {users?.map((user) => (
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
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <div className="flex -space-x-2">
                    {user.password}
                    </div>
                  
                  </TableCell>
                  
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <button className="px-[1vw] py-[.8vh] rounded-2xl text-xs  bg-red-500 text-white">
                     removeAccess
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
