import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { damClient } from '@/services/api/clients/damClient'
import type { AssetCreateDto } from '@/types/coreDam/Asset'
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import {
  AnzuApiForbiddenError,
  AnzuApiForbiddenOperationError,
  AnzuApiValidationError,
  type AnzuApiValidationResponseData,
  AnzuFatalError,
  apiAnyRequest,
  apiCreateOne,
  apiDeleteOne,
  apiFetchList,
  apiFetchOne,
  type AssetCustomData,
  type AssetDetailItemDto,
  type AssetMetadataDto,
  type AssetSearchListItemDto,
  axiosErrorResponseHasForbiddenOperationData,
  axiosErrorResponseHasValidationData,
  axiosErrorResponseIsForbidden,
  type DocId,
  type DocIdNullable,
  type FilterBag,
  HTTP_STATUS_OK,
  type IntegerId,
  isNull,
  isUndefined,
  type Pagination,
  type UploadQueueItem,
  useAlerts,
  useDamConfigState,
  type ValidationError,
} from '@anzusystems/common-admin'
import { isAxiosError } from 'axios'

export interface AssetMetadataBulkItem {
  id: DocId
  keywords: DocId[]
  authors: DocId[]
  described: boolean
  customData: AssetCustomData
  mainFileSingleUse: boolean | null
}

const BULK_METADATA_LIMIT = 10
const END_POINT = '/adm/v1/asset'
export const ENTITY = 'asset'
const FETCH_BY_IDS_MAX_LIMIT = 25

