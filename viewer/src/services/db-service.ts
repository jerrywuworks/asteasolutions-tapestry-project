const OBJECT_STORE = 'last_tapestry'

class DBService {
  private db: Promise<IDBDatabase>

  constructor() {
    const request = indexedDB.open('tapestry', 1)
    this.db = this.promisify(request)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore(OBJECT_STORE, { autoIncrement: true })
    }
  }

  async get(signal?: AbortSignal): Promise<ArrayBuffer | undefined> {
    const tx = await this.transaction({ signal })

    const records = await this.promisify<ArrayBuffer[]>(tx.objectStore(OBJECT_STORE).getAll())
    return records[0]
  }

  async save(file: File, signal?: AbortSignal) {
    const buffer = await file.arrayBuffer()
    const tx = await this.transaction({ mode: 'readwrite', signal })
    await this.promisify(tx.objectStore(OBJECT_STORE).clear())
    await this.promisify(tx.objectStore(OBJECT_STORE).put(buffer))
  }

  async clear(signal?: AbortSignal) {
    const tx = await this.transaction({ mode: 'readwrite', signal })
    return this.promisify(tx.objectStore(OBJECT_STORE).clear())
  }

  private async transaction({
    mode,
    signal,
  }: { mode?: IDBTransactionMode; signal?: AbortSignal } = {}) {
    const tx = (await this.db).transaction(OBJECT_STORE, mode)
    signal?.addEventListener('abort', () => tx.abort())
    if (signal?.aborted) {
      tx.abort()
    }
    return tx
  }

  private promisify<T>(request: IDBRequest) {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = reject
    })
  }
}

export const db = new DBService()
