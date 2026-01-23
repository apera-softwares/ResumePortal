'use client';


import { useEffect, useState } from "react";


interface joblist {
  id: number;
  title: string; 
  client: string;
  description: string;
  skills: string[];
  salary: string;
  internalSalary?: string;
  location:string;
    type: string;
    cities: string[];
}


// Define the job listings data


export default function PublicJoblisting() {
 const [jobList ,setJobList]=useState<joblist[]>([]);
   const [appliedJobs, setAppliedJobs] =useState<number[]>([])
    const [searchitem, setSearchitem] = useState<string>('');
   const [filteredjobs , setFilterdJobs] =useState<joblist[]>(jobList);
  
      
 

  useEffect(()=>{
    const JobsData =async()=>{
      try{
        const response = await fetch("http://192.168.1.48:3003/jobs",{
          method:"GET",
        headers: {"Content-Type": "application/json"}
        });
        if(!response.ok) throw new Error("Somethig went wrong while fetch");
        const JobListData = await response.json();
        setJobList( JobListData.data)
        console.log(JobListData.data, " im job list ")
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    }
    JobsData()
  },[])
  // 👇 Add this effect
useEffect(() => {
  setFilterdJobs(jobList);
}, [jobList]);

     const handleSearch =()=>{ 
        if(searchitem?.trim() ===""){
            setFilterdJobs(jobList)
        }
        else{
         const result = jobList.filter((job)=>(
            job.title.toLowerCase().includes(searchitem.toLowerCase()) ||
          job.client.includes(searchitem.toLowerCase()) ||
          job.skills.some((skill) =>
            skill.toLowerCase().includes(searchitem.toLowerCase())
          )
         ))
          setFilterdJobs(result);
        }
       

     }
     const handleApply =(id:number)=>{
            setAppliedJobs((prev)=> prev.includes(id) ? prev.filter((jobsId)=> jobsId !== id)
        : [...prev ,id] )
            
     }

    return (
        <div className=" relative px-6 bg-gray-50 h-[100vh] overflow-y-hidden border-2 mt-1px">

            <div className="flex flex-col gap-4  mt-3 md:flex-row items-center  w-full sticky top-0  bg-gray-50   justify-between sm:pb-5 sm:pt-2  lg:px-8 lg:py-8 ">
                <h1 className="  sm:text-xl lg:text-3xl font-bold  text-gray-800">Avalable  Jobs</h1>
                <div className="searchbar h-[8vh] w-[80%] lg:w-[34vw] px-6 border  flex items-center justify-between rounded-4xl">

                    <input onChange={(e) => setSearchitem(e.target.value)} value={searchitem} type="text" name="search" placeholder="search by job title" className="w-[80%] outline-none py-2" />

                    <button onClick={handleSearch} className="w-[14vw] border py-2 rounded-4xl text-xs lg:text-sm bg-blue-600   hover:bg-blue-700 text-white font-regular "  > Search</button>
                </div> 
            </div>

            <div className="grid pb-10 overflow-y-scroll no-scrollbar  px-5 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-120px)]">
              {filteredjobs.length > 0 ? (
  filteredjobs.map((job) => (
    <div
      key={job.id}
      className="bg-white shadow-lg  rounded-2xl p-5 hover:shadow-xl    transition duration-300"
    >
      {/* Title + Type */}
      <div className="flex justify-between  items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
        <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
          {job.type}
        </span>
      </div>

      {/* Company Name */}
      <p className="text-sm text-gray-500 mb-3">{job.client}</p>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-3">{job.description}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {job.skills.map((skill, index) => (
          <span
            key={index}
            className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Salary Info */}
      <div className="text-sm mb-2">
        <strong>Salary:</strong> {job.salary}
      </div>
      {job.internalSalary && (
        <div className="text-sm text-gray-500">
          <strong>Internal Salary:</strong> {job.internalSalary}
        </div>
      )}

      {/* Location */}
      <div className="mt-3 text-sm">
        <strong>Location:</strong> {job.location}
      </div>

      {/* Apply Button */}
      <button onClick={()=>handleApply(job.id)} className={`mt-4 w-full  ${appliedJobs.includes(job.id) ? 'bg-gray-400':'bg-blue-500'} text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition`} >
    {appliedJobs.includes(job.id) ? "Applied" : "Apply"}
      </button>
    </div>
  ))
) : (
  <p className="text-gray-500 text-center">No jobs found</p>
)}

            </div>

        </div>
    );
}
