const api = require('./api');
const file = require('./file');

const REGISTRY_PATH = 'registry.json';
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true';

async function getPlugin(result, release) {
  try {
    const plugin = await api.getJSON(`https://github.com/${result.full_name}/releases/download/${release.tag_name}/plugin.json`);
    const error = validatePlugin(plugin);
    if (error === false) {
      console.log(result.full_name, release.tag_name, plugin);
    } else {
      console.error(error);
    }
  } catch(error) {
    console.error(`${result.full_name} is missing plugin.json`)
  }
}

async function getReleases(result) {
  try {
    const releases = await api.getJSON(result.releases_url.replace('{/id}', ''));
    await releases.forEach(async (release) => {
      await getPlugin(result, release);
    });
  } catch(error) {
    console.error(`${result.full_name} is missing GitHub releases`)
  }
}

async function getResults(url, path) {
  try {
    const results = await api.getJSON(url);
    await results.items.forEach(async (result) => {
      await getReleases(result);
    });
    file.createFileJson(path, results);
  } catch(error) {
    console.error(`GitHub API error`)
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

getResults(SEARCH_URL, REGISTRY_PATH);
