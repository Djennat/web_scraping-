"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import AdminDashboard from "@/components/admin-dashboard"
import { adminApi } from "@/lib/api"

export default function Admin() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [adminVerified, setAdminVerified] = useState(false)
  const [verifyingAdmin, setVerifyingAdmin] = useState(true)

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        // Quick check based on user context
        if (!user || user.role !== "admin") {
          console.log("User is not admin based on context. Redirecting...");
          router.push("/");
          return;
        }

        // Extra verification through API
        const isAdmin = await adminApi.checkAdminAccess();
        console.log("Admin API verification result:", isAdmin);
        
        if (!isAdmin) {
          console.log("Admin API access denied. Redirecting...");
          router.push("/");
          return;
        }
        
        setAdminVerified(true);
      } catch (error) {
        console.error("Admin verification error:", error);
        router.push("/");
      } finally {
        setVerifyingAdmin(false);
      }
    };

    if (!loading) {
      verifyAdmin();
    }
  }, [user, loading, router]);

  // Show nothing during the loading states
  if (loading || verifyingAdmin || !user || !adminVerified) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#253BAB]/5 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#253BAB]"></div>
        <p className="mt-4 text-[#253BAB]">Verifying admin access...</p>
      </div>
    );
  }

  return <AdminDashboard />
}