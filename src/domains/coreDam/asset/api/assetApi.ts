import {
  AnzuApiValidationError,
  HTTP_STATUS_OK,
  isAnzuApiValidationError,
  isNull,
  isUndefined,
  useAlerts,
  useApiCommand,
  useApiFetchList,
  useApiRequest,
  useDamConfigState,
} from '@anzusystems/common-admin'
import type {
  AnzuApiValidationResponseData,
  AssetCustomData,
  AssetDetailItemDto,
  AssetMetadataDto,
  AssetSearchListItemDto,
  DamAssetTypeType,
  DocId,
  DocIdNullable,
  FilterConfig,
  FilterData,
  IntegerId,
  Pagination,
  UploadQueueItem,
  ValidationError,
} from '@anzusystems/common-admin'
import { isAxiosError } from 'axios'
import type { AxiosError } from 'axios'
import type { Ref } from 'vue'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type { AssetCreateDto } from '@/domains/coreDam/asset/types/Asset'
import {
  metadataOfQueueRow,
  metadataSaveSent,
  nextMetadataOrder,
  queueRowBaseline,
  sameMetadataValue,
  setQueueRowBaseline,
} from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import type { QueueRowMetadata } from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import { i18n } from '@/plugins/i18n'
import { damApiBase } from '@/shared/apiClients/damApiBase'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export interface AssetMetadataBulkItem {
  id: DocId
  described: boolean
  /*
   * Optional on purpose. `AssetMetadataBulkManager` guards each
   * field with `isXUndefined()`, so an omitted field is not written.
   * This lets a save skip flags the form never showed and fields nobody changed.
   * The backend still runs its internal rules afterwards, which can change `internal` on their own.
   */
  keywords?: DocId[]
  authors?: DocId[]
  customData?: AssetCustomData
  mainFileSingleUse?: boolean | null
  mainFileOverrideInternal?: boolean
  mainFileInternal?: boolean
  ttsAudio?: boolean
}

const BULK_METADATA_LIMIT = 10
const END_POINT = '/adm/v1/asset'
export const ENTITY = 'asset'
const FETCH_BY_IDS_MAX_LIMIT = 50

export const useFetchAssetList = () =>
  useApiFetchList<AssetSearchListItemDto>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT + '/licence/:licenceId',
  })

