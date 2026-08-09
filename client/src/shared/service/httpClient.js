import axios from 'axios'

// Endpoint used to refresh an expired access token
const REFRESH_URL = '/auth/refresh'

// Stores the ongoing refresh request so that multiple
// failed requests don't trigger multiple refresh calls
let refreshPromise = null

// Stores the current access token in memory
let accessToken = null

// Create a reusable Axios instance with common configuration
export const httpClient = axios.create({
  // Every request will be prefixed with /api/v1
  baseURL: '/api/v1',

  // Automatically include cookies (e.g. refresh token)
  withCredentials: true,

  // Default headers for every request
  headers: {
    'Content-Type': 'application/json',
  },
})

// Save the access token in memory and attach/remove it
// from the default Authorization header
export function setAccessToken(token) {
  accessToken = token || null

  if (accessToken) {
    httpClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    return
  }

  // Remove Authorization header when user logs out
  delete httpClient.defaults.headers.common.Authorization
}

// Returns the currently stored access token
export function getAccessToken() {
  return accessToken
}

// Refresh the access token.
// If a refresh request is already running,
// reuse the same promise instead of making another request.
function queueRefresh() {
  if (!refreshPromise) {
    refreshPromise = httpClient
      .post(REFRESH_URL, {}, { skipAuthRefresh: true })
      .then((response) => {
        // Get the new access token from the response
        const token = response?.data?.accessToken || null

        // Save it for future requests
        setAccessToken(token)

        return token
      })
      .finally(() => {
        // Allow future refresh requests
        refreshPromise = null
      })
  }

  return refreshPromise
}

// Request Interceptor
// Runs before every outgoing request.
httpClient.interceptors.request.use((config) => {
  const nextConfig = { ...config }

  // Attach the latest access token if available
  if (accessToken) {
    nextConfig.headers = nextConfig.headers || {}
    nextConfig.headers.Authorization = `Bearer ${accessToken}`
  }

  return nextConfig
})

// Response Interceptor
// Runs whenever a response or error is received.
httpClient.interceptors.response.use(
  // If request succeeds, simply return the response
  (response) => response,

  // Handle failed requests
  async (error) => {
    const originalRequest = error?.config
    const status = error?.response?.status

    // If request information is unavailable,
    // forward the error.
    if (!originalRequest) {
      return Promise.reject(error)
    }

    // Don't attempt to refresh while the refresh
    // request itself is running.
    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error)
    }

    // Only refresh once for 401 Unauthorized responses.
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Mark this request so it isn't retried infinitely
    originalRequest._retry = true

    try {
      // Refresh the access token
      const token = await queueRefresh()

      if (!token) {
        return Promise.reject(error)
      }

      // Update the Authorization header
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${token}`

      // Retry the original request with the new token
      return httpClient(originalRequest)
    } catch {
      // Refresh failed, clear the stored token
      setAccessToken(null)

      return Promise.reject(error)
    }
  },
)