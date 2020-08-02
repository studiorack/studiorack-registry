const fs = require('fs');
const request = require('sync-request');

const REGISTRY_PATH = 'registry.json';
const SEARCH_URL = 'https://api.github.com/search/repositories?q=topic:studiorack-plugin';
const headers = {
  headers: {
    'user-agent': 'example-user-agent',
  },
};

async function get(url) {
  console.log('api.get', url);
  return await request('GET', url, headers).getBody('utf8');
};

async function getJSON(url) {
  return JSON.parse(await get(url));
};

function createFile(path, data) {
  return fs.writeFileSync(path, data);
}

function createFileJson(path, data) {
  return createFile(path, JSON.stringify(data, null, 2));
}

async function init() {
  const data = await getJSON(SEARCH_URL);
  createFileJson(REGISTRY_PATH, data);
}

init();
