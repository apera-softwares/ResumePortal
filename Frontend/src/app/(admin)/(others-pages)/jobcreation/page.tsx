  "use client"

  import Joblisting from '@/components/joblisting/Joblisting';
  import { Modal } from '@/components/ui/modal';
  import { useModal } from '@/hooks/useModal';
  import Select from 'react-select';
  import React, { useEffect, useState } from 'react';

  const clients = ["CloudSphere Technologies", "PixelCraft Studio", "PeopleFirst HR"];
  const majorCities = ["MUMBAI", "DELHI", "BANGALORE", '  HYDERABAD',"CHENNAI", "PUNE",];
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

  export default function jobscreation() {
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
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://192.168.1.48:3003/jobs/create", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error("Something went wrong");

        const CreateJobData = await response.json();
        // Add new job to the list immediately
        setJData((prev) => [...prev, CreateJobData.data]);

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
      } catch (error) {
        console.error("Error creating Job:", error);
      }
    };
    
      const [skills ,setSkills]=useState([])
      useEffect(()=>{
        const fetchSkills =async()=>{
          try{
            const res=await fetch("http://192.168.1.48:3003/skills",{
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
          const res = await fetch("http://192.168.1.48:3003/jobs", {
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
            <div className="relative w-full flex max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
              <div className="max-w-2xl mx-auto bg-white h-[75vh] overflow-y-scroll shadow-md rounded-2xl p-6 mt-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add Job Listing</h2>
                <form onSubmit={handlSubmit} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block mb-1 text-gray-700">Job Title</label>
                    <input
                      type="text"
                      name="title"
                      onChange={handleChnage}
                      placeholder="Enter job title"
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1 text-gray-700">Description</label>
                    <textarea
                      name="description"
                      onChange={handleChnage}
                      placeholder="Enter job description"
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
                      rows={4}
                      required
                    ></textarea>
                  </div>

                  {/* Client */}
                  <div>
                    <label className="block mb-1 text-gray-700">Client</label>
                    <select
                      name="client"
                      onChange={handleChnage}
                      className="w-full border rounded-lg p-2"
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map((client) => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">Skills</label>
                    <Select
  name="skills"
  defaultValue={selectedOption}
  onChange={handleSkillsChange}
  options={skills.map((skill: any) => ({
    value: skill.name,
    label: skill.name,
  }))}
  isMulti
/>

                    <p className="text-sm text-gray-500 mt-1">
                 
                    </p>
                  </div>

        
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-gray-700">Salary</label>
                      <input
                        type="number"
                        name="salary"
                        onChange={handleChnage}
                        placeholder="e.g. 80000"
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-700">Internal Salary</label>
                      <input
                        type="number"
                        name="internalSalary"
                        onChange={handleChnage}
                        placeholder="e.g. 100000"
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block mb-1 text-gray-700">Location</label>
                    <select
                      name="location"
                      onChange={handleChnage}
                      className="w-full border rounded-lg p-2"
                      required
                    >
                      <option value="">Select Location</option>
                      {majorCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Job Type */}
                  <div>
                <label className="block mb-1 text-gray-700">Job Type</label>
  <Select
    name="type"
    onChange={(selected: any) =>
      setFormData(prev => ({ ...prev, type: selected.value }))
    }
    options={jobTypes.map((type) => ({
      value: type,
      label: type,
    }))}
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
