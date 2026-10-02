import {
  createFilter,
  createFilterStore,
  syncUserAndTimeTracking,
  useAlerts,
  usePagination,
} from '@anzusystems/common-admin'
import type {
  DocId,
  FilterConfig,
  FilterData,
  IntegerId,
  MakeFilterOption,
  Pagination,
  ValueObjectOption,
} from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import {
  ENTITY,
  useCreateVoiceFamily,
  useDeleteVoiceFamily,
  useFetchVoiceFamily,
  useFetchVoiceFamilyListByExtSystem,
  useFetchVoiceFamilyListByIds,
  useUpdateVoiceFamily,
} from '@/domains/coreDam/voiceFamily/api/voiceFamilyApi'
import { useVoiceFamilyOneStore } from '@/domains/coreDam/voiceFamily/store/voiceFamilyStore'
import type { VoiceFamily, VoiceFamilyCreate, VoiceFamilyUpdate } from '@/domains/coreDam/voiceFamily/types/VoiceFamily'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)

export const useVoiceFamilyListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { execute } = useFetchVoiceFamilyListByExtSystem()
  const listItems = ref<VoiceFamily[]>([])

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig, {
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

export const useVoiceFamilyCreateActions = () => {
  const { execute: createVoiceFamilyRequest } = useCreateVoiceFamily()

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
    return createVoiceFamilyRequest({ body: payload })
  }

  return {
    createVoiceFamily,
  }
}

export const useVoiceFamilyRemoveActions = () => {
  const router = useRouter()
  const { execute: deleteVoiceFamily } = useDeleteVoiceFamily()
  const removeVoiceFamily = async (id: DocId) => {
    detailLoading.value = true
    try {
      await deleteVoiceFamily({ urlParams: { id } })
      showRecordWas('deleted')
      // Keep detailLoading=true on success: it hides VoiceBindingsList (v-if="!detailLoading")
      // so it cannot remount and refetch voices for the just-deleted family (404) before the
      // redirect completes. The next detail mount resets the flag via fetchData.
      router.push({ name: '/(coreDam)/voice-families' })
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
  const { execute: fetchVoiceFamily } = useFetchVoiceFamily()

  const fetchData = async (id: DocId) => {
    detailLoading.value = true
    try {
      voiceFamily.value = await fetchVoiceFamily({ urlParams: { id } })
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
  const { execute: fetchVoiceFamily } = useFetchVoiceFamily()
  const { execute: updateVoiceFamily } = useUpdateVoiceFamily()

  const fetchData = async (id: DocId) => {
    detailLoading.value = true
    try {
      voiceFamily.value = await fetchVoiceFamily({ urlParams: { id } })
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
      const res = await updateVoiceFamily({ urlParams: { id: voiceFamilyOneStore.voiceFamily.id }, body: payload })
      syncUserAndTimeTracking(voiceFamilyOneStore.voiceFamily, res)
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
  const { execute } = useFetchVoiceFamilyListByExtSystem()
  const { execute: executeFetchByIds } = useFetchVoiceFamilyListByIds()

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    try {
      const items = await execute(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: resolveExtSystemId() },
      })

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
      const items = await executeFetchByIds(ids, { urlParams: { extSystemId: resolveExtSystemId() } })

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

// Slug-valued voice-family options for a RemoteAutocomplete (the synthesize request carries the slug).
export const useVoiceFamilySlugSelectActions = (extSystemId: IntegerId | (() => IntegerId)) => {
  const resolveExtSystemId = () => (typeof extSystemId === 'function' ? extSystemId() : extSystemId)
  const { execute } = useFetchVoiceFamilyListByExtSystem()

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    try {
      const items = await execute(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: resolveExtSystemId() },
      })

      return <ValueObjectOption<string>[]>items.map((voiceFamily: VoiceFamily) => ({
        title: voiceFamily.displayName,
        value: voiceFamily.slug,
      }))
    } catch (error) {
      showErrorsDefault(error)
      return []
    }
  }

  // Resolves the currently-selected slug(s) — filter server-side by slug instead of loading all.
  const fetchItemsBySlugs = async (slugs: string[]) => {
    if (slugs.length === 0) return []
    try {
      // Dedicated ephemeral slug filter — must not mutate the shared list-filter store.
      const slugFields = [
        { name: 'slug' as const, variant: 'in', default: [], type: 'string' },
      ] satisfies readonly MakeFilterOption[]
      const { filterData, filterConfig } = createFilter(slugFields, createFilterStore(slugFields), {
        system: SYSTEM_CORE_DAM,
        subject: ENTITY,
      })
      filterData.slug = slugs
      const { pagination } = usePagination(null)
      const items = await execute(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: resolveExtSystemId() },
      })

      return <ValueObjectOption<string>[]>items.map((voiceFamily: VoiceFamily) => ({
        title: voiceFamily.displayName,
        value: voiceFamily.slug,
      }))
    } catch (error) {
      showErrorsDefault(error)
      return []
    }
  }

  return {
    fetchItems,
    fetchItemsByIds: fetchItemsBySlugs,
  }
}
