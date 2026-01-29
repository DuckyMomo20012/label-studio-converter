import { existsSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import sharp from 'sharp';

/**
 * Image rotation utilities for Sino Nom text processing
 *
 * Provides functions to rotate images for better text detection,
 * with optional backup before modification.
 */

export type RotationOptions = {
  angle: number;
  createBackup?: boolean;
  backupSuffix?: string;
};

/**
 * Rotate an image and optionally create a backup
 *
 * @param imagePath - Path to the image file
 * @param options - Rotation options
 * @returns Path to the rotated image (same as input if rotated in place)
 */
export async function rotateImage(
  imagePath: string,
  options: RotationOptions,
): Promise<string> {
  const { angle, createBackup = false, backupSuffix = '.backup' } = options;

  if (!existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  // Create backup if requested
  if (createBackup) {
    const backupPath = await createImageBackup(imagePath, backupSuffix);
    console.log(`Created backup: ${backupPath}`);
  }

  // Rotate the image
  await sharp(imagePath)
    .rotate(angle, { background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(imagePath + '.tmp');

  // Replace original with rotated version
  const { rename } = await import('node:fs/promises');
  await rename(imagePath + '.tmp', imagePath);

  console.log(`Rotated image ${angle}° in place: ${imagePath}`);
  return imagePath;
}

/**
 * Create a backup copy of an image
 *
 * @param imagePath - Path to the image file
 * @param backupSuffix - Suffix to append to backup filename (default: '.backup')
 * @returns Path to the backup file
 */
export async function createImageBackup(
  imagePath: string,
  backupSuffix = '.backup',
): Promise<string> {
  const dir = dirname(imagePath);
  const filename = basename(imagePath);
  const ext = filename.substring(filename.lastIndexOf('.'));
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const backupPath = join(dir, `${nameWithoutExt}${backupSuffix}${ext}`);

  await copyFile(imagePath, backupPath);
  return backupPath;
}

/**
 * Detect if an image needs rotation based on text orientation
 *
 * @param _imagePath - Path to the image file (unused in current implementation)
 * @returns Recommended rotation angle (0, 90, 180, or 270)
 */
export async function detectRequiredRotation(
  _imagePath: string,
): Promise<number> {
  // Placeholder for rotation detection logic
  // This can be enhanced with actual text orientation detection
  // For now, we assume images are already in correct orientation
  return 0;
}

/**
 * Rotate an image to optimize for vertical text detection
 *
 * @param imagePath - Path to the image file
 * @param options - Options including backup preference
 * @returns Object with rotated path and applied angle
 */
export async function rotateForVerticalText(
  imagePath: string,
  options: { createBackup?: boolean } = {},
): Promise<{ path: string; angle: number }> {
  const recommendedAngle = await detectRequiredRotation(imagePath);

  if (recommendedAngle === 0) {
    console.log('Image orientation is optimal, no rotation needed');
    return { path: imagePath, angle: 0 };
  }

  const rotatedPath = await rotateImage(imagePath, {
    angle: recommendedAngle,
    createBackup: options.createBackup,
  });

  return { path: rotatedPath, angle: recommendedAngle };
}
