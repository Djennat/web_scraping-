"use client"

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  USER_PROFILE: `${API_BASE_URL}/users/me`,
  ADMIN_CHECK: `${API_BASE_URL}/admin/check`,
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      console.log("Checking auth with token:", token);

      // Verify token and get user profile
      const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User data from profile:", userData);
        setUser(userData);
        
        // Get current path to determine if we need to redirect
        const currentPath = window.location.pathname;
        
        // Role-based routing logic
        if (userData.role === "admin") {
          // Admin user logic
          if (currentPath === "/" || currentPath === "/login") {
            console.log("Admin user on main page, redirecting to admin dashboard");
            router.push('/admin');
          }
        } else {
          // Regular user logic
          if (currentPath === "/" || currentPath === "/login") {
            console.log("Regular user on main page, redirecting to profile");
            router.push('/profile');
          }
          
          // Redirect from admin pages if user is not admin
          if (currentPath.startsWith('/admin')) {
            console.log("Non-admin user on admin page, redirecting to profile");
            router.push('/profile');
          }
        }
      } else {
        console.error("Auth check failed:", await response.text());
        logout();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log("Attempting login for:", username);
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      // Step 1: Authenticate with username and password
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const responseData = await response.json();
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        throw new Error(responseData.detail || "Invalid credentials");
      }

      console.log("Login successful, token received");
      const token = responseData.access_token;
      localStorage.setItem("token", token);

      // Step 2: Get user profile
      const profileResponse = await fetch(API_ENDPOINTS.USER_PROFILE, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!profileResponse.ok) {
        console.error("Profile fetch failed:", await profileResponse.text());
        throw new Error("Failed to get user profile");
      }

      const userData = await profileResponse.json();
      console.log("User profile data:", userData);
      setUser(userData);
      
      // Step 3: Redirect based on role
      if (userData.role === "admin") {
        console.log("Admin user detected, redirecting to admin dashboard");
        router.push('/admin');
      } else {
        console.log("Regular user detected, redirecting to profile");
        router.push('/profile');
      }

      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("Logging out user");
    localStorage.removeItem("token");
    setUser(null);
    router.push('/login');
  };

  // Update user profile in context
  const updateUserInContext = (updatedUser) => {
    console.log("Updating user in context:", updatedUser);
    setUser(current => ({
      ...current,
      ...updatedUser
    }));
  };

  // For debugging
  useEffect(() => {
    console.log("Current auth context user:", user);
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      setUser: updateUserInContext
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}