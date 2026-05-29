import type { Ref } from 'vue'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import {
  useDeleteAuthorCleanPhrase,
  useFetchAuthorCleanPhrase,
  useFetchAuthorCleanPhraseList,
  useUpdateAuthorCleanPhrase,
} from '@/domains/coreDam/authorCleanPhrase/api/AuthorCleanPhraseApi'
import type { AuthorCleanPhrase } from '@/domains/coreDam/authorCleanPhrase/types/AuthorCleanPhrase'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAuthorCleanPhraseOneStore } from '@/domains/coreDam/authorCleanPhrase/store/authorCleanPhraseStore'
import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAuthorCleanPhraseListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<AuthorCleanPhrase[]>([])
  const { executeFetch } = useFetchAuthorCleanPhraseList()

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

export const useAuthorCleanPhraseRemoveActions = () => {
  const router = useRouter()
  const { executeRequest: deleteAuthorCleanPhrase } = useDeleteAuthorCleanPhrase()
  const removeAuthorCleanPhrase = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      await deleteAuthorCleanPhrase({ urlParams: { id } })
      showRecordWas('updated')
      router.push({ name: '/(coreDam)/author-clean-phrases' })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    removeAuthorCleanPhrase,
  }
}

export const useAuthorCleanPhraseDetailActions = () => {
  const authorCleanPhraseOneStore = useAuthorCleanPhraseOneStore()
  const { authorCleanPhrase } = storeToRefs(authorCleanPhraseOneStore)
  const { fetchCachedAuthors, addToCachedAuthors } = useCachedAuthors()

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const { executeRequest: fetchAuthorCleanPhrase } = useFetchAuthorCleanPhrase()
      const authorCleanPhrase = await fetchAuthorCleanPhrase({ urlParams: { id } })
      authorCleanPhraseOneStore.setAuthorCleanPhrase(authorCleanPhrase)
      if (authorCleanPhrase.authorReplacement) {
        addToCachedAuthors(authorCleanPhrase.authorReplacement)
      }
      fetchCachedAuthors()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    authorCleanPhrase,
    detailLoading,
    fetchData,
    resetStore: authorCleanPhraseOneStore.reset,
  }
}

export const useAuthorCleanPhraseEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const authorCleanPhraseOneStore = useAuthorCleanPhraseOneStore()
  const { authorCleanPhrase } = storeToRefs(authorCleanPhraseOneStore)

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const { executeRequest: fetchAuthorCleanPhrase } = useFetchAuthorCleanPhrase()
      const authorCleanPhrase = await fetchAuthorCleanPhrase({ urlParams: { id } })
      authorCleanPhraseOneStore.setAuthorCleanPhrase(authorCleanPhrase)
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
      const { executeRequest: updateAuthorCleanPhrase } = useUpdateAuthorCleanPhrase()
      await updateAuthorCleanPhrase({
        urlParams: { id: authorCleanPhraseOneStore.authorCleanPhrase.id },
        object: authorCleanPhrase.value,
      })
      showRecordWas('updated')

      router.push({
        name: '/(coreDam)/author-clean-phrases/[id]',
        params: { id: authorCleanPhraseOneStore.authorCleanPhrase.id },
      })
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
    authorCleanPhrase,
    fetchData,
    onUpdate,
    resetStore: authorCleanPhraseOneStore.reset,
  }
}
