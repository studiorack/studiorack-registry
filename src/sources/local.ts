import yaml from 'js-yaml';
import path from 'path';
import * as semver from 'semver';
import {
  PluginPack,
  PluginVersion,
  PluginVersionLocal,
  dirRead,
  fileReadString,
  pluginValidateSchema,
  safeSlug,
} from '@studiorack/core';
import chalk from 'chalk';
import { pluginCompatibility } from './github.js';

const LOCAL_DIR: string = path.join('src', 'plugins');
const LOCAL_EXT: string = '.yaml';
const LOCAL_REG: string = path.join(LOCAL_DIR, '**', '*' + LOCAL_EXT);

export function localGetPack() {
  console.log('-- Yaml plugins --');
  const pack: PluginPack = {};
  const filepaths: string[] = dirRead(LOCAL_REG);
  filepaths.forEach((filepath: string) => {
    // TODO update studiorack/core to handle these strings
    const parts: string[] = filepath.replace(LOCAL_DIR, '').replace(LOCAL_EXT, '').substring(1).split(path.sep);
    const pluginId: string = safeSlug(`${parts[0]}/${parts[1]}`);
    const pluginVersion: string = parts[2];

    // Get plugin from yaml files.
    const plugin: PluginVersion = localGetFile(filepath);
    if (typeof plugin.date === 'object') plugin.date = (plugin.date as Date).toISOString();

    // Ensure plugin has valid fields.
    const errors: string | boolean = pluginValidateSchema(plugin as PluginVersionLocal);
    const compatibility: string | boolean = pluginCompatibility(plugin);
    if (errors) {
      console.log(chalk.red(`X ${pluginId} | ${pluginVersion} | ${filepath}`));
      console.log(chalk.yellow(compatibility) ? chalk.red(errors) + chalk.yellow(compatibility) : chalk.red(errors));
    } else {
      console.log(chalk.green(`✓ ${pluginId} | ${pluginVersion} | ${filepath}`));
      if (compatibility) console.log(chalk.yellow(compatibility));
    }

    // Add plugin to the plugin pack.
    if (!pack[pluginId]) {
      // @ts-ignore
      pack[pluginId] = {
        version: pluginVersion,
        versions: {},
      };
    }
    pack[pluginId].versions[pluginVersion] = plugin;
    // If plugin version is greater than the current, set as latest version
    if (semver.gt(pluginVersion, pack[pluginId].version)) {
      pack[pluginId].version = pluginVersion;
    }
  });
  console.log(`-- ${Object.keys(pack).length} Yaml plugins added --`);
  return pack;
}

export function localGetFile(path: string) {
  const file: string = fileReadString(path);
  return yaml.load(file) as PluginVersion;
}
