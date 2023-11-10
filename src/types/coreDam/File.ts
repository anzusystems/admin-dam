import type {
  AnzuUserAndTimeTrackingAware,
  AssetFileFailReason,
  AssetFileLinkType,
  AssetFileProcessStatus,
  DocId,
  DocIdNullable,
} from '@anzusystems/common-admin'
import type { ImagePreviewNullable } from '@/types/coreDam/ImagePreview'

interface ImageAttributes {
  ratioWidth: number
  ratioHeight: number
  width: number
  height: number
  rotation: number
  mostDominantColor: string
  animated: boolean
}

interface AudioAttributes {
  duration: number
  codecName: string
  bitrate: number
}

interface DocumentAttributes {
  pageCount: number
}

interface VideoAttributes {
  bitrate: number
  codecName: string
  duration: number
  height: number
  ratioHeight: number
  ratioWidth: number
  rotation: number
  width: number
}

interface Metadata {
  exifData: [] // todo check
  id: string
  createdAt: string
  modifiedAt: string
  createdBy: number
  modifiedBy: number
}

interface FileAttributes {
  status: AssetFileProcessStatus
  mimeType: string
  size: number
  originFileName: string
  originUrl: string
  failReason: AssetFileFailReason
}

export interface AssetFileLink {
  width: number
  height: number
  requestedWidth: number
  requestedHeight: number
  url: string
  title: string
  type: AssetFileLinkType
}

export type AssetFileLinks =
  | Record<'image_list' | 'image_table' | 'image_detail' | 'audio', AssetFileLink>
  | Record<string, never>

export interface ImageFile extends AnzuUserAndTimeTrackingAware {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  imageAttributes: ImageAttributes
  originAssetFile: DocIdNullable
  links?: AssetFileLinks
  metadata: Metadata
  _resourceName: 'imageFile'
}

export interface AudioFile extends AnzuUserAndTimeTrackingAware {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  audioAttributes: AudioAttributes
  originAssetFile: DocIdNullable
  links?: AssetFileLinks
  _resourceName: 'audioFile'
}

export interface VideoFile extends AnzuUserAndTimeTrackingAware {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  videoAttributes: VideoAttributes
  originAssetFile: DocIdNullable
  links?: AssetFileLinks
  imagePreview: ImagePreviewNullable
  _resourceName: 'videoFile'
}

export interface DocumentFile extends AnzuUserAndTimeTrackingAware {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  documentAttributes: DocumentAttributes
  originAssetFile: DocIdNullable
  links?: AssetFileLinks
  _resourceName: 'documentFile'
}

export interface FileDownloadLink extends AnzuUserAndTimeTrackingAware {
  id: DocId
  link: string
  _system: string
  _resourceName: 'imageFile'
}

export type AssetFile = ImageFile | AudioFile | VideoFile | DocumentFile

export type AssetFileNullable = ImageFile | AudioFile | VideoFile | DocumentFile | null

export const isImageFile = (value: any): value is ImageFile => {
  if (!value || !value._resourceName) return false
  return value._resourceName === 'imageFile'
}

export const isVideoFile = (value: any): value is VideoFile => {
  if (!value || !value._resourceName) return false
  return value._resourceName === 'videoFile'
}

export const isAudioFile = (value: any): value is AudioFile => {
  if (!value || !value._resourceName) return false
  return value._resourceName === 'audioFile'
}

export const isDocumentFile = (value: any): value is DocumentFile => {
  if (!value || !value._resourceName) return false
  return value._resourceName === 'documentFile'
}
