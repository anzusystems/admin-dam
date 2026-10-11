import type { CommonAdminCoreDamOptions } from '@anzusystems/common-admin'

import { damClient } from '@/shared/apiClients/damClient'

type CoreDamConfig = NonNullable<CommonAdminCoreDamOptions>['configs'][string]

// The `default` configuration of the library's DAM blocks, read by the start of the application and by the tests
// that install the plugin: a test with its own copy would not see a grant added here.
export const coreDamDefaultConfig: CoreDamConfig = {
  damClient,
  keywordCreateAcl: 'dam_keyword_create',
  authorCreateAcl: 'dam_author_create',
}
