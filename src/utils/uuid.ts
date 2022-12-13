import { v1 as uuidv1 } from 'uuid'

export const isUuid = (value: string) => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)
}

export const generateUuidv1 = () => {
  return uuidv1()
}
