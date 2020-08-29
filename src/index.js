const api = require('./api');
const file = require('./file');

const REGISTRY_PATH = 'registry.json';
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true';

async function init() {
  const results = await api.getJSON(SEARCH_URL);
  await results.items.forEach(async (result) => {
    const releases = await api.getJSON(result.releases_url.replace('{/id}', ''));
    releases.forEach((release) => {
      console.log(result.full_name, release.tag_name);
    });
  });
  file.createFileJson(REGISTRY_PATH, results);
}

init();
