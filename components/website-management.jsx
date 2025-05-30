"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchIcon, TrashIcon, PlusIcon } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"

export default function WebsiteManagement() {
  const { user } = useAuth()
  const [websites, setWebsites] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newWebsiteName, setNewWebsiteName] = useState("")
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  // Load websites from XML
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await fetch('/websites.xml')
        const xmlText = await response.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, "text/xml")
        const sites = Array.from(xmlDoc.getElementsByTagName("site")).map((site, index) => ({
          id: index + 1,
          name: site.getElementsByTagName("name")[0].textContent,
          url: site.getElementsByTagName("url")[0].textContent,
          addedAt: new Date().toLocaleDateString() // Since XML doesn't have dates, using current date
        }))
        setWebsites(sites)
      } catch (error) {
        console.error("Error loading websites:", error)
        setError("Failed to load websites")
      }
    }
    fetchWebsites()
  }, [])

  const handleAddWebsite = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      // Create new XML site element
      const newSite = {
        id: websites.length + 1,
        name: newWebsiteName,
        url: newWebsiteUrl,
        addedAt: new Date().toLocaleDateString()
      }

      // Update local state
      setWebsites([...websites, newSite])

      // Create XML content for the new site
      const xmlContent = `    <site>
        <name>${newWebsiteName}</name>
        <url>${newWebsiteUrl}</url>
    </site>`

      // Send to backend to update XML file
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWebsiteName,
          url: newWebsiteUrl,
          xmlContent: xmlContent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add website')
      }

      setSuccess("Website added successfully")
      setNewWebsiteName("")
      setNewWebsiteUrl("")
      setIsAddDialogOpen(false)
    } catch (err) {
      console.error("Error adding website:", err)
      setError(err.message || "Failed to add website")
    } finally {
      setLoading(false)
    }
  }

  const deleteWebsite = async (websiteId) => {
    try {
      // Remove from local state
      const updatedWebsites = websites.filter(website => website.id !== websiteId)
      setWebsites(updatedWebsites)

      // Send to backend to update XML file
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete website')
      }

      setSuccess("Website deleted successfully")
    } catch (err) {
      console.error("Error deleting website:", err)
      setError(err.message || "Failed to delete website")
    }
  }

  if (!user || user.role !== "admin") {
    return <div>Access denied</div>
  }

  // Filter websites based on search term
  const filteredWebsites = websites.filter(
    (website) =>
      website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      website.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search websites..."
            className="pl-8 border-[#253BAB]/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#253BAB] hover:bg-[#253BAB]/90 text-white">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Website
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddWebsite}>
              <DialogHeader>
                <DialogTitle>Add New Website</DialogTitle>
                <DialogDescription>Add a new website for scraping to the database.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={newWebsiteName}
                    onChange={(e) => setNewWebsiteName(e.target.value)}
                    className="col-span-3 border-[#253BAB]/30"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">
                    URL
                  </Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={newWebsiteUrl}
                    onChange={(e) => setNewWebsiteUrl(e.target.value)}
                    className="col-span-3 border-[#253BAB]/30"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#253BAB] hover:bg-[#253BAB]/90 text-white" disabled={loading}>
                  {loading ? "Adding..." : "Add Website"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <div className="rounded-md border border-[#253BAB]/20">
        <Table>
          <TableHeader className="bg-[#253BAB]/5">
            <TableRow>
              <TableHead className="text-[#0E0E0E]">Name</TableHead>
              <TableHead className="text-[#0E0E0E]">URL</TableHead>
              <TableHead className="text-[#0E0E0E]">Added Date</TableHead>
              <TableHead className="text-[#0E0E0E]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWebsites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No websites found
                </TableCell>
              </TableRow>
            ) : (
              filteredWebsites.map((website) => (
                <TableRow key={website.id} className="hover:bg-[#253BAB]/5">
                  <TableCell className="font-medium">{website.name}</TableCell>
                  <TableCell>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#253BAB] hover:underline"
                    >
                      {website.url}
                    </a>
                  </TableCell>
                  <TableCell>{website.addedAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteWebsite(website.id)}>
                      <TrashIcon className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Delete</span>
                    </Button>
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
