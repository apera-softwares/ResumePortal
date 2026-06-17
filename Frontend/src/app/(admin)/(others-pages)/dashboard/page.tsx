"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ResumeUploadForm from "@/components/ResumeUploadForm/ResumeUploadForm";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/ThemeContext';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Stats {
  candidatesCount: number;
  jobsCount: number;
  skillsCount: number;
  cleanedResumesCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { isOpen, openModal, closeModal } = useModal();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<Stats>({
    candidatesCount: 0,
    jobsCount: 0,
    skillsCount: 0,
    cleanedResumesCount: 0,
  });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [locationChartData, setLocationChartData] = useState<{ categories: string[]; data: number[] }>({
    categories: [],
    data: [],
  });
  const [jobTypeChartData, setJobTypeChartData] = useState<{ labels: string[]; series: number[] }>({
    labels: [],
    series: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 1. Fetch Candidates
      const cRes = await fetch(`${API_URL}/candidates`, { headers });
      if (!cRes.ok) throw new Error("Failed to fetch candidates");
      const cData = await cRes.json();
      const candidates = Array.isArray(cData) ? cData : (cData.data || []);

      // 2. Fetch Jobs
      const jRes = await fetch(`${API_URL}/jobs`, { headers });
      if (!jRes.ok) throw new Error("Failed to fetch jobs");
      const jData = await jRes.json();
      const jobs = jData.data || [];

      // 3. Fetch Skills
      const sRes = await fetch(`${API_URL}/skills`, { headers });
      if (!sRes.ok) throw new Error("Failed to fetch skills");
      const sData = await sRes.json();
      const skills = sData || [];

      // Process counts
      const cleanedCount = candidates.filter((c: any) => c.cleanedResume).length;

      setStats({
        candidatesCount: candidates.length,
        jobsCount: jobs.length,
        skillsCount: skills.length,
        cleanedResumesCount: cleanedCount,
      });

      setRecentCandidates(candidates.slice(-5).reverse());
      setRecentJobs(jobs.slice(-5).reverse());

      // Prepare Charts data
      // Location distribution of jobs
      const locationCounts: { [key: string]: number } = {};
      jobs.forEach((job: any) => {
        const loc = job.location || 'UNKNOWN';
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });
      setLocationChartData({
        categories: Object.keys(locationCounts),
        data: Object.values(locationCounts),
      });

      // Job Type distribution
      const typeCounts: { [key: string]: number } = {};
      jobs.forEach((job: any) => {
        const type = job.type ? job.type.replace('_', ' ') : 'OTHER';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      setJobTypeChartData({
        labels: Object.keys(typeCounts),
        series: Object.values(typeCounts),
      });

    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
      toast.error("Error fetching dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem("role") || "USER");
    setUserName(localStorage.getItem("name") || "Recruiter");
    fetchDashboardData();
  }, []);

  // ApexCharts Options
  const locationBarOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: ['#4F46E5'],
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        barHeight: '50%',
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: locationChartData.categories,
      labels: {
        style: { colors: isDark ? '#9CA3AF' : '#4B5563' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#9CA3AF' : '#4B5563' }
      }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } }
    },
    theme: { mode: isDark ? ('dark' as const) : ('light' as const) }
  };

  const jobTypeDonutOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    labels: jobTypeChartData.labels,
    colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    legend: {
      position: 'bottom' as const,
      labels: { colors: isDark ? '#9CA3AF' : '#4B5563' }
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      colors: isDark ? ['#111827'] : ['#ffffff'],
      width: 2,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Jobs',
              color: isDark ? '#9CA3AF' : '#4B5563',
              formatter: () => stats.jobsCount.toString()
            },
            value: {
              show: true,
              color: isDark ? '#ffffff' : '#111827',
              fontWeight: 800,
            }
          }
        }
      }
    },
    theme: { mode: isDark ? ('dark' as const) : ('light' as const) }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome & Intro Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
            {role} Workspace
          </span>
          <h1 className="text-2xl md:text-3xl font-black">Welcome back, {userName}!</h1>
          <p className="text-blue-100 text-sm md:text-base max-w-xl">
            Here's the current overview of your talent pipeline, active jobs, and resume parsing records.
          </p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0 z-10">
          <button
            onClick={openModal}
            className="bg-white hover:bg-blue-50 text-blue-700 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Upload Resume
          </button>

          <button
            onClick={() => router.push('/jobcreation')}
            className="bg-blue-900/30 hover:bg-blue-900/50 border border-white/20 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Post a Job
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Candidates Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-400 uppercase">Total Candidates</span>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 21c-2.243 0-4.352-.64-6.136-1.75a3.333 3.333 0 01-1.08-1.08C2.116 16.987 3.9 16.21 5.924 16.21a9.03 9.03 0 013.376.65m0 0a11.386 11.386 0 011.089-6.628M9.3 16.21a9.03 9.03 0 01-3.376-.65m0 0l.092-.09A11.386 11.386 0 0110.089 9c1.9 0 3.693.468 5.277 1.298M9.03 16.21a9.03 9.03 0 003.376-.65m0 0A11.386 11.386 0 0015 9" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            {loading ? "..." : stats.candidatesCount}
          </h2>
          <p className="text-xs text-gray-500 mt-2">Candidates added across portal</p>
        </div>

        {/* Jobs Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-400 uppercase">Active Jobs</span>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .596-.482 1.077-1.076 1.077H4.826c-.594 0-1.076-.481-1.076-1.077v-4.25m16.5 0a2.25 2.25 0 00-2.25-2.25h-12a2.25 2.25 0 00-2.25 2.25m16.5 0v3a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25v-3m16.5 0h-16.5" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            {loading ? "..." : stats.jobsCount}
          </h2>
          <p className="text-xs text-gray-500 mt-2">Active vacancies to fulfill</p>
        </div>

        {/* Skills Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-400 uppercase">Skills Database</span>
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            {loading ? "..." : stats.skillsCount}
          </h2>
          <p className="text-xs text-gray-500 mt-2">Configured search skills</p>
        </div>

        {/* Cleaned Resumes Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-400 uppercase">Cleaned Resumes</span>
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            {loading ? "..." : stats.cleanedResumesCount}
          </h2>
          <p className="text-xs text-gray-500 mt-2">Cleaned of contact info</p>
        </div>

      </div>

      {/* Graphical Insights */}
      {!loading && stats.jobsCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900/40 border border-gray-150 dark:border-gray-800/80 backdrop-blur-sm rounded-3xl p-6 lg:col-span-2 shadow-xs">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Distribution by Location</h3>
            <div className="h-64">
              <Chart options={locationBarOptions} series={[{ data: locationChartData.data }]} type="bar" height="100%" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/40 border border-gray-150 dark:border-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Active Vacancies by Type</h3>
            <div className="h-64 flex items-center justify-center">
              <Chart options={jobTypeDonutOptions} series={jobTypeChartData.series} type="donut" width="100%" height="250" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Candidates & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Candidates Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-950 dark:text-white">Recent Candidates Pipeline</h3>
                <p className="text-xs text-gray-500">Overview of the last candidate resumes uploaded</p>
              </div>
              <button
                onClick={() => router.push('/candidates')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading data...</div>
            ) : recentCandidates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-400 uppercase">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Experience</th>
                      <th className="pb-3">Notice Period</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {recentCandidates.map((cand) => (
                      <tr key={cand.id} className="text-sm">
                        <td className="py-4">
                          <div>
                            <span className="block font-semibold text-gray-900 dark:text-white">
                              {cand.firstName} {cand.lastName}
                            </span>
                            <span className="block text-xs text-gray-500">{cand.email}</span>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-gray-600 dark:text-gray-300">
                          {cand.yearsOfExperience} Year{cand.yearsOfExperience > 1 && 's'}
                        </td>
                        <td className="py-4 text-gray-500">
                          {cand.noticePeriod} Day{cand.noticePeriod > 1 && 's'}
                        </td>
                        <td className="py-4">
                          {cand.cleanedResume ? (
                            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md">
                              Parsed & Cleaned
                            </span>
                          ) : (
                            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-md">
                              Awaiting Clean
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">No candidates uploaded yet</div>
            )}
          </div>
        </div>

        {/* Recent Active Jobs */}
        <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-950 dark:text-white">Recent Job Openings</h3>
                <p className="text-xs text-gray-500">Fresh requirements added recently</p>
              </div>
              <button
                onClick={() => router.push('/jobcreation')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading data...</div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border border-gray-100 dark:border-gray-700/60 rounded-2xl hover:border-blue-300 dark:hover:border-blue-900 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md">
                        {job.type ? job.type.replace('_', ' ') : 'FULL TIME'}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        {job.location}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                      {job.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {job.client || 'Internal Client'}
                    </p>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-800 dark:text-gray-300">
                      <span>₹{job.salary ? job.salary.toLocaleString() : 'N/A'}</span>
                      {job.internalSalary && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ₹{job.internalSalary.toLocaleString()} (Int)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">No active jobs found</div>
            )}
          </div>
        </div>

      </div>

      {/* Upload Resume Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <ResumeUploadForm closeModal={() => { closeModal(); fetchDashboardData(); }} />
      </Modal>

    </div>
  );
}