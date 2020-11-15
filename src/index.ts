import { dirCreate, fileJsonCreate, getJSON, Plugin, PluginEntry, PluginPack, validatePluginSchema } from "@studiorack/core";

const DIST_PATH = './out';
const REGISTRY_FILE = 'index.json';
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true';

async function getResults(url: string, dir: string, filename: string) {
  try {
    const registry = {
      objects: {},
      time: new Date(),
      total: 0
    };
    const results = await getJSON(url);
    for (const result of results.items) {
      const pluginPack = await getReleases(result);
      registry.objects = Object.assign(pluginPack);
      registry.total += Object.keys(pluginPack).length;
    };
    console.log(registry);
    dirCreate(dir);
    fileJsonCreate(`${dir}/${filename}`, registry);
  } catch(error) {
    console.error(error);
  }
}

async function getReleases(result: any) {
  // this is temporary code to prototype multiple repo types
  const pluginPack: PluginPack = {};
  try {
    const releases = await getJSON(result.releases_url.replace('{/id}', ''));
    for (const release of releases) {
      const version = release.tag_name.replace('v', '');
      const pluginJson = await getPlugin(`https://github.com/${result.full_name}/releases/download/${release.tag_name}/plugin.json`);
      // single plugin
      if (pluginJson) {
        const plugin: PluginEntry = {
          id: result.full_name,
          version: version,
          versions: {}
        }
        plugin.versions[version] = {
          "author": pluginJson.author,
          "homepage": pluginJson.homepage,
          "name": pluginJson.name,
          "description": pluginJson.description,
          "tags": pluginJson.tags,
          "version": pluginJson.version,
          "date": pluginJson.date,
          "size": pluginJson.size
        };
        pluginPack[plugin.id] = plugin;
      } else {
        // multiple plugins
        const pluginsJson = await getPlugins(`https://github.com/${result.full_name}/releases/download/${release.tag_name}/plugins.json`);
        pluginsJson.plugins.forEach((pluginJson: Plugin) => {
          const plugin: PluginEntry = {
            id: `${result.full_name}/${pluginJson.id}`,
            version: version,
            versions: {}
          }
          plugin.versions[version] = {
            "author": pluginJson.author,
            "homepage": pluginJson.homepage,
            "name": pluginJson.name,
            "description": pluginJson.description,
            "tags": pluginJson.tags,
            "version": pluginJson.version,
            "date": pluginJson.date,
            "size": pluginJson.size
          };
          if (pluginPack[plugin.id]) {
            pluginPack[plugin.id].versions[version] = plugin.versions[version];
          } else {
            pluginPack[plugin.id] = plugin;
          }
        })
      }
    };
    return pluginPack;
  } catch(error) {
    return error;
  }
}

async function getPlugins(url: string) {
  try {
    let valid = true;
    const pluginsJson = await getJSON(url);
    pluginsJson.plugins.forEach((plugin: Plugin) => {
      const error = validatePluginSchema(plugin);
      if (error === true) {
        valid = false;
      }
    });
    if (valid === true) {
      return pluginsJson;
    }
    return false;
  } catch(error) {
    return false;
  }
}

async function getPlugin(url: string) {
  try {
    const plugin = await getJSON(url);
    const error = validatePluginSchema(plugin);
    if (error === false) {
      return plugin;
    }
    return false;
  } catch(error) {
    return false;
  }
}

getResults(SEARCH_URL, DIST_PATH, REGISTRY_FILE);
