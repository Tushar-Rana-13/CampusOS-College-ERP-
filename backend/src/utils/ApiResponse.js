/**
 * Utility class to standardize successful API responses.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (e.g., 200, 201)
   * @param {any} data - The payload (object, array, string, etc.)
   * @param {string} [message="Success"] - Informative message for the client
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // Any status code under 400 is treated as a success
    this.success = statusCode < 400;
  }
}

export { ApiResponse };