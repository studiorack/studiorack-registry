import * as semver from 'semver';
import slugify from 'slugify';
import {
  getJSON,
  PluginInterface,
  PluginLocal,
  PluginPack,
  validatePluginSchema
} from '@studiorack/core';

const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true';

async function getGithubPack(): Promise<PluginPack> {
  const pluginPack: PluginPack = {};
  const results = await getJSON(SEARCH_URL);
  for (const result of results.items) {
    await getGithubReleases(pluginPack, result);
  }
  return pluginPack;
}

async function getGithubReleases(pluginPack: PluginPack, result: any): Promise<PluginPack> {
  try {
    // Get releases for a GitHub repo
    const releases = await getJSON(result.releases_url.replace('{/id}', ''));
    for (const release of releases) {
      // For each release get plugins.json
      const pluginsJsonList = await getGithubPlugins(
        `https://github.com/${result.full_name}/releases/download/${release.tag_name}/plugins.json`
      );
      pluginsJsonList.plugins.forEach((plugin: PluginInterface) => {
        // For each plugin sanitize the id and add to registry
        const pluginId = slugify(`${result.full_name}/${plugin.id}`, {
          lower: true,
          remove: /[^\w\s$*_+~.()'"!\-:@\/]+/g,
        });
        const pluginVersion = semver.coerce(plugin.version)?.version || '0.0.0';
        console.log('plugin', pluginId, pluginVersion);
        if (!pluginPack[pluginId]) {
          pluginPack[pluginId] = {
            id: pluginId,
            version: pluginVersion,
            versions: {},
          };
        }
        // Release is different from version and can vary per version
        plugin.release = release.tag_name;
        pluginPack[pluginId].versions[pluginVersion] = plugin;
        // If plugin version is greater than the current, set as latest version
        if (semver.gt(pluginVersion, pluginPack[pluginId].version)) {
          pluginPack[pluginId].version = pluginVersion;
        }
      });
    }
  } catch (error) {
  }
  return pluginPack;
}

async function getGithubPlugins(url: string) {
  const pluginsValid: PluginInterface[] = [];
  const pluginsJson = await getJSON(url);
  pluginsJson.plugins.forEach((plugin: PluginInterface) => {
    const error = validatePluginSchema(plugin as PluginLocal);
    if (error === false) {
      pluginsValid.push(plugin);
    } else {
      console.log(error, plugin);
    }
  });
  return { plugins: pluginsValid };
}

export {
  getGithubPack
}
