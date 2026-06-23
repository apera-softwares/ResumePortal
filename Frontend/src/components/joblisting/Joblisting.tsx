'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Trash } from "lucide-react";

interface Job {
  id: number;
  company?: string;
  title: string;
  description: string;
  client?: string;
  skills: string[];
  internalSalary?: number;
  salary: number;
  location: string;
  type: string;
}

interface JoblistingProps {
  jData: Job[];
  onCreateJob: () => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalCount: number;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  itemsPerPage: number;
  onRefresh?: () => void;
}

export default function Joblisting({
  jData,
  onCreateJob,
  currentPage,
  setCurrentPage,
  totalCount,
  searchTerm,
  setSearchTerm,
  itemsPerPage,
  onRefresh,
}: JoblistingProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [localJobs, setLocalJobs] = useState<Job[]>(jData || []);
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    setLocalJobs(jData || []);
  }, [jData]);

  const executeDelete = async (jobid: number) => {
    const token = localStorage.getItem("token");
    const idUrl = `${API_URL}/jobs/${jobid}`;
    try {
      const res = await fetch(idUrl, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!res.ok) {
        throw new Error("failed to Delete");
      }
      toast.success("Job deleted successfully!");
      if (onRefresh) {
        onRefresh();
      } else {
        setLocalJobs((prev) => prev.filter((job) => job.id !== jobid));
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job.");
    }
  };

  const handleDelete = (jobid: number) => {
    setDeleteConfirmId(jobid);
  };

  // Dynamic initial-based avatars
  const getAvatarStyle = (clientName: string) => {
    const gradients = [
      "from-blue-600 to-blue-700 text-white",
      "from-gray-700 to-gray-800 text-white dark:from-gray-800 dark:to-gray-900",
      "from-slate-800 to-slate-950 text-white border border-gray-700/50 dark:border-gray-800",
      "from-blue-500 to-indigo-600 text-white",
      "from-zinc-700 to-zinc-900 text-white",
      "from-blue-700 to-slate-900 text-white",
    ];
    let hash = 0;
    const name = clientName || "Company";
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradient = gradients[Math.abs(hash) % gradients.length];
    const initial = name.charAt(0).toUpperCase();
    return { gradient, initial };
  };

  return (
    <div className="min-h-[80vh] w-full flex flex-col gap-6 font-outfit px-4 sm:px-6 py-6 bg-gray-55 dark:bg-gray-950 transition-colors duration-300">

      {/* 1st Card: Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-3xl shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Job Listings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage all job openings and client requirements.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <input
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              type="text"
              placeholder="Search by title, skills, location..."
              className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-950 dark:text-white transition-all leading-normal"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Create Job Button */}
          <button
            onClick={onCreateJob}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-55 hover:bg-gray-105 dark:bg-gray-800 dark:hover:bg-gray-750 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs cursor-pointer"
          >
            <svg className="fill-current text-gray-500 dark:text-white" width="14" height="14" viewBox="0 0 18 18">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z" />
            </svg>
            <span>Create Job</span>
          </button>

          {/* Toggle buttons */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 justify-center">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-1.5 rounded-lg transition-all ${isGridView ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-1.5 rounded-lg transition-all ${!isGridView ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2nd Card: Listings card */}
      <div className="flex-1 min-h-[70vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between p-6">
        <div className="max-w-full overflow-x-auto flex-1">
          {localJobs.length > 0 ? (
            isGridView ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localJobs.map((job) => (
                  <div
                    key={job?.id}
                    className="group flex flex-col justify-between bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 hover:shadow-lg hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/80 rounded-md">
                          {job?.type?.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-805 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/80 rounded-lg">
                          {job?.location}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {job?.title}
                      </h3>
                      <p className="text-sm font-medium text-gray-550 dark:text-gray-400 mb-4">{job?.client || job?.company || 'Internal Client'}</p>

                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                        {job?.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {job?.skills?.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-md border border-gray-200/50 dark:border-gray-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200/40 dark:border-gray-800/60 pt-4 mt-auto">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className="text-xs text-gray-405 dark:text-gray-500 block">Salary Package</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            ₹{job?.salary?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        {job?.internalSalary && (
                          <div className="text-right">
                            <span className="text-xs text-gray-405 dark:text-gray-500 block">Internal Salary</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{job?.internalSalary?.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(job?.id)}
                        className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200"
                      >
                        Delete Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* TABLE LIST VIEW */
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1102px]">
                  <Table>
                    {/* Table Header */}
                    <TableHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                      <TableRow className="h-14">
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Job Name
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Location
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Salary Range
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Skills Required
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody className="divide-y divide-gray-200/40 dark:divide-gray-800/60">
                      {localJobs.map((job) => {
                        const avatar = getAvatarStyle(job?.client || job?.company || 'Internal Client');
                        return (
                          <TableRow key={job?.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all border-b border-gray-200/40 dark:border-gray-800/60">
                            {/* Job Title & Client */}
                            <TableCell className="px-6 py-4 text-start">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold bg-gradient-to-br ${avatar.gradient}`}>
                                  {avatar.initial}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="block font-semibold text-gray-900 dark:text-white">
                                      {job?.title}
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/80 rounded-md">
                                      {job?.type?.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <span className="block text-xs text-gray-450 dark:text-gray-500 mt-0.5">
                                    {job?.client || job?.company || 'Internal Client'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Location */}
                            <TableCell className="px-6 py-4 text-start text-sm">
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/80">
                                {job?.location}
                              </span>
                            </TableCell>

                            {/* Salary */}
                            <TableCell className="px-6 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                              <div>
                                <span className="block font-semibold">₹{job?.salary?.toLocaleString() || 'N/A'}</span>
                                {job?.internalSalary && (
                                  <span className="block text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    ₹{job?.internalSalary?.toLocaleString()} (Internal)
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Skills */}
                            <TableCell className="px-6 py-4 text-start text-sm">
                              <div className="flex flex-wrap gap-1 max-w-[280px]">
                                {job?.skills?.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-gray-700"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </TableCell>

                            {/* Delete Action */}
                            <TableCell className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                {/* Delete Tooltip Wrapper */}
                                <div className="relative group">
                                  <button
                                    onClick={() => handleDelete(job?.id)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-rose-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                    delete job
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-rose-600" />
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-center font-medium">No matching jobs found</p>
            </div>
          )}
        </div>

        {/* Premium Pagination Bar */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row justify-end items-center border-t border-gray-200/40 dark:border-gray-800/60 bg-white dark:bg-gray-900 pt-6 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>

              {(() => {
                const totalPages = Math.ceil(totalCount / itemsPerPage);
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
                      <span key={`ellipse-${idx}`} className="text-gray-400 dark:text-gray-650 px-1.5 font-semibold text-xs select-none">
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
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
                disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 mb-4">
              <Trash className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-6 mb-2">
              Are you sure?
            </h3>

            {/* Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Do you really want to delete this job? This action is permanent and cannot be undone.
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
