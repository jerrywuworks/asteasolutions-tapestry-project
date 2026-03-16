import {
  BlobReader,
  BlobWriter,
  TextWriter,
  ZipReader,
  type Entry,
  type FileEntry,
} from '@zip.js/zip.js'
import { compact } from 'lodash-es'
import { Store } from 'tapestry-core-client/src/lib/store'
import { viewModelFromTapestry } from 'tapestry-core-client/src/view-model/utils'
import {
  CurrentExport,
  FILE_PREFIX,
  parseRootJson,
  ROOT_FILE,
} from 'tapestry-core/src/data-format/export'
import { HexColor } from 'tapestry-core/src/data-format/schemas/common'
import { MediaItem } from 'tapestry-core/src/data-format/schemas/item'
import { isMediaItem } from 'tapestry-core/src/utils'

type ExportItem = NonNullable<CurrentExport['items']>[number]

export class ImportService {
  private entries!: Entry[]

  async parse(blob: Blob | undefined) {
    if (!blob) {
      return
    }
    const zipReader = new ZipReader(new BlobReader(blob))
    this.entries = await zipReader.getEntries()

    const rootEntry = this.findEntry(ROOT_FILE)

    if (!rootEntry) {
      return
    }

    const rootJson: unknown = JSON.parse(await rootEntry.getData(new TextWriter()))
    const parsed = parseRootJson(rootJson)
    if (!parsed) {
      return
    }

    const viewModel = viewModelFromTapestry(
      {
        ...parsed,
        items: await Promise.all((parsed.items ?? []).map(this.parseItem)),
        rels: parsed.rels ?? [],
        groups: (parsed.groups ?? []).map((g) => ({ ...g, color: g.color as HexColor | null })),
        thumbnail: await this.toObjectUrl(parsed.thumbnail),
      },
      parsed.presentation ?? [],
    )

    return new Store(viewModel, [])
  }

  private findEntry = (name: string) =>
    this.entries.find((e) => e.filename === name) as FileEntry | undefined

  private parseItem = async (i: ExportItem) => {
    const item = { ...i }

    if (isMediaItem(i)) {
      ;(item as MediaItem).source = (await this.toObjectUrl(i.source)) ?? i.source
    }

    item.thumbnail = i.thumbnail && {
      renditions: compact(
        await Promise.all(
          i.thumbnail.renditions.map(async (r) => {
            const source = await this.toObjectUrl(r.source)
            return source && { ...r, source }
          }),
        ),
      ),
    }
    return item
  }

  private async toObjectUrl(url: string | undefined | null) {
    if (!url) {
      return
    }
    const path = url.startsWith(FILE_PREFIX) ? url.slice(FILE_PREFIX.length) : url
    const entry = this.findEntry(path)
    if (!entry) {
      return
    }
    return URL.createObjectURL(await entry.getData(new BlobWriter()))
  }
}
