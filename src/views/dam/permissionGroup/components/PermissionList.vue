<script lang="ts" setup>
import type { DescribedPermission, PermissionFilter, Permissions } from '@/types/Permission'
import { Grant, PermissionCategory } from '@/types/Permission'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useVModels } from '@vueuse/core'
import { usePermissionGrant } from '@/model/dam/valueObject/PermissionGrant'
import { usePermissionListActions } from '@/views/dam/permissionGroup/composables/permissionGroupActions'
import PermissionListGrantIcon from '@/views/dam/permissionGroup/components/PermissionListGrantIcon.vue'
import { useCurrentUser } from '@/composables/system/currentUser'
import PermissionListFilter from '@/views/dam/permissionGroup/components/PermissionListFilter.vue'
import { groupBy } from '@/utils/array'

const props = withDefaults(
  defineProps<{
    modelValue: Permissions
    readonly?: boolean
    includeDefaultOption?: boolean
    groupIds?: number[]
  }>(),
  {
    readonly: false,
    includeDefaultOption: false,
    groupIds: () => [],
  }
)

const emit = defineEmits<{
  (e: 'change'): void
  (e: 'update:modelValue', data: Permissions): void
}>()

const { modelValue } = useVModels(props, emit)

const activeFirstRow = ref<string>('')
const permissionsDetail = ref<DescribedPermission[]>([])
const permissionsGroups = ref<Permissions>({})
const permissionsLoaded = ref<boolean>(false)
const groupPermissionsLoaded = ref<boolean>(false)

const setActionForUndefined = (defaultValue: number) => {
  const modifiedPermissions: Permissions = {}
  permissionsDetail.value.map((item: DescribedPermission) => {
    if (typeof modelValue.value[item.name] !== 'undefined') {
      modifiedPermissions[item.name] = modelValue.value[item.name]
    } else {
      modifiedPermissions[item.name] = defaultValue
    }
  })
  modelValue.value = modifiedPermissions
}

const filter = reactive<PermissionFilter>({
  text: '',
  category: PermissionCategory.All,
})

const filterCategoryOnly = (item: DescribedPermission, filter: PermissionFilter) => {
  return item.category === filter.category
}
const filterTextOnly = (item: DescribedPermission, filter: PermissionFilter) => {
  return item.searchIndex.includes(filter.text.toLowerCase())
}
const filterCategoryAndText = (item: DescribedPermission, filter: PermissionFilter) => {
  return filterCategoryOnly(item, filter) && filterTextOnly(item, filter)
}

const permissionsDetailComputed = computed(() => {
  return permissionsDetail.value.filter((item) => {
    const filterText = filter.text.length === 0 ? '' : filter.text
    if (filter.category !== PermissionCategory.All && filterText.length === 0) {
      return filterCategoryOnly(item, filter)
    } else if (filter.category !== PermissionCategory.All && filterText.length > 0) {
      return filterCategoryAndText(item, filter)
    } else if (filter.category === PermissionCategory.All && filterText.length > 0) {
      return filterTextOnly(item, filter)
    }
    return true
  })
})
const permissionsDetailGroupedComputed = computed(() => {
  return groupBy(permissionsDetailComputed.value, (item: any) => item.categoryAndGroup)
})
const loadedComputed = computed(() => permissionsLoaded.value && groupPermissionsLoaded.value)

const setActiveRow = (name: string) => {
  if (props.readonly) return
  if (activeFirstRow.value === name) {
    activeFirstRow.value = ''
  } else {
    activeFirstRow.value = name
  }
}

const massChange = (name: string, grant: number) => {
  if (activeFirstRow.value.length > 0 && !props.readonly) {
    const index1 = permissionsDetailComputed.value?.findIndex((item) => activeFirstRow.value === item.name)
    const index2 = permissionsDetailComputed.value?.findIndex((item) => name === item.name)
    if (
      typeof index1 !== 'undefined' &&
      typeof index2 !== 'undefined' &&
      index1 > Grant.NotSet &&
      index2 > Grant.NotSet &&
      index1 !== index2
    ) {
      let startIndex = index1
      let endIndex = index2
      if (index1 > index2) {
        startIndex = index2
        endIndex = index1
      }
      const sliced = permissionsDetailComputed.value?.slice(startIndex, endIndex + 1)
      if (typeof sliced !== 'undefined') {
        for (let i = 0; i < sliced.length; i++) {
          if (grant === Grant.NotSet || sliced[i].grants.includes(grant)) {
            modelValue.value[sliced[i].name] = grant
          }
        }
      }
    }
  }
}

const { fetchAllPermissions, fetchPreviewForGroupPermissions } = usePermissionListActions()

