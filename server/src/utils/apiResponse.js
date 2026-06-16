export function successResponse(res, message = "Success", data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, message = "Error message", errors = [], statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
