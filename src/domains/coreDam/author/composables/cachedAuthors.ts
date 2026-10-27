import { useDamCachedAuthors } from '@anzusystems/common-admin'

/*
 * Wraps the library's page-wide author name cache, keyed by the ext system `initCurrentExtSystemAndLicence` sets.
 * A library widget mounted by admin-dam would also set that ext system.
 */
export const useCachedAuthors = () => useDamCachedAuthors()
