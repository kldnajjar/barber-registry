/**
 * Tests for Admin Verification Endpoint
 * 
 * Validates: Requirements 1.1, 9.1, 9.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import handler from './verify.js'

describe('Admin Verification Endpoint', () => {
  let originalAdminSecret

  beforeEach(() => {
    originalAdminSecret = process.env.ADMIN_SECRET
  })

  afterEach(() => {
    if (originalAdminSecret !== undefined) {
      process.env.ADMIN_SECRET = originalAdminSecret
    } else {
      delete process.env.ADMIN_SECRET
    }
  })

  // Helper to create mock request/response objects
  function createMocks(method = 'GET', query = {}, headers = {}) {
    const request = {
      method,
      query,
      headers
    }

    const response = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(data) {
        this.body = data
        return this
      }
    }

    return { request, response }
  }

  describe('Development Mode (no ADMIN_SECRET)', () => {
    it('should return 200 OK when ADMIN_SECRET is not set', async () => {
      delete process.env.ADMIN_SECRET

      const { request, response } = createMocks()
      await handler(request, response)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({ ok: true })
    })

    it('should allow requests without any secret provided', async () => {
      delete process.env.ADMIN_SECRET

      const { request, response } = createMocks()
      await handler(request, response)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({ ok: true })
    })
  })

  describe('Production Mode (ADMIN_SECRET configured)', () => {
    beforeEach(() => {
      process.env.ADMIN_SECRET = 'test-secret-123'
    })

    it('should return 200 OK with valid secret in query parameter', async () => {
      const { request, response } = createMocks('GET', { adminSecret: 'test-secret-123' })
      await handler(request, response)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({ ok: true })
    })

    it('should return 200 OK with valid secret in Authorization header', async () => {
      const { request, response } = createMocks('GET', {}, { 
        authorization: 'Bearer test-secret-123' 
      })
      await handler(request, response)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({ ok: true })
    })

    it('should return 403 Forbidden with invalid secret', async () => {
      const { request, response } = createMocks('GET', { adminSecret: 'wrong-secret' })
      await handler(request, response)

      expect(response.statusCode).toBe(403)
      expect(response.body).toEqual({ 
        message: 'Invalid or missing admin key.' 
      })
    })

    it('should return 403 Forbidden with no secret provided', async () => {
      const { request, response } = createMocks()
      await handler(request, response)

      expect(response.statusCode).toBe(403)
      expect(response.body).toEqual({ 
        message: 'Invalid or missing admin key.' 
      })
    })

    it('should return 403 Forbidden with empty secret', async () => {
      const { request, response } = createMocks('GET', { adminSecret: '' })
      await handler(request, response)

      expect(response.statusCode).toBe(403)
      expect(response.body).toEqual({ 
        message: 'Invalid or missing admin key.' 
      })
    })
  })

  describe('HTTP Method Validation', () => {
    it('should return 405 Method Not Allowed for POST requests', async () => {
      const { request, response } = createMocks('POST')
      await handler(request, response)

      expect(response.statusCode).toBe(405)
      expect(response.body).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 Method Not Allowed for PUT requests', async () => {
      const { request, response } = createMocks('PUT')
      await handler(request, response)

      expect(response.statusCode).toBe(405)
      expect(response.body).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 Method Not Allowed for DELETE requests', async () => {
      const { request, response } = createMocks('DELETE')
      await handler(request, response)

      expect(response.statusCode).toBe(405)
      expect(response.body).toEqual({ message: 'Method not allowed' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle Authorization header without Bearer prefix', async () => {
      process.env.ADMIN_SECRET = 'test-secret-123'

      const { request, response } = createMocks('GET', {}, { 
        authorization: 'test-secret-123' 
      })
      await handler(request, response)

      // Should succeed - implementation is flexible and accepts both formats
      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({ ok: true })
    })

    it('should prioritize query parameter over header when both provided', async () => {
      process.env.ADMIN_SECRET = 'test-secret-123'

      const { request, response } = createMocks('GET', 
        { adminSecret: 'test-secret-123' },
        { authorization: 'Bearer wrong-secret' }
      )
      await handler(request, response)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({ ok: true })
    })
  })
})
