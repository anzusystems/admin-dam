import dayjs from 'dayjs'
import Duration from 'dayjs/plugin/duration'

// Extended here because this module uses the duration plugin. It must not rely on another module extending it first.
dayjs.extend(Duration)

export const prettyBps = (bytes: number, decimals = 2): string => {
  const sizes = ['bps', 'kbps', 'Mbps', 'Gbps']

  if (bytes === 0) {
    return '0 ' + sizes[0]
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const prettyDuration = (seconds: number): string => {
  const duration = dayjs.duration(seconds * 1000)

  return duration.format('HH:mm:ss')
}
