import { ref } from 'vue'
import type { User } from '@/types/dam/User'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { fetchUser, fetchUserList, fetchUserListByIds, updateUser } from '@/services/api/dam/userApi'
import { useUserOneStore } from '@/stores/dam/userStore'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import type { ValueObjectOption } from '@/types/ValueObject'
import { loadLazyExtSystem } from '@/views/dam/extSystem/composables/lazyExtSystem'
import { useDescribedPermissionAction } from '@/views/dam/permissionGroup/composables/permissionList'
import { simpleCloneObject } from '@/utils/object'
import { loadLazyPermissionGroup } from '@/views/dam/permissionGroup/composables/lazyPermissionGroup'
import { loadLazyAssetLicence } from '@/views/dam/assetLicence/composables/lazyAssetLicence'

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { fetchLazyExtSystem, addToLazyExtSystemBuffer } = loadLazyExtSystem()
const { fetchLazyPermissionGroup, addToLazyPermissionGroupBuffer } = loadLazyPermissionGroup()
const { fetchLazyAssetLicence, addToLazyAssetLicenceBuffer } = loadLazyAssetLicence()

export const useUserListActions = () => {
  const listItems = ref<User[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchUserList(pagination, filterBag)
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

export const useUserDetailActions = () => {
  const userOneStore = useUserOneStore()
  const { user, loaded } = storeToRefs(userOneStore)

  const fetchData = async (id: number) => {
    loaderOn('detail')
    try {
      const user = await fetchUser(id)
      userOneStore.setUser(user)
      user.adminToExtSystems.forEach((id) => addToLazyExtSystemBuffer(id))
      user.permissionGroups.forEach((id) => addToLazyPermissionGroupBuffer(id))
      user.assetLicences.forEach((id) => addToLazyAssetLicenceBuffer(id))
      fetchLazyExtSystem()
      fetchLazyPermissionGroup()
      fetchLazyAssetLicence()
      userOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    user,
    loaded,
    fetchData,
    resetStore: userOneStore.reset,
  }
}

export const useUserEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const userOneStore = useUserOneStore()
  const { userUpdate, loaded } = storeToRefs(userOneStore)

  const fetchData = async (id: number) => {
    loaderOn('edit')
    try {
      const user = await fetchUser(id)
      userOneStore.setUser(user)
      userOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('edit')
    }
  }

  const onUpdate = async (close = false) => {
    const { cleanUpPermissions } = useDescribedPermissionAction()
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
      const userUpdateCloned = simpleCloneObject(userUpdate.value)
      cleanUpPermissions(userUpdateCloned.permissions)
      await updateUser(userOneStore.user.id, userUpdateCloned)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.USER.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
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
