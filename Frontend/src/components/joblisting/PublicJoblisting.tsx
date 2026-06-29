'use client';

import { useEffect, useState, useCallback } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import ResumeUploadForm from "../ResumeUploadForm/ResumeUploadForm";

interface joblist {
  id: string;
  title: string;
  client: string;
  description: string;
  skills: string[];
  salary: string;
  internalSalary?: string;
  location: string;
  type: string;
  cities: string[];
}



export default function PublicJoblisting() {
  const [jobList, setJobList] = useState<joblist[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [searchitem, setSearchitem] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 8;

  const { isOpen, openModal, closeModal } = useModal();
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Load applied jobs from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedApplied = sessionStorage.getItem("appliedJobIds");
      if (storedApplied) {
        try {
          setAppliedJobs(JSON.parse(storedApplied));
        } catch (e) {
          console.error("Error parsing appliedJobIds", e);
        }
      }
    }
  }, []);

  // Reset pagination when search parameters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchitem, searchLocation, searchType]);

  // Fetch jobs dynamically based on backend pagination/filters
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(currentPage));
        queryParams.append("limit", String(ITEMS_PER_PAGE));
        if (searchitem?.trim()) queryParams.append("search", searchitem.trim());
        if (searchLocation?.trim()) queryParams.append("location", searchLocation.trim());
        if (searchType && searchType !== "All") queryParams.append("type", searchType);

        const response = await fetch(`${API_URL}/jobs?${queryParams.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("Something went wrong while fetching jobs");
        const resData = await response.json();
        setJobList(resData.data || []);
        setTotalCount(resData.total || 0);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };
    fetchJobs();
  }, [API_URL, currentPage, searchitem, searchLocation, searchType]);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleApply = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const checkRes = await fetch(`${API_URL}/users/check-auth`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!checkRes.ok) {
        window.location.href = "/login";
        return;
      }

      setApplyingJobId(id);
      openModal();
    } catch (error) {
      console.error("Error checking auth status:", error);
      window.location.href = "/login";
    }
  };

  const handleApplySuccess = (jobId: string) => {
    setAppliedJobs((prev) => [...prev, jobId]);
  };

  // Quick badge filter helper
  const handleBadgeClick = (type: string) => {
    setSearchType(type);
  };

  // Dynamic Avatar Background Color & Initials (Black, Grey, Blue palette)
  const getAvatarStyle = (clientName: string) => {
    const gradients = [
      "from-blue-600 to-blue-700 text-white",
      "from-gray-700 to-gray-800 text-white",
      "from-slate-800 to-slate-950 text-white border border-gray-700/50",
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

  // List of unique locations & types for autofill dropdowns
  const uniqueLocations = ["REMOTE", "MUMBAI", "DELHI", "BANGALORE", "HYDERABAD", "CHENNAI", "PUNE"];
  const uniqueTypes = ["FULL_TIME", "INTERN", "CONTRACT", "FREELANCING"];

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-950 min-h-screen font-outfit transition-colors duration-300">
      {/* Premium Hero Section with Ambient Lights */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 via-gray-50 to-gray-50 dark:from-gray-900/20 dark:via-gray-950/45 dark:to-gray-950 py-16 sm:py-24 border-b border-gray-100 dark:border-gray-900/60">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
            Find Your Next <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Dream Career</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover thousands of high-paying opportunities from leading companies. Refine by title, location, or type, and apply instantly.
          </p>

          {/* Premium Multi-Field Search Console */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl md:rounded-full p-2.5 sm:p-3 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0">
            {/* Field 1: What (Job Title / Skill / Company) */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                value={searchitem} 
                onChange={(e) => setSearchitem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Job title, keywords, or company" 
                className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder-gray-400"
              />
            </div>

            {/* Field 2: Where (Location) */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input 
                type="text" 
                value={searchLocation} 
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="City, state, or remote" 
                className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder-gray-400"
                list="locations-datalist"
              />
              <datalist id="locations-datalist">
                {uniqueLocations.map((loc, idx) => (
                  <option key={idx} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Field 3: Job Type Dropdown */}
            <div className="flex items-center gap-3 px-4 py-2 md:w-48">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none cursor-pointer appearance-none pr-6 dark:bg-gray-900"
              >
                <option value="All" className="dark:bg-gray-900">All Job Types</option>
                {uniqueTypes.map((type, idx) => (
                  <option key={idx} value={type} className="dark:bg-gray-900">{type}</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSearch} 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl md:rounded-full px-8 py-3.5 font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] shrink-0"
            >
              <span>Search</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 text-sm">
            <span className="text-gray-500 font-medium">Quick Filters:</span>
            <button 
              onClick={() => handleBadgeClick('All')}
              className={`px-4 py-1.5 rounded-full border transition-all text-xs font-semibold ${searchType === 'All' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              All Jobs
            </button>
            {uniqueTypes.slice(0, 4).map((type, idx) => (
              <button 
                key={idx}
                onClick={() => handleBadgeClick(type)}
                className={`px-4 py-1.5 rounded-full border transition-all text-xs font-semibold ${searchType.toLowerCase() === type.toLowerCase() ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Jobs Listing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results Bar / Layout Toggle */}
        {/* Results Bar / Layout Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-900 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-6">
            <h2 className="pb-4 text-xl font-bold text-gray-900 dark:text-white">
              Explore Positions
            </h2>
          </div>

          {/* Grid vs List Toggles */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-xl shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Listings Display */}
        {jobList.length > 0 ? (
            viewMode === 'grid' ? (
              /* GRID VIEW */
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5">
                {jobList.map((job) => {
                  const { gradient, initial } = getAvatarStyle(job.client);
                  const isApplied = appliedJobs.includes(job.id);
                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4.5 shadow-sm hover:shadow-xl hover:-translate-y-1 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Row: Logo & Job Type */}
                        <div className="flex justify-between items-start mb-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-base shadow-sm shrink-0`}>
                            {initial}
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/30">
                            {job.type}
                          </span>
                        </div>

                        {/* Title & Company */}
                        <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5 mb-3">
                          {job.client}
                        </p>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-3.5 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Metadata & Skills split footer */}
                        <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3.5 mt-3.5 flex items-center justify-between gap-3 mb-4">
                          {/* Left: Location & Salary info */}
                          <div className="flex flex-col gap-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="line-clamp-1">{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{job.salary}</span>
                            </div>
                          </div>

                          {/* Right: Skills badges */}
                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
                              {job.skills.slice(0, 2).map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[9px] font-semibold px-2 py-0.5 rounded border border-gray-200/50 dark:border-gray-700/55"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 2 && (
                                <span className="text-[9px] font-bold text-gray-450 dark:text-gray-500 px-0.5 py-0.5 self-center">
                                  +{job.skills.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={() => handleApply(job.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                          isApplied
                            ? "bg-gray-150 dark:bg-[#1a2333] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-default"
                            : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow"
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <svg className="w-4.5 h-4.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Applied</span>
                          </>
                        ) : (
                          <span>Apply Now</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 dark:border-[#222138] bg-white dark:bg-[#121124] shadow-xs">
                <div className="max-w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="h-14 border-b border-gray-200/40 dark:border-[#222138]/60 bg-gray-50/50 dark:bg-[#0b0a19]/40">
                        <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Job Details</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Job Type</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Location & Salary</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Skills</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/40 dark:divide-[#222138]/60">
                      {jobList.map((job) => {
                        const { gradient, initial } = getAvatarStyle(job.client);
                        const isApplied = appliedJobs.includes(job.id);
                        return (
                          <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1c1b35]/20 transition-all">
                            {/* Job Details */}
                            <td className="px-6 py-4 text-start">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold bg-gradient-to-br ${gradient} text-xs`}>
                                  {initial}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                    {job.title}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {job.client}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Job Type */}
                            <td className="px-6 py-4 text-start">
                              <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/30">
                                {job.type}
                              </span>
                            </td>

                            {/* Location & Salary */}
                            <td className="px-6 py-4 text-start">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {job.location}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {job.salary}
                                </span>
                              </div>
                            </td>

                            {/* Skills */}
                            <td className="px-6 py-4 text-start max-w-[200px]">
                              <div className="flex flex-wrap gap-1.5">
                                {job.skills && job.skills.length > 0 ? (
                                  job.skills.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="bg-gray-100 dark:bg-[#1c1b35] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md text-xs border border-gray-200/50 dark:border-[#2d2c4b]"
                                    >
                                      {skill}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleApply(job.id)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 mx-auto ${
                                  isApplied
                                    ? "bg-gray-100 dark:bg-[#1a2333] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 cursor-default"
                                    : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                                }`}
                              >
                                {isApplied ? (
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* NO RESULTS */
            <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No jobs found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                We couldn&apos;t find any positions matching your filters. Try adjusting your search term, location, or reset job types.
              </p>
              <button 
                onClick={() => {
                  setSearchitem('');
                  setSearchLocation('');
                  setSearchType('All');
                }}
                className="mt-6 px-5 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}

        {/* Premium Pagination Bar */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200/40 dark:border-gray-800/60 bg-transparent pt-6 mt-12 gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Showing</span>
              <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 font-bold">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
              </span>
              <span>of</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                {totalCount}
              </span>
              <span>jobs</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-55 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-55 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Apply Job Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Apply for Job
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Submit your resume and details to apply for this vacancy.
            </p>
          </div>
          <ResumeUploadForm closeModal={closeModal} jobId={applyingJobId} onApplySuccess={handleApplySuccess} />
        </div>
      </Modal>
    </div>
  );
}
