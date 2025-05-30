"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UserManagement from "@/components/user-management"
import WebsiteManagement from "@/components/website-management"
import XMLRequestsTable from "@/components/xml-requests-table"
import WebsiteRequestsTable from "@/components/website-requests-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import { userApi, adminApi } from "@/lib/api"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users")
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData()
    } else if (!user) {
        router.push("/")
    }
  }, [user, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersData, requestsData] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getAllRequests(),
      ])
      setUsers(usersData)
      setRequests(requestsData)
    } catch (err) {
      console.error("Error fetching admin data:", err)
      setError("Failed to fetch admin data. Please try again.")
      if (err.message?.includes("401") || err.message?.includes("403")) {
        logout()
      }
    } finally {
      setLoading(false)
    }
        }

  const handleCreateUser = async (userData) => {
    try {
      const newUser = await adminApi.createNewUser(userData)
      setUsers((prev) => [...prev, newUser])
      return true
    } catch (err) {
      console.error("Error creating user:", err)
      throw err
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      await adminApi.approveScrapingRequest(requestId)
      await fetchData()
    } catch (err) {
      console.error("Error approving request:", err)
      throw err
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await adminApi.rejectScrapingRequest(requestId)
      await fetchData()
    } catch (err) {
      console.error("Error rejecting request:", err)
      throw err
    }
  }

  const handleSignOut = () => {
    logout()
    router.push("/")
  }

  if (!user || user.role !== "admin") {
    return null // Let the AdminPage component handle the redirect
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#253BAB]/5 to-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#253BAB]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#253BAB]/5 to-white">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#253BAB]">WebScraperPro</span>
            <span className="bg-[#253BAB] text-white text-xs px-2 py-0.5 rounded-md">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-[#253BAB]">
                <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-[#253BAB] text-white">
                  {user.name?.split(" ").map(n => n[0]).join("") || "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.name || user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email || "Admin User"}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut} className="text-[#253BAB]">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-8 pt-6">
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-[#253BAB]">Web Scraping Admin Dashboard</h2>
        </div>
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-[#253BAB]/10">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#253BAB] data-[state=active]:text-white">
              User Management
            </TabsTrigger>
            <TabsTrigger value="websites" className="data-[state=active]:bg-[#253BAB] data-[state=active]:text-white">
              Website Management
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-[#253BAB] data-[state=active]:text-white">
              Scraping Requests
            </TabsTrigger>
            <TabsTrigger
              value="website-requests"
              className="data-[state=active]:bg-[#253BAB] data-[state=active]:text-white"
            >
              Website Requests
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="space-y-4">
            <Card className="border-[#253BAB]/20 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#253BAB]/20 to-white">
                <CardTitle className="text-[#0E0E0E]">User Management</CardTitle>
                <CardDescription>Create, view, and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement
                  users={users}
                  onCreateUser={handleCreateUser}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="websites" className="space-y-4">
            <Card className="border-[#253BAB]/20 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#253BAB]/20 to-white">
                <CardTitle className="text-[#0E0E0E]">Website Management</CardTitle>
                <CardDescription>Add and manage websites for scraping</CardDescription>
              </CardHeader>
              <CardContent>
                <WebsiteManagement />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="requests" className="space-y-4">
            <Card className="border-[#253BAB]/20 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#253BAB]/20 to-white">
                <CardTitle className="text-[#0E0E0E]">Scraping Requests</CardTitle>
                <CardDescription>View and manage all scraping requests</CardDescription>
              </CardHeader>
              <CardContent>
                <XMLRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="website-requests" className="space-y-4">
            <Card className="border-[#253BAB]/20 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#253BAB]/20 to-white">
                <CardTitle className="text-[#0E0E0E]">Website Requests</CardTitle>
                <CardDescription>Review and approve website requests from users</CardDescription>
              </CardHeader>
              <CardContent>
                <WebsiteRequestsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}