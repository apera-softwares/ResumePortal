"use client"
import UsersTable from "@/components/users/UsersTable";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Users() {
  const [callApi, setCallAPi] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="pt-6 px-4 sm:px-6">
      <div className="space-y-6">
        <UsersTable callApi={callApi} setCallApi={setCallAPi} />
      </div>
    </div>
  );
}
