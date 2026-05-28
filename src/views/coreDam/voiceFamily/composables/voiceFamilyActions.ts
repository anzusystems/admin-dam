import type { DocId, FilterBag, IntegerId, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import {
  deleteVoiceFamily,
  fetchVoiceFamily,
  fetchVoiceFamilyList,
  fetchVoiceFamilyListByExtSystem,
  fetchVoiceFamilyListByIds,
  updateVoiceFamily,
} from '@/services/api/coreDam/voiceFamilyApi'
import type { VoiceFamily, VoiceFamilyUpdate } from '@/types/coreDam/VoiceFamily'
import { storeToRefs } from 'pinia'
import { useVoiceFamilyOneStore } from '@/stores/coreDam/voiceFamilyStore'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useVoiceFamilyListActions = () => {
  const listItems = ref<VoiceFamily[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVoiceFamilyList(pagination, filterBag)
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

export const useVoiceFamilyRemoveActions = () => {
  const router = useRouter()
  const removeVoiceFamily = async (id: DocId) => {
    detailLoading.value = true
    try {
      await deleteVoiceFamily(id)
      showRecordWas('deleted')
      router.push({ name: ROUTE.DAM.VOICE_FAMILY.LIST })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    removeVoiceFamily,
  }
}

export const useVoiceFamilyDetailActions = () => {
  const voiceFamilyOneStore = useVoiceFamilyOneStore()
  const { voiceFamily } = storeToRefs(voiceFamilyOneStore)

  const fetchData = async (id: DocId) => {
    detailLoading.value = true
    try {
      voiceFamily.value = await fetchVoiceFamily(id)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    detailLoading,
    voiceFamily,
    fetchData,
    resetStore: voiceFamilyOneStore.reset,
  }
}

export const useVoiceFamilyEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const voiceFamilyOneStore = useVoiceFamilyOneStore()
  const { voiceFamily } = storeToRefs(voiceFamilyOneStore)

  const fetchData = async (id: DocId) => {
    detailLoading.value = true
    try {
      voiceFamily.value = await fetchVoiceFamily(id)
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
      const payload: VoiceFamilyUpdate = {
        displayName: voiceFamily.value.displayName,
        language: voiceFamily.value.language,
        preferredProvider: voiceFamily.value.preferredProvider,
        active: voiceFamily.value.active,
        keyword: voiceFamily.value.keyword,
        keywords: voiceFamily.value.keywords,
      }
      await updateVoiceFamily(voiceFamilyOneStore.voiceFamily.id, payload)
      showRecordWas('updated')
      if (!close) return
      router.push({
        name: ROUTE.DAM.VOICE_FAMILY.DETAIL,
        params: { id: voiceFamilyOneStore.voiceFamily.id },
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
    voiceFamily,
    fetchData,
    onUpdate,
    resetStore: voiceFamilyOneStore.reset,
  }
}

export const useVoiceFamilySelectActions = (extSystemId: IntegerId | (() => IntegerId)) => {
  const resolveExtSystemId = () => (typeof extSystemId === 'function' ? extSystemId() : extSystemId)

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    const items = await fetchVoiceFamilyListByExtSystem(resolveExtSystemId(), pagination, filterBag)

    return <ValueObjectOption<DocId>[]>items.map((voiceFamily: VoiceFamily) => ({
      title: voiceFamily.displayName,
      value: voiceFamily.id,
    }))
  }

  const fetchItemsByIds = async (ids: DocId[]) => {
    const items = await fetchVoiceFamilyListByIds(resolveExtSystemId(), ids)

    return <ValueObjectOption<DocId>[]>items.map((voiceFamily: VoiceFamily) => ({
      title: voiceFamily.displayName,
      value: voiceFamily.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
