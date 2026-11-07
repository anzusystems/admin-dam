import { defineAnzuAdminConfig } from '@anzusystems/common-admin/eslint'

// The shared admin config (common-admin `./eslint`); `root` is what its paths resolve against.
export default defineAnzuAdminConfig({ root: import.meta.url })
