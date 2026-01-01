import {
  buildInstallCommand,
  buildUninstallCommand,
} from '@stricli/auto-complete';
import { buildApplication, buildRouteMap } from '@stricli/core';
import { description, version } from '@/../package.json';
import { toLabelStudioCommand } from '@/commands/toLabelStudio/command';
import { toPPOCRCommand } from '@/commands/toPPOCR/commands';

const routes = buildRouteMap({
  routes: {
    toLabelStudio: toLabelStudioCommand,
    toPPOCR: toPPOCRCommand,
    install: buildInstallCommand('label-studio-converter', {
      bash: '__label-studio-converter_bash_complete',
    }),
    uninstall: buildUninstallCommand('label-studio-converter', { bash: true }),
  },
  docs: {
    brief: description,
    hideRoute: {
      install: true,
      uninstall: true,
    },
  },
});

export const app = buildApplication(routes, {
  name: 'label-studio-converter',
  versionInfo: {
    currentVersion: version,
  },
});