export const fetchAssetList = (
  licenceId: number,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  const { execute } = useFetchAssetList()
  return execute(pagination, filterData, filterConfig, { urlParams: { licenceId } })
}

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
) =>
  new Promise((resolve, reject) => {
    fetchAssetListByIdsSequence(ids, licenceId)
      .then((responses) => {
        if (responses.length === 0) {
          reject(responses)
        } else if (
          responses.every(
            (res) =>
              // A response without the list does not mean "none of these assets exist".
              res.status === HTTP_STATUS_OK && Array.isArray(res.data?.data)
          )
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

// The response is not typed here. The caller below validates it.
const useFetchWaitingAssets = () =>
  useApiRequest<{ data?: unknown }, null>({ ...damApiBase, method: 'GET', entity: ENTITY })

/*
 * Fetches assets of a licence by id for the upload queue poll, in batches of fifty like `fetchAssetListByIds`.
 * `report: false` keeps a failed call out of the api error logger. The error is still thrown.
 * `useApiFetchItems` cannot silence a single call, so the list is validated here.
 * A response without the list is always rejected. It must never read as "none of these assets exist".
 */
export const fetchWaitingAssets = async (ids: DocId[], licenceId: number, options?: { report?: boolean }) => {
  const { execute } = useFetchWaitingAssets()
  const found: AssetDetailItemDto[] = []
  for (let offset = 0; offset < ids.length; offset += FETCH_BY_IDS_MAX_LIMIT) {
    const batch = ids.slice(offset, offset + FETCH_BY_IDS_MAX_LIMIT)
    const body = await execute({
      // Full URL instead of a template parameter: a parameter would be encoded, including its commas.
      urlTemplate: END_POINT + `/licence/${licenceId}/ids/${batch.join(',')}`,
      report: options?.report,
    })
    if (!Array.isArray(body?.data)) throw new Error('assetApi: unexpected asset list')
    found.push(...(body.data as AssetDetailItemDto[]))
  }

  return found
}

export const useFetchAsset = () =>
  useApiRequest<AssetDetailItemDto, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

/*
 * `report: false` keeps a failed call out of the api error logger. The error is still thrown.
 * Used by the upload queue poll, which already reported the first failure of a streak.
 */
export const fetchAsset = (id: DocId, options?: { report?: boolean }) => {
  const { execute } = useFetchAsset()
  return execute({ urlParams: { id }, report: options?.report })
}

export const useFetchAssetByFileId = () =>
  useApiRequest<AssetDetailItemDto, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:fileId',
  })

export const fetchAssetByFileId = (fileId: DocId) => {
  const { execute } = useFetchAssetByFileId()
  return execute({ urlParams: { fileId } })
}

export const useFetchAssetMetadata = () =>
  useApiRequest<AssetMetadataDto, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id/metadata',
  })

export const fetchAssetMetadata = (id: DocId) => {
  const { execute } = useFetchAssetMetadata()
  return execute({ urlParams: { id } })
}

/**
 * Items the bulk save sends: those with an asset whose metadata the user may edit.
 */
export const hasMetadataToSave = (item: UploadQueueItem): item is UploadQueueItem & { assetId: DocId } =>
  !isNull(item.assetId) && item.canEditMetadata

/*
 * Builds the bulk save payload per row, with the metadata the server will hold after the save.
 * A row sends only fields that differ from what it last got from or saved to the
 * server. Sending untouched fields would overwrite another editor's changes.
 * A sent row is marked described. A row whose server state or described flag is unknown is sent whole.
 */
const listItemsToMetadataBulkItems = (items: UploadQueueItem[]) => {
  const dtoItems: Array<{
    item: UploadQueueItem
    dtoItem: AssetMetadataBulkItem
    metadata: QueueRowMetadata
    changed: Partial<QueueRowMetadata>
  }> = []
  items.forEach((item) => {
    if (hasMetadataToSave(item)) {
      // Copied when the save starts. The row can still be edited while its batch waits for earlier batches.
      const metadata = metadataOfQueueRow(item)
      const known = queueRowBaseline(item)
      const whole = !known || isUndefined(known.described)
      const changed: Partial<QueueRowMetadata> = {}
      if (whole || !sameMetadataValue(metadata.keywords, known.keywords)) changed.keywords = metadata.keywords
      if (whole || !sameMetadataValue(metadata.authors, known.authors)) changed.authors = metadata.authors
      // Sent whole when any part differs. The server treats an omitted form field as emptied.
      if (whole || !sameMetadataValue(metadata.customData, known.customData)) changed.customData = metadata.customData
      if (!isNull(metadata.mainFileSingleUse) && (whole || metadata.mainFileSingleUse !== known.mainFileSingleUse)) {
        changed.mainFileSingleUse = metadata.mainFileSingleUse
      }
      /*
       * Nothing to write: the asset is described and the row matches the server.
       * Sending it anyway would make core-dam treat it as a change and notify all listeners.
       */
      if (!whole && known.described && Object.keys(changed).length === 0) return
      dtoItems.push({ item, dtoItem: { id: item.assetId, described: true, ...changed }, metadata, changed })
    }
  })

  return dtoItems
}

// Only a 200 counts as saved. The response body is not read.
const useUpdateMetadataBulk = () =>
  useApiCommand<AssetMetadataBulkItem[]>({
    ...damApiBase,
    method: 'PATCH',
    entity: ENTITY,
    urlTemplate: END_POINT + '/metadata-bulk-update',
    options: { validateStatus: (status) => status === HTTP_STATUS_OK },
  })

/*
 * Metadata save rejected by validation.
 * `fields` use request keys such as `[0].customData.title`. The
 * index is the asset's position in its batch, not a screen row.
 * `named` holds the same fields with form names, which are shown to the user.
 */
class AssetMetadataValidationError extends AnzuApiValidationError {
  named: ValidationError[]

  constructor(axiosError: AxiosError, named: ValidationError[]) {
    super(axiosError, SYSTEM_CORE_DAM, ENTITY, axiosError)
    this.named = named
  }
}

const metadataFieldName = (key: string, assetTypeAt: (index: number) => DamAssetTypeType | undefined) => {
  const { t } = i18n.global
  const indexed = key.match(/^\[(\d+)\]\.(.+)$/)
  const path = indexed ? indexed[2] : key
  if (path === 'keywords') return t('coreDam.asset.model.keywords')
  if (path === 'authors') return t('coreDam.asset.model.authors')
  const property = path.split('.').at(-1) ?? path
  const assetType = indexed ? assetTypeAt(Number(indexed[1])) : undefined
  if (path.startsWith('customData.') && !isUndefined(assetType)) {
    const { getDamConfigAssetCustomFormElements } = useDamConfigState(damClient)
    const { currentExtSystemId } = useCurrentExtSystem()
    const found = getDamConfigAssetCustomFormElements(currentExtSystemId.value)?.[assetType].find(
      (element) => element.property === property
    )
    if (found) return found.name
  }

  return property
}

/*
 * Maps a save failure for display. Validation errors get field names,
 * and a field rejected in several assets of the batch is listed once.
 * Other errors are returned unchanged.
 */
const withNamedFields = (error: unknown, assetTypeAt: (index: number) => DamAssetTypeType | undefined) => {
  if (!isAnzuApiValidationError(error) || !isAxiosError(error.cause)) return error
  const data = error.cause.response?.data as AnzuApiValidationResponseData
  const named = new Map<string, Set<string>>()
  for (const [key, errors] of Object.entries(data.fields)) {
    const name = metadataFieldName(key, assetTypeAt)
    named.set(name, new Set([...(named.get(name) ?? []), ...errors]))
  }

  return new AssetMetadataValidationError(
    error.cause,
    Array.from(named, ([field, errors]) => ({ field, errors: [...errors] }))
  )
}

// Assets deleted in this session, added once the delete request was answered.
const deletedHere = new Set<DocId>()

/**
 * Whether the asset was deleted here. A read sent before the delete can still return the old asset.
 */
export const assetDeletedHere = (assetId: DocId) => deletedHere.has(assetId)

type BulkItem = ReturnType<typeof listItemsToMetadataBulkItems>[number]

const saveBatch = async (rows: BulkItem[], execute: ReturnType<typeof useUpdateMetadataBulk>['execute']) => {
  /*
   * Skips assets deleted while earlier batches were in flight. The
   * queue stays usable meanwhile, and the delete removes the row.
   * An empty batch is not sent.
   */
  const batch = rows.filter(({ dtoItem }) => !deletedHere.has(dtoItem.id))
  if (batch.length === 0) return
  try {
    await execute({ body: batch.map(({ dtoItem }) => dtoItem) })
  } catch (error) {
    throw withNamedFields(error, (index) => batch[index]?.item.assetType)
  }
  /*
   * After a successful save, later saves diff against what was sent.
   * Only the sent fields are written, over the current row state. A read or another
   * save may have changed it meanwhile, and the click-time copy would revert that.
   * This runs when the save is answered, because a read sent earlier may return pre-save data.
   */
  const savedAt = nextMetadataOrder()
  batch.forEach(({ item, metadata, changed }) =>
    setQueueRowBaseline(item, { ...(queueRowBaseline(item) ?? metadata), ...changed, described: true }, savedAt)
  )
  // Also updates the detail or panel holding one of these assets.
  useAssetDetailStore().savedAsDescribed(batch.map(({ dtoItem }) => dtoItem.id))
}

/*
 * Saves ten rows per batch, sequentially. The server saves a batch atomically.
 * A failed batch stops later ones, earlier ones stay saved, and retrying is safe.
 * Only rows with changes are sent. If none have changes, no request is made and the save still succeeds.
 */
export const bulkUpdateAssetsMetadata = async (items: UploadQueueItem[]) => {
  // The buttons are disabled when no row can be sent (`nothingToSave`).
  if (!items.some(hasMetadataToSave)) throw new Error('assetApi: no metadata to save')
  const bulkItems = listItemsToMetadataBulkItems(items)
  const { execute } = useUpdateMetadataBulk()
  // Counts the filtered array. Counting the input sent trailing PATCHes with an empty body.
  const batches: BulkItem[][] = []
  for (let offset = 0; offset < bulkItems.length; offset += BULK_METADATA_LIMIT) {
    batches.push(bulkItems.slice(offset, offset + BULK_METADATA_LIMIT))
  }
  // Marks every batch as in flight from the click until it is answered. All bodies are built now.
  const answered = batches.map((batch) => metadataSaveSent(batch.map(({ dtoItem }) => dtoItem.id)))
  try {
    for (const [index, batch] of batches.entries()) {
      await saveBatch(batch, execute)
      answered[index]()
    }
  } finally {
    // Ends the failed batch and the batches it stopped.
    answered.forEach((end) => end())
  }
}

const { showErrorsDefault, showUnknownError, showApiValidationError } = useAlerts()

/**
 * Shows the error message for a failed metadata save by failure kind. The single place for this message.
 */
export const showMetadataSaveError = (error: unknown) => {
  if (error instanceof AssetMetadataValidationError) {
    showApiValidationError(error.named, -1, true)
    return
  }
  if (!showErrorsDefault(error)) showUnknownError()
}

export const updateAssetMetadata = async (
  asset: AssetDetailItemDto,
  mainFileSingleUse: boolean | null,
  mainFileOverrideInternal: boolean,
  mainFileInternal: boolean,
  ttsAudio: boolean
) => {
  const data: AssetMetadataBulkItem = {
    id: asset.id,
    keywords: asset.keywords,
    authors: asset.authors,
    described: true,
    customData: asset.metadata.customData,
    mainFileSingleUse: mainFileSingleUse,
    mainFileOverrideInternal: mainFileOverrideInternal,
    mainFileInternal: mainFileInternal,
    ttsAudio: ttsAudio,
  }
  const { execute } = useUpdateMetadataBulk()
  try {
    await execute({ body: [data] })
  } catch (error) {
    throw withNamedFields(error, () => asset.attributes.assetType)
  }
  // Also marks the asset described in the detail or panel if it holds this asset.
  useAssetDetailStore().savedAsDescribed([asset.id])
}

export const useDeleteAsset = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const deleteAsset = async (id: DocId) => {
  const { execute } = useDeleteAsset()
  await execute({ urlParams: { id } })
  // An in-flight bulk save skips this asset from now on.
  deletedHere.add(id)
}

export const useUpdateAssetCategory = () =>
  useApiCommand<{ id: DocId; distributionCategory: DocIdNullable }>({
    ...damApiBase,
    method: 'PUT',
    entity: '',
    urlTemplate: END_POINT + '/:assetId',
  })

export const updateAssetCategory = (assetId: DocId, distributionCategoryId: DocIdNullable) => {
  const { execute } = useUpdateAssetCategory()
  return execute({
    urlParams: { assetId },
    body: { id: assetId, distributionCategory: distributionCategoryId },
  })
}

export const useCreateAsset = () =>
  useApiRequest<AssetDetailItemDto, AssetCreateDto>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT + '/licence/:licenceId',
  })

export const createAsset = (licenceId: IntegerId, data: AssetCreateDto) => {
  const { execute } = useCreateAsset()
  return execute({ urlParams: { licenceId }, body: data })
}

export const useSetSibling = () =>
  useApiRequest<AssetDetailItemDto, object>({
    ...damApiBase,
    method: 'PATCH',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:assetId/sibling/:targetAssetId',
  })

export const setSibling = (assetId: DocId, targetAssetId: DocId) => {
  const { execute } = useSetSibling()
  return execute({ urlParams: { assetId, targetAssetId }, body: {} })
}

export const useRemoveSibling = () =>
  useApiRequest<AssetDetailItemDto, object>({
    ...damApiBase,
    method: 'PATCH',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:assetId/sibling',
  })

export const removeSibling = (assetId: DocId) => {
  const { execute } = useRemoveSibling()
  return execute({ urlParams: { assetId }, body: {} })
}
