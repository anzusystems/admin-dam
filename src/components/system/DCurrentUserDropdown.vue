<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useCurrentUser } from '@/composables/system/currentUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

withDefaults(
  defineProps<{
    variant?: 'main' | 'settings'
  }>(),
  {
    variant: 'main',
  }
)

const { currentUser } = useCurrentUser()
</script>

<template>
  <VBtn variant="text" icon size="small" class="mx-1" data-cy="button-user">
    <VIcon icon="mdi-account" />
    <VMenu activator="parent">
      <VCard min-width="300">
        <VList v-if="currentUser">
          <VListItem
            prepend-icon=""
            :title="currentUser.firstName + ' ' + currentUser.lastName"
            :subtitle="currentUser.email"
            data-cy="user-email"
          >
            <template v-slot:prepend>
              <div class="mr-3">
                <VIcon color="secondary" icon="mdi-account" :size="44" />
              </div>
            </template>
          </VListItem>
        </VList>
        <VList>
          <VDivider></VDivider>
          <VListItem
            :to="{ name: ROUTE.SYSTEM.SETTINGS }"
            :title="t('system.currentUser.settings')"
            prepend-icon="mdi-cog"
            v-show="variant === 'main'"
            data-cy="button-settings"
          />
          <VListItem
            prepend-icon="mdi-home"
            :to="{ name: ROUTE.DAM.ASSET.LIST }"
            :title="t('system.currentUser.backToAssets')"
            v-show="variant === 'settings'"
          ></VListItem>
          <VDivider></VDivider>
          <VListItem
            prepend-icon="mdi-logout-variant"
            :to="{ name: ROUTE.SYSTEM.LOGOUT }"
            :title="t('system.currentUser.logout')"
            data-cy="button-logout"
          />
        </VList>
      </VCard>
    </VMenu>
  </VBtn>
</template>
