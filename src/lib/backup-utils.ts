import { existsSync } from 'fs';
import { copyFile } from 'fs/promises';
import { BACKUP_SUFFIX_PREFIX } from '@/constants';

/**
 * Creates a backup of a file if it exists
 * @param filePath - Path to the file to backup
 * @returns Promise that resolves to the backup path if created, null otherwise
 */
export async function backupFileIfExists(
  filePath: string,
): Promise<string | null> {
  if (!existsSync(filePath)) {
    return null;
  }

  // Format: filename.ext.backup-YYYY-MM-DDTHH-MM-SS
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupPath = `${filePath}.${BACKUP_SUFFIX_PREFIX}${timestamp}`;

  await copyFile(filePath, backupPath);
  return backupPath;
}
