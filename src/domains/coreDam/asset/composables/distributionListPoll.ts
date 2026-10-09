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
 * How long after a read the next one comes, by the time since a distribution under way was first seen or the
 * list was last read for the user: reads at 15 s and 30 s, then every 30 s until 5 minutes, then every minute.
 * core-dam itself looks at a distribution under way once in 30 to 90 s.
 *
 * `afterFailure`: after a read that failed the next one comes no sooner than this, by the number of reads that
 * failed in a row; the last entry holds for every failure after it.
 */
export const DISTRIBUTION_LIST_POLL = {
  early: { until: 30_000, every: 15_000 },
  regular: { until: 5 * 60_000, every: 30_000 },
  late: { every: 60_000 },
  afterFailure: [15_000, 30_000, 60_000, 120_000, 300_000],
} as const

/** A distribution in one of these is still going to change on its own. */
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
 * Keeps the distribution list of the mounted tab up to date without the notification server: while a listed
 * distribution is under way, the list is read again in the rhythm above and its rows are replaced. The
 * notifications, where they arrive, change the rows as before.
 *
 * @param read The request of the list as the tab shows it. It is handed a signal: a read of the tab's own
 * stops the one made here.
 */
export function useDistributionListPoll(read: (signal: AbortSignal) => Promise<DistributionListItems>) {
  const distributionListStore = useDistributionListStore()
  const underWay = computed(() =>
    distributionListStore.list.some((item) => DISTRIBUTION_STATUSES_UNDER_WAY.includes(item.status))
  )

  let mounted = false
  // Set while there is something to wait for; the rhythm is measured from it.
  let startedAt: number | undefined = undefined
  let timer: ReturnType<typeof setTimeout> | undefined = undefined
  let reading: AbortController | undefined = undefined
  let ownReads = 0
  // Reads of this poll that failed one after another.
  let failures = 0

  // A notification writes into the list while a read is on its way: what it wrote is newer than the answer.
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
      const items = await read(current.signal)
      if (current.signal.aborted) return
      failures = 0
      if (listWrites === listWritesBefore) distributionListStore.setList(items)
    } catch {
      // Said nowhere: the list stays as it is, and the next read comes later the more of them failed.
      if (!current.signal.aborted) failures++
    } finally {
      if (reading === current) {
        reading = undefined
        schedule()
      }
    }
  }

  // Sync, so that the rows a read has just put in decide about the next read before it is scheduled.
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
   * Wraps every read the tab makes itself (opening, paging, after a distribution was created, cancelled or
   * managed): nothing is read here meanwhile, and the rhythm starts again when it is over.
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
