  "use client"

  import Joblisting from '@/components/joblisting/Joblisting';
  import { Modal } from '@/components/ui/modal';
  import { useModal } from '@/hooks/useModal';
  import Select from 'react-select';
  import React, { useEffect, useState } from 'react';
  import toast from 'react-hot-toast';
  import { useTheme } from '@/context/ThemeContext';

  const clients = ["CloudSphere Technologies", "PixelCraft Studio", "PeopleFirst HR"];
  const majorCities = ["REMOTE", "MUMBAI", "DELHI", "BANGALORE", "HYDERABAD", "CHENNAI", "PUNE"];
  const jobTypes = ["FULL_TIME", "INTERN", "CONTRACT", "FREELANCING"]
  // const options = [
  //   { value: 'Js', label: 'Js' },
  //   { value: 'nodeJs', label: 'nodeJs' },
  //   { value: 'React', label: 'React' },
  //   { value: 'SCSS', label: 'SCSS' },
  // ];

  interface Job {
    id: number;
    company: string;
    title: string;
    description: string;
    client: string;
    skills: string[];
    internalSalary: number;
    salary: number;
    location: string;
    type: string;
  }

  export default function JobsCreation() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const selectStyles = {
      control: (base: any) => ({
        ...base,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#d1d5db',
        color: isDark ? '#ffffff' : '#111827',
        borderRadius: '0.5rem',
        padding: '0.125rem',
      }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#d1d5db',
      }),
      option: (base: any, { isFocused, isSelected }: any) => ({
        ...base,
        backgroundColor: isSelected
          ? '#2563eb'
          : isFocused
          ? (isDark ? '#374151' : '#f3f4f6')
          : 'transparent',
        color: isSelected ? '#ffffff' : (isDark ? '#e5e7eb' : '#111827'),
        cursor: 'pointer',
      }),
      multiValue: (base: any) => ({
        ...base,
        backgroundColor: isDark ? '#374151' : '#e5e7eb',
      }),
      multiValueLabel: (base: any) => ({
        ...base,
        color: isDark ? '#ffffff' : '#111827',
      }),
      multiValueRemove: (base: any) => ({
        ...base,
        color: isDark ? '#9ca3af' : '#4b5563',
        ':hover': {
          backgroundColor: isDark ? '#4b5563' : '#d1d5db',
          color: isDark ? '#ffffff' : '#111827',
        },
      }),
      singleValue: (base: any) => ({
        ...base,
        color: isDark ? '#ffffff' : '#111827',
      }),
      input: (base: any) => ({
        ...base,
        color: isDark ? '#ffffff' : '#111827',
      }),
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { isOpen, openModal, closeModal } = useModal();
    const [jData, setJData] = useState<Job[]>([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [formData, setFormData] = useState({
      title: "",
      description: "",
      client: "",
      skills: [],
      salary: 0,
      internalSalary: 0,
      location: "",
      type: "",
    });

    const handleChnage = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: name === "salary" || name === "internalSalary" ? Number(value) : value,
      }));
    }

    const handleSkillsChange = (selected: any) => {
      const values = selected ? selected.map((opt: any) => opt.value) : [];
      setFormData((prev) => ({ ...prev, skills: values }));
    };

    const handlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formData.skills || formData.skills.length === 0) {
        toast.error("Please select at least one skill.");
        return;
      }
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${API_URL}/jobs/create`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            Array.isArray(errorData.message)
              ? errorData.message.join(", ")
              : errorData.message || "Failed to create job"
          );
        }

        const CreateJobData = await response.json();
        // Add new job to the list immediately
        setJData((prev) => [...prev, CreateJobData.data]);
        toast.success("Job created successfully!");

        // Reset form
        setFormData({
          title: "",
          description: "",
          client: "",
          skills: [],
          salary: 0,
          internalSalary: 0,
          location: "",
          type: "",
        });
        setSelectedOption(null);

        closeModal();
      } catch (error: any) {
        console.error("Error creating Job:", error);
        toast.error(error.message || "Error creating Job");
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
    useEffect(() => {
      const fetchJobs = async () => {
        try {
          const res = await fetch(`${API_URL}/jobs`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) throw new Error("Something went wrong");

          const jobsData = await res.json();
          setJData(jobsData.data);
        } catch (error) {
          console.error("Error fetching jobs:", error);
        }
      };

      fetchJobs();
    }, []);

    return (
      <>
        <div className="px-6 py-5 flex justify-end items-center">
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z" />
            </svg>
            Create Job
          </button>

          <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
            <div className="relative w-full flex max-w-[700px] rounded-3xl bg-white dark:bg-gray-900 p-4 lg:p-11">
              <div className="max-w-2xl w-full mx-auto bg-white dark:bg-gray-950 h-[75vh] overflow-y-scroll custom-scrollbar shadow-md rounded-2xl p-6 mt-8 border border-gray-100 dark:border-gray-800/80">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Add Job Listing</h2>
                <form onSubmit={handlSubmit} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Job Title</label>
                    <input
                      type="text"
                      name="title"
                      onChange={handleChnage}
                      placeholder="Enter job title"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Description</label>
                    <textarea
                      name="description"
                      onChange={handleChnage}
                      placeholder="Enter job description"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      rows={4}
                      required
                    ></textarea>
                  </div>

                  {/* Client */}
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Client</label>
                    <select
                      name="client"
                      onChange={handleChnage}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="" className="text-gray-500">Select Client</option>
                      {clients.map((client) => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Skills</label>
                    <Select
                      name="skills"
                      defaultValue={selectedOption}
                      onChange={handleSkillsChange}
                      options={skills.map((skill: any) => ({
                        value: skill.name,
                        label: skill.name,
                      }))}
                      isMulti
                      styles={selectStyles}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Salary</label>
                      <input
                        type="number"
                        name="salary"
                        onChange={handleChnage}
                        placeholder="e.g. 80000"
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Internal Salary</label>
                      <input
                        type="number"
                        name="internalSalary"
                        onChange={handleChnage}
                        placeholder="e.g. 100000"
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Location</label>
                    <select
                      name="location"
                      onChange={handleChnage}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="" className="text-gray-500">Select Location</option>
                      {majorCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Job Type</label>
                    <Select
                      name="type"
                      onChange={(selected: any) =>
                        setFormData(prev => ({ ...prev, type: selected.value }))
                      }
                      options={jobTypes.map((type) => ({
                        value: type,
                        label: type,
                      }))}
                      styles={selectStyles}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition-all"
                  >
                    Create Job
                  </button>
                </form>
              </div>
            </div>
          </Modal>
        </div>

        <Joblisting jData={jData} />
      </>
    )
  }
