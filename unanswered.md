# Unanswered questions — Vuetify 4 migration session

## 1. ESLint config shape

You pasted the minimal snippet from the eslint-plugin-vuetify docs:

```js
import vue from 'eslint-plugin-vue'
import vuetify from 'eslint-plugin-vuetify'

export default [
  ...vue.configs['flat/base'],
  ...vuetify.configs['flat/recommended-v4'],
]
```

Current `eslint.config.mjs` keeps the existing setup (pinia, stylistic, ts-extension, vueTsConfigs, etc.) and spreads `...pluginVuetify.configs['flat/recommended-v4']` into it — same approach as `admin-cms/eslint.config.mjs`.

Pick:
- (a) Keep current merged setup (matches admin-cms).
- (b) Replace with the minimal snippet (drops pinia/stylistic/ts-extension/typescript rules — almost certainly not desired).

## 2. Browser verification

The following changes have not been visually/runtime verified:

- CSS reset port (`@layer vuetify-core.reset` block in `src/styles/main.scss`)
- Alpha-syntax rewrites from `rgb(var(--v-theme-X), 0.Y)` → `rgb(var(--v-theme-X) / Y%)` in `src/styles/anzutap/{_prosemirror,_anzutap,_toolbar}.scss`
- Border alpha rewrite from `rgb(var(--v-border-color), var(--v-border-opacity))` → `rgb(var(--v-border-color) / var(--v-border-opacity))` in `_anzutap.scss:10` (docs don't explicitly cover border vars — watch for editor card border regressions)
- Removed `dark` prop from `VAlert` (2x in `AssetInfobox.vue`), `VBtn` and `VIcon` (in `DistributionCategorySelectEditForm.vue`) — confirm contrast/look still acceptable
- Removed `contain` from two `VImg` (`ImageFile.vue`, `ImagePreview.vue`) — v4 default is `object-fit: contain`, so this should be a no-op, but worth eyeballing thumbnails

Action: run `yarn dev`, walk through the app (especially anzutap editor, asset detail/thumbnails, alerts), confirm no visual regressions vs. the previous build.

## 3. Runtime behavior change from TS fixes

The TS-error sweep replaced `configExtSystem.X.Y` with `configExtSystem.X?.Y ?? <fallback>` in many places. This changes runtime semantics: where the original code would throw at the deeper access (e.g. `Cannot read 'enabled' of undefined`), the new code silently returns the fallback (`false` / `{}` / `0` / empty string).

This is almost always the safer behavior, but worth confirming nothing in the app *depended* on the throw. Specifically affected files:

- `src/composables/system/appInitialize.ts` — asset-type enablement now silently skips missing types
- `src/views/coreDam/asset/components/AssetSlotsFilter.vue` — slot list silently empty for missing asset types
- `src/views/coreDam/author/composables/authorConfig.ts` + `keyword/composables/keywordConfig.ts` — `authorEnabled` / `keywordEnabled` default to `false`
- `src/views/coreDam/asset/detail/components/AssetDetailDialogSidebar.vue` — `typeHasDistributions` defaults to `false`
- `src/views/coreDam/asset/detail/components/distribution/{DistributionNewDialog,DistributionListItem*,DistributionBlockedBy,DistributionItemView}.vue` — distribution requirements may now be `undefined` in computed return, downstream templates use `?.` to guard
- `src/views/coreDam/distributionCategory/composables/distributionCategoryActions.ts` — distribution service slug list silently empty
- `src/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectOptionSelect.vue` — `isRequired` defaults to `false`
- `src/views/coreDam/externalProviderAsset/composables/externalProviderAssetListActions.ts` — pagination `rowsPerPage` defaults to `0` if provider config missing (note: `0` may cause API issues — confirm with a real external-provider config)
- `src/model/coreDam/factory/UserFactory.ts` — added `locale: null` to default user (was missing)

Action: confirm via QA / manual click-through that the fallbacks don't mask real config-missing bugs.
