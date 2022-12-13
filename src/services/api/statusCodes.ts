export const HTTP_STATUS_OK = 200
export const HTTP_STATUS_CREATED = 201
export const HTTP_STATUS_NO_CONTENT = 204
export const HTTP_BAD_REQUEST = 400
export const HTTP_STATUS_UNAUTHORIZED = 401
export const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422

export const HTTP_STATUS_VALID_ALL = [HTTP_STATUS_OK, HTTP_STATUS_CREATED, HTTP_STATUS_NO_CONTENT]

export const isValidHTTPStatus = (statusCode: number) => {
  return HTTP_STATUS_VALID_ALL.includes(statusCode)
}
