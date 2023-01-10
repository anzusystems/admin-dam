<script lang="ts" setup>
import { useFlagsSvg } from '@/composables/system/useFlagsSvg'
import type { Locale, LocaleCode } from '@/composables/system/localeSettings'
import { defaultLocale, useLocaleSettings } from '@/composables/system/localeSettings'
import { computed } from 'vue'
import { isUndefined } from '@/utils/common'
import { useCurrentUser } from '@/composables/system/currentUser'

const { allLocales, currentLocaleCode, setLocale } = useLocaleSettings()
const { currentUserIsSuperAdmin } = useCurrentUser()

const onLocaleChange = (code: LocaleCode) => {
  setLocale(code)
}

const { getLocaleFlag } = useFlagsSvg()

const currentLocale = computed(() => {
  const found = allLocales.find((item) => item.code === currentLocaleCode.value)
  if (isUndefined(found)) return defaultLocale
  return found as Locale
})

const availableLocales = computed(() => {
  return allLocales.filter((item) => {
    return !(item.adminOnly && !currentUserIsSuperAdmin.value)
  })
})
</script>

<template>
  <VMenu>
    <template v-slot:activator="{ props }">
      <VBtn class="pl-1" rounded="pill" v-bind="props" variant="text" data-cy="settings-language">
        <VAvatar class="mr-1" size="30">
          <div class="flag" v-html="getLocaleFlag(currentLocale?.code)"></div>
        </VAvatar>
        {{ currentLocale.title }}
      </VBtn>
    </template>
    <VCard>
      <VList dense>
        <VListItem v-for="locale in availableLocales" :key="locale.code" @click.stop="onLocaleChange(locale.code)">
          <VListItemTitle>
            <VAvatar class="mr-1" size="30">
              <div class="flag" v-html="getLocaleFlag(locale.code)"></div>
            </VAvatar>
            {{ locale.title }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCard>
  </VMenu>
</template>

<style lang="scss" scoped>
.flag {
  position: relative;
  width: 30px;
  height: 30px;

  :deep(svg) {
    width: 90px;
    height: 60px;
    position: absolute;
    top: -15px;
    left: -27px;
    transform: scale(0.7);
  }
}
</style>
