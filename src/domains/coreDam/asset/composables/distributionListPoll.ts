import { DamDistributionStatus } from '@anzusystems/common-admin'
import type { DamDistributionStatusType } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'

import { useDistributionListStore } from '@/domains/coreDam/asset/store/distributionListStore'
import type {
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'

type DistributionListItems = Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>

/**
 * Delay until the next read, by time since a distribution in
 * progress was first seen or the list was last read for the user.
 * Reads at 15 s and 30 s, then every 30 s until 5 minutes, then every
 * minute. core-dam checks a running distribution every 30 to 90 s.
 * `afterFailure`: minimum delay by the number of consecutive failures. The last entry applies to all further failures.
 */
export const DISTRIBUTION_LIST_POLL = {
  early: { until: 30_000, every: 15_000 },
  regular: { until: 5 * 60_000, every: 30_000 },
  late: { every: 60_000 },
  afterFailure: [15_000, 30_000, 60_000, 120_000, 300_000],
} as const

/** A distribution in one of these statuses still changes on its own. */
export const DISTRIBUTION_STATUSES_UNDER_WAY: ReadonlyArray<DamDistributionStatusType> = [
  DamDistributionStatus.Waiting,
  DamDistributionStatus.Distributing,
  DamDistributionStatus.RemoteProcessing,
]

const delayByAge = (age: number) => {
  if (age < DISTRIBUTION_LIST_POLL.early.until) return DISTRIBUTION_LIST_POLL.early.every
  if (age < DISTRIBUTION_LIST_POLL.regular.until) return DISTRIBUTION_LIST_POLL.regular.every
  return DISTRIBUTION_LIST_POLL.late.every
}

export const distributionListPollDelay = (age: number, failures = 0) => {
  if (failures < 1) return delayByAge(age)
  const { afterFailure } = DISTRIBUTION_LIST_POLL
  return Math.max(delayByAge(age), afterFailure[Math.min(failures, afterFailure.length) - 1])
}

/**
 * Keeps the distribution list of the mounted tab current without the notification server.
 * While a listed distribution is in progress, the list is re-read on the schedule above
 * and its rows replaced. Notifications still update rows where they arrive.
 * @param read Fetches the list as the tab shows it. Its signal is aborted by the
 * tab's own reads. `report` is true only for the first of consecutive failures.
 */
export function useDistributionListPoll(
  read: (signal: AbortSignal, report: boolean) => Promise<DistributionListItems>
) {
  const distributionListStore = useDistributionListStore()
  const underWay = computed(() =>
    distributionListStore.list.some((item) => DISTRIBUTION_STATUSES_UNDER_WAY.includes(item.status))
  )

  let mounted = false
  // Set while something is in progress. The schedule is measured from it.
  let startedAt: number | undefined = undefined
  let timer: ReturnType<typeof setTimeout> | undefined = undefined
  let reading: AbortController | undefined = undefined
  let ownReads = 0
  // Consecutive failed reads of this poll.
  let failures = 0

  // A notification can write into the list while a read is in flight. That write is newer than the answer.
  let listWrites = 0
  watch(
    () => distributionListStore.list,
    () => {
      listWrites++
    },
    { deep: true, flush: 'sync' }
  )

  const hidden = () => document.visibilityState === 'hidden'
  const idle = () => mounted && startedAt !== undefined && ownReads === 0 && reading === undefined && !hidden()

  const clearTimer = () => {
    clearTimeout(timer)
    timer = undefined
  }

  const schedule = () => {
    clearTimer()
    if (!idle() || startedAt === undefined) return
    timer = setTimeout(readNow, distributionListPollDelay(Date.now() - startedAt, failures))
  }

  const readNow = async () => {
    clearTimer()
    if (!idle()) return
    const current = new AbortController()
    reading = current
    const listWritesBefore = listWrites
    try {
      const items = await read(current.signal, failures === 0)
      if (current.signal.aborted) return
      failures = 0
      if (listWrites === listWritesBefore) distributionListStore.setList(items)
    } catch {
      // Not reported. The list stays unchanged, and the next read is delayed more with each failure.
      if (!current.signal.aborted) failures++
    } finally {
      if (reading === current) {
        reading = undefined
        schedule()
      }
    }
  }

  // Sync, so rows just written by a read decide the next read before it is scheduled.
  watch(
    underWay,
    (value) => {
      startedAt = value ? Date.now() : undefined
      failures = 0
      schedule()
    },
    { flush: 'sync' }
  )

  /**
   * Wraps every read the tab makes itself (opening, paging, after creating, cancelling or
   * managing a distribution). No poll read runs meanwhile, and the schedule restarts afterwards.
   */
  const duringOwnRead = async <T>(run: () => Promise<T>): Promise<T> => {
    ownReads++
    clearTimer()
    reading?.abort()
    reading = undefined
    try {
      return await run()
    } finally {
      ownReads--
      if (ownReads === 0 && mounted) {
        startedAt = underWay.value ? Date.now() : undefined
        failures = 0
        schedule()
      }
    }
  }

  const onVisibilityChange = () => {
    if (hidden()) {
      clearTimer()
      return
    }
    readNow()
  }

  onMounted(() => {
    mounted = true
    document.addEventListener('visibilitychange', onVisibilityChange)
    startedAt = underWay.value ? Date.now() : undefined
    schedule()
  })

  onBeforeUnmount(() => {
    mounted = false
    document.removeEventListener('visibilitychange', onVisibilityChange)
    clearTimer()
    reading?.abort()
    reading = undefined
  })

  return { duringOwnRead }
}
