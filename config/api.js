const API_BASE_URL = "http://localhost:8000"

// Debug option - change this to test different update endpoints
const PROFILE_UPDATE_ENDPOINT = "/profile"

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  USER_PROFILE: `${API_BASE_URL}/users/me`,
  UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_REQUESTS: `${API_BASE_URL}/admin/requests`,
  SCRAPING_XML: `${API_BASE_URL}/scraping/xml`,
  SCRAPING_RESULTS: `${API_BASE_URL}/scraping/results`,
  SCRAPING_REQUEST: `${API_BASE_URL}/users/requests`,
  XML_REQUESTS: `${API_BASE_URL}/scraping/xml-requests`
}

// Expose a way to change the endpoint dynamically for debugging
export const setProfileUpdateEndpoint = (newEndpoint) => {
  console.log(`Changing profile update endpoint from ${PROFILE_UPDATE_ENDPOINT} to ${newEndpoint}`);
  API_ENDPOINTS.UPDATE_PROFILE = `${API_BASE_URL}/users${newEndpoint}`;
} 