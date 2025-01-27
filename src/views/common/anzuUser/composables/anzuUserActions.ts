import type { AnzuUser, DamUser, FilterBag, IntegerId, Pagination, ValueObjectOption } from '@anzusystems/common-admin'
import { fetchDamUserList, fetchDamUserListByIds, isInt, useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import type { AxiosInstance } from 'axios'
import { useAnzuUserApi } from '@/services/api/common/anzuUserApi'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import useVuelidate from '@vuelidate/core'
import { useAnzuUserOneStore } from '@/stores/common/anzuUserStore'
import { useCachedPermissionGroups } from '@/views/common/permissionGroup/composables/cachedPermissionGroups'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id', 'person.firstName', 'person.lastName'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)

export const useAnzuUserActions = (client: () => AxiosInstance) => {
  const { apiFetchAnzuUserList, apiFetchAnzuUser, apiUpdateAnzuUser, apiCreateAnzuUser } = useAnzuUserApi(client)
  const { addToCachedPermissionGroups, fetchCachedPermissionGroups } = useCachedPermissionGroups()

  const anzuUserList = ref<AnzuUser[]>([])
  const fetchAnzuUserList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      anzuUserList.value = await apiFetchAnzuUserList(pagination, filterBag)
      anzuUserList.value.forEach((anzuUser) => addToCachedPermissionGroups(anzuUser.permissionGroups))
      fetchCachedPermissionGroups()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  const anzuUserOneStore = useAnzuUserOneStore()
  const { anzuUser } = storeToRefs(anzuUserOneStore)

  const fetchAnzuUser = async (id: number) => {
    detailLoading.value = true
    try {
      const anzuUserRes = await apiFetchAnzuUser(id)
      anzuUserOneStore.setAnzuUser(anzuUserRes)
      addToCachedPermissionGroups(anzuUserRes.permissionGroups)
      fetchCachedPermissionGroups()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  const router = useRouter()
  const v$ = useVuelidate()
  const updateAnzuUser = async (close = false) => {
    if (!isInt(anzuUserOneStore.anzuUser.id)) return
    try {
      saveButtonLoading.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        return
      }
      await apiUpdateAnzuUser(anzuUserOneStore.anzuUser.id, anzuUserOneStore.anzuUser)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.COMMON.ANZU_USER.LIST })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
    }
  }

  const createAnzuUser = async (close = false) => {
    saveButtonLoading.value = true
    try {
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        return
      }
      const anzuUserRes = await apiCreateAnzuUser(anzuUserOneStore.anzuUser)
      showRecordWas('created')
      if (close) {
        router.push({ name: ROUTE.COMMON.ANZU_USER.LIST })
        return
      }
      router.push({ name: ROUTE.COMMON.ANZU_USER.DETAIL, params: { id: anzuUserRes.id } })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    fetchAnzuUserList,
    fetchAnzuUser,
    updateAnzuUser,
    createAnzuUser,
    anzuUserList,
    anzuUser,
    listLoading,
    detailLoading,
    saveButtonLoading,
    resetAnzuUserStore: anzuUserOneStore.reset,
  }
}

export const useAnzuUserSelectAction = (client: () => AxiosInstance) => {
  const mapToValueObject = (user: DamUser): ValueObjectOption<IntegerId> => ({
    title: '' === user.person.fullName ? user.email : user.person.fullName,
    value: user.id,
  })

  const mapToValueObjects = (users: DamUser[]): ValueObjectOption<IntegerId>[] => {
    return users.map((user: DamUser) => mapToValueObject(user))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToValueObjects(await fetchDamUserList(client, pagination, filterBag))
  }

  const fetchItemsByIds = async (ids: IntegerId[]) => {
    return mapToValueObjects(await fetchDamUserListByIds(client, ids))
  }

  return {
    mapToValueObject,
    fetchItems,
    fetchItemsByIds,
  }
}
