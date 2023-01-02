import * as semver from 'semver';
import slugify from 'slugify';
import { PluginInterface, PluginLocal, PluginPack, validatePluginSchema } from '@studiorack/core';
import fetch from 'node-fetch';

// Plugins need to have a topic `studiorack-plugin` to appear in the results
// https://github.com/topics/studiorack-plugin
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true&per_page=100';

async function getJSONAuthed(url: string): Promise<any> {
  console.log('⤓', url);
  const headers: any = {};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  console.log('headers', headers);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    console.log('⤓', data);
    return data;
  } catch(error) {
    console.log('⤓', error);
    return false;
  }
}

async function getGithubPack(): Promise<PluginPack> {
  const pluginPack: PluginPack = {};
  const results = await getJSONAuthed(SEARCH_URL);
  for (const result of results.items) {
    await getGithubReleases(pluginPack, result);
  }
  return pluginPack;
}

async function getGithubReleases(pluginPack: PluginPack, result: any): Promise<PluginPack> {
  try {
    // Get releases for a GitHub repo
    const releases = await getJSONAuthed(result.releases_url.replace('{/id}', ''));
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
        console.log('github', pluginId, pluginVersion);
        if (!pluginPack[pluginId]) {
          pluginPack[pluginId] = {
            id: pluginId,
            license: result.license?.key || 'other',
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
    // do nothing
    console.log('error', error);
  }
  return pluginPack;
}

async function getGithubPlugins(url: string) {
  const pluginsValid: PluginInterface[] = [];
  const pluginsJson = await getJSONAuthed(url);
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

export { getGithubPack };
