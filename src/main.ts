import fs from 'fs';
import yaml from 'js-yaml';
import { PluginInterface, PluginRegistry } from './types/Plugin.js';

function registryLoad(repo: string, version: string, id: string) {
  const file: string = fs.readFileSync(`./src/plugins/${repo}/${version}/${id}.yaml`, 'utf8');
  return yaml.load(file) as PluginInterface;
}

function registryNew() {
  return {
    name: 'StudioRack Registry',
    url: 'https://studiorack.github.io/studiorack-registry',
    version: '2.0.0',
    objects: [],
  };
}

function run() {
  const registry: PluginRegistry = registryNew();
  const pluginRepo: string = 'surge-synthesizer/releases-xt';
  const pluginVersion: string = '1.3.1';
  const pluginId: string = 'surge';
  const plugin: PluginInterface = registryLoad(pluginRepo, pluginVersion, pluginId);
  // registry.objects[`${pluginRepo}/${pluginId}`] = {
  //   id: pluginId,
  //   version: pluginVersion,
  //   versions[pluginVersion]: plugin;,
  // }
  console.log(plugin);
}

run();
