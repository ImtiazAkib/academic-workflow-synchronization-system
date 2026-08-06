import { gridFsStorage } from './gridfs.storage';

import type { StorageDriver } from './storage.types';

export type { StorageDriver, StoredFile, StoredFileStream } from './storage.types';

/**
 * The driver the app uses.
 *
 * One binding, so swapping backends is this line plus a new file — nothing above the
 * storage layer names GridFS.
 */
export const storage: StorageDriver = gridFsStorage;
