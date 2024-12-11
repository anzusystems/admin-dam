import type { FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import {
  deleteAuthorCleanPhrase,
  fetchAuthorCleanPhrase, fetchAuthorCleanPhraseList,
  updateAuthorCleanPhrase,
} from '@/services/api/coreDam/AuthorCleanPhraseApi'
import type { AuthorCleanPhrase } from '@/types/coreDam/AuthorCleanPhrase'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useAuthorCleanPhraseOneStore } from '@/stores/coreDam/authorCleanPhraseStore'
import { ROUTE } from '@/router/routes'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAuthorCleanPhraseListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<AuthorCleanPhrase[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchAuthorCleanPhraseList(currentExtSystemId.value, pagination, filterBag)
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
  const removeAuthorCleanPhrase = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      await deleteAuthorCleanPhrase(id)
      showRecordWas('updated')
      router.push({ name: ROUTE.DAM.AUTHOR_CLEAN_PHRASE.LIST })
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

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const authorCleanPhrase = await fetchAuthorCleanPhrase(id)
      authorCleanPhraseOneStore.setAuthorCleanPhrase(authorCleanPhrase)
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
      const authorCleanPhrase = await fetchAuthorCleanPhrase(id)
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
      await updateAuthorCleanPhrase(authorCleanPhraseOneStore.authorCleanPhrase.id, authorCleanPhrase.value)
      showRecordWas('updated')

      router.push({ name: ROUTE.DAM.AUTHOR_CLEAN_PHRASE.DETAIL, params: { id: authorCleanPhraseOneStore.authorCleanPhrase.id } })
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
