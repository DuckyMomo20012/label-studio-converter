import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

/**
 * Recursively find all files in directories matching a pattern
 * @param dirs - Array of directory paths to search
 * @param pattern - Regex pattern to match files
 * @param recursive - Whether to search recursively
 * @returns Array of file paths matching the pattern
 */
export async function findFiles(
  dirs: string[],
  pattern: string,
  recursive: boolean,
): Promise<string[]> {
  const allFiles: string[] = [];

  const regex = new RegExp(pattern);

  async function scanDirectory(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (recursive) {
          await scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (regex.test(entry.name)) {
          allFiles.push(fullPath);
        }
      }
    }
  }

  for (const dir of dirs) {
    const dirStat = await stat(dir);
    if (dirStat.isDirectory()) {
      await scanDirectory(dir);
    } else if (dirStat.isFile()) {
      // If a file path is provided directly, check if it matches
      if (regex.test(dir)) {
        allFiles.push(dir);
      }
    }
  }

  return allFiles;
}

/**
 * Get relative path from any of the input directories
 * Used to preserve directory structure in output
 * @param filePath - Absolute file path
 * @param inputDirs - Array of input directory paths
 * @returns Relative path from the matching input directory
 */
export function getRelativePathFromInputs(
  filePath: string,
  inputDirs: string[],
): string {
  for (const inputDir of inputDirs) {
    // Check if filePath is under this inputDir
    const rel = relative(inputDir, filePath);
    if (!rel.startsWith('..') && !rel.startsWith('/')) {
      return rel;
    }
  }

  // If no match, just return the basename
  return relative(process.cwd(), filePath);
}
