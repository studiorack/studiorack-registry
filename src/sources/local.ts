import yaml from 'js-yaml';
import path from 'path';
import * as semver from 'semver';
import { PluginPack, PluginVersion, dirRead, fileReadString, safeSlug } from '@studiorack/core';

const LOCAL_DIR: string = path.join('src', 'plugins');
const LOCAL_EXT: string = '.yaml';
const LOCAL_REG: string = path.join(LOCAL_DIR, '**', '*' + LOCAL_EXT);

export function localGetPack() {
  const pack: PluginPack = {};
  const filepaths: string[] = dirRead(LOCAL_REG);
  filepaths.forEach((filepath: string) => {
    // TODO update studiorack/core to handle these strings
    const parts: string[] = filepath.replace(LOCAL_DIR, '').replace(LOCAL_EXT, '').substring(1).split(path.sep);
    const id = safeSlug(`${parts[0]}/${parts[1]}`);
    const version = parts[2];
    if (!pack[id]) {
      // @ts-ignore
      pack[id] = {
        version,
        versions: {},
      };
    }
    // Release is different from version and can vary per version
    const plugin: PluginVersion = localGetFile(filepath);
    plugin.id = id;
    plugin.version = version;
    pack[id].versions[version] = plugin;
    // If plugin version is greater than the current, set as latest version
    if (semver.gt(version, pack[id].version)) {
      pack[id].version = version;
    }
  });
  return pack;
}

export function localGetFile(path: string) {
  const file: string = fileReadString(path);
  return yaml.load(file) as PluginVersion;
}
