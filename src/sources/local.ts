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

const LOCAL_DIR: string = path.join('src', 'plugins');
const LOCAL_EXT: string = '.yaml';
const LOCAL_REG: string = path.join(LOCAL_DIR, '**', '*' + LOCAL_EXT);

export function localGetPack() {
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
    console.log('local', pluginId, pluginVersion);

    // Ensure plugin has valid fields.
    const error = pluginValidateSchema(plugin as PluginVersionLocal);
    if (error) return console.log(error);

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
  return pack;
}

export function localGetFile(path: string) {
  const file: string = fileReadString(path);
  return yaml.load(file) as PluginVersion;
}
