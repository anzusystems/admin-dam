// Imports nothing on purpose: the refresh interceptor reads it while its module loads, and authApi sits
// in an import cycle with the api client and that interceptor.
export const AUTH_PATH_PREFIX = '/auth'
