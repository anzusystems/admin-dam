import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
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

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

export const usePodcastListActions = () => {
  const listItems = ref<Podcast[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchPodcastListByExtSystem(currentExtSystemId.value, pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('list')
    }
  }

  return {
    listItems,
    fetchList,
  }
}

export const usePodcastDetailActions = () => {
  const podcastOneStore = usePodcastOneStore()
  const { podcast, loaded } = storeToRefs(podcastOneStore)

  const fetchData = async (id: string) => {
    loaderOn('detail')
    try {
      const podcast = await fetchPodcast(id)
      podcastOneStore.setPodcast(podcast)
      podcastOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    podcast,
    loaded,
    fetchData,
    resetStore: podcastOneStore.reset,
  }
}

export const usePodcastEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const podcastOneStore = usePodcastOneStore()
  const { podcast, loaded } = storeToRefs(podcastOneStore)

  const fetchData = async (id: string) => {
    loaderOn('edit')
    try {
      const podcast = await fetchPodcast(id)
      podcastOneStore.setPodcast(podcast)
      podcastOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('edit')
    }
  }

  const onUpdate = async (close = false) => {
    try {
      btnDisable('save', 'saveAndClose', 'delete')
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        btnEnable('save', 'saveAndClose', 'delete')
        return
      }
      btnDisable(close ? 'save' : 'saveAndClose', 'delete')
      btnLoadingOn(close ? 'saveAndClose' : 'save')
      await updatePodcast(podcastOneStore.podcast.id, podcast.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.PODCAST.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
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
