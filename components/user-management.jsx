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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, SearchIcon, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { userApi } from "@/lib/api"

export default function UserManagement({ limit, showControls = true }) {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Fetch users from the backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await userApi.getUsers()
        setUsers(usersData)
      } catch (error) {
        console.error('Error fetching users:', error)
        setError('Failed to fetch users')
      }
    }

    fetchUsers()
  }, [])

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Limit the number of users shown if limit is provided
  const displayedUsers = limit ? filteredUsers.slice(0, limit) : filteredUsers

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const formData = new FormData(e.target)
    const newUser = {
      username: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role')
    }

    try {
      const createdUser = await userApi.createUser(newUser)
      setUsers([...users, createdUser])
      setSuccess("User created successfully")
      setIsCreateDialogOpen(false)
      e.target.reset()
    } catch (err) {
      console.error("Error creating user:", err)
      setError(err.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  // Handle user deactivation
  const handleDeactivateUser = async (userId) => {
    try {
      const updatedUser = await userApi.deactivateUser(userId)
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ))
      setSuccess("User status updated successfully")
    } catch (err) {
      console.error("Error updating user status:", err)
      setError(err.message || "Failed to update user status")
    }
  }

  if (!user || user.role !== "admin") {
    return <div>Access denied</div>
  }

  return (
    <div className="space-y-4">
      {showControls && (
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user or admin to the system.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" name="name" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" name="email" type="email" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <div className="col-span-3 relative">
                      <Input 
                        id="password" 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select name="role" defaultValue="user">
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {showControls && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showControls ? 5 : 4} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              displayedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "success" : "destructive"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {showControls && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeactivateUser(user.id)}
                          disabled={!user.is_active}
                        >
                          {user.is_active ? "Deactivate" : "Inactive"}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
