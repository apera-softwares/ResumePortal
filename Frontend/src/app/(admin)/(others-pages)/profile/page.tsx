"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useUser } from "@/context/UserContext";

interface SkillItem {
  id: string;
  name: string;
}

interface CandidateSkill {
  id: string;
  skill: SkillItem;
}

export default function ProfilePage() {
  const router = useRouter();
  const { updateUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCandidateRecord, setHasCandidateRecord] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // User details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  // Candidate details
  const [mobile, setMobile] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">("");
  const [education, setEducation] = useState("");
  const [noticePeriod, setNoticePeriod] = useState<number | "">("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [expectedCtc, setExpectedCtc] = useState<number | "">("");
  const [currentCtc, setCurrentCtc] = useState<number | "">("");
  const [resumeFilename, setResumeFilename] = useState("");
  const [skills, setSkills] = useState<CandidateSkill[]>([]);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const { user, candidate } = result.data;

        setName(user.name || "");
        setEmail(user.email || "");
        setRole(user.role || "");
        updateUser({ name: user.name, email: user.email, role: user.role });

        if (candidate) {
          setHasCandidateRecord(true);
          setMobile(candidate.mobile || "");
          setYearsOfExperience(candidate.yearsOfExperience !== undefined ? candidate.yearsOfExperience : "");
          setEducation(candidate.education || "");
          setNoticePeriod(candidate.noticePeriod !== undefined ? candidate.noticePeriod : "");
          setCurrentLocation(candidate.currentLocation || "");
          setBudget(candidate.budget || "");
          setExpectedCtc(candidate.expectedCtc !== undefined ? candidate.expectedCtc : "");
          setCurrentCtc(candidate.currentCtc !== undefined ? candidate.currentCtc : "");
          setResumeFilename(candidate.resume || "");
          setSkills(candidate.skills || []);
        } else {
          setHasCandidateRecord(false);
        }
      } else {
        toast.error("Failed to load profile details.");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      toast.error("An error occurred loading your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const saveToast = toast.loading("Saving profile changes...");

    try {
      const token = localStorage.getItem("token");
      const payload: any = {
        name,
        email,
      };

      if (role === "CANDIDATE" && hasCandidateRecord) {
        payload.candidate = {
          mobile,
          yearsOfExperience: yearsOfExperience === "" ? 0 : Number(yearsOfExperience),
          education,
          noticePeriod: noticePeriod === "" ? 0 : Number(noticePeriod),
          currentLocation,
          budget,
          expectedCtc: expectedCtc === "" ? 0 : Number(expectedCtc),
          currentCtc: currentCtc === "" ? 0 : Number(currentCtc),
        };
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.dismiss(saveToast);
        toast.success("Profile updated successfully!");
        updateUser({ name, email });
        fetchProfile();
      } else {
        const errData = await response.json();
        toast.dismiss(saveToast);
        toast.error(errData.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.dismiss(saveToast);
      toast.error("An error occurred while saving changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    const uploadToast = toast.loading("Uploading and parsing your resume...");
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId") || "";

      const bodyData = new FormData();
      bodyData.append("file", file);
      
      const nameParts = name.trim().split(/\s+/);
      bodyData.append("firstName", nameParts[0] || "Candidate");
      bodyData.append("lastName", nameParts.slice(1).join(" ") || "User");
      bodyData.append("email", email);
      bodyData.append("mobile", mobile || "");
      bodyData.append("yearsOfExperience", String(yearsOfExperience || 0));
      bodyData.append("noticePeriod", String(noticePeriod || 0));
      if (userId) {
        bodyData.append("userId", userId);
      }

      const response = await fetch(`${API_URL}/candidates/uploadMedia`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: bodyData,
      });

      if (response.ok) {
        toast.dismiss(uploadToast);
        toast.success("Resume uploaded and parsed successfully!");
        fetchProfile();
      } else {
        const errData = await response.json();
        toast.dismiss(uploadToast);
        toast.error(errData.message || "Failed to upload resume.");
      }
    } catch (err) {
      console.error("Error uploading resume:", err);
      toast.dismiss(uploadToast);
      toast.error("An error occurred during upload.");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleResumeUpload(e.target.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 font-outfit">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xl max-w-sm w-full text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Loading Profile
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Please wait while we fetch your profile information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] w-full flex flex-col gap-6 font-outfit px-4 sm:px-6 py-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto w-full">
        
        {/* Profile Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-brand-500 via-indigo-600 to-purple-600 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden mb-6 border border-white/10">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
          <div className="space-y-2 z-10">
            <span className="bg-white/20 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {role} Profile
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold">{name || "User Profile"}</h1>
            <p className="text-indigo-100 text-xs md:text-sm max-w-md">
              Manage your personal details, contact information, and professional preferences.
            </p>
          </div>
          <div className="mt-4 md:mt-0 z-10 w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold text-white border border-white/10">
            {name ? name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>

        {/* Not Registered as Candidate: Welcome State */}
        {!hasCandidateRecord && role === "CANDIDATE" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Account Credentials Card */}
            <div className="md:col-span-1 bg-white dark:bg-gray-900 border border-gray-150/85 dark:border-gray-800/85 rounded-3xl p-6 shadow-xl shadow-gray-100/10 dark:shadow-none flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-3 mb-5">
                  Account Credentials
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      disabled
                      value={email}
                      placeholder="Email address"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="mt-6 w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-750 dark:text-gray-255 text-sm font-bold transition-all active:scale-[0.98]"
              >
                Update Credentials
              </button>
            </div>

            {/* Resume Upload Wizard (Drag-and-Drop) */}
            <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-150/85 dark:border-gray-800/85 rounded-3xl p-8 shadow-xl shadow-gray-100/10 dark:shadow-none flex flex-col items-center justify-center text-center">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-lg border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center ${
                  dragActive 
                    ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/5" 
                    : "border-gray-200 dark:border-gray-800 hover:border-brand-500 hover:bg-gray-50/50 dark:hover:bg-gray-950/40"
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                
                <div className="w-16 h-16 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Upload Your Resume
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-4 leading-relaxed">
                  Drag & drop your resume file here, or <span className="text-brand-600 dark:text-brand-400 font-semibold underline">browse local files</span>.
                  We support PDF, DOC, and DOCX formats.
                </p>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-950 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800/60">
                  Maximum file size: 10MB
                </span>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Your resume is securely stored and parsed automatically.</span>
              </div>
            </div>

          </div>
        ) : (
          /* Profile Details Form (Two-Column Layout) */
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Credentials & Resume Details */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Account Credentials */}
              <div className="bg-white dark:bg-gray-900 border border-gray-150/85 dark:border-gray-800/85 rounded-3xl p-6 shadow-xl shadow-gray-100/10 dark:shadow-none">
                <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-855 pb-3 mb-4">
                  Account Credentials
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      disabled
                      value={email}
                      placeholder="Email address"
                    />
                  </div>
                </div>
              </div>

              {/* Resume Status Card */}
              {role === "CANDIDATE" && (
                <div className="bg-white dark:bg-gray-900 border border-gray-150/85 dark:border-gray-800/85 rounded-3xl p-6 shadow-xl shadow-gray-100/10 dark:shadow-none">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-855 pb-3 mb-4">
                    Uploaded Resume
                  </h3>
                  <div className="flex items-start gap-3.5 bg-gray-50 dark:bg-gray-950/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 mb-4">
                    <div className="w-10 h-10 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">
                        {resumeFilename ? resumeFilename.substring(resumeFilename.indexOf("-") + 1) : "Resume.pdf"}
                      </span>
                      <span className="block text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mt-0.5">
                        Active Resume
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={`${API_URL}/uploads/${resumeFilename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Original File
                    </a>
                    
                    <button
                      type="button"
                      onClick={() => router.push("/my-resume")}
                      className="w-full py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:bg-brand-500/5 dark:hover:bg-brand-500/15 dark:text-brand-450 text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Fidelity Resume Editor
                    </button>

                    <button
                      type="button"
                      onClick={() => replaceFileInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-850 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                      </svg>
                      Replace Resume File
                    </button>
                    <input 
                      ref={replaceFileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Professional Details & Skills */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Professional Profile Form */}
              <div className="bg-white dark:bg-gray-900 border border-gray-150/85 dark:border-gray-800/85 rounded-3xl p-6 shadow-xl shadow-gray-100/10 dark:shadow-none">
                <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-855 pb-3 mb-5">
                  Professional Profile
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label>Mobile Number</Label>
                    <Input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter mobile number"
                    />
                  </div>

                  <div>
                    <Label>Current Location</Label>
                    <Input
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="e.g. Mumbai, Maharashtra"
                    />
                  </div>

                  <div>
                    <Label>Budget</Label>
                    <Input
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 5-7 LPA"
                    />
                  </div>

                  <div>
                    <Label>Notice Period (Days)</Label>
                    <Input
                      type="number"
                      value={noticePeriod === "" ? "" : String(noticePeriod)}
                      onChange={(e) => setNoticePeriod(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Notice period in days"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      step={0.1}
                      value={yearsOfExperience === "" ? "" : String(yearsOfExperience)}
                      onChange={(e) => setYearsOfExperience(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Years of experience"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label>Highest Education</Label>
                    <Input
                      type="text"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="e.g. B.Tech in Computer Science"
                    />
                  </div>

                  <div>
                    <Label>Current CTC (LPA)</Label>
                    <Input
                      type="number"
                      step={0.1}
                      value={currentCtc === "" ? "" : String(currentCtc)}
                      onChange={(e) => setCurrentCtc(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Current CTC in LPA"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label>Expected CTC (LPA)</Label>
                    <Input
                      type="number"
                      step={0.1}
                      value={expectedCtc === "" ? "" : String(expectedCtc)}
                      onChange={(e) => setExpectedCtc(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Expected CTC in LPA"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Parsed & Extracted Skills */}
              {skills.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-150/85 dark:border-gray-800/85 rounded-3xl p-6 shadow-xl shadow-gray-100/10 dark:shadow-none">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-855 pb-3 mb-4 flex items-center justify-between">
                    <span>Extracted Skills</span>
                    <span className="text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-brand-500/20">
                      {skills.length} Skills
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((cs) => (
                      <span
                        key={cs.id}
                        className="inline-block text-xs font-semibold px-3 py-1.5 bg-brand-500/5 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 rounded-xl border border-brand-500/10 dark:border-brand-500/10 hover:bg-brand-500/10 transition-all"
                      >
                        {cs.skill?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md disabled:opacity-50 flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {saving ? "Saving Changes..." : "Save Profile"}
                </button>
              </div>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}
