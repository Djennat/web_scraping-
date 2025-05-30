"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditIcon, LogOutIcon, UploadIcon } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { userApi } from "@/lib/api"

export default function ProfilePage() {
  const { user, setUser, updateProfile, logout } = useAuth()
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)
  const xmlFileInputRef = useRef(null)
  const router = useRouter()
  const [hasUpdated, setHasUpdated] = useState(false)
  const [websites, setWebsites] = useState([])
  const [interests, setInterests] = useState([])
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/categories.xml')
        const xmlText = await response.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, "text/xml")
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror')
        if (parserError) {
          throw new Error('XML parsing error: ' + parserError.textContent)
        }
        
        const categoriesList = Array.from(xmlDoc.getElementsByTagName('category')).map(category => {
          const name = category.getElementsByTagName('name')[0]?.textContent.trim()
          const sousCategories = Array.from(category.getElementsByTagName('sous_category'))
            .map(sub => sub.textContent.trim())
          
          return {
            name,
            sousCategories
          }
        })
        
        setCategories(categoriesList)
        if (categoriesList.length > 0) {
          setSelectedCategory(categoriesList[0].name)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
        setError('Failed to load categories: ' + error.message)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const loadWebsites = async () => {
      try {
        const response = await fetch('/websites.xml')
        const xmlText = await response.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, "text/xml")

        const sites = Array.from(xmlDoc.getElementsByTagName('site')).map(site => ({
          name: site.getElementsByTagName('name')[0]?.textContent.trim(),
          url: site.getElementsByTagName('url')[0]?.textContent.trim(),
        }))

        setWebsites(sites)
      } catch (error) {
        console.error('Error loading websites:', error)
        setError('Failed to load websites')
      }
    }

    loadWebsites()
  }, [])

  useEffect(() => {
    if (user) {
      console.log('Setting interests from user:', user);
      console.log('User object full details:', JSON.stringify(user, null, 2));
      setInterests(user.interests || []);
    }
  }, [user]);

  // Debugging effect to log interests changes
  useEffect(() => {
    console.log('Interests state updated:', interests);
  }, [interests]);

  const handleInterestChange = (interest) => {
    if (!interest || interest.trim() === '') return;
    
    setInterests(prev => {
      // Make sure prev is an array
      const currentInterests = Array.isArray(prev) ? prev : [];
      
      // Check if this interest is already selected
      const isSelected = currentInterests.includes(interest);
      
      // Create new array based on selection
      const newInterests = isSelected 
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest];
      
      console.log('Interest changed:', {
        interest,
        wasSelected: isSelected,
        newInterests
      });
      
      return newInterests;
    });
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      // Get the form data
      const formData = new FormData(e.target);
      const email = formData.get('email');
      
      // Create the update data
      const updateData = {};
      
      // Only include email if it's different from current
      if (email && email !== user.email) {
        updateData.email = email;
      }

      // Always include interests in the update
      updateData.interests = interests || [];
      
      console.log('Current user interests:', user.interests);
      console.log('New interests to update:', interests);
      console.log('Sending update data:', updateData);
      
      // Use the API service to update the profile
      const response = await userApi.updateProfile(updateData);
      
      // Update local state with the response
      setUser(prevUser => {
        const updatedUser = { ...prevUser, ...response };
        console.log('Updated user state:', updatedUser);
        return updatedUser;
      });
      
      setInterests(response.interests || []);
      setSuccess("Profile updated successfully");
      setIsUpdateDialogOpen(false);
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const goToScrapingPage = () => {
    router.push("/scraping")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#253BAB]/10 to-white">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#253BAB]">WebScraperPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogout} className="text-[#253BAB]">
              <LogOutIcon className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-10">
        <div className="mx-auto max-w-4xl">
          <Card className="w-full border-[#253BAB]/20 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4 bg-gradient-to-r from-[#253BAB]/10 to-white rounded-t-lg">
              <Avatar className="h-20 w-20 border-2 border-[#253BAB]">
                <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback className="bg-[#253BAB] text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl text-[#0E0E0E]">{user.username}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
              <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-[#253BAB] text-[#253BAB] hover:bg-[#253BAB]/10">
                    <EditIcon className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleUpdateProfile}>
                    <DialogHeader>
                      <DialogTitle>Update Your Profile</DialogTitle>
                      <DialogDescription>Make changes to your profile information here.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex justify-center mb-2">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-2 border-[#253BAB]">
                            <AvatarImage src={previewImage || user.photo} alt={user.username} />
                            <AvatarFallback className="bg-[#253BAB] text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            type="button"
                            size="icon"
                            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#253BAB] text-white hover:bg-[#253BAB]/90"
                            onClick={triggerFileInput}
                          >
                            <UploadIcon className="h-4 w-4" />
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input id="email" name="email" defaultValue={user.email} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password
                        </Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Leave blank to keep current"
                          className="col-span-3"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Interests</Label>
                        <div className="col-span-3 space-y-4">
                          {categories.map((category, index) => (
                            <div key={index} className="mb-2">
                              <h4 className="font-medium text-[#253BAB] mb-1">{category.name}</h4>
                              <div className="flex flex-wrap gap-4">
                                {category.sousCategories.map((subCat, subIndex) => (
                                  <div key={subIndex} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`interest-${subCat}`}
                                      checked={interests.includes(subCat)}
                                      onCheckedChange={() => handleInterestChange(subCat)}
                                      className="text-[#253BAB] border-[#253BAB]"
                                    />
                                    <Label htmlFor={`interest-${subCat}`}>{subCat}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
                    <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
                      <Button 
                        type="submit" 
                        className="bg-[#253BAB] text-white hover:bg-[#253BAB]/90"
                        disabled={isLoading}
                      >
                        {isLoading ? "Saving..." : "Save changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="text-lg font-medium text-[#253BAB]">Account Information</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div className="bg-[#253BAB]/5 p-3 rounded-lg">
                    <p className="text-sm font-medium text-[#253BAB]">Username</p>
                    <p className="text-[#0E0E0E]">{user.username}</p>
                  </div>
                  <div className="bg-[#253BAB]/5 p-3 rounded-lg">
                    <p className="text-sm font-medium text-[#253BAB]">Email</p>
                    <p className="text-[#0E0E0E]">{user.email}</p>
                  </div>
                  <div className="bg-[#253BAB]/5 p-3 rounded-lg">
                    <p className="text-sm font-medium text-[#253BAB]">Role</p>
                    <p className="text-[#0E0E0E]">{user.role}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#253BAB]">Interests</h3>
                </div>
                
                <div className="mt-2 space-y-3">
                  {categories.map((category) => (
                      <div key={category.name} className="bg-[#253BAB]/5 p-3 rounded-lg">
                        <p className="text-sm font-medium text-[#253BAB] mb-2">{category.name}</p>
                        <div className="flex flex-wrap gap-2">
                        {category.sousCategories
                          .filter(subCat => interests.includes(subCat))
                          .map((item) => (
                            <Badge key={item} variant="outline" className="bg-[#253BAB] text-white border-none">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                  ))}
                </div>
                {error && <p className="mt-2 text-red-500">{error}</p>}
                {success && <p className="mt-2 text-green-500">{success}</p>}
              </div>
            </CardContent>
            
            <CardFooter className="flex space-x-4 bg-gradient-to-r from-white to-[#253BAB]/10 rounded-b-lg">
              <Button onClick={goToScrapingPage} className="w-full bg-[#253BAB] hover:bg-[#253BAB]/90 text-white">
                Go to Scraping Page
              </Button>
              <Button
                onClick={() => router.push("/history")}
                className="w-full bg-[#253BAB]/80 hover:bg-[#253BAB] text-white"
              >
                View Scraping History
              </Button>
            </CardFooter>
            
            {/* Debug section */}
        
          </Card>
        </div>
      </main>
    </div>
  )
}