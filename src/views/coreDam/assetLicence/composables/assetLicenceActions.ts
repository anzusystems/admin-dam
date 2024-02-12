import { ref } from 'vue'
import type { DamAssetLicence, FilterBag, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { fetchDamAssetLicenceList, fetchDamAssetLicenceListByIds, useAlerts } from '@anzusystems/common-admin'
import { useAssetLicenceOneStore } from '@/stores/coreDam/assetLicenceStore'
import { storeToRefs } from 'pinia'
import { fetchAssetLicence, updateAssetLicence } from '@/services/api/coreDam/assetLicenceApi'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useCachedExtSystems } from '@/views/coreDam/extSystem/composables/cachedExtSystems'
import { damClient } from '@/services/api/clients/damClient'

const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAssetLicenceListActions = () => {
  const listItems = ref<DamAssetLicence[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchDamAssetLicenceList(damClient, pagination, filterBag)
      addToCachedExtSystems(listItems.value.map((item) => item.extSystem))
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

export const useAssetLicenceDetailActions = () => {
  const assetLicenceOneStore = useAssetLicenceOneStore()
  const { assetLicence } = storeToRefs(assetLicenceOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const assetLicence = await fetchAssetLicence(id)
      addToCachedExtSystems(assetLicence.extSystem)
      fetchCachedExtSystems()
      assetLicenceOneStore.setAssetLicence(assetLicence)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    assetLicence,
    detailLoading,
    fetchData,
    resetStore: assetLicenceOneStore.reset,
  }
}

export const useAssetLicenceEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const assetLicenceOneStore = useAssetLicenceOneStore()
  const { assetLicence } = storeToRefs(assetLicenceOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const assetLicence = await fetchAssetLicence(id)
      addToCachedExtSystems(assetLicence.extSystem)
      fetchCachedExtSystems()
      assetLicenceOneStore.setAssetLicence(assetLicence)
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
      await updateAssetLicence(assetLicenceOneStore.assetLicence.id, assetLicence.value)
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
    assetLicence,
    fetchData,
    onUpdate,
    resetStore: assetLicenceOneStore.reset,
  }
}

export const useAssetLicenceByExtIdSelectActions = () => {
  const mapToValueObjectOption = (assetLicences: DamAssetLicence[]): ValueObjectOption<number>[] => {
    return assetLicences.map((assetLicence: DamAssetLicence) => ({
      title: assetLicence.extId,
      value: assetLicence.id,
    }))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToValueObjectOption(await fetchDamAssetLicenceList(damClient, pagination, filterBag))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    return mapToValueObjectOption(await fetchDamAssetLicenceListByIds(damClient, ids))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
