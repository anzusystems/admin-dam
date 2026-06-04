import type { DocId, FilterBag, IntegerId, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import {
  createVoiceFamily as apiCreateVoiceFamily,
  deleteVoiceFamily,
  fetchVoiceFamily,
  fetchVoiceFamilyListByExtSystem,
  fetchVoiceFamilyListByIds,
  updateVoiceFamily,
} from '@/services/api/coreDam/voiceFamilyApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { VoiceFamily, VoiceFamilyCreate, VoiceFamilyUpdate } from '@/types/coreDam/VoiceFamily'
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

export const useVoiceFamilyListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<VoiceFamily[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVoiceFamilyListByExtSystem(currentExtSystemId.value, pagination, filterBag)
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

export const useVoiceFamilyCreateActions = () => {
  // Passed to ACreateDialog's call-create; the dialog owns loading + error handling.
  const createVoiceFamily = (voiceFamily: VoiceFamily): Promise<VoiceFamily> => {
    const payload: VoiceFamilyCreate = {
      extSystem: voiceFamily.extSystem,
      slug: voiceFamily.slug,
      displayName: voiceFamily.displayName,
      language: voiceFamily.language,
      preferredProvider: voiceFamily.preferredProvider,
      active: voiceFamily.active,
      keywords: voiceFamily.keywords,
    }
    return apiCreateVoiceFamily(payload)
  }

  return {
    createVoiceFamily,
  }
}

export const useVoiceFamilyRemoveActions = () => {
  const router = useRouter()
  const removeVoiceFamily = async (id: DocId) => {
    detailLoading.value = true
    try {
      await deleteVoiceFamily(id)
      showRecordWas('deleted')
      // Keep detailLoading=true on success: it hides VoiceBindingsList (v-if="!detailLoading")
      // so it cannot remount and refetch voices for the just-deleted family (404) before the
      // redirect completes. The next detail mount resets the flag via fetchData.
      router.push({ name: ROUTE.DAM.VOICE_FAMILY.LIST })
    } catch (error) {
      detailLoading.value = false
      showErrorsDefault(error)
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

  const onUpdate = async () => {
    try {
      saveButtonLoading.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        return
      }
      const payload: VoiceFamilyUpdate = {
        slug: voiceFamily.value.slug,
        displayName: voiceFamily.value.displayName,
        language: voiceFamily.value.language,
        preferredProvider: voiceFamily.value.preferredProvider,
        active: voiceFamily.value.active,
        keywords: voiceFamily.value.keywords,
      }
      await updateVoiceFamily(voiceFamilyOneStore.voiceFamily.id, payload)
      showRecordWas('updated')
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
    }
  }

  return {
    detailLoading,
    saveButtonLoading,
    voiceFamily,
    fetchData,
    onUpdate,
    resetStore: voiceFamilyOneStore.reset,
  }
}

export const useVoiceFamilySelectActions = (extSystemId: IntegerId | (() => IntegerId)) => {
  const resolveExtSystemId = () => (typeof extSystemId === 'function' ? extSystemId() : extSystemId)

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    try {
      const items = await fetchVoiceFamilyListByExtSystem(resolveExtSystemId(), pagination, filterBag)

      return <ValueObjectOption<DocId>[]>items.map((voiceFamily: VoiceFamily) => ({
        title: voiceFamily.displayName,
        value: voiceFamily.id,
      }))
    } catch (error) {
      showErrorsDefault(error)
      return []
    }
  }

  const fetchItemsByIds = async (ids: DocId[]) => {
    try {
      const items = await fetchVoiceFamilyListByIds(resolveExtSystemId(), ids)

      return <ValueObjectOption<DocId>[]>items.map((voiceFamily: VoiceFamily) => ({
        title: voiceFamily.displayName,
        value: voiceFamily.id,
      }))
    } catch (error) {
      showErrorsDefault(error)
      return []
    }
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
