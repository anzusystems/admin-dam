export const compare2NumberArrays = (
  newArray: number[],
  oldArray: number[]
): { added: number[]; removed: number[] } => {
  const added = []
  const removed = []
  for (let i = 0; i < newArray.length; i++) {
    if (!oldArray.includes(newArray[i])) {
      added.push(newArray[i])
    }
  }
  for (let i = 0; i < oldArray.length; i++) {
    if (!newArray.includes(oldArray[i])) {
      removed.push(oldArray[i])
    }
  }
  return {
    added: added,
    removed: removed,
  }
}

export const toggleArrayItem = <T>(array: Array<T>, value: T) => {
  const index = array.indexOf(value)
  if (index === -1) {
    array.push(value)
    return
  }
  array.splice(index, 1)
}

export const toString = (values: number[] | string[], separator = ', ') => values.join(separator)

// @ts-ignore todo
export const fromArgs = (...args: any) => Array.from(...args)

// @ts-ignore todo
export const flattenArray = (arr) => {
  // @ts-ignore todo
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten)
  }, [])
}

export const isEmpty = (array: Array<any>) => Array.isArray(array) && array.length === 0
export const isNotEmpty = (array: Array<any>) => Array.isArray(array) && array.length > 0

// todo check, alternative for lodash groupBy
export const groupBy = (arr: any, criteria: any) => {
  return arr.reduce(function (obj: any, item: any) {
    // Check if the criteria is a function to run on the item or a property of it
    const key = typeof criteria === 'function' ? criteria(item) : item[criteria]

    // If the key doesn't exist yet, create it
    if (!obj[key]) {
      obj[key] = []
    }

    // Push the value to the object
    obj[key].push(item)

    // Return the object to the next item in the loop
    return obj
  }, {})
}
