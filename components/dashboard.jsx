"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UserManagement from "@/components/user-management"
import WebsiteManagement from "@/components/website-management"
import RequestsTable from "@/components/requests-table"
import WebsiteRequestsTable from "@/components/website-requests-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import { userApi } from "@/lib/api"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users")
  const router = useRouter()
  const { user, token, logout } = useAuth()
  const [error, setError] = useState("")
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      router.push("/")
    }
    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersData, requestsData] = await Promise.all([
        userApi.getUsers(),
        userApi.getRequests(),
      ])
      setUsers(usersData)
      setRequests(requestsData)
      setError("")
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#253BAB]/5 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#253BAB]">WebScraperPro</span>
            <span className="bg-[#253BAB] text-white text-xs px-2 py-0.5 rounded-md">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-[#253BAB]">
                <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback className="bg-[#253BAB] text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-[#253BAB]">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {error && <p className="text-red-500 text-sm p-4">{error}</p>}

      <div className="flex-1 space-y-4 p-8 pt-6">
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
                <UserManagement users={users} />
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
                <RequestsTable requests={requests} />
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
