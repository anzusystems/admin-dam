export function useFormatJson() {
  return (data: string) => {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch (e) {
      return data
    }
  }
}
