import * as semver from 'semver';
import { getJSON, pathGetId, pathGetVersion, PluginInterface, PluginPack } from '@studiorack/core';

const REGISTRY_URL = 'https://central.owlplug.com/store';

interface OwlPluginInterface {
  name: string;
  creator: string;
  screenshotUrl: string;
  description: string;
  pageUrl: string;
  donateUrl: string;
  version: string;
  technicalUid: string;
  type: string;
  stage: string;
  tags: string[];
  bundles: OwlPluginFiles[];
}

interface OwlPluginFiles {
  name: string;
  targets: string[];
  format: string;
  downloadUrl: string;
  fileSize: number;
}

async function getOwlplugPack(): Promise<PluginPack> {
  const pluginPack: PluginPack = {};
  const registry = await getJSON(REGISTRY_URL);
  registry.products.forEach((product: OwlPluginInterface) => {
    const plugin: PluginInterface = {
      author: product.creator,
      date: new Date().toISOString(),
      description: product.description,
      homepage: product.pageUrl,
      id: pathGetId(product.screenshotUrl),
      name: product.name,
      files: {
        audio: { name: '', size: 0 },
        image: { name: product.screenshotUrl, size: 0 },
        linux: { name: '', size: 0 },
        mac: { name: '', size: 0 },
        win: { name: '', size: 0 },
      },
      release: `v${registry.version}`,
      repo: 'owlplug/central',
      tags: product.tags,
      version: pathGetVersion(product.version || '0.0.0'),
    };
    product.bundles.forEach((bundle: OwlPluginFiles) => {
      if (bundle.targets.includes('linux')) {
        plugin.files.linux.name = bundle.downloadUrl;
        plugin.files.linux.size = bundle.fileSize;
      }
      if (bundle.targets.includes('osx')) {
        plugin.files.mac.name = bundle.downloadUrl;
        plugin.files.mac.size = bundle.fileSize;
      } else if (bundle.targets.includes('win64')) {
        plugin.files.win.name = bundle.downloadUrl;
        plugin.files.win.size = bundle.fileSize;
      }
    });
    // For each plugin sanitize the id and add to registry
    const pluginId = `${plugin.repo}/${plugin.id}`;
    const pluginVersion = semver.coerce(plugin.version)?.version || '0.0.0';
    console.log('owlplug', pluginId, pluginVersion);
    if (!pluginPack[pluginId]) {
      pluginPack[pluginId] = {
        id: pluginId,
        license: '',
        version: pluginVersion,
        versions: {},
      };
    }
    pluginPack[pluginId].versions[pluginVersion] = plugin;
    // If plugin version is greater than the current, set as latest version
    if (semver.gt(pluginVersion, pluginPack[pluginId].version)) {
      pluginPack[pluginId].version = pluginVersion;
    }
  });
  return pluginPack;
}

export { getOwlplugPack };
