'use client';

import { useEffect, useState } from "react";



export default function Joblisting({ jData }: any) {
  const [searchitem, setSearchitem] = useState<string>('');

  const [filteredjobs, setFilterdJobs] = useState(jData);
 
useEffect(() => {
    setFilterdJobs(jData || []);
  }, [jData]);

  const handleDelete=async(jobid :Number)=>{
    if (!confirm("Are you sure you want to delete this job?")) return;
      const token = localStorage.getItem("token");
    const idUrl = `http://192.168.1.48:3003/jobs/${jobid}`;
      try{
        const res = await  fetch(idUrl , {
          method:"DELETE",
          headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        });
        if(!res.ok){
          throw new Error("failed to Delete");
        }
        setFilterdJobs((prev:any)=>prev.filter((job:any)=>job.id !== jobid));
      }catch(error){
  console.error("Error deleting job:", error);
      }
  }
  // const handleSearch = () => {
  //   if (searchitem?.trim() === "") {
  //     setFilterdJobs(jData)
  //   }
  //   else {
  //     const result = jData.filter((job: any) => (
  //       job.title.toLowerCase().includes(searchitem.toLowerCase()) ||
  //       job.company.toLowerCase().includes(searchitem.toLowerCase()) ||
  //       job.skills.some((skill: any) =>
  //         skill.toLowerCase().includes(searchitem.toLowerCase())
  //       )
  //     ))
  //     setFilterdJobs(result);

  //   }
  //   console.log(filteredjobs, " im filtered result")
  // }



  return (
    <div className=" relative px-6 bg-[#FFFFFF] min-h-[70vh] overflow-y-hidden overflow-y-scroll border-2 rounded-2xl mt-1px">

      <div className="flex flex-col gap-4   mt-3 md:flex-row items-center  w-full sticky top-0    justify-between sm:pb-5 sm:pt-2  lg:px-8 lg:py-8 ">
        <h1 className="  sm:text-xl lg:text-3xl font-bold  text-gray-800"> Jobs</h1>
        {/* <div className="searchbar h-[8vh] w-[80%] lg:w-[34vw] px-6 border  flex items-center justify-between rounded-4xl">

          <input onChange={(e) => setSearchitem(e.target.value)} value={searchitem} type="text" name="search" placeholder="search by job title" className="w-[80%] outline-none py-2" />

          <button  className="w-[14vw] border py-2 rounded-4xl text-xs lg:text-sm bg-blue-600   hover:bg-blue-700 text-white font-regular "  > Search</button>
        </div> */}
      </div>

      <div className="grid pb-10 overflow-y-scroll no-scrollbar  px-5 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-120px)]">
        {filteredjobs.length > 0 ? (
          filteredjobs.map((job: any) => (
            <div
              key={job?.id}
              className="bg-[#fafafa] shadow-lg border-2 rounded-2xl p-5 hover:shadow-xl    transition duration-300"
            >
              {/* Title + Type */} 
              <div className="flex justify-between  items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{job?.title}</h2>
                <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {job?.type}
                </span>
              </div>

              {/* Company Name */}
              <p className="text-sm text-gray-500 mb-3">{job?.company}</p>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-3">{job?.description}</p>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {job?.skills.map((skill: any, index: any) => (
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
                <strong>Salary:</strong> {job?.salary}
              </div>
              {job?.internalSalary && (
                <div className="text-sm text-gray-500">
                  <strong>Internal Salary:</strong> {job?.internalSalary}
                </div>
              )}

              {/* Location */}
              {/* <div className="mt-3 text-sm">
                <strong>Location:</strong> {job?.location.type} ({job?.location.cities.join(", ")})
              </div> */}

              {/* Apply Button */}
              <button onClick={() => handleDelete(job?.id)} className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition">
                Delete Job
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
