"use client"
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsersTable from "@/components/users/UsersTable";
import React, { useState } from "react";

export default function Users() {
  const [callApi, setCallAPi] = useState(false)

console.log(callApi,"callApi")

  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />
      <div className="space-y-6">
        <ComponentCard title="User Table" succes={()=>setCallAPi(!callApi)}>
          <UsersTable callApi={callApi} />
        </ComponentCard>
      </div>
    </div>
  );
}
