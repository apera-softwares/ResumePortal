'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Trash, Users, Edit } from "lucide-react";

interface Job {
  id: string;
  company?: string;
  title: string;
  description: string;
  client?: string;
  skills: string[];
  internalSalary?: number;
  salary: number;
  location: string;
  type: string;
  appliedCount?: number;
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
  role?: string;
  appliedJobIds?: Set<string>;
  onApply?: (jobId: string) => void;
  onEditJob?: (job: Job) => void;
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
  role,
  appliedJobIds,
  onApply,
  onEditJob,
}: JoblistingProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [localJobs, setLocalJobs] = useState<Job[]>(jData || []);
  const [isGridView, setIsGridView] = useState<boolean>(false);
  
  // Dynamic Avatar Background Color & Initials
  const getAvatarStyle = (clientName: string) => {
    const gradients = [
      "from-blue-600 to-blue-700 text-white",
      "from-gray-700 to-gray-850 text-white",
      "from-slate-800 to-slate-950 text-white border border-gray-750/50",
      "from-blue-500 to-indigo-600 text-white",
      "from-zinc-750 to-zinc-900 text-white",
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

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAppliedClick = (job: Job) => {
    router.push(`/candidates?jobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}`);
  };

  useEffect(() => {
    setLocalJobs(jData || []);
  }, [jData]);

  const executeDelete = async (jobid: string) => {
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

  const handleDelete = (jobid: string) => {
    setDeleteConfirmId(jobid);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      executeDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="min-h-[80vh] w-full flex flex-col gap-6 font-outfit px-4 sm:px-6 py-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

      {/* 1st Card: Heading and Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-3xl shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Jobs</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage all job openings and client requirements.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by title, skills, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
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

          {role !== "CANDIDATE" && (
            <button
              onClick={onCreateJob}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer shrink-0"
            >
              <span>+</span> Create Job
            </button>
          )}

          {/* Grid/List View Toggles */}
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-800 p-1 rounded-xl bg-white dark:bg-gray-900 shadow-sm shrink-0">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-1.5 rounded-lg transition-all ${
                isGridView
                  ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              }`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-1.5 rounded-lg transition-all ${
                !isGridView
                  ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              }`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {localJobs.map((job) => (
                  <div
                    key={job?.id}
                    className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Logo & Job Type */}
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarStyle(job?.client || job?.company || 'Internal Client').gradient} flex items-center justify-center font-bold text-base shadow-sm shrink-0`}>
                          {getAvatarStyle(job?.client || job?.company || 'Internal Client').initial}
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/30">
                          {job?.type?.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Title & Skills in one line */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={job?.title}>
                          {job?.title}
                        </h3>
                        {/* Skills inline */}
                        {job?.skills && job?.skills.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0">
                            {job.skills.slice(0, 1).map((skill, index) => (
                              <span
                                key={index}
                                className="bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100/30 dark:border-blue-900/30"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 1 && (
                              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">
                                +{job.skills.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Company Name */}
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-3">
                        {job?.client || job?.company || 'Internal Client'}
                      </p>

                      {/* Location & Salary (instead of description) */}
                      <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3 mt-1 flex flex-col gap-1.5 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{job?.location || "Remote"}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200 font-bold">
                            <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>₹{job?.salary?.toLocaleString() || 'N/A'}</span>
                          </div>
                          {role !== "CANDIDATE" && job?.internalSalary && (
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold border border-emerald-100/30 dark:border-emerald-900/30">
                              Int: ₹{job?.internalSalary?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Actions */}
                    <div className="border-t border-gray-105 dark:border-gray-800/80 pt-3 mt-auto">
                      {role === "CANDIDATE" ? (
                        <button
                          disabled={appliedJobIds?.has(job.id)}
                          onClick={() => onApply && onApply(job.id)}
                          className={`w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                            appliedJobIds?.has(job.id)
                              ? "bg-gray-100 dark:bg-[#1a2333] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 cursor-default"
                              : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                          }`}
                        >
                          {appliedJobIds?.has(job.id) ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Applied</span>
                            </>
                          ) : (
                            <span>Apply Now</span>
                          )}
                        </button>
                      ) : (
                        <div className="flex gap-2 w-full items-center justify-between">
                          <div className="relative group flex-1">
                             <button
                               onClick={() => handleAppliedClick(job)}
                               className="w-full inline-flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 text-center cursor-pointer border border-blue-100/50 dark:border-blue-900/40"
                             >
                               <Users className="h-3.5 w-3.5" />
                               <span>{job.appliedCount ?? 0} Applied</span>
                             </button>
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                               View Candidate
                               <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-gray-800" />
                             </div>
                           </div>
                          
                          {onEditJob && (
                            <div className="relative group shrink-0">
                              <button
                                onClick={() => onEditJob(job)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100/50 dark:border-blue-900/40 transition-all cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                Edit Job
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-blue-600" />
                              </div>
                            </div>
                          )}

                          <div className="relative group shrink-0">
                            <button
                              onClick={() => handleDelete(job?.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100/50 dark:border-rose-900/40 transition-all cursor-pointer"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                              Delete Job
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-rose-600" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* TABLE LIST VIEW */
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1102px]">
                  <Table>
                    <TableHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                      <TableRow className="h-14">
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Name
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Location
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Job Type
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Salary Range
                        </TableCell>
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                          Skills Required
                        </TableCell>
                        {role !== "CANDIDATE" && (
                          <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">
                            Applied
                          </TableCell>
                        )}
                        <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">
                          {role === "CANDIDATE" ? "Apply" : "Actions"}
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
                                  </div>
                                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {job?.client || job?.company || 'Internal Client'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Location */}
                            <TableCell className="px-6 py-4 text-start text-sm">
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-750 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/80 uppercase">
                                {job?.location}
                              </span>
                            </TableCell>

                            {/* Job Type */}
                            <TableCell className="px-6 py-4 text-start text-sm">
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-500/5 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 border border-brand-500/10 dark:border-brand-500/10 uppercase">
                                {job?.type?.replace('_', ' ')}
                              </span>
                            </TableCell>

                            {/* Salary */}
                            <TableCell className="px-6 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                              <div>
                                <span className="block font-semibold">₹{job?.salary?.toLocaleString() || 'N/A'}</span>
                                {role !== "CANDIDATE" && job?.internalSalary && (
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

                            {/* Applied Count */}
                            {role !== "CANDIDATE" && (
                              <TableCell className="px-6 py-4 text-center">
                                 <div className="relative group inline-block">
                                   <button
                                     onClick={() => handleAppliedClick(job)}
                                     className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                                   >
                                     <Users className="h-3.5 w-3.5" />
                                     <span>{job.appliedCount ?? 0}</span>
                                   </button>
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                     View Candidate
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-gray-800" />
                                   </div>
                                 </div>
                              </TableCell>
                            )}

                            {/* Delete/Apply Action */}
                            <TableCell className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {role === "CANDIDATE" ? (
                                  <button
                                    disabled={appliedJobIds?.has(job.id)}
                                    onClick={() => onApply && onApply(job.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                      appliedJobIds?.has(job.id)
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                    }`}
                                  >
                                    {appliedJobIds?.has(job.id) ? "Applied" : "Apply"}
                                  </button>
                                ) : (
                                  <>
                                    {onEditJob && (
                                      <div className="relative group">
                                        <button
                                          onClick={() => onEditJob(job)}
                                          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 bg-blue-50/50 hover:bg-blue-100/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-all shadow-xs cursor-pointer"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                          Edit Job
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-blue-600" />
                                        </div>
                                      </div>
                                    )}

                                    <div className="relative group">
                                      <button
                                        onClick={() => handleDelete(job?.id)}
                                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-rose-600 dark:text-rose-400 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-all shadow-xs cursor-pointer"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </button>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                        Delete Job
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-rose-600" />
                                      </div>
                                    </div>
                                  </>
                                )}
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
