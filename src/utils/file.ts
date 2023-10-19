import dayjs from 'dayjs'

export const prettyBps = (bytes: number, decimals = 2): string => {
  if (bytes === 0) {
    return '0 bps'
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['kbps', 'Mbps', 'Gbps']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const prettyDuration = (seconds: number): string => {
  const duration = dayjs.duration(seconds * 1000)

  return duration.format('HH:mm:ss')
}
