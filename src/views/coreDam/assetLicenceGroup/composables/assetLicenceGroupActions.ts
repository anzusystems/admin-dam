import { ref } from 'vue'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { useAssetLicenceGroupOneStore } from '@/stores/coreDam/assetLicenceGroupStore'
import { storeToRefs } from 'pinia'
import {
  fetchAssetLicenceGroup,
  fetchAssetLicenceGroupList,
  updateAssetLicenceGroup
} from '@/services/api/coreDam/assetLicenceGroupApi'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import type { AssetLicenceGroup } from '@/types/coreDam/AssetLicenceGroup'
import { useCachedAssetLicences } from '@/views/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedExtSystems } from '@/views/coreDam/extSystem/composables/cachedExtSystems'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAssetLicenceGroupListActions = () => {
  const listItems = ref<AssetLicenceGroup[]>([])
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      const res = await fetchAssetLicenceGroupList(pagination, filterBag)
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

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const res= await fetchAssetLicenceGroup(id)
      addToCachedAssetLicences(res.licences)
      addToCachedExtSystems(res.extSystem)
      assetLicenceGroup.value = res
      fetchCachedAssetLicences()
      fetchCachedExtSystems()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
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
  const router = useRouter()
  const assetLicenceGroupOneStore = useAssetLicenceGroupOneStore()
  const { assetLicenceGroup } = storeToRefs(assetLicenceGroupOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      assetLicenceGroup.value = await fetchAssetLicenceGroup(id)
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
      await updateAssetLicenceGroup(assetLicenceGroupOneStore.assetLicenceGroup.id, assetLicenceGroup.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.ASSET_LICENCE.LIST })
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
