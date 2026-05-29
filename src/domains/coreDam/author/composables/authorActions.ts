import type { DamAuthor, DamAuthorMinimal } from '@anzusystems/common-admin'
import { useDamCachedUsers } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import {
  useFetchAuthor,
  useFetchAuthorList,
  useFetchAuthorListByIds,
  useUpdateAuthor,
} from '@/domains/coreDam/author/api/authorApi'
import { useAuthorOneStore } from '@/domains/coreDam/author/store/authorStore'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAuthorListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { executeFetch } = useFetchAuthorList()

  const listItems = ref<DamAuthor[]>([])

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig, {
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

export const useAuthorDetailActions = () => {
  const authorOneStore = useAuthorOneStore()
  const { author } = storeToRefs(authorOneStore)
  const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
  const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()
  const { executeRequest: fetchAuthor } = useFetchAuthor()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const author = await fetchAuthor({ urlParams: { id } })

      author.currentAuthors.forEach((item) => {
        addToCachedAuthors(item)
      })
      author.childAuthors.forEach((item) => {
        addToCachedAuthors(item)
      })
      addToCachedUsers(author.createdBy, author.modifiedBy)
      fetchCachedAuthors()
      fetchCachedUsers()

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
  const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
  const { executeRequest: fetchAuthor } = useFetchAuthor()
  const { executeRequest: updateAuthor } = useUpdateAuthor()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const author = await fetchAuthor({ urlParams: { id } })
      author.currentAuthors.forEach((item) => {
        addToCachedAuthors(item)
      })
      author.childAuthors.forEach((item) => {
        addToCachedAuthors(item)
      })
      fetchCachedAuthors()
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
      await updateAuthor({ urlParams: { id: authorOneStore.author.id }, object: author.value })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/authors' })
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
  const { executeFetch } = useFetchAuthorList()

  const mapToMinimal = (author: DamAuthor): DamAuthorMinimal => ({
    id: author.id,
    name: author.name,
    identifier: author.identifier,
    reviewed: author.flags.reviewed,
  })

  const mapToValueObject = (author: DamAuthor): ValueObjectOption<string> => ({
    title: author.name + (author.identifier ? ` (${author.identifier})` : ''),
    value: author.id,
  })

  const mapToValueObjects = (authors: DamAuthor[]): ValueObjectOption<string>[] => {
    return authors.map((author: DamAuthor) => mapToValueObject(author))
  }

  const mapToMinimals = (authors: DamAuthor[]): DamAuthorMinimal[] => {
    return authors.map((author: DamAuthor) => mapToMinimal(author))
  }

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    return mapToValueObjects(
      await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
    )
  }

  const fetchItemsMinimal = async (
    pagination: Ref<Pagination>,
    filterData: FilterData,
    filterConfig: FilterConfig
  ) => {
    return mapToMinimals(
      await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
    )
  }

  const fetchItemsByIds = async (ids: string[]) => {
    const { executeFetch: executeFetchByIds } = useFetchAuthorListByIds()
    return mapToValueObjects(
      await executeFetchByIds(ids, { urlParams: { extSystemId: currentExtSystemId.value } })
    )
  }

  return {
    mapToValueObject,
    fetchItems,
    fetchItemsByIds,
    fetchItemsMinimal,
  }
}
