"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckIcon, EyeIcon, SearchIcon, XIcon } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { adminApi } from "@/lib/api"

export default function WebsiteRequestsTable() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)
  const [xmlContent, setXmlContent] = useState(null)

  useEffect(() => {
    fetchRequests()
    fetchXmlContent()
  }, [])

  const fetchXmlContent = async () => {
    try {
      const response = await fetch('/websites.xml')
      const text = await response.text()
      setXmlContent(text)
    } catch (err) {
      console.error("Error fetching XML:", err)
    }
  }

  const updateXmlFile = async (request, action) => {
    try {
      // Get current XML content
      const response = await fetch('/websites.xml')
      const xmlText = await response.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, "text/xml")
      const websitesElement = xmlDoc.getElementsByTagName("websites")[0]

      if (action === 'add') {
        // Extract website name from URL
        const websiteName = request.url.replace(/^https?:\/\//, '').replace(/\/$/, '')

        // Create new site XML content
        const newSiteXml = `<site>
        <name>${websiteName}</name>
        <url>${request.url}</url>
    </site>`

        // Append the new site to existing XML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = newSiteXml
        const newSiteElement = tempDiv.firstElementChild
        websitesElement.appendChild(newSiteElement)

        // Convert to string
        const serializer = new XMLSerializer()
        const updatedXmlString = serializer.serializeToString(xmlDoc)

        // Send the updated XML to the backend
        const updateResponse = await fetch('/api/websites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            xmlContent: updatedXmlString
          })
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update XML file')
        }
      }

      return true
    } catch (err) {
      console.error("Error updating XML:", err)
      throw new Error("Failed to update XML file")
    }
  }

  const fetchRequests = async () => {
    try {
      const data = await adminApi.getAllRequests()
      // Transform the data to match our UI needs
      const transformedData = data.map(req => ({
        id: req.id,
        name: req.website_url.split('/').pop() || req.website_url,
        url: req.website_url,
        requestedBy: req.user_id,
        requestedAt: new Date(req.requested_at).toLocaleString(),
        status: req.status || 'pending',
        reviewedAt: req.approved_at || req.rejected_at || null
      }))
      setRequests(transformedData)
    } catch (err) {
      console.error("Error fetching website requests:", err)
      setError("Failed to fetch website requests")
    } finally {
      setLoading(false)
    }
  }

  const approveRequest = async (requestId) => {
    try {
      // Find the request to be approved
      const request = requests.find(r => r.id === requestId)
      if (!request) {
        throw new Error("Request not found")
      }

      // Extract website name from URL
      const websiteName = request.url.replace(/^https?:\/\//, '').replace(/\/$/, '')

      // Create XML content for the new site
      const xmlContent = `    <site>
        <name>${websiteName}</name>
        <url>${request.url}</url>
    </site>`

      // First approve in the backend using admin endpoint
      await adminApi.approveScrapingRequest(requestId)

      // Then update XML file
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: websiteName,
          url: request.url,
          xmlContent: xmlContent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update XML file')
      }

      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved', reviewedAt: new Date().toLocaleString() }
            : req
        )
      )

      // Close the details dialog if it's open
      setIsDetailsDialogOpen(false)
      
      setSuccess("Request approved and website added successfully")
    } catch (err) {
      console.error("Error approving request:", err)
      setError(err.message || "Failed to approve request")
    }
  }

  const rejectRequest = async (requestId) => {
    try {
      // Find the request to be rejected
      const request = requests.find(r => r.id === requestId)
      if (!request) {
        throw new Error("Request not found")
      }

      // Update local state first
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected', reviewedAt: new Date().toLocaleString() }
            : req
        )
      )

      // Reject in backend
      await adminApi.rejectScrapingRequest(requestId)

      // Close the details dialog if it's open
      setIsDetailsDialogOpen(false)
      
      setSuccess("Request rejected successfully")
    } catch (err) {
      console.error("Error rejecting request:", err)
      setError(err.message || "Failed to reject request")
    }
  }

  // Filter requests based on search term
  const filteredRequests = requests.filter(
    (request) =>
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success"
      case "pending":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500 text-white"
      case "rejected":
        return "bg-red-500 text-white"
      case "pending":
        return "bg-[#253BAB] text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const viewRequestDetails = (request) => {
    setSelectedRequest(request)
    setIsDetailsDialogOpen(true)
  }

  const renderTableRow = (request) => (
    <TableRow key={request.id} className="hover:bg-[#253BAB]/5">
      <TableCell className="font-medium">{request.name}</TableCell>
      <TableCell>
        <a
          href={request.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#253BAB] hover:underline"
        >
          {request.url}
        </a>
      </TableCell>
      <TableCell>{request.requestedBy}</TableCell>
      <TableCell>{request.requestedAt}</TableCell>
      <TableCell>
        <Badge className={getStatusBadgeClass(request.status)}>
          {request.status.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => viewRequestDetails(request)}>
            <EyeIcon className="h-4 w-4 text-[#253BAB]" />
            <span className="sr-only">View Details</span>
          </Button>

          {request.status.toLowerCase() === "pending" && (
            <>
              <Button variant="ghost" size="icon" onClick={() => approveRequest(request.id)}>
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span className="sr-only">Approve</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={() => rejectRequest(request.id)}>
                <XIcon className="h-4 w-4 text-red-500" />
                <span className="sr-only">Reject</span>
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )

  const renderDialogContent = () => (
    selectedRequest && (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#253BAB]/5 p-3 rounded-lg">
            <p className="text-sm font-medium text-[#253BAB]">Website Name</p>
            <p className="font-medium">{selectedRequest.name}</p>
          </div>
          <div className="bg-[#253BAB]/5 p-3 rounded-lg">
            <p className="text-sm font-medium text-[#253BAB]">Status</p>
            <Badge className={getStatusBadgeClass(selectedRequest.status)}>
              {selectedRequest.status.toUpperCase()}
            </Badge>
          </div>
          <div className="bg-[#253BAB]/5 p-3 rounded-lg">
            <p className="text-sm font-medium text-[#253BAB]">URL</p>
            <a
              href={selectedRequest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#253BAB] hover:underline"
            >
              {selectedRequest.url}
            </a>
          </div>
          <div className="bg-[#253BAB]/5 p-3 rounded-lg">
            <p className="text-sm font-medium text-[#253BAB]">Requested By</p>
            <p>{selectedRequest.requestedBy}</p>
          </div>
          <div className="bg-[#253BAB]/5 p-3 rounded-lg">
            <p className="text-sm font-medium text-[#253BAB]">Requested At</p>
            <p>{selectedRequest.requestedAt}</p>
          </div>
          {selectedRequest.reviewedAt && (
            <div className="bg-[#253BAB]/5 p-3 rounded-lg">
              <p className="text-sm font-medium text-[#253BAB]">Reviewed At</p>
              <p>{selectedRequest.reviewedAt}</p>
            </div>
          )}
        </div>

        {selectedRequest.status.toLowerCase() === "pending" && (
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                rejectRequest(selectedRequest.id)
                setIsDetailsDialogOpen(false)
              }}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                approveRequest(selectedRequest.id)
                setIsDetailsDialogOpen(false)
              }}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Approve
            </Button>
          </div>
        )}
      </div>
    )
  )

  if (!user || user.role !== "admin") {
    return <div>Access denied</div>
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}
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
              <TableHead className="text-[#0E0E0E]">Website Name</TableHead>
              <TableHead className="text-[#0E0E0E]">URL</TableHead>
              <TableHead className="text-[#0E0E0E]">Requested By</TableHead>
              <TableHead className="text-[#0E0E0E]">Requested At</TableHead>
              <TableHead className="text-[#0E0E0E]">Status</TableHead>
              <TableHead className="text-[#0E0E0E]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No website requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map(renderTableRow)
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Website Request Details</DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
