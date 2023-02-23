import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import { useAlerts } from '@anzusystems/common-admin'
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

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAuthorListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()

  const listItems = ref<Author[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchAuthorList(currentExtSystemId.value, pagination, filterBag)
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

export const useAuthorDetailActions = () => {
  const authorOneStore = useAuthorOneStore()
  const { author } = storeToRefs(authorOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const author = await fetchAuthor(id)
      authorOneStore.setAuthor(author)
    } catch (error) {
      handleError(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    author,
    detailLoading,
    fetchData,
    resetStore: authorOneStore.reset,
  }
}

export const useAuthorEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const authorOneStore = useAuthorOneStore()
  const { author } = storeToRefs(authorOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const author = await fetchAuthor(id)
      authorOneStore.setAuthor(author)
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
      await updateAuthor(authorOneStore.author.id, author.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.AUTHOR.LIST })
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
