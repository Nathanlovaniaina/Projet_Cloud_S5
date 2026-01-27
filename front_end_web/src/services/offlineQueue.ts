import { openDB } from 'idb'

const DB_NAME = 'app-db'
const STORE = 'queue'

export async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function enqueue(action: any) {
  const db = await getDb()
  await db.add(STORE, { action, createdAt: Date.now() })
  console.log('Action enqueued for sync:', action)
}

export async function drainQueue(handler: (a: any) => Promise<void>) {
  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  let cursor = await store.openCursor()
  while (cursor) {
    try {
      await handler(cursor.value.action)
      await cursor.delete()
      console.log('Action synced:', cursor.value.action)
    } catch (e) {
      console.error('Failed to sync action:', e)
      break // stop on first failure, try later
    }
    cursor = await cursor.continue()
  }
  await tx.done
}
