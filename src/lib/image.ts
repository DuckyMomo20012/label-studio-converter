import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import sizeOf from 'image-size';

export const getImageDimensions = async (
  imagePath: string,
): Promise<{ width: number; height: number } | null> => {
  // Check if the imagePath is valid path
  if (!existsSync(imagePath)) {
    console.warn(`Image file does not exist at path: ${imagePath}`);
    return null;
  }

  try {
    const fileBuffer = await readFile(imagePath);

    const dimensions = sizeOf(fileBuffer);
    if (dimensions.width && dimensions.height) {
      return { width: dimensions.width, height: dimensions.height };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting image dimensions for ${imagePath}:`, error);
    return null;
  }
};