const getGroupPermissions = async () => {
  permissionsGroups.value = await fetchPreviewForGroupPermissions(props.groupIds)
  groupPermissionsLoaded.value = true
}

const getPermissions = async () => {
  permissionsDetail.value = await fetchAllPermissions()
  permissionsLoaded.value = true
  if (props.includeDefaultOption) {
    setActionForUndefined(Grant.NotSet)
  } else {
    setActionForUndefined(Grant.Deny)
  }
  if (props.includeDefaultOption && props.groupIds.length) {
    await getGroupPermissions()
  } else {
    groupPermissionsLoaded.value = true
  }
}

onMounted(() => {
  getPermissions()
})

watch(props.groupIds, () => {
  getGroupPermissions()
})

const { getPermissionGrantOption } = usePermissionGrant()
const { currentUserIsSuperAdmin } = useCurrentUser()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div v-if="loadedComputed">
    <PermissionListFilter v-model="filter"></PermissionListFilter>
    <div v-if="permissionsDetailComputed?.length === 0" class="full-width">
      {{ t('coreDam.permission.filter.noPermissionFound') }}
    </div>
    <VTable>
      <thead>
        <tr>
          <th>{{ t('coreDam.permission.table.actions') }}</th>
          <th v-if="includeDefaultOption">{{ t('coreDam.permission.table.groupsPermission') }}</th>
          <th>{{ t('coreDam.permission.table.permissions') }}</th>
        </tr>
      </thead>
      <template v-for="(groupItems, category) in permissionsDetailGroupedComputed" :key="category">
        <thead>
          <tr>
            <th :colspan="includeDefaultOption ? 3 : 2">
              <span class="text-h6">
                {{ groupItems[0].categoryTitle + ' - ' + groupItems[0].groupTitle }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="permission in groupItems"
            :key="permission.name"
            :class="{ 'anzu-table-active-row': activeFirstRow === permission.name }"
            @click.stop="setActiveRow(permission.name)"
          >
            <td>
              {{ permission.subjectTitle + (permission.actionTitle.length > 0 ? ' - ' : '') + permission.actionTitle }}
              <small v-if="currentUserIsSuperAdmin" class="text--disabled text--caption"
                ><br />{{ permission.name }}</small
              >
            </td>
            <td v-if="includeDefaultOption" :class="{ 'text--disabled': modelValue[permission.name] !== Grant.NotSet }">
              <span v-if="groupIds.length > 0">
                <PermissionListGrantIcon
                  :value="getPermissionGrantOption(permissionsGroups[permission.name])"
                ></PermissionListGrantIcon>
              </span>
            </td>
            <td v-if="readonly">
              {{ getPermissionGrantOption(modelValue[permission.name]).title }}
            </td>
            <td v-else style="width: 60%">
              <div v-if="activeFirstRow === permission.name" class="text--disabled text--caption pt-2">
                {{ t('coreDam.permission.filter.massOperationsStart') }}
              </div>
              <VRadioGroup v-model="modelValue[permission.name]" inline>
                <VRadio
                  v-if="includeDefaultOption"
                  :label="t('coreDam.permission.grant.notSet')"
                  :value="Grant.NotSet"
                  @click.stop=""
                  @click.shift="massChange(permission.name, Grant.NotSet)"
                ></VRadio>
                <VRadio
                  v-if="permission.grants.includes(Grant.Allow)"
                  :label="t('coreDam.permission.grant.allow')"
                  :value="Grant.Allow"
                  @click.stop=""
                  @click.shift="massChange(permission.name, Grant.Allow)"
                ></VRadio>
                <VRadio
                  v-if="permission.grants.includes(Grant.Deny)"
                  :label="t('coreDam.permission.grant.deny')"
                  :value="Grant.Deny"
                  @click.stop=""
                  @click.shift="massChange(permission.name, Grant.Deny)"
                ></VRadio>
                <VRadio
                  v-if="permission.grants.includes(Grant.AllowOwner)"
                  :label="t('coreDam.permission.grant.allowOwner')"
                  :value="Grant.AllowOwner"
                  @click.stop=""
                  @click.shift="massChange(permission.name, Grant.AllowOwner)"
                ></VRadio>
              </VRadioGroup>
            </td>
          </tr>
        </tbody>
      </template>
    </VTable>
  </div>
  <VProgressLinear v-else active class="my-2" height="2" :indeterminate="true" rounded></VProgressLinear>
</template>

<style lang="scss">
@use 'sass:color';

.anzu-table-active-row {
  background-color: color.adjust(#8b7878, $lightness: 30%);
}
</style>
