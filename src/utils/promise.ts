export const simulateFetch = <T = any>(data: T, timeout = 1000) => {
  return new Promise(function (resolve) {
    setTimeout(() => {
      resolve(data)
    }, timeout)
  })
}
