import { sql } from '@vercel/postgres'

// Export the sql client directly for use in serverless functions
export { sql }

// Export a db object with query helper function
export const db = {
  /**
   * Execute a SQL query with parameters
   * @param {string} text - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(text, params = []) {
    try {
      const result = await sql.query(text, params)
      return result
    } catch (error) {
      // Log error for debugging while preserving the original error
      console.error('Database query error:', {
        message: error.message,
        query: text,
        // Don't log params as they may contain sensitive data
      })
      throw error
    }
  }
}
