import { API_ENDPOINTS } from "@/config/api"

export const userApi = {
  async fetchProfile() {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to fetch profile: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }
  },

  async updateProfile(data) {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      console.log('Raw update data:', data);
      
      // Create update payload - only include fields that are present
      const updatePayload = {};
      
      // Only include fields that are actually present in the data
      if ('email' in data) {
        updatePayload.email = data.email;
      }
      if ('interests' in data) {
        // Ensure interests is a non-empty array
        const interestsList = Array.isArray(data.interests) ? data.interests.filter(i => i && i.trim() !== '') : [];
        if (interestsList.length > 0) {
          updatePayload.interests = interestsList;
        }
      }
      
      console.log('Final update payload:', updatePayload);
      
      // Only proceed if we have data to update
      if (Object.keys(updatePayload).length === 0) {
        throw new Error("No valid data to update");
      }
      
      // Send the update request
      const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      })

      // Log full response info for debugging
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update profile error response:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `Failed to update profile: ${response.status}`)
        } catch (e) {
          throw new Error(`Failed to update profile: ${response.status}`)
        }
      }

      // Parse and return response
      const responseData = await response.json();
      console.log('Profile update successful:', responseData);
      return responseData;
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  // Scraping related
  async submitScrapingRequest(xmlData) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log('Submitting XML request:', xmlData);

    const response = await fetch(API_ENDPOINTS.SCRAPING_XML, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(xmlData),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Scraping request error:', errorText);
      throw new Error("Failed to submit scraping request")
    }

    return response.json()
  },

  async getScrapingResults() {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(API_ENDPOINTS.SCRAPING_RESULTS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch scraping results")
    }

    return response.json()
  },

  // Admin related
  async getUsers() {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(API_ENDPOINTS.ADMIN_USERS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch users")
    }

    return response.json()
  },

  async createUser(userData) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(API_ENDPOINTS.ADMIN_USERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Failed to create user")
    }

    return response.json()
  },

  async deactivateUser(userId) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/deactivate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Failed to deactivate user")
    }

    return response.json()
  },

  async updateUserStatus(userId, action) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const endpoint = `${API_ENDPOINTS.ADMIN_USERS}/${userId}/${action}`
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to ${action} user`)
    }

    return response.json()
  },

  async getRequests() {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(API_ENDPOINTS.ADMIN_REQUESTS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch requests")
    }

    return response.json()
  },

  async approveRequest(requestId) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_ENDPOINTS.ADMIN_REQUESTS}/${requestId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to approve request")
    }

    return response.json()
  },

  async rejectRequest(requestId) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    const response = await fetch(`${API_ENDPOINTS.ADMIN_REQUESTS}/${requestId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to reject request")
    }

    return response.json()
  },

  // Website request
  async submitWebsiteRequest(websiteUrl) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log('Submitting website request:', websiteUrl);

    const response = await fetch(API_ENDPOINTS.SCRAPING_REQUEST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        website_url: websiteUrl
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Website request error:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || "Failed to submit website request");
      } catch (e) {
        throw new Error("Failed to submit website request");
      }
    }

    return response.json()
  },
}

// Separate admin API service
export const adminApi = {
  // Check if user has admin rights
  async checkAdminAccess() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return false;
      }

      // Use the users endpoint first to verify role
      const profileResponse = await fetch(API_ENDPOINTS.USER_PROFILE, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });

      if (!profileResponse.ok) {
        return false;
      }

      const userData = await profileResponse.json();
      
      // Quick check if user has admin role
      if (userData.role !== 'admin') {
        return false;
      }
      
      // As an additional check, try to access an admin-only endpoint
      // Use GET /admin/users which is a protected admin endpoint
      const adminResponse = await fetch(API_ENDPOINTS.ADMIN_USERS, {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });

      return adminResponse.ok;
    } catch (error) {
      console.error("Admin access check failed:", error);
      return false;
    }
  },

  // All admin-specific API calls
  async getAllUsers() {
    return userApi.getUsers();
  },
  
  async getAllRequests() {
    return userApi.getRequests();
  },
  
  async createNewUser(userData) {
    return userApi.createUser(userData);
  },
  
  async approveScrapingRequest(requestId) {
    return userApi.approveRequest(requestId);
  },
  
  async rejectScrapingRequest(requestId) {
    return userApi.rejectRequest(requestId);
  },

  // XML-related admin functions
  async getXMLRequests() {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    try {
      const response = await fetch(API_ENDPOINTS.XML_REQUESTS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('XML requests error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || "Failed to fetch XML requests");
        } catch (e) {
          throw new Error("Failed to fetch XML requests");
        }
      }

      return response.json()
    } catch (error) {
      console.error('Error fetching XML requests:', error);
      throw error;
    }
  },

  async approveXMLRequest(requestId) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.XML_REQUESTS}/${requestId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Approve XML request error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || "Failed to approve XML request");
        } catch (e) {
          throw new Error("Failed to approve XML request");
        }
      }

      return response.json()
    } catch (error) {
      console.error('Error approving XML request:', error);
      throw error;
    }
  },

  async rejectXMLRequest(requestId) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.XML_REQUESTS}/${requestId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reject XML request error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || "Failed to reject XML request");
        } catch (e) {
          throw new Error("Failed to reject XML request");
        }
      }

      return response.json()
    } catch (error) {
      console.error('Error rejecting XML request:', error);
      throw error;
    }
  }
} 