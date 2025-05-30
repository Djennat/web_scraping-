"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { adminApi } from "@/lib/api"
import { API_ENDPOINTS } from "@/config/api"

export default function XMLRequestsTable() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [user])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      if (!API_ENDPOINTS?.XML_REQUESTS) {
        throw new Error("API endpoint not configured")
      }

      console.log('Fetching XML requests from:', API_ENDPOINTS.XML_REQUESTS);
      const data = await adminApi.getXMLRequests();
      console.log('Raw response data:', data);
      
      if (!data) {
        throw new Error('No data received from server');
      }
      
      if (!Array.isArray(data)) {
        console.error('Expected array of requests but got:', typeof data, data);
        throw new Error('Invalid data format received from server');
      }
      
      setRequests(data);
      setError('');
    } catch (err) {
      console.error("Error fetching XML requests:", err);
      if (err.message.includes("No authentication token found")) {
        setError("Please log in again to view XML requests");
      } else {
        setError(err.message || "Failed to fetch XML requests. Please try again.");
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = requests.filter(
    (request) =>
      request.website_url?.some(url => url.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.request_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#253BAB]"></div>
        <p className="text-sm text-gray-500">Loading XML requests...</p>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && !loading)) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        {!user ? "Please refresh the page or log in again to view XML requests." : "Access denied. Admin privileges required."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={fetchRequests} 
            className="ml-4 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            className="pl-8 border-[#253BAB]/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-[#253BAB]/20">
        <Table>
          <TableHeader className="bg-[#253BAB]/5">
            <TableRow>
              <TableHead className="text-[#0E0E0E]">Website URLs</TableHead>
              <TableHead className="text-[#0E0E0E]">Request ID</TableHead>
              <TableHead className="text-[#0E0E0E]">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#253BAB]"></div>
                    <p className="text-sm text-gray-500">Loading XML requests...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  {error ? (
                    <div className="text-red-500">{error}</div>
                  ) : (
                    <div className="text-gray-500">No XML requests found</div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request._id} className="hover:bg-[#253BAB]/5">
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {request.website_url?.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#253BAB] hover:underline"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{request.request_id}</TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 