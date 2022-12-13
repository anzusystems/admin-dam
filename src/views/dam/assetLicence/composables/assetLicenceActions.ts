import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import type { AssetLicence } from '@/types/dam/AssetLicence'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { useAssetLicenceOneStore } from '@/stores/dam/assetLicenceStore'
import { storeToRefs } from 'pinia'
import {
  fetchAssetLicence,
  fetchAssetLicenceList,
  fetchAssetLicenceListByIds,
  updateAssetLicence,
} from '@/services/api/dam/assetLicenceApi'
import { loadLazyExtSystem } from '@/views/dam/extSystem/composables/lazyExtSystem'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import type { ValueObjectOption } from '@/types/ValueObject'

const { fetchLazyExtSystem, addToLazyExtSystemBuffer } = loadLazyExtSystem()

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

export const useAssetLicenceListActions = () => {
  const listItems = ref<AssetLicence[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchAssetLicenceList(pagination, filterBag)
      listItems.value.forEach((item) => {
        if (item.extSystem) addToLazyExtSystemBuffer(item.extSystem)
      })
      fetchLazyExtSystem()
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('list')
    }
  }

  return {
    listItems,
    fetchList,
  }
}

export const useAssetLicenceDetailActions = () => {
  const assetLicenceOneStore = useAssetLicenceOneStore()
  const { assetLicence, loaded } = storeToRefs(assetLicenceOneStore)

  const fetchData = async (id: number) => {
    loaderOn('detail')
    try {
      const assetLicence = await fetchAssetLicence(id)
      if (assetLicence.extSystem) addToLazyExtSystemBuffer(assetLicence.extSystem)
      fetchLazyExtSystem()
      assetLicenceOneStore.setAssetLicence(assetLicence)
      assetLicenceOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    assetLicence,
    loaded,
    fetchData,
    resetStore: assetLicenceOneStore.reset,
  }
}

export const useAssetLicenceEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const assetLicenceOneStore = useAssetLicenceOneStore()
  const { assetLicence, loaded } = storeToRefs(assetLicenceOneStore)

  const fetchData = async (id: number) => {
    loaderOn('edit')
    try {
      const assetLicence = await fetchAssetLicence(id)
      if (assetLicence.extSystem) addToLazyExtSystemBuffer(assetLicence.extSystem)
      fetchLazyExtSystem()
      assetLicenceOneStore.setAssetLicence(assetLicence)
      assetLicenceOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('edit')
    }
  }

  const onUpdate = async (close = false) => {
    try {
      btnDisable('save', 'saveAndClose', 'delete')
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        btnEnable('save', 'saveAndClose', 'delete')
        return
      }
      btnDisable(close ? 'save' : 'saveAndClose', 'delete')
      btnLoadingOn(close ? 'saveAndClose' : 'save')
      await updateAssetLicence(assetLicenceOneStore.assetLicence.id, assetLicence.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.ASSET_LICENCE.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
    assetLicence,
    fetchData,
    onUpdate,
    resetStore: assetLicenceOneStore.reset,
  }
}

export const useAssetLicenceSelectActions = () => {
  const mapToValueObjectOption = (assetLicences: AssetLicence[]): ValueObjectOption<number>[] => {
    return assetLicences.map((assetLicence: AssetLicence) => ({
      title: assetLicence.name,
      value: assetLicence.id,
    }))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToValueObjectOption(await fetchAssetLicenceList(pagination, filterBag))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    return mapToValueObjectOption(await fetchAssetLicenceListByIds(ids))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
