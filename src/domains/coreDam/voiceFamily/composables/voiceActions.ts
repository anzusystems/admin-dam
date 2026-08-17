import { ref } from 'vue'
import type { Ref } from 'vue'
import { type DocId, useAlerts } from '@anzusystems/common-admin'
import { createFilter, createFilterStore, type MakeFilterOption, type Pagination } from '@anzusystems/common-admin/labs'
import useVuelidate from '@vuelidate/core'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import {
  ENTITY,
  useCreateVoice,
  useDeleteVoice,
  useFetchVoiceListByFamily,
  useUpdateVoice,
  writeEndpoint,
} from '@/domains/coreDam/voiceFamily/api/voiceApi'
import type { Voice } from '@/domains/coreDam/voiceFamily/types/Voice'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

// Voice list has no filter UI — an empty filter satisfies the new executeFetch signature.
const emptyFilterFields = [] satisfies readonly MakeFilterOption[]
const { filterData: emptyFilterData, filterConfig: emptyFilterConfig } = createFilter(
  emptyFilterFields,
  createFilterStore(emptyFilterFields),
  { system: SYSTEM_CORE_DAM, subject: ENTITY }
)

const listLoading = ref(false)
const saveButtonLoading = ref(false)

export const useVoiceListActions = () => {
  const { executeFetch } = useFetchVoiceListByFamily()
  const listItems = ref<Voice[]>([])

  const fetchList = async (voiceFamilyId: DocId, pagination: Ref<Pagination>) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, emptyFilterData, emptyFilterConfig, {
        urlParams: { voiceFamilyId },
      })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  const { executeRequest: deleteVoice } = useDeleteVoice()
  const removeVoice = async (id: DocId): Promise<boolean> => {
    try {
      await deleteVoice({ urlParams: { id } })
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
  const { executeRequest: createVoiceRequest } = useCreateVoice()

  // Passed to ACreateDialog's call-create; the dialog owns loading + error handling.
  const createVoice = (voice: Voice): Promise<Voice> =>
    createVoiceRequest({ urlTemplate: writeEndpoint(voice.discriminator), object: voice })

  return {
    createVoice,
  }
}

export const useVoiceEditActions = () => {
  const v$ = useVuelidate()
  const { executeRequest: updateVoiceRequest } = useUpdateVoice()

  const onUpdate = async (voice: Voice, onSuccess?: () => void) => {
    try {
      saveButtonLoading.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        return
      }
      await updateVoiceRequest({
        urlTemplate: writeEndpoint(voice.discriminator) + '/:id',
        urlParams: { id: voice.id },
        object: voice,
      })
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
