import type { AnzuUser, FilterBag, Pagination } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
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

const datatableHiddenColumns = ref<Array<string>>([])

export const useAnzuUserActions = (client: () => AxiosInstance) => {
  const { apiFetchAnzuUserList, apiFetchAnzuUser, apiUpdateAnzuUser, apiCreateAnzuUser } = useAnzuUserApi(client)
  const { addToCachedPermissionGroups, fetchCachedPermissionGroups } = useCachedPermissionGroups()

  const anzuUserList = ref<AnzuUser[]>([])
  const loadingAnzuUserList = ref(false)
  const fetchAnzuUserList = async (pagination: Pagination, filterBag: FilterBag) => {
    loadingAnzuUserList.value = true
    try {
      anzuUserList.value = await apiFetchAnzuUserList(pagination, filterBag)
      anzuUserList.value.forEach((anzuUser) => addToCachedPermissionGroups(anzuUser.permissionGroups))
      fetchCachedPermissionGroups()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      loadingAnzuUserList.value = false
    }
  }

  const anzuUserOneStore = useAnzuUserOneStore()
  const { anzuUser, loadingAnzuUser } = storeToRefs(anzuUserOneStore)

  const fetchAnzuUser = async (id: number) => {
    anzuUserOneStore.setLoadingAnzuUser(true)
    try {
      const anzuUserRes = await apiFetchAnzuUser(id)
      anzuUserOneStore.setAnzuUser(anzuUserRes)
      addToCachedPermissionGroups(anzuUserRes.permissionGroups)
      fetchCachedPermissionGroups()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      anzuUserOneStore.setLoadingAnzuUser(false)
    }
  }

  const router = useRouter()
  const v$ = useVuelidate()
  const loadingUpdateAnzuUser = ref(false)
  const updateAnzuUser = async (close = false) => {
    try {
      loadingUpdateAnzuUser.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        return
      }
      await apiUpdateAnzuUser(anzuUserOneStore.anzuUser.id, anzuUserOneStore.anzuUser)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.COMMON.ANZU_USER.LIST })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      loadingUpdateAnzuUser.value = false
    }
  }

  const loadingCreateAnzuUser = ref(false)
  const createAnzuUser = async (close = false) => {
    try {
      loadingCreateAnzuUser.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
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
      loadingCreateAnzuUser.value = false
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
    loadingAnzuUserList,
    loadingAnzuUser,
    loadingUpdateAnzuUser,
    loadingCreateAnzuUser,
    resetAnzuUserStore: anzuUserOneStore.reset,
  }
}
