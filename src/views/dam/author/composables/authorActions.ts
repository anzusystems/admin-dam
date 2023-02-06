import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import type { Author } from '@/types/dam/Author'
import { fetchAuthor, fetchAuthorList, fetchAuthorListByIds, updateAuthor } from '@/services/api/dam/authorApi'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useAuthorOneStore } from '@/stores/dam/authorStore'
import type { ValueObjectOption } from '@/types/ValueObject'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

export const useAuthorListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()

  const listItems = ref<Author[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchAuthorList(currentExtSystemId.value, pagination, filterBag)
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

export const useAuthorDetailActions = () => {
  const authorOneStore = useAuthorOneStore()
  const { author, loaded } = storeToRefs(authorOneStore)

  const fetchData = async (id: string) => {
    loaderOn('detail')
    try {
      const author = await fetchAuthor(id)
      authorOneStore.setAuthor(author)
      authorOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    author,
    loaded,
    fetchData,
    resetStore: authorOneStore.reset,
  }
}

export const useAuthorEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const authorOneStore = useAuthorOneStore()
  const { author, loaded } = storeToRefs(authorOneStore)

  const fetchData = async (id: string) => {
    loaderOn('edit')
    try {
      const author = await fetchAuthor(id)
      authorOneStore.setAuthor(author)
      authorOneStore.setLoaded(true)
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
      await updateAuthor(authorOneStore.author.id, author.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.AUTHOR.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
    author,
    fetchData,
    onUpdate,
    resetStore: authorOneStore.reset,
  }
}

export const useAuthorSelectActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()

  const mapToValueObject = (author: Author): ValueObjectOption<string> => ({
    title: author.name + (author.identifier ? ` (${author.identifier})` : ''),
    value: author.id,
  })

  const mapToValueObjects = (authors: Author[]): ValueObjectOption<string>[] => {
    return authors.map((author: Author) => mapToValueObject(author))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToValueObjects(await fetchAuthorList(currentExtSystemId.value, pagination, filterBag))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    return mapToValueObjects(await fetchAuthorListByIds(currentExtSystemId.value, ids))
  }

  return {
    mapToValueObject,
    fetchItems,
    fetchItemsByIds,
  }
}
