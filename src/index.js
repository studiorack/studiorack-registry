const api = require('./api');
const file = require('./file');

const DIST_PATH = './out';
const REGISTRY_FILE = 'index.json';
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true';

async function getPlugin(url) {
  try {
    const plugin = await api.getJSON(url);
    const error = validatePlugin(plugin);
    if (error === false) {
      return plugin;
    }
    return false;
  } catch(error) {
    return false;
  }
}

async function getPlugins(url) {
  try {
    const valid = true;
    const pluginsJson = await api.getJSON(url);
    pluginsJson.plugins.forEach(plugin => {
      const error = validatePlugin(plugin);
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

async function getReleases(result) {
  // this is temporary code to prototype multiple repo types
  const pluginPack = {};
  try {
    const releases = await api.getJSON(result.releases_url.replace('{/id}', ''));
    for (const release of releases) {
      const version = release.tag_name.replace('v', '');
      const pluginJson = await getPlugin(`https://github.com/${result.full_name}/releases/download/${release.tag_name}/plugin.json`);
      // single plugin
      if (pluginJson) {
        const plugin = {
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
        pluginsJson.plugins.forEach(pluginJson => {
          const plugin = {
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
          pluginPack[plugin.id] = plugin;
        })
      }
    };
    return pluginPack;
  } catch(error) {
    return error;
  }
}

async function getResults(url, dir, filename) {
  try {
    const registry = {
      objects: {},
      time: new Date(),
      total: 0
    };
    const results = await api.getJSON(url);
    for (const result of results.items) {
      const pluginPack = await getReleases(result);
      registry.objects = Object.assign(pluginPack);
      registry.total += 1;
    };
    console.log(registry);
    file.createDirectory(dir);
    file.createFileJson(`${dir}/${filename}`, registry);
  } catch(error) {
    console.error(error);
  }
}

function validatePlugin(plugin) {
  let error = false;
  if (!plugin.author) { error = `author attribute missing`; }
  if (typeof plugin.author !== 'string') { error = `author incorrect type ${typeof plugin.author}`; }
  if (!plugin.homepage) { error = `homepage attribute missing`; }
  if (typeof plugin.homepage !== 'string') { error = `homepage incorrect type ${typeof plugin.homepage}`; }
  if (!plugin.name) { error = `name attribute missing`; }
  if (typeof plugin.name !== 'string') { error = `name incorrect type ${typeof plugin.name}`; }
  if (!plugin.description) { error = `description attribute missing`; }
  if (typeof plugin.description !== 'string') { error = `description incorrect type ${typeof plugin.description}`; }
  if (!plugin.tags) { error = `tags attribute missing`; }
  if (!Array.isArray(plugin.tags)) { error = `tags incorrect type ${typeof plugin.tags}`; }
  if (!plugin.version) { error = `version attribute missing`; }
  if (typeof plugin.version !== 'string') { error = `version incorrect type ${typeof plugin.version}`; }
  if (!plugin.size) { error = `size attribute missing`; }
  if (typeof plugin.size !== 'number') { error = `size incorrect type ${typeof plugin.size}`; }
  return error;
}

getResults(SEARCH_URL, DIST_PATH, REGISTRY_FILE);
