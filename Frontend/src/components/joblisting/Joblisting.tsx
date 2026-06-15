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

export default function Joblisting({ jData }: { jData: Job[] }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [searchitem, setSearchitem] = useState<string>('');
  const [filteredjobs, setFilteredJobs] = useState<Job[]>(jData || []);
  const [isGridView, setIsGridView] = useState<boolean>(false);

  useEffect(() => {
    setFilteredJobs(jData || []);
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
      setFilteredJobs((prev) => prev.filter((job) => job.id !== jobid));
      toast.success("Job deleted successfully!");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job.");
    }
  };

  const handleDelete = (jobid: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-medium text-gray-900">
          Are you sure you want to delete this job?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-750 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await executeDelete(jobid);
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

  // Live search functionality
  useEffect(() => {
    if (!searchitem.trim()) {
      setFilteredJobs(jData || []);
    } else {
      const query = searchitem.toLowerCase();
      const results = (jData || []).filter((job) => 
        job.title?.toLowerCase().includes(query) ||
        job.client?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.skills?.some((s) => s.toLowerCase().includes(query)) ||
        job.location?.toLowerCase().includes(query)
      );
      setFilteredJobs(results);
    }
  }, [searchitem, jData]);

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
    <div className="relative px-6 py-6 bg-white dark:bg-gray-900 min-h-[70vh] border border-gray-200 dark:border-gray-800 rounded-3xl mt-6 shadow-xs font-outfit">
      
      {/* Header controls */}
      <div className="flex flex-col gap-4 sm:flex-row items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Active Job Listings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all job openings and client requirements.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <input 
              onChange={(e) => setSearchitem(e.target.value)} 
              value={searchitem} 
              type="text" 
              placeholder="Search by title, skills, location..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-950 p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/80">
            <button 
              onClick={() => setIsGridView(true)}
              className={`p-2 rounded-lg transition-all ${isGridView ? 'bg-white dark:bg-gray-850 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button 
              onClick={() => setIsGridView(false)}
              className={`p-2 rounded-lg transition-all ${!isGridView ? 'bg-white dark:bg-gray-850 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table View Rendering */}
      {filteredjobs.length > 0 ? (
        isGridView ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredjobs.map((job) => (
              <div
                key={job?.id}
                className="group flex flex-col justify-between bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 hover:shadow-lg hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-lg">
                      {job?.type?.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-lg">
                      {job?.location}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {job?.title}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">{job?.client || job?.company || 'Internal Client'}</p>

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

                <div className="border-t border-gray-100 dark:border-gray-805/60 pt-4 mt-auto">
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
          <div className="overflow-hidden rounded-3xl border border-gray-205 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
            <div className="max-w-full overflow-x-auto">
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                  <TableRow className="h-14">
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">
                      Job Details
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
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredjobs.map((job) => {
                    const avatar = getAvatarStyle(job?.client || job?.company || 'Internal Client');
                    return (
                      <TableRow key={job?.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-all border-b border-gray-100 dark:border-gray-850">
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
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-md">
                                  {job?.type?.replace('_', ' ')}
                                </span>
                              </div>
                              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {job?.client || job?.company || 'Internal Client'}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Location */}
                        <TableCell className="px-6 py-4 text-start text-sm">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
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
                          <button 
                            onClick={() => handleDelete(job?.id)} 
                            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                          >
                            Delete
                          </button>
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
          <svg className="w-12 h-12 text-gray-305 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-center font-medium">No matching jobs found</p>
        </div>
      )}
    </div>
  );
}
