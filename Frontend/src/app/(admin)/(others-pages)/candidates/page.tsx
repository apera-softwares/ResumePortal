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
  const role =localStorage.getItem("role")
  const [candidatesData, setCandidatesData] = useState<Candidate[]>([]);

   const [filtercandidate,setFiltercandidates]=useState(candidatesData)
 
     useEffect(()=>{
      setFiltercandidates(candidatesData||[]);
     },[candidatesData])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://192.168.1.48:3003/candidates", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error("Something went wrong while fetching candidates");
        }
        const data = await res.json();
        const candidatesArray = Array.isArray(data.data) ? data.data : data; // handles both cases
setCandidatesData(candidatesArray || []);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchData();
  }, []);

  const handleDelete =async(candidatesID : number)=>{
     if (!confirm("Are you sure you want to delete this job?")) return;
 const url =`http://192.168.1.48:3003/candidates/${candidatesID}`
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
    <div className="min-h-[80vh] w-full">
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
