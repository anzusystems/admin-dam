import type { DamUser, DamUserUpdateDto } from '@anzusystems/common-admin'
import { useUserFactory } from '@/model/coreDam/factory/UserFactory'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { AssetLicenceGroup } from '@/types/coreDam/AssetLicenceGroup'

export const useUserOneStore = defineStore('damUserOneStore', () => {
  const { createDefault, createDefaultForUpdate } = useUserFactory()

  const user = ref<DamUser>(createDefault())
  const userUpdate = ref<DamUserUpdateDto>(createDefaultForUpdate(createDefault()))
  const userAssetLicenceGroups = ref<AssetLicenceGroup[]>([])

  function setUser(userNew: DamUser) {
    user.value = userNew
    userUpdate.value = createDefaultForUpdate(userNew)
  }

  function reset() {
    user.value = createDefault()
    userUpdate.value = createDefaultForUpdate(user.value)
    userAssetLicenceGroups.value = []
  }

  return {
    user,
    userUpdate,
    userAssetLicenceGroups,
    setUser,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserOneStore, import.meta.hot))
}
