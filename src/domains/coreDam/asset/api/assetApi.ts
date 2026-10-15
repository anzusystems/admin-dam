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
  nextMetadataOrder,
  queueRowBaseline,
  sameMetadataValue,
  setQueueRowBaseline,
} from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import type { QueueRowMetadata } from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import { i18n } from '@/plugins/i18n'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export interface AssetMetadataBulkItem {
  id: DocId
  described: boolean
  /* Optional on purpose: `AssetMetadataBulkManager` guards each of these with `isXUndefined()`, so
   * a field left out is one this save does not write - the only way to edit metadata without also
   * writing flags the form never showed, and to save a row without writing what nobody changed in it.
   * The backend still runs its internal rules afterwards, which can move `internal` on their own. */
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
    client: damClient,
    system: SYSTEM_CORE_DAM,
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
) => {
  return new Promise((resolve, reject) => {
    fetchAssetListByIdsSequence(ids, licenceId)
      .then((responses) => {
        if (responses.length === 0) {
          reject(responses)
        } else if (
          responses.every((res) => {
            // An answer without its list is not "none of these assets exist".
            return res.status === HTTP_STATUS_OK && Array.isArray(res.data?.data)
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

// The answer is taken as it comes and checked by its reader below.
const useFetchWaitingAssets = () =>
  useApiRequest<{ data?: unknown }, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
  })

/* Several assets of a licence by their ids, for the poll of the upload queue: the requests of `fetchAssetListByIds`,
 * in the same groups of fifty.
 *
 * The poll asks again and again, and says of each request whether a failure of it is to be written down:
 * `report: false` keeps this one call from the api error logger, the failure is thrown as ever. That is why it
 * is not `useApiFetchItems`, a single call of which cannot be kept quiet, and why the list is checked here. An
 * answer without its list is refused whether it is reported or not: it must never read as "none of these assets
 * exist". */
export const fetchWaitingAssets = async (ids: DocId[], licenceId: number, options?: { report?: boolean }) => {
  const { execute } = useFetchWaitingAssets()
  const found: AssetDetailItemDto[] = []
  for (let offset = 0; offset < ids.length; offset += FETCH_BY_IDS_MAX_LIMIT) {
    const batch = ids.slice(offset, offset + FETCH_BY_IDS_MAX_LIMIT)
    const body = await execute({
      // The address whole, not a template with parameters: a parameter would be encoded, its commas with it.
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
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

/* `report: false` keeps a failure of this one call from the api error logger; it is thrown as ever. For the poll
 * of the upload queue, which has reported the first failure of a streak already. */
export const fetchAsset = (id: DocId, options?: { report?: boolean }) => {
  const { execute } = useFetchAsset()
  return execute({ urlParams: { id }, report: options?.report })
}

export const useFetchAssetByFileId = () =>
  useApiRequest<AssetDetailItemDto, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:fileId',
  })

export const fetchAssetByFileId = (fileId: DocId) => {
  const { execute } = useFetchAssetByFileId()
  return execute({ urlParams: { fileId } })
}

export const useFetchAssetMetadata = () =>
  useApiRequest<AssetMetadataDto, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id/metadata',
  })

export const fetchAssetMetadata = (id: DocId) => {
  const { execute } = useFetchAssetMetadata()
  return execute({ urlParams: { id } })
}

/** What the bulk save sends: an item with an asset whose metadata the user may edit. */
export const hasMetadataToSave = (item: UploadQueueItem): item is UploadQueueItem & { assetId: DocId } =>
  !isNull(item.assetId) && item.canEditMetadata

/* What the bulk save sends, row by row, each with the metadata the server has of it once that is saved. Of a row goes
 * out what differs from what it last got from the server, or last saved: a field nobody touched here would overwrite
 * what another editor saved meanwhile. A row that goes out is marked described. A row of which it is not known what
 * the server has, or whether its asset is described there, is sent whole. */
const listItemsToMetadataBulkItems = (items: UploadQueueItem[]) => {
  const dtoItems: Array<{
    item: UploadQueueItem
    dtoItem: AssetMetadataBulkItem
    metadata: QueueRowMetadata
    changed: Partial<QueueRowMetadata>
  }> = []
  items.forEach((item) => {
    if (hasMetadataToSave(item)) {
      // A copy, taken as the save begins: the row can be typed into while its batch waits for the ones before it.
      const metadata = metadataOfQueueRow(item)
      const known = queueRowBaseline(item)
      const whole = !known || isUndefined(known.described)
      const changed: Partial<QueueRowMetadata> = {}
      if (whole || !sameMetadataValue(metadata.keywords, known.keywords)) changed.keywords = metadata.keywords
      if (whole || !sameMetadataValue(metadata.authors, known.authors)) changed.authors = metadata.authors
      // All of it when any of it differs: the server takes a field of the form that is left out as one emptied.
      if (whole || !sameMetadataValue(metadata.customData, known.customData)) changed.customData = metadata.customData
      // Only what this form edits.
      if (!isNull(metadata.mainFileSingleUse) && (whole || metadata.mainFileSingleUse !== known.mainFileSingleUse)) {
        changed.mainFileSingleUse = metadata.mainFileSingleUse
      }
      /* Nothing to write: the asset is described and the row holds what the server has. Sent all the same, core-dam
       * would take the fields left out for a change of the asset and tell everyone who listens for one. */
      if (!whole && known.described && Object.keys(changed).length === 0) return
      dtoItems.push({ item, dtoItem: { id: item.assetId, described: true, ...changed }, metadata, changed })
    }
  })

  return dtoItems
}

// Only a 200 is a save: any other answer is a save that failed, as before. Nothing is read from the answer.
const useUpdateMetadataBulk = () =>
  useApiCommand<AssetMetadataBulkItem[]>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/metadata-bulk-update',
    options: { validateStatus: (status) => status === HTTP_STATUS_OK },
  })

/* A save of metadata refused by validation. `fields` are as the library makes them, from the keys of the request
 * such as `[0].customData.title` - the index is the place of the asset in its batch, not a row on the screen;
 * `named` holds the same fields as the forms name them, which is what the user is told. */
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

/* The failure of a save as the user is to be told it: a refusal by validation gets the names of its fields, a field
 * refused in several assets of the batch once. Any other failure is handed on as it came. */
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

// The assets deleted here, once their delete was answered.
const deletedHere = new Set<DocId>()

/** Whether the asset was deleted here: a read sent before its delete can still bring it as it was. */
export const assetDeletedHere = (assetId: DocId) => deletedHere.has(assetId)

/* Ten at a time, one batch after the other. The server saves a batch whole or not at all; a batch that fails stops
 * those after it, the ones before it stay saved, and saving again is safe. Only the rows there is something to write
 * of go out: with none of them no request is made, and the save is done all the same. */
export const bulkUpdateAssetsMetadata = async (items: UploadQueueItem[]) => {
  // Refused as before; the buttons are off while no row could be sent (`nothingToSave`).
  if (!items.some(hasMetadataToSave)) throw new Error('assetApi: no metadata to save')
  const bulkItems = listItemsToMetadataBulkItems(items)
  const { execute } = useUpdateMetadataBulk()
  // From the filtered array: counting the input sent trailing PATCHes with an empty body.
  for (let offset = 0; offset < bulkItems.length; offset += BULK_METADATA_LIMIT) {
    /* Not an asset deleted while the batches before were on the wire: the queue can still be used meanwhile, and its
     * row is gone with the delete. A batch left with nothing is not sent. */
    const batch = bulkItems
      .slice(offset, offset + BULK_METADATA_LIMIT)
      .filter(({ dtoItem }) => !deletedHere.has(dtoItem.id))
    if (batch.length === 0) continue
    try {
      await execute({ body: batch.map(({ dtoItem }) => dtoItem) })
    } catch (error) {
      throw withNamedFields(error, (index) => batch[index]?.item.assetType)
    }
    /* Saved: the server has what was sent, and a save after this one sends what differs from it. Only the fields that
     * went out are written, over what is known of the row by now: a read or another save may have moved that while
     * this one was on the wire, and the copy of the click would put it back. Placed where the save is answered: a
     * read sent before that may have been answered from before the save. */
    const savedAt = nextMetadataOrder()
    batch.forEach(({ item, metadata, changed }) =>
      setQueueRowBaseline(item, { ...(queueRowBaseline(item) ?? metadata), ...changed, described: true }, savedAt)
    )
    // And the detail or the panel that holds one of them.
    useAssetDetailStore().savedAsDescribed(batch.map(({ dtoItem }) => dtoItem.id))
  }
}

const { showErrorsDefault, showUnknownError, showApiValidationError } = useAlerts()

/** What a failed save of metadata tells the user, by the kind of the failure; the one place that says it. */
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
  // Described with it: so is the asset the detail or the panel holds, when it is this one.
  useAssetDetailStore().savedAsDescribed([asset.id])
}

export const useDeleteAsset = () =>
  useApiCommand<null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const deleteAsset = async (id: DocId) => {
  const { execute } = useDeleteAsset()
  await execute({ urlParams: { id } })
  // A bulk save on its way sends nothing more of it.
  deletedHere.add(id)
}

export const useUpdateAssetCategory = () =>
  useApiCommand<{ id: DocId; distributionCategory: DocIdNullable }>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
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
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/licence/:licenceId',
  })

export const createAsset = (licenceId: IntegerId, data: AssetCreateDto) => {
  const { execute } = useCreateAsset()
  return execute({ urlParams: { licenceId }, body: data })
}

export const useSetSibling = () =>
  useApiRequest<AssetDetailItemDto, object>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:assetId/sibling/:targetAssetId',
  })

export const setSibling = (assetId: DocId, targetAssetId: DocId) => {
  const { execute } = useSetSibling()
  return execute({ urlParams: { assetId, targetAssetId }, body: {} })
}

export const useRemoveSibling = () =>
  useApiRequest<AssetDetailItemDto, object>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:assetId/sibling',
  })

export const removeSibling = (assetId: DocId) => {
  const { execute } = useRemoveSibling()
  return execute({ urlParams: { assetId }, body: {} })
}
