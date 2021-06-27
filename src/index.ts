import { dirCreate, fileJsonCreate, PluginPack } from '@studiorack/core';
import { getGithubPack } from './sources/github';

const DIST_PATH = './out';
const REGISTRY_OUT = 'index.json';

function registryLoad() {
  const registry: any = require('./registry.json');
  registry.time = new Date();
  registry.total = 0;
  return registry;
}

function registryAdd(list: any, pluginPack: PluginPack) {
  console.log(list);
  console.log(pluginPack);
  list.objects = Object.assign(list.objects, pluginPack);
  list.total += Object.keys(pluginPack).length;
}

async function registrySave(file: any) {
  dirCreate(DIST_PATH);
  fileJsonCreate(`${DIST_PATH}/${REGISTRY_OUT}`, file);
}

async function run() {
  const registry = registryLoad();
  registryAdd(registry, await getGithubPack());
  registrySave(registry);
}

run();
