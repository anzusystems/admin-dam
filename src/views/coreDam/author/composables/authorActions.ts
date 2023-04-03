import { ref } from 'vue'
import type { FilterBag, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import type { Author, AuthorMinimal } from '@/types/coreDam/Author'
import { fetchAuthor, fetchAuthorList, fetchAuthorListByIds, updateAuthor } from '@/services/api/coreDam/authorApi'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useAuthorOneStore } from '@/stores/coreDam/authorStore'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
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

export const useAuthorDetailActions = () => {
  const authorOneStore = useAuthorOneStore()
  const { author } = storeToRefs(authorOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const author = await fetchAuthor(id)
      authorOneStore.setAuthor(author)
    } catch (error) {
      showErrorsDefault(error)
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
      showErrorsDefault(error)
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
    author,
    fetchData,
    onUpdate,
    resetStore: authorOneStore.reset,
  }
}

export const useAuthorSelectActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()

  const mapToMinimal = (author: Author): AuthorMinimal => ({
    id: author.id,
    name: author.name,
    identifier: author.identifier,
  })

  const mapToValueObject = (author: Author): ValueObjectOption<string> => ({
    title: author.name + (author.identifier ? ` (${author.identifier})` : ''),
    value: author.id,
  })

  const mapToValueObjects = (authors: Author[]): ValueObjectOption<string>[] => {
    return authors.map((author: Author) => mapToValueObject(author))
  }

  const mapToMinimals = (authors: Author[]): AuthorMinimal[] => {
    return authors.map((author: Author) => mapToMinimal(author))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToValueObjects(await fetchAuthorList(currentExtSystemId.value, pagination, filterBag))
  }

  const fetchItemsMinimal = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToMinimals(await fetchAuthorList(currentExtSystemId.value, pagination, filterBag))
  }

  const fetchItemsByIds = async (ids: string[]) => {
    return mapToValueObjects(await fetchAuthorListByIds(currentExtSystemId.value, ids))
  }

  return {
    mapToValueObject,
    fetchItems,
    fetchItemsByIds,
    fetchItemsMinimal,
  }
}
