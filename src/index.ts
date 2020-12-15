import * as semver from 'semver';
import slugify from 'slugify';
import {
  dirCreate,
  fileJsonCreate,
  getJSON,
  Plugin,
  PluginPack,
  validatePluginSchema,
} from '@studiorack/core';

const DIST_PATH = './out';
const REGISTRY_FILE = 'index.json';
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true';

async function getResults(url: string, dir: string, filename: string) {
  try {
    const registry = {
      objects: {},
      time: new Date(),
      total: 0,
    };
    const results = await getJSON(url);
    for (const result of results.items) {
      const pluginPack = await getReleases(result);
      registry.objects = Object.assign(registry.objects, pluginPack);
      registry.total += Object.keys(pluginPack).length;
    }
    console.log(registry);
    dirCreate(dir);
    fileJsonCreate(`${dir}/${filename}`, registry);
  } catch (error) {
    console.error(error);
  }
}

async function getReleases(result: any) {
  const pluginPack: PluginPack = {};
  try {
    // Get releases for a GitHub repo
    const releases = await getJSON(result.releases_url.replace('{/id}', ''));
    for (const release of releases) {
      // For each release get plugins.json
      const pluginsJsonList = await getPlugins(
        `https://github.com/${result.full_name}/releases/download/${release.tag_name}/plugins.json`
      );
      pluginsJsonList.plugins.forEach((plugin: Plugin) => {
        // For each plugin sanitize the id and add to registry
        const pluginId = slugify(`${result.full_name}/${plugin.id}`, { lower: true, remove: /[^\w\s$*_+~.()'"!\-:@\/]+/g });
        const pluginVersion = semver.coerce(plugin.version)?.version || '0.0.0';
        console.log('plugin', pluginId, pluginVersion);
        if (!pluginPack[pluginId]) {
          pluginPack[pluginId] = {
            id: pluginId,
            version: pluginVersion,
            versions: {},
          };
        }
        // plugin.release = release.tag_name;
        pluginPack[pluginId].versions[pluginVersion] = plugin;
        // If plugin version is greater than the current, set as latest version
        if (semver.gt(pluginVersion, pluginPack[pluginId].version)) {
          pluginPack[pluginId].version = pluginVersion;
        }
      });
    }
    return pluginPack;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getPlugins(url: string) {
  try {
    const pluginsValid: Plugin[] = [];
    const pluginsJson = await getJSON(url);
    pluginsJson.plugins.forEach((plugin: Plugin) => {
      const error = validatePluginSchema(plugin);
      if (error === false) {
        pluginsValid.push(plugin);
      } else {
        console.log(error, plugin);
      }
    });
    return { plugins: pluginsValid };
  } catch (error) {
    return { plugins: [] };
  }
}

getResults(SEARCH_URL, DIST_PATH, REGISTRY_FILE);
