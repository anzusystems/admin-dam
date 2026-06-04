import { ref } from 'vue'
import { type DocId, type FilterBag, type Pagination, useAlerts } from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import {
  createVoice as apiCreateVoice,
  deleteVoice as apiDeleteVoice,
  fetchVoiceListByFamily,
  updateVoice as apiUpdateVoice,
} from '@/services/api/coreDam/voiceApi'
import type { Voice } from '@/types/coreDam/Voice'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const listLoading = ref(false)
const saveButtonLoading = ref(false)

export const useVoiceListActions = () => {
  const listItems = ref<Voice[]>([])

  const fetchList = async (voiceFamilyId: DocId, pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchVoiceListByFamily(voiceFamilyId, pagination, filterBag)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  const removeVoice = async (id: DocId): Promise<boolean> => {
    try {
      await apiDeleteVoice(id)
      showRecordWas('deleted')
      return true
    } catch (error) {
      showErrorsDefault(error)
      return false
    }
  }

  return {
    listLoading,
    listItems,
    fetchList,
    removeVoice,
  }
}

export const useVoiceCreateActions = () => {
  // Passed to ACreateDialog's call-create; the dialog owns loading + error handling.
  const createVoice = (voice: Voice): Promise<Voice> => apiCreateVoice(voice)

  return {
    createVoice,
  }
}

export const useVoiceEditActions = () => {
  const v$ = useVuelidate()

  const onUpdate = async (voice: Voice, onSuccess?: () => void) => {
    saveButtonLoading.value = true
    try {
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        return
      }
      await apiUpdateVoice(voice.id, voice)
      showRecordWas('updated')
      if (onSuccess) onSuccess()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
    }
  }

  return {
    saveButtonLoading,
    onUpdate,
  }
}
