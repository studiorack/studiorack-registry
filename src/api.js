const request = require('sync-request');
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

async function getRaw(url) {
  console.log('api.getRaw', url);
  return await request('GET', url, headers).body;
};

module.exports.get = get;
module.exports.getJSON = getJSON;
module.exports.getRaw = getRaw;
