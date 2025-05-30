"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SearchIcon, EyeIcon, DownloadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"

export default function RequestsTable({ limit }) {
  const router = useRouter()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  // Fetch requests from the backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:8000/admin/requests', {
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch requests')
        }
        const data = await response.json()
        setRequests(data)
      } catch (error) {
        console.error('Error fetching requests:', error)
        setError('Failed to fetch requests')
      } finally {
        setLoading(false)
      }
    }

    if (user?.token) {
      fetchRequests()
    }
  }, [user?.token])

  // Filter requests based on search term
  const filteredRequests = requests.filter(
    (request) =>
      request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Limit the number of requests shown if limit is provided
  const displayedRequests = limit ? filteredRequests.slice(0, limit) : filteredRequests

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
        return "success"
      case "in-progress":
        return "default"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleViewRequest = (requestId) => {
    router.push(`/requests/${requestId}`)
  }

  if (!user || user.role !== "admin") {
    return <div>Access denied</div>
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!limit && (
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Keywords</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              displayedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="max-w-xs truncate">
                    <a
                      href={request.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {request.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {request.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                  </TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell>{request.requestedAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewRequest(request.id)}
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      {request.status === "completed" && (
                        <Button variant="ghost" size="icon">
                          <DownloadIcon className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
