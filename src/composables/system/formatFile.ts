import { prettyBytes } from '@/utils/file'

export function usePrettyBytes() {
  return (value: number, decimals = 2) => prettyBytes(value, decimals)
}
