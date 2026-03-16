import { BaseResourceDto } from './common.js'
import { ImageAsset, ImageAssetRendition } from 'tapestry-core/src/data-format/schemas/item.js'

export interface ImageAssetDto extends ImageAsset, BaseResourceDto {}
export interface ImageAssetRenditionDto extends ImageAssetRendition, BaseResourceDto {}
