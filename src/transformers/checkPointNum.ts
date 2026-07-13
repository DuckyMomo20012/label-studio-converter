import chalk from 'chalk';
import { type Transformer } from '@/lib/processor';

export type CheckPointNumOptions = {
  numPointCheck?: number;
};

export const checkPointNum = (async (boxes, imageFilePath: string, options) => {
  const { numPointCheck } = options;

  if (!numPointCheck) {
    return boxes;
  }

  boxes.forEach((box, index) => {
    if (box.points.length !== numPointCheck) {
      console.log(
        chalk.yellow(
          `Box ${index + 1} in image: ${imageFilePath} has ${box.points.length} points, expected ${numPointCheck}`,
        ),
      );
    }
  });

  return boxes;
}) satisfies Transformer<CheckPointNumOptions>;
