import { useDamCachedAuthors } from '@anzusystems/common-admin'

/* The names of the authors are the library's cache: one for the page, asked under the ext system
 * `initCurrentExtSystemAndLicence` writes into it. Kept under its names for its callers. A widget of the library
 * that admin-dam mounted would write that ext system too. */
export const useCachedAuthors = () => useDamCachedAuthors()
