"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ResumeUploadForm from "@/components/ResumeUploadForm/ResumeUploadForm";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import {
  Users,
  Briefcase,
  Cpu,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckSquare,
  UserCheck,
  Plus,
  ChevronRight,
  Clock,
  MapPin,
  ClipboardList,
  Target,
  Award,
  Zap,
  Activity
} from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Stats {
  candidatesCount: number;
  jobsCount: number;
  skillsCount: number;
  cleanedResumesCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");
  const { isOpen, openModal, closeModal } = useModal();
  const { theme } = useTheme();
  const { name: contextName, role: contextRole, email: contextEmail } = useUser();
  const isDark = theme === 'dark';

  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
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
  const [candidateApps, setCandidateApps] = useState<any[]>([]);
  const [candidateAppliedJobs, setCandidateAppliedJobs] = useState<any[]>([]);
  const [candidateSkillsList, setCandidateSkillsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Recruiter checklist tasks state
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review new resume queue on R2/S3", date: "15 Jul", status: "In Progress", checked: false },
    { id: 2, text: "Send cleaned developer PDF to Client Review", date: "16 Jul", status: "Pending", checked: false },
    { id: 3, text: "Setup technical screening interview for Janish", date: "16 Jul", status: "Completed", checked: true },
    { id: 4, text: "Integrate latest AI parser skills taxonomy", date: "17 Jul", status: "Completed", checked: true },
    { id: 5, text: "Update candidate profiles notice period values", date: "18 Jul", status: "Pending", checked: false },
  ]);

  // High-fidelity pipeline database mock (CRM Deals Status)
  const [pipelineCandidates, setPipelineCandidates] = useState([
    { id: 1, name: "Sophia Cunha", targetJob: "Lead Frontend Engineer", stage: "Offer Sent", stageColor: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400", recruiter: "Donald Risher", avatarBg: "bg-indigo-500", date: "Sep 20, 2026", client: "Abstergo LLC" },
    { id: 2, name: "Janish Brown", targetJob: "Senior Node.js Developer", stage: "Technical Interview", stageColor: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400", recruiter: "Sofia Cunha", avatarBg: "bg-purple-500", date: "Sep 23, 2026", client: "Raitech Soft" },
    { id: 3, name: "Luis Rocha", targetJob: "UX Architect", stage: "Screening", stageColor: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400", recruiter: "Luis Rocha", avatarBg: "bg-emerald-500", date: "Sep 27, 2026", client: "William PVT" },
    { id: 4, name: "Vitoria Rodrigues", targetJob: "Fullstack Engineer", stage: "Hired", stageColor: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400", recruiter: "Donald Risher", avatarBg: "bg-indigo-500", date: "Sep 30, 2026", client: "Lolusee LLP" },
    { id: 5, name: "Marcus Aurelius", targetJob: "Database Administrator", stage: "Awaiting Clean", stageColor: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400", recruiter: "Sofia Cunha", avatarBg: "bg-purple-500", date: "Sep 30, 2026", client: "Apple Inc" },
  ]);

  // Recruiter activities list (Upcoming Activities)
  const [activities, setActivities] = useState([
    { id: 1, time: "10:00 AM - 11:30 AM", title: "Technical round interview with Janish Brown", date: "16 Wed", teamCount: 3, avatarBg: "bg-indigo-500" },
    { id: 2, time: "02:00 PM - 02:45 PM", title: "Review newly parsed CV queues from Cloudflare R2", date: "16 Wed", teamCount: 2, avatarBg: "bg-purple-500" },
    { id: 3, time: "04:30 PM - 05:15 PM", title: "Client call with Abstergo LLC hiring team", date: "17 Thu", teamCount: 4, avatarBg: "bg-emerald-500" },
    { id: 4, time: "11:00 AM - 12:00 PM", title: "Feedback evaluation session for Sophia Cunha", date: "18 Fri", teamCount: 5, avatarBg: "bg-amber-500" },
  ]);

  // Recent placements / Hired (Closing Deals)
  const [placements, setPlacements] = useState([
    { id: 1, date: "Today", candidate: "Vitoria Rodrigues", client: "Lolusee LLP", compensation: "₹24,00,000", recruiter: "Donald Risher" },
    { id: 2, date: "Dec 30", candidate: "Janish Brown", client: "Raitech Soft", compensation: "₹18,50,000", recruiter: "Sofia Cunha" },
    { id: 3, date: "Nov 25", candidate: "William PVT", client: "William PVT", compensation: "₹22,00,000", recruiter: "Luis Rocha" },
    { id: 4, date: "Sep 20", candidate: "Julia William", client: "Raitech Soft", compensation: "₹16,80,000", recruiter: "Donald Risher" },
    { id: 5, date: "Sep 15", candidate: "Vitoria Rodrigues", client: "Abstergo LLC", compensation: "₹21,00,000", recruiter: "Sofia Cunha" },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked, status: !t.checked ? "Completed" : "In Progress" } : t));
  };

  const fetchDashboardData = async () => {
    try {
      const userRole = contextRole || (typeof window !== "undefined" ? localStorage.getItem("role") || "USER" : "USER");
      const activeEmail = contextEmail || (typeof window !== "undefined" ? localStorage.getItem("email") || "" : "");

      if (userRole === 'CANDIDATE' && activeEmail) {
        const [res, jRes] = await Promise.all([
          fetch(`${API_URL}/candidates/my-applications?email=${encodeURIComponent(activeEmail)}`),
          fetch(`${API_URL}/jobs`)
        ]);

        let apps: any[] = [];
        if (res.ok) {
          const data = await res.json();
          apps = Array.isArray(data) ? data : [];
          setCandidateApps(apps);
        }

        let allJobs: any[] = [];
        if (jRes.ok) {
          const jData = await jRes.json();
          allJobs = jData.data || [];
          setRecentJobs(allJobs.slice(-5).reverse());
        }

        let totalJobsApplied = 0;
        const uniqueSkills = new Set<string>();
        const extractedApps: any[] = [];

        apps.forEach((cand: any) => {
          if (cand.skills) {
            cand.skills.forEach((sk: any) => {
              const skillName = sk.name || sk.skill?.name;
              if (skillName) uniqueSkills.add(skillName);
            });
          }
          if (cand.appliedJobs) {
            cand.appliedJobs.forEach((aj: any) => {
              totalJobsApplied++;
              const matchedJob = allJobs.find((j: any) => j.id === aj.jobId) || aj.job || {};
              extractedApps.push({
                jobTitle: matchedJob.title || "Job Position",
                jobType: matchedJob.type ? matchedJob.type.replace('_', ' ') : "Full Time",
                client: matchedJob.client || matchedJob.company || "Hiring Partner",
                location: matchedJob.location || "Remote",
                status: aj.status || "APPLIED",
                appliedAt: aj.createdAt || aj.appliedAt || null,
              });
            });
          }
        });

        setCandidateAppliedJobs(extractedApps);
        setCandidateSkillsList(Array.from(uniqueSkills));

        setStats({
          candidatesCount: apps.length,
          jobsCount: totalJobsApplied,
          skillsCount: uniqueSkills.size,
          cleanedResumesCount: apps.filter((c: any) => c.cleanedResume || c.resumePdf).length,
        });

      } else {
        const token = localStorage.getItem("token");
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const queryParams = new URLSearchParams();
        const localRole = localStorage.getItem("role");
        const localUserId = localStorage.getItem("userId");
        if (localRole) {
          queryParams.append("role", localRole);
        }
        if (localUserId) {
          queryParams.append("userId", localUserId);
        }

        const [cRes, jRes, sRes] = await Promise.all([
          fetch(`${API_URL}/candidates?${queryParams.toString()}`, { headers }),
          fetch(`${API_URL}/jobs?${queryParams.toString()}`, { headers }),
          fetch(`${API_URL}/skills`, { headers })
        ]);

        let candidates: any[] = [];
        if (cRes.ok) {
          const cData = await cRes.json();
          candidates = Array.isArray(cData) ? cData : (cData.data || []);
        }

        let jobs: any[] = [];
        if (jRes.ok) {
          const jData = await jRes.json();
          jobs = jData.data || [];
        }

        let skills: any[] = [];
        if (sRes.ok) {
          const sData = await sRes.json();
          skills = sData || [];
        }

        const cleanedCount = candidates.filter((c: any) => c.cleanedResume).length;

        setStats({
          candidatesCount: candidates.length,
          jobsCount: jobs.length,
          skillsCount: skills.length,
          cleanedResumesCount: cleanedCount,
        });

        setRecentCandidates(candidates.slice(-5).reverse());
        setRecentJobs(jobs.slice(-5).reverse());

        const locationCounts: { [key: string]: number } = {};
        jobs.forEach((job: any) => {
          const loc = job.location || 'UNKNOWN';
          locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });
        setLocationChartData({
          categories: Object.keys(locationCounts),
          data: Object.values(locationCounts),
        });

        const typeCounts: { [key: string]: number } = {};
        jobs.forEach((job: any) => {
          const type = job.type ? job.type.replace('_', ' ') : 'OTHER';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        setJobTypeChartData({
          labels: Object.keys(typeCounts),
          series: Object.values(typeCounts),
        });
      }
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
      toast.error("Error fetching dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentRole = contextRole || (typeof window !== "undefined" ? localStorage.getItem("role") || "USER" : "USER");
    const currentName = contextName || (typeof window !== "undefined" ? localStorage.getItem("name") || "Recruiter" : "Recruiter");
    const currentEmail = contextEmail || (typeof window !== "undefined" ? localStorage.getItem("email") || "" : "");
    setRole(currentRole);
    setUserName(currentName);
    setUserEmail(currentEmail);
    fetchDashboardData();
  }, [contextName, contextRole, contextEmail]);

  // Line / Area overview chart (Balance Overview)
  const pipelineOverviewOptions = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: ['#4F46E5', '#10B981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 2 },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { colors: isDark ? '#9CA3AF' : '#4B5563' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: isDark ? '#9CA3AF' : '#4B5563' } }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    legend: {
      position: 'top' as const,
      horizontalAlign: 'right' as const,
      labels: { colors: isDark ? '#9CA3AF' : '#4B5563' }
    },
    theme: { mode: isDark ? ('dark' as const) : ('light' as const) }
  };

  const pipelineOverviewSeries = [
    {
      name: 'Resumes Uploaded',
      data: [45, 52, 38, 65, 78, 92, 110, 85, 120, 105, 95, 130]
    },
    {
      name: 'Candidates Hired',
      data: [15, 24, 18, 30, 42, 50, 62, 48, 70, 58, 52, 75]
    }
  ];

  // Sourcing radar chart (Deal Type Radar Chart)
  const sourcingRadarOptions = {
    chart: {
      type: 'radar' as const,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: ['#6366F1', '#10B981', '#F59E0B'],
    labels: ['LinkedIn', 'Direct Application', 'Portal Search', 'Recruiters Referral', 'Hiring Agencies'],
    legend: {
      position: 'bottom' as const,
      labels: { colors: isDark ? '#9CA3AF' : '#4B5563' }
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: isDark ? '#374151' : '#E5E7EB',
          connectorColors: isDark ? '#374151' : '#E5E7EB',
          fill: {
            colors: isDark ? ['#1f2937', '#111827'] : ['#f9fafb', '#ffffff']
          }
        }
      }
    },
    yaxis: { show: false },
    theme: { mode: isDark ? ('dark' as const) : ('light' as const) }
  };

  const sourcingRadarSeries = [
    {
      name: 'Active Pipeline',
      data: [90, 70, 85, 60, 50]
    },
    {
      name: 'Hired Candidates',
      data: [50, 40, 65, 55, 30]
    }
  ];

  // Location bar chart options
  const locationBarOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: ['#3B82F6'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '45%',
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: locationChartData.categories,
      labels: { style: { colors: isDark ? '#9CA3AF' : '#4B5563' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: isDark ? '#9CA3AF' : '#4B5563' } }
    },
    grid: {
      borderColor: isDark ? '#374151' : '#E5E7EB',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    theme: { mode: isDark ? ('dark' as const) : ('light' as const) }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {/* ── Welcome & Interactive Header ── */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-md overflow-hidden transition-all border border-indigo-950/15 dark:border-slate-800/40">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold tracking-wider uppercase backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {role === 'CANDIDATE' ? 'Candidate Portal' : `${role} Workspace`}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-indigo-100 text-xs md:text-sm max-w-xl leading-relaxed opacity-90">
            {role === 'CANDIDATE'
              ? 'Track your job applications, profile strength, matched vacancies, and resume status in real-time.'
              : "Here's the current overview of your recruitment metrics, active schedules, and talent pipeline data."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-5 md:mt-0 z-10">
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-900 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Resume
          </button>

          {role === 'CANDIDATE' ? (
            <button
              onClick={() => router.push('/dashboard/jobs')}
              className="flex items-center gap-2 bg-indigo-600/40 hover:bg-indigo-600/60 border border-white/20 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              Browse Open Jobs
            </button>
          ) : (
            <button
              onClick={() => router.push('/jobcreation')}
              className="flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-white/20 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              Post a Job
            </button>
          )}
        </div>
      </div>

      {/* ── Dashboard Quick Actions Toolbar ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
          <ClipboardList className="w-4.5 h-4.5 text-indigo-650" />
          <span>Quick Actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'CANDIDATE' ? (
            <>
              <button
                onClick={() => router.push('/dashboard/my-applications')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>My Applications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push('/dashboard/jobs')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Browse Vacancies</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push('/my-resume')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Manage My Resume</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/candidates')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Search Candidates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push('/addskills')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Skills Settings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stats Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {role === 'CANDIDATE' ? (
          <>
            {/* Applications Submitted Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Applied Positions</span>
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-gray-950 dark:text-white">
                  {loading ? "..." : stats.jobsCount}
                </h2>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Active job applications submitted</p>
            </div>

            {/* Profile Registration Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Profile Status</span>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100/50 dark:border-emerald-900/30">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold text-gray-950 dark:text-white truncate">
                  {loading ? "..." : candidateApps.length > 0 ? "Active Candidate" : "Pending Upload"}
                </h2>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Talent pool database status</p>
            </div>

            {/* Tagged Skills Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Parsed Skills</span>
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center border border-amber-100/50 dark:border-amber-900/30">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-gray-950 dark:text-white">
                  {loading ? "..." : stats.skillsCount}
                </h2>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Skills extracted from resume</p>
            </div>

            {/* Cleaned Resume Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Resume Format</span>
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 rounded-2xl flex items-center justify-center border border-purple-100/50 dark:border-purple-900/30">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold text-gray-950 dark:text-white truncate">
                  {loading ? "..." : stats.cleanedResumesCount > 0 ? "Cleaned PDF Ready" : "Original Uploaded"}
                </h2>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Recruiter-shareable CV format</p>
            </div>
          </>
        ) : (
          <>
            {/* Admin Candidates Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Candidates</span>
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-gray-950 dark:text-white">
                  {loading ? "..." : stats.candidatesCount}
                </h2>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +5.02%
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Active parsed resumes in system</p>
            </div>

            {/* Admin Active Openings Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Vacancies</span>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100/50 dark:border-emerald-900/30">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-gray-950 dark:text-white">
                  {loading ? "..." : stats.jobsCount}
                </h2>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +3.58%
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Open recruitment assignments</p>
            </div>

            {/* Admin Skills Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Skills Directory</span>
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center border border-amber-100/50 dark:border-amber-900/30">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-gray-950 dark:text-white">
                  {loading ? "..." : stats.skillsCount}
                </h2>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +12.4%
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Unique parsed skills tracked</p>
            </div>

            {/* Admin Cleaned Resumes Metric */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Cleaned Resumes</span>
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 rounded-2xl flex items-center justify-center border border-purple-100/50 dark:border-purple-900/30">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-gray-950 dark:text-white">
                  {loading ? "..." : stats.cleanedResumesCount}
                </h2>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +8.7%
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Anonymized database records</p>
            </div>
          </>
        )}
      </div>

      {/* ── Main Dashboard Body ── */}
      {role === 'CANDIDATE' ? (
        /* CANDIDATE DASHBOARD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2/3 width): Applications & Open Jobs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* My Active Applications Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">My Active Applications</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Real-time status of your submitted job applications</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/my-applications')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All Applications</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {candidateAppliedJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                        <th className="pb-3 pr-2">Job Title</th>
                        <th className="pb-3">Client / Partner</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Application Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {candidateAppliedJobs.map((app: any, idx: number) => (
                        <tr key={idx} className="text-xs sm:text-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                          <td className="py-4 pr-2">
                            <span className="block font-bold text-gray-950 dark:text-white">
                              {app.jobTitle}
                            </span>
                            <span className="block text-[11px] text-gray-400 mt-0.5">{app.jobType}</span>
                          </td>
                          <td className="py-4 font-semibold text-gray-600 dark:text-gray-300">
                            {app.client}
                          </td>
                          <td className="py-4 text-xs text-gray-500">
                            {app.location}
                          </td>
                          <td className="py-4">
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md ${
                              app.status === 'SHORTLISTED' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                              app.status === 'REVIEWED' ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                              app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                              'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No Applications Submitted Yet</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                    Explore active job vacancies available on the portal and submit your application with a single click.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/jobs')}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Browse Open Vacancies</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Recommended Openings */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">Featured Open Vacancies</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Explore recent job postings seeking candidates</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/jobs')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Browse All Jobs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3.5">
                {recentJobs.length > 0 ? (
                  recentJobs.slice(0, 4).map((job: any) => (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50/70 hover:bg-gray-50 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 border border-gray-100 dark:border-gray-800 rounded-2xl transition-all"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{job.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{job.client || job.company || "Hiring Partner"}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{job.location || "Remote"}</span>
                          <span>•</span>
                          <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md">{job.type ? job.type.replace('_', ' ') : 'Full Time'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/dashboard/jobs')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap self-end sm:self-center"
                      >
                        Apply Now
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">No open jobs available right now.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (1/3 width): Candidate Profile & Checklist */}
          <div className="space-y-6">
            
            {/* Candidate Profile Summary */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm uppercase">
                  {userName ? userName.charAt(0) : "C"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">{userName}</h4>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{userEmail}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Resume Format:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {stats.cleanedResumesCount > 0 ? "Cleaned PDF Ready" : candidateApps.length > 0 ? "Uploaded" : "Pending Upload"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Parsed Skills:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.skillsCount} Skills</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Applications:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.jobsCount} Submitted</span>
                </div>

                {candidateSkillsList.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Top Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidateSkillsList.slice(0, 6).map((sk, index) => (
                        <span key={index} className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push('/my-resume')}
                className="w-full mt-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200/70 dark:border-gray-700/70 rounded-xl text-xs font-bold transition-all cursor-pointer text-center block"
              >
                Manage My Resume Profile
              </button>
            </div>

            {/* Profile Readiness Checklist */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-950 dark:text-white">Profile Readiness</h3>
                <CheckSquare className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center gap-3 p-3 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    candidateApps.length > 0 ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}>
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Upload Professional Resume</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{candidateApps.length > 0 ? "Completed" : "Action required"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    stats.skillsCount > 0 ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}>
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Skill Parsing & Profile</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{stats.skillsCount > 0 ? `${stats.skillsCount} skills parsed` : "Pending parse"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    stats.jobsCount > 0 ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}>
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Submit Job Applications</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{stats.jobsCount > 0 ? `${stats.jobsCount} applications submitted` : "Explore open jobs"}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ADMIN / RECRUITER DASHBOARD VIEW */
        <>
          {/* ── High-Fidelity CRM Charts Row ── */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recruitment pipeline activities (Balance Overview) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 lg:col-span-2 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Recruitment Pipeline Overview</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Resume upload frequency vs successful candidate hiring activity</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md uppercase">Monthly</span>
                  </div>
                </div>
                <div className="h-72">
                  <Chart options={pipelineOverviewOptions} series={pipelineOverviewSeries} type="area" height="100%" />
                </div>
              </div>

              {/* Sourcing Channel Radar (Deal Type) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Candidate Sourcing Channels</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Radar tracking of applicant channels</p>
                  </div>
                </div>
                <div className="h-72 flex items-center justify-center">
                  <Chart options={sourcingRadarOptions} series={sourcingRadarSeries} type="radar" width="100%" height="270" />
                </div>
              </div>
            </div>
          )}

          {/* ── Recruitment Pipeline Tables Widget ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Candidates Pipeline (CRM Deals Status) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 lg:col-span-2 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Candidate Application Pipeline</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Overview of candidates currently undergoing client evaluation rounds</p>
                  </div>
                  <button
                    onClick={() => router.push('/candidates')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-550 uppercase">
                        <th className="pb-3 pr-2">Candidate</th>
                        <th className="pb-3">Hiring Client</th>
                        <th className="pb-3">Assigned Recruiter</th>
                        <th className="pb-3">Pipeline Stage</th>
                        <th className="pb-3">Activity Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {pipelineCandidates.map((cand) => (
                        <tr key={cand.id} className="text-xs sm:text-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                          <td className="py-4 pr-2">
                            <div>
                              <span className="block font-bold text-gray-950 dark:text-white">
                                {cand.name}
                              </span>
                              <span className="block text-[11px] text-gray-400 mt-0.5">{cand.targetJob}</span>
                            </div>
                          </td>
                          <td className="py-4 font-semibold text-gray-600 dark:text-gray-300">
                            {cand.client}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${cand.avatarBg} text-white flex items-center justify-center text-[10px] font-bold`}>
                                {cand.recruiter.charAt(0)}
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{cand.recruiter}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-md ${cand.stageColor}`}>
                              {cand.stage}
                            </span>
                          </td>
                          <td className="py-4 text-xs font-medium text-gray-450 dark:text-gray-550">
                            {cand.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recruiter Tasks Checklist (CRM Tasks) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Recruitment Checklist</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Tasks list of resume operations</p>
                  </div>
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="space-y-4.5 mt-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl cursor-pointer transition-all border border-gray-50/50 dark:border-gray-800/40"
                    >
                      <input
                        type="checkbox"
                        checked={task.checked}
                        onChange={() => { }}
                        className="w-4 h-4 mt-0.5 text-indigo-650 border-gray-300 dark:border-gray-700 rounded-sm focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold text-gray-800 dark:text-gray-200 ${task.checked ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>
                          {task.text}
                        </p>
                        <div className="flex gap-2 items-center mt-1 text-[10px] text-gray-450">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {task.date}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${task.status === "Completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" :
                              task.status === "In Progress" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" :
                                "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                            }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full text-center text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 mt-5 pt-3 border-t border-gray-50 dark:border-gray-850 hover:underline flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Configure Checklist Board</span>
              </button>
            </div>
          </div>

          {/* ── Placement Records & Activity Timeline Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Hires/Placements (Closing Deals) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 lg:col-span-2 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Recent Successful Placements</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Latest placements filled across client networks</p>
                  </div>
                  <button
                    onClick={() => router.push('/jobcreation')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View Job Requirements</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-555 uppercase">
                        <th className="pb-3">Close Date</th>
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3">Hiring Partner</th>
                        <th className="pb-3">Recruiter In Charge</th>
                        <th className="pb-3">Compensation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {placements.map((plc) => (
                        <tr key={plc.id} className="text-xs sm:text-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                          <td className="py-4 font-semibold text-gray-900 dark:text-white">
                            {plc.date}
                          </td>
                          <td className="py-4 font-bold text-indigo-600 dark:text-indigo-400">
                            {plc.candidate}
                          </td>
                          <td className="py-4 font-semibold text-gray-600 dark:text-gray-300">
                            {plc.client}
                          </td>
                          <td className="py-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {plc.recruiter}
                          </td>
                          <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {plc.compensation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recruitment Timeline Feed (Upcoming Activities) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">Interview Activities</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Recruiter actions & panel meetings schedule</p>
                  </div>
                  <Activity className="w-5 h-5 text-indigo-650" />
                </div>

                <div className="space-y-5 mt-4">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-3.5 items-start">
                      {/* Timeline representation */}
                      <div className="flex flex-col items-center justify-center w-11 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-extrabold text-[10px] shrink-0">
                        <span>{act.date.split(" ")[0]}</span>
                        <span className="text-[8px] text-gray-400 font-medium uppercase">{act.date.split(" ")[1]}</span>
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{act.title}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">{act.time}</p>

                        {/* Avatars count representation */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {[...Array(act.teamCount)].map((_, i) => (
                              <div key={i} className={`inline-block h-4.5 w-4.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${act.avatarBg} text-white flex items-center justify-center text-[7px] font-bold`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                          <span className="text-[9px] font-bold text-gray-400">+{act.teamCount} members</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full text-center text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 mt-5 pt-3 border-t border-gray-50 dark:border-gray-850 hover:underline flex items-center justify-center gap-1.5 cursor-pointer">
                <span>View Full Schedulers</span>
              </button>
            </div>
          </div>

          {/* ── Client Locations Widget ── */}
          {!loading && locationChartData.categories.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">Active Vacancies Locations</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Geographical distribution of job postings</p>
                </div>
              </div>
              <div className="h-64">
                <Chart options={locationBarOptions} series={[{ name: 'Jobs Available', data: locationChartData.data }]} type="bar" height="100%" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Resume Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <ResumeUploadForm closeModal={() => { closeModal(); fetchDashboardData(); }} />
      </Modal>

    </div>
  );
}