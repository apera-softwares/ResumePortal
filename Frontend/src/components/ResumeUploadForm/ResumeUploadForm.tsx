import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from 'react-select';
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


export default function ResumeUploadForm({closeModal, jobId, onApplySuccess} : {closeModal: () => void; jobId?: number | null; onApplySuccess?: (jobId: number) => void} ) {
   const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");
  const [candidData, setcanditData] = useState<any[]>([]);
     const [selectedOption, setSelectedOption] = useState<any[]>([]);
     const [isDark, setIsDark] = useState(false);

     useEffect(() => {
       if (typeof window !== "undefined") {
         setIsDark(document.documentElement.classList.contains("dark"));
         
         const observer = new MutationObserver(() => {
           setIsDark(document.documentElement.classList.contains("dark"));
         });
         observer.observe(document.documentElement, {
           attributes: true,
           attributeFilter: ["class"],
         });
         return () => observer.disconnect();
       }
     }, []);

         const handleSkillsChange = (selected: any) => {
      const values = selected ? selected.map((opt: any) => opt.value) : [];
      setFormData((prev) => ({ ...prev, skills: values }));
    };
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    yearsOfExperience: "",
    education: "",
    noticePeriod: "",
    resume: null as File | null,
    skills: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    mobile: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "mobile") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 10) return;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      setErrors((prev) => ({ ...prev, mobile: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors as user types
    if (name === "email" || name === "mobile") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        resume: file,
      }));
    }
  };

  const validate = () => {
    let isValid = true;
    const tempErrors = { email: "", mobile: "" };

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    const mobileRegex = /^\d{10}$/;
    if (!formData.mobile.trim()) {
      tempErrors.mobile = "Mobile number is required";
      isValid = false;
    } else if (!mobileRegex.test(formData.mobile)) {
      tempErrors.mobile = "Mobile number must be exactly 10 digits";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    
    const token = localStorage.getItem("token");

    const bodyData = new FormData();
   Object.entries(formData).forEach(([key, value]) => {
  if (value !== null) {
    // If the field is "resume", backend expects it as "file"
    if (key === "resume") {
      bodyData.append("file", value );
    } else {
      bodyData.append(key, value as any);
    }
  }
});
    
    if (jobId) {
      bodyData.append("jobId", String(jobId));
    }
     console.log("bodyData",bodyData)
    try {
      const response = await fetch(`${API_URL}/candidates/uploadMedia`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: bodyData,
      });
           console.log(bodyData,"im bodydata ")
      if (!response.ok) throw new Error("Something went wrong");

      const createdCandidate = await response.json();
      setcanditData((prev) => [...(prev || []), createdCandidate]);

     
      setFormData({

        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        yearsOfExperience: "",
        education: "",
        noticePeriod: "",
        resume: null,
        skills: "",
      });

      toast.success("Resume uploaded successfully!");
      
      // Save email and applied job ID to localStorage to track status and persist applied state
      if (formData.email) {
        localStorage.setItem("candidateEmail", formData.email);
      }
      if (jobId) {
        const storedApplied = localStorage.getItem("appliedJobIds");
        const appliedList = storedApplied ? JSON.parse(storedApplied) : [];
        if (!appliedList.includes(jobId)) {
          localStorage.setItem("appliedJobIds", JSON.stringify([...appliedList, jobId]));
        }
      }

      if (jobId && onApplySuccess) {
        onApplySuccess(jobId);
      }
      closeModal()
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Resume upload failed.");
    }
  };

      const [skills ,setSkills]=useState([])
        useEffect(()=>{
          const fetchSkills =async()=>{
            try{
              const res=await fetch(`${API_URL}/skills`,{
                    method:"GET",
                    headers:{"Content-Type": "application/json"}
                  });
                  if(!res.ok)throw new Error("somethig went wrong");
                  const Data= await res.json();
                  setSkills(Data);
            }catch(error){
              console.error("error while getting skills")
            }
          }
    fetchSkills()
        },[])

  const customSelectStyles = {
    control: (provided: any, state: any) => {
      return {
        ...provided,
        backgroundColor: isDark ? '#1f2937' : '#ffffff', // gray-800 or white
        borderColor: state.isFocused
          ? '#3b82f6' // blue-500
          : isDark
          ? '#374151' // gray-700
          : '#e5e7eb', // gray-200
        borderRadius: '0.75rem', // rounded-xl
        padding: '2px 4px',
        fontSize: '0.875rem', // text-sm
        boxShadow: state.isFocused
          ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
          : 'none',
        '&:hover': {
          borderColor: isDark ? '#4b5563' : '#d1d5db',
        },
        transition: 'all 0.2s ease',
      };
    },
    menu: (provided: any) => {
      return {
        ...provided,
        backgroundColor: isDark ? '#111827' : '#ffffff', // gray-900 or white
        borderRadius: '0.75rem',
        border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        zIndex: 9999,
      };
    },
    menuList: (provided: any) => {
      return {
        ...provided,
        maxHeight: '180px',
        padding: '4px',
        scrollbarWidth: 'thin' as any, // Firefox
        scrollbarColor: isDark ? '#4b5563 transparent' : '#cbd5e1 transparent', // Firefox
        '&::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: isDark ? '#374151' : '#cbd5e1',
          borderRadius: '9999px',
          border: '1px solid transparent',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: isDark ? '#4b5563' : '#94a3b8',
        },
      };
    },
    option: (provided: any, state: any) => {
      return {
        ...provided,
        backgroundColor: state.isSelected
          ? '#3b82f6'
          : state.isFocused
          ? isDark
            ? '#1f2937' // gray-800
            : '#f3f4f6' // gray-100
          : 'transparent',
        color: state.isSelected
          ? '#ffffff'
          : isDark
          ? '#f9fafb' // gray-50
          : '#111827', // gray-900
        padding: '8px 12px',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        cursor: 'pointer',
        '&:active': {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
        },
        transition: 'all 0.15s ease',
      };
    },
    multiValue: (provided: any) => {
      return {
        ...provided,
        backgroundColor: isDark ? '#374151' : '#e5e7eb', // gray-700 or gray-200
        borderRadius: '0.375rem',
        padding: '2px 6px',
      };
    },
    multiValueLabel: (provided: any) => {
      return {
        ...provided,
        color: isDark ? '#f9fafb' : '#111827',
        fontSize: '0.75rem',
        fontWeight: '500',
      };
    },
    multiValueRemove: (provided: any) => {
      return {
        ...provided,
        color: isDark ? '#9ca3af' : '#4b5563',
        '&:hover': {
          backgroundColor: isDark ? '#4b5563' : '#d1d5db',
          color: isDark ? '#f9fafb' : '#111827',
        },
        borderRadius: '0.25rem',
        transition: 'all 0.15s ease',
      };
    },
    placeholder: (provided: any) => {
      return {
        ...provided,
        color: isDark ? '#6b7280' : '#9ca3af',
        fontSize: '0.875rem',
      };
    },
  };

  return (
    <div className="relative w-full p-2 sm:p-4">
      <div className="px-2 pr-14">
        <h4 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Upload Resume
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          Fill in your details and upload your resume for review.
        </p>
      </div>

      <form className="flex flex-col justify-start" onSubmit={handlSubmit}>
        <div className="custom-scrollbar max-h-[60vh] md:max-h-[70vh] overflow-y-auto px-2 pb-3">
            <div className="mt-7">
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Candidate Information
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.email}</p>
                  )}
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Mobile</Label>
                  <Input
                    type="text"
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                  />
                  {errors.mobile && (
                    <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.mobile}</p>
                  )}
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Yrs Of Exp</Label>
                  <Input
                    type="number"
                    name="yearsOfExperience"
                    placeholder="e.g. 5"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Notice Period</Label>
                  <Input
                    type="number"
                    name="noticePeriod"
                    placeholder="e.g. 30"
                    value={formData.noticePeriod}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Education</Label>
                  <Input
                    type="text"
                    name="education"
                    placeholder="e.g. B.Tech in Computer Science"
                    value={formData.education}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Skills</Label>
                 <Select
                  name="skills"
                  defaultValue={selectedOption|| undefined}
                  onChange={handleSkillsChange}
                  options={skills.map((skill: any) => ({
                    value: skill.name,
                    label: skill.name,
                  }))}
                  isMulti
                  styles={customSelectStyles}
                />
                </div>

                <div className="col-span-2">
                  <Label>Upload Resume (PDF/DOC)</Label>
                  <Input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200"
            >
              Save & Upload
            </button>
          </div>
        </form>
    </div>
  );
}
