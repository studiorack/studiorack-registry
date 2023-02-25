import { dirCreate, fileJsonCreate, PluginEntry, PluginInterface, pluginLatest, PluginPack } from '@studiorack/core';
import { githubGetPack } from './sources/github';
import { getOwlplugPack } from './sources/owlplug';

const DIST_PATH = './out';
const REGISTRY_OUT = 'index.json';
const REGISTRY_OUT_EFFECTS = 'effects.json';
const REGISTRY_OUT_INSTRUMENTS = 'instruments.json';
const REGISTRY_OUT_SFZ = 'sfz.json';

function registryLoad() {
  const registry: any = require('./registry.json');
  registry.time = new Date();
  registry.total = registry.objects.length || 0;
  return registry;
}

function registryAdd(list: any, pluginPack: PluginPack) {
  console.log(list);
  console.log(pluginPack);
  list.objects = Object.assign(list.objects, pluginPack);
  list.total += Object.keys(pluginPack).length;
}

async function registrySave(path: string, file: any) {
  dirCreate(DIST_PATH);
  fileJsonCreate(path, file);
}

async function run() {
  const registry = registryLoad();
  registryAdd(registry, await githubGetPack());
  // registryAdd(registry, await getOwlplugPack());

  // Create separate registries for Effects and Instruments
  const effects: any = { objects: {} };
  const index: any = { objects: {} };
  const instruments: any = { objects: {} };
  const sfz: any = { objects: {} };
  for (const pluginId in registry.objects) {
    const pluginEntry: PluginEntry = registry.objects[pluginId];
    const plugin: PluginInterface = pluginLatest(pluginEntry);
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
