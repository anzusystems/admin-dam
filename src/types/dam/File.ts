import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { ImagePreviewNullable } from '@/types/dam/ImagePreview'

export enum AssetFileProcessStatus {
  Uploading = 'uploading', // file entity created and ready to receive chunks
  Uploaded = 'uploaded', // all chunks were sent
  Downloading = 'downloading', // file is uploaded from external provider
  Storing = 'storing', // validate size|mime and store final file to disk
  Stored = 'stored', // File is stored and ready to processing
  Duplicate = 'duplicate', // AssetFile is duplicate of another asset
  Processing = 'processing', // processing file attributes (length, size, colors, ...)
  Processed = 'processed', // file processed and ready to serve
  Failed = 'failed',
}

interface ImageAttributes {
  ratioWidth: number
  ratioHeight: number
  width: number
  height: number
  rotation: number
  mostDominantColor: string
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
  failReason: string
}

export interface Link {
  width: number
  height: number
  requestedWidth: number
  requestedHeight: number
  url: string
  title: string
  type: string
}

export type Links = Record<'image_list' | 'image_detail' | 'audio', Link> | Record<string, never>

export interface ImageFile extends UserAndTimeTrackingFields {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  imageAttributes: ImageAttributes
  originAssetFile: DocIdNullable
  links?: Links
  metadata: Metadata
  _resourceName: 'imageFile'
}

export interface AudioFile extends UserAndTimeTrackingFields {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  audioAttributes: AudioAttributes
  originAssetFile: DocIdNullable
  links?: Links
  _resourceName: 'audioFile'
}

export interface VideoFile extends UserAndTimeTrackingFields {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  videoAttributes: VideoAttributes
  originAssetFile: DocIdNullable
  links?: Links
  imagePreview: ImagePreviewNullable
  _resourceName: 'videoFile'
}

export interface DocumentFile extends UserAndTimeTrackingFields {
  id: DocId
  asset: DocId
  fileAttributes: FileAttributes
  documentAttributes: DocumentAttributes
  originAssetFile: DocIdNullable
  links?: Links
  _resourceName: 'documentFile'
}

export interface FileDownloadLink extends UserAndTimeTrackingFields {
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
