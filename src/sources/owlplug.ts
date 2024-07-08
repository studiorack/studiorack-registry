import * as semver from 'semver';
import { fileReadJson, pathGetId, PluginPack, PluginVersion, safeSlug } from '@studiorack/core';

const REGISTRY_URL = 'https://central.owlplug.com/store';

interface OwlPluginInterface {
  name: string;
  creator: string;
  license: string;
  screenshotUrl: string;
  description: string;
  pageUrl: string;
  donateUrl: string;
  type: string;
  tags: string[];
  bundles: OwlPluginFiles[];
}

interface OwlPluginFiles {
  name: string;
  targets: string[];
  format: string;
  downloadUrl: string;
  downloadSha256: string;
  fileSize: number;
}

async function getOwlplugPack(): Promise<PluginPack> {
  console.log('-- Owlplug plugins --');
  const pluginPack: PluginPack = {};
  const registry = await fileReadJson(REGISTRY_URL);
  registry.products.forEach((product: OwlPluginInterface) => {
    const plugin: PluginVersion = {
      author: product.creator,
      date: new Date().toISOString(),
      description: product.description,
      homepage: product.pageUrl,
      id: pathGetId(product.screenshotUrl),
      name: product.name,
      files: {
        audio: { url: '', size: 0 },
        image: { url: product.screenshotUrl, size: 0 },
        linux: { url: '', size: 0 },
        mac: { url: '', size: 0 },
        win: { url: '', size: 0 },
      },
      license: product.license,
      tags: product.tags,
      version: '0.0.0',
    };
    product.bundles.forEach((bundle: OwlPluginFiles) => {
      if (bundle.targets.includes('linux')) {
        plugin.files.linux.url = bundle.downloadUrl;
        plugin.files.linux.size = bundle.fileSize;
      }
      if (bundle.targets.includes('osx')) {
        plugin.files.mac.url = bundle.downloadUrl;
        plugin.files.mac.size = bundle.fileSize;
      } else if (bundle.targets.includes('win64')) {
        plugin.files.win.url = bundle.downloadUrl;
        plugin.files.win.size = bundle.fileSize;
      }
    });
    // For each plugin sanitize the id and add to registry
    const pluginId = safeSlug(plugin.id || '');
    const pluginVersion = semver.coerce(plugin.version)?.version || '0.0.0';
    console.log('owlplug', pluginId, pluginVersion);
    if (!pluginPack[pluginId]) {
      pluginPack[pluginId] = {
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
