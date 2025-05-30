"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { userApi } from "@/lib/api"

export default function ScrapingHistory() {
  const router = useRouter()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchScrapingResults()
  }, [])

  const fetchScrapingResults = async () => {
    try {
      const data = await userApi.getScrapingResults()
      setResults(data)
    } catch (err) {
      console.error("Failed to fetch scraping results:", err)
      setError("Failed to load scraping history")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch (err) {
      return "Date not available"
    }
  }

  return (
    <div className="container py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-100 via-white to-[#253BAB]/10 min-h-screen pt-24">
      <header className="fixed top-0 left-0 right-0 z-40 border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <motion.span
              className="text-xl font-bold text-[#253BAB] tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              WebScraperPro
            </motion.span>
          </div>
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              variant="ghost"
              onClick={() => router.push("/profile")}
              className="text-[#253BAB] hover:bg-[#253BAB]/10 hover:text-[#1E2F97] transition-all duration-300 rounded-lg px-4 py-2"
              aria-label="Navigate back to profile"
            >
              Back to Profile
            </Button>
          </motion.div>
        </div>
      </header>
      <motion.h1
        className="text-5xl font-extrabold text-[#253BAB] mb-12 tracking-tight text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Scraping History
      </motion.h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#253BAB]"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">{error}</div>
      ) : results.length === 0 ? (
        <div className="text-center text-gray-500 p-4">No scraping results found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {results.map((result) => (
            <div key={result.id}>
              <Card className="relative border-none bg-white/95 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#253BAB]/10 to-[#253BAB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative pb-3 bg-gradient-to-b from-[#253BAB]/5 to-transparent">
                  <CardTitle className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#253BAB] transition-colors duration-300">
                    Scraping Result
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 font-medium">
                    {formatDate(result.scraped_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative pt-4 space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <p className="text-sm text-gray-700 font-medium">
                      <strong className="font-semibold text-[#253BAB]">Request ID:</strong>{" "}
                      {result.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium break-all">
                      <strong className="font-semibold text-[#253BAB]">URLs:</strong>{" "}
                      {result.website_url.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#253BAB] hover:text-[#1E2F97] hover:underline decoration-[#253BAB]/50 decoration-2 underline-offset-4 transition-all duration-200 block"
                        >
                          {url}
                        </a>
                      ))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      <strong className="font-semibold text-[#253BAB]">Keywords:</strong>{" "}
                      {result.keywords.join(", ")}
                    </p>
                  </div>
                  {result.results && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-[#253BAB] mb-2">Results:</p>
                      <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">
                        {result.results}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}