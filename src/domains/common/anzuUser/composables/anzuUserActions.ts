import type { AnzuUser } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import {
  useCreateAnzuUser,
  useFetchAnzuUser,
  useFetchAnzuUserList,
  useUpdateAnzuUser,
} from '@/domains/common/anzuUser/api/anzuUserApi'
import { useAnzuUserOneStore } from '@/domains/common/anzuUser/store/anzuUserStore'
import { useCachedPermissionGroups } from '@/domains/common/permissionGroup/composables/cachedPermissionGroups'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id', 'person.firstName', 'person.lastName'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)

export const useAnzuUserActions = () => {
  const { addToCachedPermissionGroups, fetchCachedPermissionGroups } = useCachedPermissionGroups()

  const anzuUserList = ref<AnzuUser[]>([])
  const { execute } = useFetchAnzuUserList()
  const fetchAnzuUserList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      anzuUserList.value = await execute(pagination, filterData, filterConfig)
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
      const { execute: fetchAnzuUserRequest } = useFetchAnzuUser()
      const anzuUserRes = await fetchAnzuUserRequest({ urlParams: { id } })
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
      const { execute: updateAnzuUserRequest } = useUpdateAnzuUser()
      await updateAnzuUserRequest({
        urlParams: { id: anzuUserOneStore.anzuUser.id },
        body: anzuUserOneStore.anzuUser,
      })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(common)/anzu-users' })
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
      const { execute: createAnzuUserRequest } = useCreateAnzuUser()
      const anzuUserRes = await createAnzuUserRequest({ body: anzuUserOneStore.anzuUser })
      showRecordWas('created')
      if (close) {
        router.push({ name: '/(common)/anzu-users' })
        return
      }
      router.push({ name: '/(common)/anzu-users/[id]', params: { id: String(anzuUserRes.id) } })
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
