"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import EditResume from "@/components/UsersModels/resumeEditModel/EditResume";
import React, { useEffect, useState } from "react";

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  yearsOfExperience: number;
  education?: string;
  noticePeriod: number;
  resume: string;
  skills: { name: string }[];
}

export default function Candidates() {
   const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const role =localStorage.getItem("role")
  const [candidatesData, setCandidatesData] = useState<Candidate[]>([]);
  const [filtercandidate,setFiltercandidates]=useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltercandidates(candidatesData || []);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = candidatesData.filter((cand) => {
      const nameMatch = `${cand.firstName} ${cand.lastName}`.toLowerCase().includes(term);
      const emailMatch = cand.email.toLowerCase().includes(term);
      const mobileMatch = cand.mobile?.toLowerCase().includes(term) || false;
      const eduMatch = cand.education?.toLowerCase().includes(term) || false;
      const skillsMatch = cand.skills?.some((s) => s.name.toLowerCase().includes(term)) || false;
      const resumeTextMatch = (cand as any).resumeText?.toLowerCase().includes(term) || false;
      return nameMatch || emailMatch || mobileMatch || eduMatch || skillsMatch || resumeTextMatch;
    });
    setFiltercandidates(filtered);
  }, [searchTerm, candidatesData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/candidates`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error("Something went wrong while fetching candidates");
        }
        const data = await res.json();
        const candidatesArray = Array.isArray(data.data) ? data.data : data; 
        setCandidatesData(candidatesArray || []);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchData();
  }, []);

  const handleDelete =async(candidatesID : number)=>{
     if (!confirm("Are you sure you want to delete this job?")) return;
 const url =`${API_URL}/candidates/${candidatesID}`
  try{
       const res =await fetch(url , {
        method:"DELETE",
        headers:{'Content-Type': 'application/json'}
       });
       if(!res.ok)throw new Error("FAILD TO DELETE");
        setFiltercandidates((prev:any)=>prev.filter((cand:any)=> cand.id !==candidatesID ))
  }catch(error){
    console.error("Error deleting job:", error);
  }
  }

  return (
    <div className="min-h-[80vh] w-full flex flex-col gap-4">
      {/* Search Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-xl">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Candidates List
          </h3>
          <p className="text-xs text-gray-500">
            Search candidates by name, email, education, tagged skills, or keywords in their resume.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border min-h-[82vh] border-gray-200 bg-white  ">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px] ">
            <Table>
              {/* Header */}
              <TableHeader className="border-b  border-gray-200    ">
                <TableRow className="h-12 font-medium">
                  <TableCell isHeader className="font-medium">Candidate Name</TableCell>
                  <TableCell isHeader className="font-medium">Email</TableCell>
                  <TableCell isHeader className="font-medium">Mobile No</TableCell>
                  <TableCell isHeader className="font-medium">Years of Experience</TableCell>
                  <TableCell isHeader className="font-medium">Education</TableCell>
                  <TableCell isHeader className="font-medium">Skills</TableCell>
                  <TableCell isHeader className="font-medium">Resume</TableCell>
                  {role =="CLIENT"? "" :(<TableCell isHeader className="font-medium">Delete</TableCell>)}
                </TableRow>
              </TableHeader>

              {/* Body */}
              <TableBody className="divide-y divide-gray-100  mt-5">
                {filtercandidate.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-700 text-white rounded-full">
                          {user.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-sm text-gray-800 dark:text-white/90">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </div> 
                    </TableCell>

                    <TableCell   className=" font-sm text-gray-800 dark:text-white/90 text-center text-sm">{user.email}</TableCell>
                    <TableCell   className=" font-sm text-gray-800 dark:text-white/90 text-center text-sm">{user.mobile}</TableCell>
                    <TableCell   className=" font-sm text-gray-800 dark:text-white/90 text-center text-sm">{user.yearsOfExperience}</TableCell>
                    <TableCell   className=" font-sm text-gray-800 dark:text-white/90 text-center text-sm ">{user.education || "-"}</TableCell>

                    <TableCell className=" w-[16%]">
                      <div className="flex flex-wrap w-full  justify-center  m-auto gap-2">
                        {user.skills.length > 0 ? (
                          user.skills.map((s, i) => (
                            <span key={i} className="bg-gray-100 px-2 py-1 rounded-md text-xs">
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className=" mt-5 flex  justify-center " >
                      <EditResume resume={user.resume} />
                    </TableCell>

                    <TableCell >
                      {role == "CLIENT" ?"":( <button onClick={()=>handleDelete(user?.id)} className="px-3 py-1 rounded-2xl text-xs bg-red-500 text-white">
                        Delete
                      </button>) }
                     
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
