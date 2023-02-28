import { ref } from 'vue'
import type { User } from '@/types/coreDam/User'
import type { FilterBag, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { cloneDeep, useAlerts, useErrorHandler } from '@anzusystems/common-admin'
import { fetchUser, fetchUserList, fetchUserListByIds, updateUser } from '@/services/api/coreDam/userApi'
import { useUserOneStore } from '@/stores/coreDam/userStore'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { loadLazyExtSystem } from '@/views/coreDam/extSystem/composables/lazyExtSystem'
import { loadLazyAssetLicence } from '@/views/coreDam/assetLicence/composables/lazyAssetLicence'

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { fetchLazyExtSystem, addToLazyExtSystemBuffer } = loadLazyExtSystem()
const { fetchLazyAssetLicence, addToLazyAssetLicenceBuffer } = loadLazyAssetLicence()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useUserListActions = () => {
  const listItems = ref<User[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchUserList(pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    listLoading,
    listItems,
    fetchList,
  }
}

export const useUserDetailActions = () => {
  const userOneStore = useUserOneStore()
  const { user } = storeToRefs(userOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const user = await fetchUser(id)
      userOneStore.setUser(user)
      user.adminToExtSystems.forEach((id) => addToLazyExtSystemBuffer(id))
      user.userToExtSystems.forEach((id) => addToLazyExtSystemBuffer(id))
      user.assetLicences.forEach((id) => addToLazyAssetLicenceBuffer(id))
      fetchLazyExtSystem()
      fetchLazyAssetLicence()
    } catch (error) {
      handleError(error)
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
  const { userUpdate } = storeToRefs(userOneStore)

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const user = await fetchUser(id)
      userOneStore.setUser(user)
    } catch (error) {
      handleError(error)
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
      await updateUser(userOneStore.user.id, userUpdateCloned)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.USER.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
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
    const users = await fetchUserList(pagination, filterBag)

    return <ValueObjectOption<number>[]>users.map((user: User) => ({
      title: user.email,
      value: user.id,
    }))
  }

  const fetchItemsByIds = async (ids: number[]) => {
    const users = await fetchUserListByIds(ids)

    return <ValueObjectOption<number>[]>users.map((user: User) => ({
      title: user.email,
      value: user.id,
    }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
