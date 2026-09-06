import { damFileTypeFix } from '@anzusystems/common-admin'

/* Lifted out of `FileUpload.vue` so the boundaries can be tested: the component needs Vuetify to
 * mount, these two need nothing. */
export const checkFormats = (file: File, accepts: string[]) => {
  if (accepts.length === 0) {
    return true
  }
  for (let i = 0; i < accepts.length; i++) {
    if (accepts[i].startsWith('.')) {
      // .format
      if (file.name.toLowerCase().endsWith(accepts[i])) {
        return true
      }
    } else {
      // type
      const splitType = accepts[i].split('/')
      if (splitType[1] === '*' && damFileTypeFix(file).startsWith(splitType[0] + '/')) {
        return true
      } else if (accepts[i] === damFileTypeFix(file)) {
        return true
      }
    }
  }
  return false
}

/* Every branch the same way round, and inclusive. The wildcard and extension keys compared the
 * limit the other way about - `limit <= size` - so they passed the files that were too big and
 * refused the ones that fit, taking the file exactly on the limit only by accident of that. The
 * mime branches asked `limit > size` and so refused it, which the backend does not:
 * `AbstractAssetFileFacade` asks `size <= sizeLimit`. */
export const checkSizes = (file: File, keys: Array<string>, sizes: Record<string, number> | undefined) => {
  if (keys.length === 0 || isUndefined(sizes)) {
    return true
  }
  for (let j = 0; j < keys.length; j++) {
    if (keys[j] === '*' && sizes[keys[j]] >= file.size) {
      // *
      return true
    } else if (
      keys[j].startsWith('.') &&
      // Matched on the file name, which is the only thing an extension key can mean
      file.name.toLowerCase().endsWith(keys[j].toLowerCase()) &&
      sizes[keys[j]] >= file.size
    ) {
      return true
    } else {
      // type
      const splitType = keys[j].split('/')
      if (splitType[1] === '*' && damFileTypeFix(file).startsWith(splitType[0] + '/') && sizes[keys[j]] >= file.size) {
        return true
      } else if (keys[j] === damFileTypeFix(file) && sizes[keys[j]] >= file.size) {
        return true
      }
    }
  }
  return false
}
