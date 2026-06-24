class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true; // safe to send the message to the client
  }
}

module.exports = ApiError;
