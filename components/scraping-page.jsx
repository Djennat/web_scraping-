"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/app/context/AuthContext"
import { userApi } from "@/lib/api"

export default function ScrapingPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [selectedWebsites, setSelectedWebsites] = useState([])
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0],
  )
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const [newWebsiteName, setNewWebsiteName] = useState("")
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("")
  const [newWebsiteKeywords, setNewWebsiteKeywords] = useState("")
  const [websites, setWebsites] = useState([])
  const [loadedWebsites, setLoadedWebsites] = useState([])
  const [error, setError] = useState("")
  const [xmlContent, setXmlContent] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  // Load websites from XML (always show all sites, not filtered by allowed_websites)
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await fetch('/websites.xml')
        const xmlText = await response.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, "text/xml")
        const sites = Array.from(xmlDoc.getElementsByTagName("site")).map(site => ({
          name: site.getElementsByTagName("name")[0].textContent,
          url: site.getElementsByTagName("url")[0].textContent
        }))
        setLoadedWebsites(sites)
        setWebsites(sites)
      } catch (error) {
        console.error("Error loading websites:", error)
        setError("Failed to load websites")
      }
    }
    fetchWebsites()
  }, [])

  // User interests as keywords
  const userKeywords = (user?.interests || []).map(k => ({ value: k, label: k }))
  // For demo, you can define other keywords here or fetch from backend
  const otherKeywords = [
    { value: "science", label: "Science" },
    { value: "technology", label: "Technology" },
    { value: "ai", label: "AI" },
    { value: "research", label: "Research" },
    { value: "conference", label: "Conference" },
    { value: "education", label: "Education" },
  ].filter(k => !userKeywords.some(uk => uk.value === k.value))

  const handleKeywordToggle = (value) => {
    setSelectedKeywords((prev) => (prev.includes(value) ? prev.filter((k) => k !== value) : [...prev, value]))
  }

  const handleWebsiteSelect = (websiteUrl) => {
    if (selectedWebsites.includes(websiteUrl)) {
      setSelectedWebsites(selectedWebsites.filter((url) => url !== websiteUrl))
    } else {
      setSelectedWebsites([...selectedWebsites, websiteUrl])
    }
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Combine keywords with date range information
      const keywordsWithDates = [
        ...selectedKeywords,
        `date_from:${startDate}`,
        `date_to:${endDate}`
      ];

      // Create XML request payload
      const xmlRequestData = {
        url: selectedWebsites,
        keywords: keywordsWithDates
      };

      console.log('Submitting scraping request:', xmlRequestData);

      // Submit the request
      await userApi.submitScrapingRequest(xmlRequestData);

      setIsRequestSubmitted(true)
      setSuccess("Scraping request submitted successfully")

      // Reset after showing success message
      setTimeout(() => {
        setIsRequestSubmitted(false)
        setSelectedWebsites([])
        setSelectedKeywords([])
      }, 3000)
    } catch (error) {
      console.error("Error submitting request:", error)
      setError("Failed to submit scraping request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestNewWebsite = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (!newWebsiteUrl) {
        throw new Error("Please enter a website URL");
      }

      // Submit the request using the API client
      const response = await userApi.submitWebsiteRequest(newWebsiteUrl);
      console.log('Website request submitted:', response);

      // Close dialog and reset form
      setIsRequestDialogOpen(false)
      setNewWebsiteUrl("")
      setSuccess("Website request submitted successfully")
    } catch (error) {
      console.error("Error requesting new website:", error)
      setError(error.message || "Failed to submit website request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchResults = async () => {
    try {
      const data = await userApi.getScrapingResults()
      setResults(data)
    } catch (err) {
      console.error("Error fetching results:", err)
      setError("Failed to fetch scraping results")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await userApi.submitScrapingRequest(xmlContent)
      setSuccess("Scraping request submitted successfully")
      setXmlContent("")
      fetchResults() // Refresh results
    } catch (err) {
      console.error("Error submitting request:", err)
      setError(err.message || "Failed to submit scraping request")
    } finally {
      setLoading(false)
    }
  }

  // Add success message display
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#253BAB]/10 to-white">
      {/* Navbar */}
      <nav className="bg-white shadow-md border-b border-[#253BAB]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-[#253BAB]">WebScraperPro</span>
            </div>
            <div className="flex items-center">
              <button onClick={() => router.push("/profile")} className="flex items-center focus:outline-none group">
                <Avatar className="h-8 w-8 border-2 border-[#253BAB] group-hover:border-[#253BAB]/70 transition-colors">
                  <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.username} />
                  <AvatarFallback className="bg-[#253BAB] text-white">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium text-[#0E0E0E] group-hover:text-[#253BAB]">
                  {user.username}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-6 text-[#253BAB]">Create Scraping Request</h1>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Selected Website Display */}
              <Card className="border-[#253BAB]/20 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#253BAB]/20 to-white">
                  <CardTitle className="text-[#0E0E0E]">Selected Websites</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {selectedWebsites.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedWebsites.map((websiteUrl) => {
                        const website = loadedWebsites.find((w) => w.url === websiteUrl)
                        return (
                          <div
                            key={websiteUrl}
                            className="bg-[#253BAB] text-white px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {website?.name || websiteUrl}
                            <button
                              type="button"
                              className="ml-2 hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center"
                              onClick={() => handleWebsiteSelect(websiteUrl)}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-16 border-2 border-dashed rounded-md border-[#253BAB]/30">
                      <p className="text-[#253BAB]/70">Please select websites from the sidebar</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card className="border-[#253BAB]/20 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#253BAB]/20 to-white">
                  <CardTitle className="text-[#0E0E0E]">Keywords</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2 text-[#253BAB]">Your Interests</h3>
                      <div className="flex flex-wrap gap-3">
                        {userKeywords.map((keyword) => (
                          <div key={keyword.value} className="flex items-center bg-[#253BAB]/10 px-3 py-1 rounded-lg">
                            <Checkbox
                              id={keyword.value}
                              checked={selectedKeywords.includes(keyword.value)}
                              onCheckedChange={() => handleKeywordToggle(keyword.value)}
                              className="mr-2 text-[#253BAB] border-[#253BAB]"
                            />
                            <Label htmlFor={keyword.value} className="text-sm cursor-pointer">
                              {keyword.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAllKeywords(!showAllKeywords)}
                        className="text-sm border-[#253BAB] text-[#253BAB] hover:bg-[#253BAB]/10"
                      >
                        {showAllKeywords ? "Hide" : "Show"} Other Keywords
                      </Button>

                      {showAllKeywords && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {otherKeywords.map((keyword) => (
                            <div key={keyword.value} className="flex items-center bg-[#253BAB]/5 px-3 py-1 rounded-lg">
                              <Checkbox
                                id={`other-${keyword.value}`}
                                checked={selectedKeywords.includes(keyword.value)}
                                onCheckedChange={() => handleKeywordToggle(keyword.value)}
                                className="mr-2 text-[#253BAB] border-[#253BAB]"
                              />
                              <Label htmlFor={`other-${keyword.value}`} className="text-sm cursor-pointer">
                                {keyword.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Range */}
              <Card className="border-[#253BAB]/20 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#253BAB]/20 to-white">
                  <CardTitle className="text-[#0E0E0E]">Date Range</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date" className="text-[#253BAB]">
                        Start Date
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-[#253BAB]/30 focus:border-[#253BAB] focus:ring-[#253BAB]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-date" className="text-[#253BAB]">
                        End Date
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-[#253BAB]/30 focus:border-[#253BAB] focus:ring-[#253BAB]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#253BAB] hover:bg-[#253BAB]/90 text-white"
                disabled={
                  selectedWebsites.length === 0 || selectedKeywords.length === 0 || isSubmitting || isRequestSubmitted
                }
              >
                {isSubmitting ? "Submitting..." : isRequestSubmitted ? "Request Submitted!" : "Submit Scraping Request"}
              </Button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-64 order-first md:order-last">
            <div className="bg-white p-4 rounded-lg shadow-md border border-[#253BAB]/20">
              <h3 className="font-medium mb-4 text-[#253BAB] border-b pb-2 border-[#253BAB]/20">Available Websites</h3>
              <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#253BAB]/20 scrollbar-track-transparent space-y-2">
                {loadedWebsites.length === 0 ? (
                  <p className="text-sm text-gray-500">No websites available.</p>
                ) : (
                  loadedWebsites.map((website) => (
                    <div
                      key={website.url}
                      onClick={() => handleWebsiteSelect(website.url)}
                      className={cn(
                        "p-2 rounded-md cursor-pointer transition-colors",
                        selectedWebsites.includes(website.url)
                          ? "bg-[#253BAB] text-white"
                          : "hover:bg-[#253BAB]/10 border border-[#253BAB]/20",
                      )}
                    >
                      <div className="font-medium">{website.name}</div>
                      <div className="text-xs truncate">
                        {selectedWebsites.includes(website.url) ? (
                          <span className="opacity-80">{website.url}</span>
                        ) : (
                          <span className="text-[#253BAB]">{website.url}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6">
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#253BAB] hover:bg-[#253BAB]/90 text-white">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Request New Website
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleRequestNewWebsite}>
                      <DialogHeader>
                        <DialogTitle>Request New Website</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="website-url">Website URL</Label>
                          <Input
                            id="website-url"
                            type="url"
                            value={newWebsiteUrl}
                            onChange={(e) => setNewWebsiteUrl(e.target.value)}
                            className="border-[#253BAB]/30"
                            placeholder="https://example.com"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-[#253BAB] hover:bg-[#253BAB]/90 text-white"
                        >
                          {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}