export const fetchAssetList = (licenceId: number, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<AssetSearchListItemDto[]>(
    damClient,
    END_POINT + '/licence/:licenceId',
    { licenceId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

async function fetchAssetListByIdsSequence(ids: DocId[], licenceId: number) {
  if (ids.length === 0) return Promise.resolve([])
  const totalCalls = Math.ceil(ids.length / FETCH_BY_IDS_MAX_LIMIT)
  const responses = []

  for (let i = 0; i < totalCalls; i++) {
    const offset = i * FETCH_BY_IDS_MAX_LIMIT
    const reduced = ids.slice(offset, offset + FETCH_BY_IDS_MAX_LIMIT)
    const res = await damClient().get(END_POINT + `/licence/${licenceId}/ids/${reduced.join(',')}`)
    responses.push(res)
  }
  return responses
}

export const fetchAssetListByIds: (ids: DocId[], licenceId: number) => Promise<AssetDetailItemDto[]> = (
  ids: DocId[],
  licenceId: number
) => {
  return new Promise((resolve, reject) => {
    fetchAssetListByIdsSequence(ids, licenceId)
      .then((responses) => {
        if (responses.length === 0) {
          reject(responses)
        } else if (
          responses.every((res) => {
            return res.status === HTTP_STATUS_OK
          })
        ) {
          const final = []
          for (let i = 0; i < responses.length; i++) {
            final.push(...responses[i].data.data)
          }
          resolve(final as AssetDetailItemDto[])
        } else {
          reject(responses)
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const fetchAsset = (id: DocId) =>
  apiFetchOne<AssetDetailItemDto>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetMetadata = (id: DocId) =>
  apiFetchOne<AssetMetadataDto>(damClient, END_POINT + '/:id/metadata', { id }, SYSTEM_CORE_DAM, ENTITY)

const listItemsToMetadataBulkItems = (items: UploadQueueItem[]) => {
  const dtoItems: AssetMetadataBulkItem[] = []
  items.forEach((item) => {
    if (!isNull(item.assetId) && item.canEditMetadata) {
      dtoItems.push({
        id: item.assetId,
        keywords: item.keywords,
        authors: item.authors,
        described: true,
        customData: item.customData,
        mainFileSingleUse: item.mainFileSingleUse,
      })
    }
  })

  return dtoItems
}

async function updateMetadataSequence(items: UploadQueueItem[]) {
  const totalCalls = Math.ceil(items.length / BULK_METADATA_LIMIT)
  const bulkItems = listItemsToMetadataBulkItems(items)
  const responses = []
  if (bulkItems.length === 0) return Promise.resolve([])

  for (let i = 0; i < totalCalls; i++) {
    const offset = i * BULK_METADATA_LIMIT
    const reduced = bulkItems.slice(offset, offset + BULK_METADATA_LIMIT)
    const res = await damClient().patch(END_POINT + '/metadata-bulk-update', JSON.stringify(reduced))
    responses.push(res)
  }
  return responses
}

export const bulkUpdateAssetsMetadata = (items: UploadQueueItem[]) => {
  return new Promise((resolve, reject) => {
    updateMetadataSequence(items)
      .then((responses) => {
        if (responses.length === 0) {
          reject(responses)
        } else if (
          responses.every((res) => {
            return res.status === HTTP_STATUS_OK
          })
        ) {
          resolve(responses)
        } else {
          reject(responses)
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

const { showUnknownError, showApiValidationError } = useAlerts()

const handleMetadataValidationError = (error: Error, assetType: DamAssetTypeType) => {
  const { getDamConfigAssetCustomFormElements } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()
  const configAssetCustomFormElements = getDamConfigAssetCustomFormElements(currentExtSystemId.value)
  if (isUndefined(configAssetCustomFormElements)) {
    throw new Error('Custom form elements must be initialised.')
  }
  if (!isAxiosError(error) || !error.response || !error.response.data) return
  const data = error.response.data as AnzuApiValidationResponseData
  const items = [] as ValidationError[]
  for (const [key, values] of Object.entries(data.fields)) {
    const field = key.split('.').pop()
    const found = configAssetCustomFormElements[assetType].find((item) => item.property === field)
    if (found) {
      items.push({
        field: found.name,
        errors: values,
      })
    }
  }
  if (items.length) {
    showApiValidationError(items, -1, true)
    return
  }
  showUnknownError()
}

export const updateAssetMetadata = (asset: AssetDetailItemDto, mainFileSingleUse: boolean | null) => {
  return new Promise((resolve, reject) => {
    const data: AssetMetadataBulkItem = {
      id: asset.id,
      keywords: asset.keywords,
      authors: asset.authors,
      described: true,
      customData: asset.metadata.customData,
      mainFileSingleUse: mainFileSingleUse,
    }
    damClient()
      .patch(END_POINT + '/metadata-bulk-update', JSON.stringify([data]))
      .then((res) => {
        if (res.status === HTTP_STATUS_OK) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        if (axiosErrorResponseIsForbidden(err)) {
          return reject(new AnzuApiForbiddenError(err))
        }
        if (axiosErrorResponseHasValidationData(err)) {
          handleMetadataValidationError(err, asset.attributes.assetType)
          return reject(new AnzuApiValidationError(err, SYSTEM_CORE_DAM, ENTITY, err))
        }
        if (axiosErrorResponseHasForbiddenOperationData(err)) {
          return reject(new AnzuApiForbiddenOperationError(err, err))
        }
        return reject(new AnzuFatalError(err))
      })
  })
}

export const deleteAsset = (id: DocId) =>
  apiDeleteOne<AssetDetailItemDto>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetCategory = (assetId: DocId, distributionCategoryId: DocIdNullable) =>
  apiAnyRequest(
    damClient,
    'PUT',
    END_POINT + '/:assetId',
    { assetId },
    { id: assetId, distributionCategory: distributionCategoryId },
    SYSTEM_CORE_DAM,
    ''
  )

export const createAsset = (licenceId: IntegerId, data: AssetCreateDto) =>
  apiCreateOne<AssetCreateDto, AssetDetailItemDto>(
    damClient,
    data,
    END_POINT + '/licence/' + licenceId,
    {},
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const setSibling = (assetId: DocId, targetAssetId: DocId) =>
  apiAnyRequest<object, AssetDetailItemDto>(
    damClient,
    'PATCH',
    END_POINT + '/:assetId/sibling/:targetAssetId',
    { assetId, targetAssetId },
    {},
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const removeSibling = (assetId: DocId) =>
  apiAnyRequest<object, AssetDetailItemDto>(
    damClient,
    'PATCH',
    END_POINT + '/:assetId/sibling',
    { assetId },
    {},
    SYSTEM_CORE_DAM,
    ENTITY
  )
