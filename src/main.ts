import {
  dirCreate,
  fileJsonCreate,
  pluginLatest,
  PluginEntry,
  PluginFile,
  PluginFiles,
  pluginFileUrl,
  PluginPack,
  PluginRegistry,
  PluginVersion,
} from '@studiorack/core';
import { githubGetPack } from './sources/github.js';
import { localGetPack } from './sources/local.js';

const DIST_PATH: string = './out';
const REGISTRY_OUT: string = 'index.json';
const REGISTRY_OUT_EFFECTS: string = 'effects.json';
const REGISTRY_OUT_INSTRUMENTS: string = 'instruments.json';
const REGISTRY_OUT_SFZ: string = 'sfz.json';

export function registryNew(type: string, version: string, path = ''): PluginRegistry {
  return {
    name: `StudioRack Registry - ${type}`,
    url: `https://studiorack.github.io/studiorack-registry/${path}${type}.json`,
    version,
    objects: {},
  };
}

export function registrySave(path: string, file: PluginRegistry) {
  dirCreate(DIST_PATH);
  fileJsonCreate(path, file);
}

export function registryPackAdd(registry: PluginRegistry, pluginPack: PluginPack) {
  registry.objects = Object.assign(registry.objects, pluginPack);
}

export function registryPackClean(pack: PluginPack) {
  // Remove legacy attributes from plugins
  Object.keys(pack).forEach((entryId: string) => {
    const pluginEntry: PluginEntry = pack[entryId];
    Object.keys(pluginEntry.versions).forEach((versionId: string) => {
      const plugin: PluginVersion = pluginEntry.versions[versionId];
      Object.keys(plugin.files).forEach((fileId: string) => {
        const file: PluginFile = plugin.files[fileId as keyof PluginFiles];
        file.url = pluginFileUrl(plugin, fileId as keyof PluginFiles);
      });
      if (plugin.license && typeof plugin.license !== 'string' && plugin.license.key)
        plugin.license = plugin.license.key;
      delete plugin.id;
      delete plugin.release;
      delete plugin.repo;
      delete plugin.version;
    });
    delete pluginEntry.id;
    delete pluginEntry.license;
  });
  return pack;
}

export function registryPackFilter(pack: PluginPack, tag: string, version: string) {
  const packFiltered: PluginPack = {};
  for (const pluginId in pack) {
    const pluginEntry: PluginEntry = pack[pluginId];
    let plugin: PluginVersion = pluginEntry.versions[pluginEntry.version];
    if (version === '1.0.0') {
      plugin = pluginLatest(pluginEntry);
    }
    if (plugin.tags.includes(tag) || (tag === 'Effect' && plugin.tags.includes('Fx'))) {
      packFiltered[pluginId] = pluginEntry;
    }
  }
  return packFiltered;
}

export function registryVersion(registry: PluginRegistry, path = '') {
  // Create directory
  if (path !== '') dirCreate(`${DIST_PATH}/${path}`);

  // All plugins
  const index: PluginRegistry = registryNew('index', registry.version, path);
  const indexPack: PluginPack = registry.objects;
  registryPackAdd(index, indexPack);
  registrySave(`${DIST_PATH}/${path}${REGISTRY_OUT}`, index);

  // Effects
  const effects: PluginRegistry = registryNew('effects', registry.version, path);
  const effectsPack: PluginPack = registryPackFilter(registry.objects, 'Effect', registry.version);
  registryPackAdd(effects, effectsPack);
  registrySave(`${DIST_PATH}/${path}${REGISTRY_OUT_EFFECTS}`, effects);

  // Instruments
  const instruments: PluginRegistry = registryNew('instruments', registry.version, path);
  const instrumentsPack: PluginPack = registryPackFilter(registry.objects, 'Instrument', registry.version);
  registryPackAdd(instruments, instrumentsPack);
  registrySave(`${DIST_PATH}/${path}${REGISTRY_OUT_INSTRUMENTS}`, instruments);

  // Sfz
  const sfz: PluginRegistry = registryNew('sfz', registry.version, path);
  const sfzPack: PluginPack = registryPackFilter(registry.objects, 'sfz', registry.version);
  registryPackAdd(sfz, sfzPack);
  registrySave(`${DIST_PATH}/${path}${REGISTRY_OUT_SFZ}`, sfz);
}

export async function run() {
  const githubPack: PluginPack = await githubGetPack();
  const localPack: PluginPack = localGetPack();

  // Registry v1
  const registryV1: PluginRegistry = registryNew('registry', '1.0.0');
  registryPackAdd(registryV1, githubPack);
  registryVersion(registryV1);

  // Registry v2
  const registryV2: PluginRegistry = registryNew('registry', '2.0.0');
  registryPackAdd(registryV2, registryPackClean(githubPack));
  registryPackAdd(registryV2, localPack);
  registryVersion(registryV2, 'v2/');
}

run();
