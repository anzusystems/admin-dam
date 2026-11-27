import type {
  FilterConfig,
  FilterData,
  IntegerId,
  IntegerIdNullable,
  Pagination,
  ValueObjectOption,
} from '@anzusystems/common-admin'
import {
  defineRecordLoader,
  isAnzuApiValidationError,
  isUndefined,
  useAlerts,
  usePageNavigation,
} from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import {
  ENTITY,
  useFetchPodcast,
  useFetchPodcastListByExtSystem,
  useFetchPodcastListByIds,
  useUpdatePodcast,
} from '@/domains/coreDam/podcast/api/podcastApi'
import { exportDataCombination } from '@/domains/coreDam/podcast/composables/podcastExportDataValidations'
import { usePodcastOneStore } from '@/domains/coreDam/podcast/store/podcastStore'
import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

type SentExportData = Array<{ id: IntegerId; pair: string }>
const EXPORT_DATA_ROW_FIELD = new RegExp(
  '^' + SYSTEM_CORE_DAM + '\\.' + ENTITY + '\\.model\\.exportData\\[(\\d+)\\]\\.'
)
const NOT_UNIQUE = 'error_field_not_unique'

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePodcastListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { execute } = useFetchPodcastListByExtSystem()

  const listItems = ref<Podcast[]>([])

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    listLoading,
    listItems,
    fetchList,
  }
}

export const usePodcastDetailActions = () => {
  const podcastOneStore = usePodcastOneStore()
  const { podcast } = storeToRefs(podcastOneStore)
  const { execute: fetchPodcast } = useFetchPodcast()

  const fetchData = defineRecordLoader(detailLoading, async (id: string, signal) => {
    const podcast = await fetchPodcast({ urlParams: { id }, signal })
    podcastOneStore.setPodcast(podcast)
  })

  return {
    detailLoading,
    podcast,
    fetchData,
    resetStore: podcastOneStore.reset,
  }
}

export const usePodcastEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const podcastOneStore = usePodcastOneStore()
  const { podcast } = storeToRefs(podcastOneStore)
  const { execute: fetchPodcast } = useFetchPodcast()
  const { execute: updatePodcast } = useUpdatePodcast()

  const fetchData = defineRecordLoader(detailLoading, async (id: string, signal) => {
    const podcast = await fetchPodcast({ urlParams: { id }, signal })
    podcastOneStore.setPodcast(podcast)
  })

  /*
   * Marks the export-data rows the server refused as not unique, at the row.
   * Its errors name a row by its place in the save: `exportData[2].exportType`.
   */
  const markRefusedExportData = (error: unknown, sent: SentExportData) => {
    if (!isAnzuApiValidationError(error)) return
    const refused = new Map<IntegerId, string>()
    error.fields.forEach(({ field, errors }) => {
      const index = EXPORT_DATA_ROW_FIELD.exec(field)?.[1]
      const row = isUndefined(index) ? undefined : sent[Number(index)]
      if (row && errors.includes(NOT_UNIQUE)) refused.set(row.id, row.pair)
    })
    podcastOneStore.exportDataRefused = refused
  }

  const onUpdate = async (close = false, onSuccess: ((podcast: Podcast) => void) | undefined = undefined) => {
    let sentExportData: SentExportData = []
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      // New rows carry a negative temp id for the editor key, but the API expects id 0 to create a new export-data entity.
      const object: Podcast = {
        ...podcast.value,
        exportData: podcast.value.exportData.map((item) => (item.id < 0 ? { ...item, id: 0 } : item)),
      }
      // In the order sent, which the server's errors refer to. The rows can change during the request.
      sentExportData = podcast.value.exportData.map((row) => ({ id: row.id, pair: exportDataCombination(row) }))
      const updatedPodcast = await updatePodcast({
        urlParams: { id: podcastOneStore.podcast.id },
        body: object,
      })
      // Adopt the server response (real ids for new rows, sorted by `setPodcast`) so the
      // editor can re-baseline via `commit()` and saved rows lose their unsaved markers.
      podcastOneStore.setPodcast(updatedPodcast)
      showRecordWas('updated')
      if (!isUndefined(onSuccess)) onSuccess(updatedPodcast)
      if (!close) return
      push({ name: '/(coreDam)/podcasts' })
    } catch (error) {
      markRefusedExportData(error, sentExportData)
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
    detailLoading,
    saveButtonLoading,
    saveAndCloseButtonLoading,
    podcast,
    fetchData,
    onUpdate,
    resetStore: podcastOneStore.reset,
  }
}

// `extSystemId` getter lets callers scope to a specific ext-system (e.g. the synthesize dialog where
// the user picks one); omitted or empty → falls back to the global current ext-system.
export const usePodcastSelectActions = (extSystemId?: () => IntegerIdNullable | undefined) => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { execute } = useFetchPodcastListByExtSystem()
  const resolveExtSystemId = (): IntegerId => extSystemId?.() || currentExtSystemId.value

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const podcasts = await execute(pagination, filterData, filterConfig, {
      urlParams: { extSystemId: resolveExtSystemId() },
    })

    return <ValueObjectOption<string>[]>podcasts.map((podcast: Podcast) => ({
      title: podcast.texts.title,
      value: podcast.id,
    }))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const { execute: executeFetchByIds } = useFetchPodcastListByIds()
    const podcasts = await executeFetchByIds(ids, { urlParams: { extSystemId: resolveExtSystemId() } })

    return <ValueObjectOption<string>[]>podcasts.map((podcast: Podcast) => ({
      title: podcast.texts.title,
      value: podcast.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
