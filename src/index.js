const api = require('./api');
const file = require('./file');

const DIST_PATH = './out';
const REGISTRY_FILE = 'registry.json';
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true';

async function getPlugin(url) {
  try {
    const plugin = await api.getJSON(url);
    const error = validatePlugin(plugin);
    if (error === false) {
      return plugin;
    }
    return error;
  } catch(error) {
    return error;
  }
}

async function getReleases(result) {
  const plugin = {
    id: result.full_name,
    version: '0.0.0',
    versions: {}
  }
  try {
    const releases = await api.getJSON(result.releases_url.replace('{/id}', ''));
    let first = true;
    for (const release of releases) {
      const version = release.tag_name.replace('v', '');
      const json = await getPlugin(`https://github.com/${result.full_name}/releases/download/${release.tag_name}/plugin.json`);
      if (json) {
        if (first === true) {
          plugin.version = version;
          first = false;
        }
        plugin.versions[version] = {
          "author": json.author,
          "homepage": json.homepage,
          "name": json.name,
          "description": json.description,
          "tags": json.tags,
          "version": json.version,
          "date": json.date,
          "size": json.size
        };
      }
    };
    console.log(plugin);
    return plugin;
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
      const plugin = await getReleases(result);
      registry.objects[plugin.id] = plugin;
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
