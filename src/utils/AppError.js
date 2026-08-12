class AppError extends Error {
  constructor(message, statusCode, errors) {
    super(message);
    this.statusCode = statusCode;

    if (errors !== undefined) {
      this.errors = errors;
    }
  }
}

export default AppError;
