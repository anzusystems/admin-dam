planned
===

### Changed

- **Components declare their model with `defineModel`** instead of a `modelValue` prop plus an
  `update:modelValue` emit. Same behaviour, a third less plumbing: the prop, the emit declaration,
  the passthrough handler and the `computed({ get, set })` wrapper around them all collapse into one
  writable ref.

  `useVModel` from `@vueuse` was checked for and is not used anywhere in any admin.

  Two shapes deliberately keep the old form, and say why in a comment: a model that accepts `null`
  but only ever emits a real value cannot be expressed by `defineModel`, which has a single type for
  both directions.
