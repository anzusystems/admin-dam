import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useAlerts } from '@anzusystems/common-admin'
import { useErrorHandler } from '@/composables/system/error'
import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import {
  fetchPodcast,
  fetchPodcastListByExtSystem,
  fetchPodcastListByIds,
  updatePodcast,
} from '@/services/api/dam/podcastApi'
import type { Podcast } from '@/types/dam/Podcast'
import { storeToRefs } from 'pinia'
import { usePodcastOneStore } from '@/stores/dam/podcastStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import type { ValueObjectOption } from '@/types/ValueObject'

const { currentExtSystemId } = useCurrentExtSystem()

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePodcastListActions = () => {
  const listItems = ref<Podcast[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchPodcastListByExtSystem(currentExtSystemId.value, pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    listLoading,
    listItems,
    fetchList,
  }
}

export const usePodcastDetailActions = () => {
  const podcastOneStore = usePodcastOneStore()
  const { podcast } = storeToRefs(podcastOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const podcast = await fetchPodcast(id)
      podcastOneStore.setPodcast(podcast)
    } catch (error) {
      handleError(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    detailLoading,
    podcast,
    fetchData,
    resetStore: podcastOneStore.reset,
  }
}

export const usePodcastEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const podcastOneStore = usePodcastOneStore()
  const { podcast } = storeToRefs(podcastOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const podcast = await fetchPodcast(id)
      podcastOneStore.setPodcast(podcast)
    } catch (error) {
      handleError(error)
    } finally {
      detailLoading.value = false
    }
  }

  const onUpdate = async (close = false) => {
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      await updatePodcast(podcastOneStore.podcast.id, podcast.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.PODCAST.LIST })
    } catch (error) {
      handleError(error)
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

export const usePodcastSelectActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    const podcasts = await fetchPodcastListByExtSystem(currentExtSystemId.value, pagination, filterBag)

    return <ValueObjectOption<string>[]>podcasts.map((podcast: Podcast) => ({
      title: podcast.texts.title,
      value: podcast.id,
    }))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const podcasts = await fetchPodcastListByIds(currentExtSystemId.value, ids)

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
