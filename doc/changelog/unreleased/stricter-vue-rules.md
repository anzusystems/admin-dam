planned
===

### Changed

- **Five stricter vue rules, the ones admin-ugc carried alone before the configs were unified.**
  `no-undef-components`, `attribute-hyphenation`, `v-on-event-hyphenation`,
  `custom-event-name-casing` and `define-emits-declaration`. They need to know which components are
  registered rather than imported, so the config reads the Vuetify component list and common-admin's
  aliases out of their `.d.ts` files, and names the three registered elsewhere: `Acl`, which
  common-admin's own plugin registers, and the `GMap*` family from
  `vue-google-maps-community-fork`.

  The first count across the six admins was 236 findings, which read like a migration. All but
  nine were `<Acl>` — registered globally, so the rule could not see it. What was left were real
  missing imports.
