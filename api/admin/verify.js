/**
 * Admin Verification Endpoint
 * 
 * Validates admin secret for protected operations.
 * If ADMIN_SECRET is not configured, allows all requests (development mode).
 * 
 * Requirements: 1.1, 9.1, 9.5
 */

export default async function handler(request, response) {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const adminSecret = process.env.ADMIN_SECRET

    // Development mode: no ADMIN_SECRET configured, allow all requests
    if (!adminSecret) {
      return response.status(200).json({ ok: true })
    }

    // Production mode: validate provided secret
    // Check both query parameter and Authorization header
    const providedSecret = 
      request.query.adminSecret || 
      request.headers.authorization?.replace('Bearer ', '')

    if (!providedSecret) {
      return response.status(403).json({ 
        message: 'Invalid or missing admin key.' 
      })
    }

    if (providedSecret === adminSecret) {
      return response.status(200).json({ ok: true })
    } else {
      return response.status(403).json({ 
        message: 'Invalid or missing admin key.' 
      })
    }
  } catch (error) {
    console.error('Admin verification error:', error)
    return response.status(500).json({ 
      message: 'Internal server error' 
    })
  }
}
