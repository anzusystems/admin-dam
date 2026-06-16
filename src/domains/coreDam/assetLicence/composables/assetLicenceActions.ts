import type { DamAssetLicence, ValueObjectOption } from '@anzusystems/common-admin'
import {
  fetchDamAssetLicenceListByIds,
  useDamCachedUsers,
  useFetchDamAssetLicenceList,
} from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'
import { useAssetLicenceOneStore } from '@/domains/coreDam/assetLicence/store/assetLicenceStore'
import { useFetchAssetLicence, useUpdateAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useCachedExtSystems } from '@/domains/coreDam/extSystem/composables/cachedExtSystems'
import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'
import { damClient } from '@/shared/apiClients/damClient'

const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
const { addToCachedUsers, fetchCachedUsers } = useDamCachedUsers()

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAssetLicenceListActions = () => {
  const listItems = ref<DamAssetLicenceExtended[]>([])
  const { executeFetch } = useFetchDamAssetLicenceList(damClient)

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = (await executeFetch(pagination, filterData, filterConfig)) as DamAssetLicenceExtended[]
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
      const { executeRequest: fetchAssetLicence } = useFetchAssetLicence()
      const assetLicence = await fetchAssetLicence({ urlParams: { id } })
      addToCachedExtSystems(assetLicence.extSystem)
      fetchCachedExtSystems()
      addToCachedAuthors(...assetLicence.internalRuleAuthors)
      addToCachedUsers(...assetLicence.internalRuleUsers)
      fetchCachedAuthors()
      fetchCachedUsers()
      assetLicenceOneStore.assetLicence = assetLicence
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
      const { executeRequest: fetchAssetLicence } = useFetchAssetLicence()
      const assetLicence = await fetchAssetLicence({ urlParams: { id } })
      addToCachedExtSystems(assetLicence.extSystem)
      fetchCachedExtSystems()
      addToCachedAuthors(...assetLicence.internalRuleAuthors)
      addToCachedUsers(...assetLicence.internalRuleUsers)
      fetchCachedAuthors()
      fetchCachedUsers()
      assetLicenceOneStore.assetLicence = assetLicence
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
      const { executeRequest: updateAssetLicence } = useUpdateAssetLicence()
      await updateAssetLicence({
        urlParams: { id: assetLicenceOneStore.assetLicence.id },
        object: assetLicence.value,
      })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/asset-licences' })
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
  const { executeFetch } = useFetchDamAssetLicenceList(damClient)

  const mapToValueObjectOption = (assetLicences: DamAssetLicence[]): ValueObjectOption<number>[] => {
    return assetLicences.map((assetLicence: DamAssetLicence) => ({
      title: assetLicence.extId,
      value: assetLicence.id,
    }))
  }

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    return mapToValueObjectOption(await executeFetch(pagination, filterData, filterConfig))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    return mapToValueObjectOption(await fetchDamAssetLicenceListByIds(damClient, ids))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
