const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/stats/dashboard`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { error: error.message }
  }
}

export const getOffersByRegion = async () => {
  try {
    const response = await fetch(`${API_BASE}/stats/offers-by-region`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching offers by region:', error)
    return { error: error.message }
  }
}

export const searchOffers = async (query) => {
  try {
    const response = await fetch(`${API_BASE}/offers/search?q=${encodeURIComponent(query)}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error searching offers:', error)
    return { error: error.message }
  }
}

export const filterOffers = async (location = null, jobType = null) => {
  try {
    const params = new URLSearchParams()
    if (location) params.append('location', location)
    if (jobType) params.append('job_type', jobType)
    
    const response = await fetch(`${API_BASE}/offers/filter?${params.toString()}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error filtering offers:', error)
    return { error: error.message }
  }
}

export const getAllOffersFromApi = async () => {
  try {
    const response = await fetch(`${API_BASE}/offers`)
    const data = await response.json()
    return data.offers || []
  } catch (error) {
    console.error('Error fetching offers:', error)
    return []
  }
}