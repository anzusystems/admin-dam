import { ref } from 'vue'
import {
  type DamUser,
  type FilterBag,
  type Pagination,
  useDamCachedUsers,
  type ValueObjectOption
} from '@anzusystems/common-admin'
import {
  cloneDeep,
  fetchDamAssetLicenceGroupListByIds,
  fetchDamUser,
  fetchDamUserList,
  fetchDamUserListByIds,
  updateDamUser,
  useAlerts,
} from '@anzusystems/common-admin'
import { useUserOneStore } from '@/stores/coreDam/userStore'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useCachedExtSystems } from '@/views/coreDam/extSystem/composables/cachedExtSystems'
import { useCachedAssetLicences } from '@/views/coreDam/assetLicence/composables/cachedAssetLicences'
import { damClient } from '@/services/api/clients/damClient'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const { fetchCachedExtSystems, addToCachedExtSystems } = useCachedExtSystems()
const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useUserListActions = () => {
  const listItems = ref<DamUser[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchDamUserList(damClient, pagination, filterBag)
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

export const useUserDetailActions = () => {
  const userOneStore = useUserOneStore()
  const { user, userAssetLicenceGroups } = storeToRefs(userOneStore)
  const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const user = await fetchDamUser(damClient, id)
      userAssetLicenceGroups.value = await fetchDamAssetLicenceGroupListByIds(damClient, user.licenceGroups)
      userOneStore.setUser(user)
      addToCachedExtSystems(user.adminToExtSystems, user.userToExtSystems)
      addToCachedAssetLicences(user.assetLicences)
      addToCachedUsers(user.createdBy, user.modifiedBy)
      fetchCachedUsers()
      fetchCachedExtSystems()
      fetchCachedAssetLicences()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    user,
    detailLoading,
    fetchData,
    resetStore: userOneStore.reset,
  }
}

export const useUserEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const userOneStore = useUserOneStore()
  const { userUpdate, user } = storeToRefs(userOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const user = await fetchDamUser(damClient, id)
      userOneStore.setUser(user)
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
      const userUpdateCloned = cloneDeep(userUpdate.value)
      await updateDamUser(damClient, userOneStore.user.id, userUpdateCloned)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.USER.LIST })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
    user,
    detailLoading,
    saveButtonLoading,
    saveAndCloseButtonLoading,
    userUpdate,
    fetchData,
    onUpdate,
    resetStore: userOneStore.reset,
  }
}

export const useUserSelectActions = () => {
  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    const users = await fetchDamUserList(damClient, pagination, filterBag)

    return <ValueObjectOption<number>[]>users.map((user: DamUser) => ({
      title: user.email,
      value: user.id,
    }))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    const users = await fetchDamUserListByIds(damClient, ids)

    return <ValueObjectOption<number>[]>users.map((user: DamUser) => ({
      title: user.email,
      value: user.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
