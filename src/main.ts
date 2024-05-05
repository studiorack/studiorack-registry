import { dirCreate, fileJsonCreate } from '@studiorack/core';
import {
  PluginEntry,
  PluginInterface,
  PluginRegistry,
} from './types/Plugin.js';
import { githubGetPack } from './sources/github.js';
import { localGetPack } from './sources/local.js';

const DIST_PATH: string = './out';
const REGISTRY_OUT: string = 'index.json';
const REGISTRY_OUT_EFFECTS: string = 'effects.json';
const REGISTRY_OUT_INSTRUMENTS: string = 'instruments.json';
const REGISTRY_OUT_SFZ: string = 'sfz.json';

export function registryNew(type: string): PluginRegistry {
  return {
    name: `StudioRack Registry - ${type}`,
    url: `https://studiorack.github.io/studiorack-registry/${type}.json`,
    version: '2.0.0',
    objects: {},
  };
}

async function registrySave(path: string, file: PluginRegistry) {
  dirCreate(DIST_PATH);
  fileJsonCreate(path, file);
}

async function run() {
  const registry: PluginRegistry = registryNew('registry');
  registry.objects = Object.assign(registry.objects, await githubGetPack());
  registry.objects = Object.assign(registry.objects, localGetPack());

  // Create separate registries for Effects and Instruments
  const effects: PluginRegistry = registryNew('effects');
  const index: PluginRegistry = registryNew('index');
  const instruments: PluginRegistry = registryNew('instruments');
  const sfz: PluginRegistry = registryNew('sfz');
  for (const pluginId in registry.objects) {
    const pluginEntry: PluginEntry = registry.objects[pluginId];
    const plugin: PluginInterface = pluginEntry.versions[pluginEntry.version];
    // Check if tags include Effect/Fx
    if (plugin.tags.includes('Effect') || plugin.tags.includes('Fx')) {
      effects.objects[pluginId] = pluginEntry;
    }
    if (plugin.tags.includes('Instrument')) {
      instruments.objects[pluginId] = pluginEntry;
    }
    if (plugin.tags.includes('sfz')) {
      sfz.objects[pluginId] = pluginEntry;
    }
    index.objects[pluginId] = pluginEntry;
  }
  registrySave(`${DIST_PATH}/${REGISTRY_OUT}`, index);
  registrySave(`${DIST_PATH}/${REGISTRY_OUT_EFFECTS}`, effects);
  registrySave(`${DIST_PATH}/${REGISTRY_OUT_INSTRUMENTS}`, instruments);
  registrySave(`${DIST_PATH}/${REGISTRY_OUT_SFZ}`, sfz);
}

run();
