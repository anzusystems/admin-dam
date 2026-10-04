import type { DamAssetLicenceGroup, FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import { handleRecordLoadError, syncUserAndTimeTracking, useAlerts, usePageNavigation } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import type { Ref } from 'vue'

import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import {
  useFetchAssetLicenceGroup,
  useFetchAssetLicenceGroupList,
  useUpdateAssetLicenceGroup,
} from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import { useAssetLicenceGroupOneStore } from '@/domains/coreDam/assetLicenceGroup/store/assetLicenceGroupStore'
import { useCachedExtSystems } from '@/domains/coreDam/extSystem/composables/cachedExtSystems'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAssetLicenceGroupListActions = () => {
  const listItems = ref<DamAssetLicenceGroup[]>([])
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { execute } = useFetchAssetLicenceGroupList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      const res = await execute(pagination, filterData, filterConfig)
      res.forEach((item) => {
        addToCachedAssetLicences(item.licences)
        addToCachedExtSystems(item.extSystem)
      })
      listItems.value = res
      fetchCachedAssetLicences()
      fetchCachedExtSystems()
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

export const useAssetLicenceGroupDetailActions = () => {
  const assetLicenceGroupOneStore = useAssetLicenceGroupOneStore()
  const { assetLicenceGroup } = storeToRefs(assetLicenceGroupOneStore)
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { execute: fetchAssetLicenceGroup } = useFetchAssetLicenceGroup()

  const fetchData = async (id: number, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      const res = await fetchAssetLicenceGroup({ urlParams: { id }, signal: options.signal })
      addToCachedAssetLicences(res.licences)
      addToCachedExtSystems(res.extSystem)
      assetLicenceGroup.value = res
      fetchCachedAssetLicences()
      fetchCachedExtSystems()
      return true
    } catch (error) {
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      // An aborted load belongs to a page that is gone; the flag is the next page's by now.
      if (!options.signal?.aborted) detailLoading.value = false
    }
  }

  return {
    assetLicenceGroup,
    detailLoading,
    fetchData,
    resetStore: assetLicenceGroupOneStore.reset,
  }
}

export const useAssetLicenceGroupEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const assetLicenceGroupOneStore = useAssetLicenceGroupOneStore()
  const { assetLicenceGroup } = storeToRefs(assetLicenceGroupOneStore)
  const { execute: fetchAssetLicenceGroup } = useFetchAssetLicenceGroup()
  const { execute: updateAssetLicenceGroup } = useUpdateAssetLicenceGroup()

  const fetchData = async (id: number, options: { signal?: AbortSignal } = {}): Promise<boolean | undefined> => {
    detailLoading.value = true
    try {
      assetLicenceGroup.value = await fetchAssetLicenceGroup({ urlParams: { id }, signal: options.signal })
      return true
    } catch (error) {
      return handleRecordLoadError(error) ? false : undefined
    } finally {
      if (!options.signal?.aborted) detailLoading.value = false
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
      const res = await updateAssetLicenceGroup({
        urlParams: { id: assetLicenceGroupOneStore.assetLicenceGroup.id },
        body: assetLicenceGroup.value,
      })
      syncUserAndTimeTracking(assetLicenceGroupOneStore.assetLicenceGroup, res)
      showRecordWas('updated')
      if (!close) return
      push({ name: '/(coreDam)/asset-licence-groups' })
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
    assetLicenceGroup,
    fetchData,
    onUpdate,
    resetStore: assetLicenceGroupOneStore.reset,
  }
}
