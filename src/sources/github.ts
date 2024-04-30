import * as semver from 'semver';
import { PluginInterface, PluginLocal, PluginPack, pluginValidateSchema, safeSlug } from '@studiorack/core';
import fetch from 'node-fetch';
import { gql, GraphQLClient, RequestDocument } from 'graphql-request';

// Plugins need to have a topic `studiorack-plugin` to appear in the results
// https://github.com/topics/studiorack-plugin
const GITHUB_API: string = 'https://api.github.com/graphql';
const GITHUB_TOPIC: string = 'studiorack-plugin';
const GITHUB_REPO_PAGINATION: number = 100;
const GITHUB_RELEASES_PAGINATION: number = 100;

interface GitHubRelease {
  tagName: string;
}

interface GitHubRepository {
  nameWithOwner: string;
  licenseInfo: {
    key: string;
  };
  releases: {
    nodes: GitHubRelease[];
  };
}

interface GitHubSearch {
  search: {
    nodes: GitHubRepository[];
  };
}

async function githubGetPack(): Promise<PluginPack> {
  const pluginPack: PluginPack = {};
  const results: GitHubSearch = await githubSearchRepos(GITHUB_API);
  for (const repo of results.search.nodes) {
    for (const release of repo.releases.nodes) {
      await githubGetRelease(pluginPack, repo, release);
    }
  }
  return pluginPack;
}

async function githubSearchRepos(url: string): Promise<GitHubSearch> {
  const headers: any = {};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const graphQLClient = new GraphQLClient(url, { headers });
  const query: RequestDocument = gql`
    {
      search(query: "topic:${GITHUB_TOPIC} fork:true", type: REPOSITORY, first: ${GITHUB_REPO_PAGINATION}) {
        nodes {
          ... on Repository {
            nameWithOwner
            licenseInfo {
              key
            }
            releases(first: ${GITHUB_RELEASES_PAGINATION}) {
              nodes {
                tagName
              }
            }
          }
        }
      }
    }
  `;
  return graphQLClient.request(query);
}

async function githubGetRelease(pluginPack: PluginPack, repo: GitHubRepository, release: GitHubRelease) {
  const pluginsJsonList = await githubGetPlugins(
    `https://github.com/${repo.nameWithOwner}/releases/download/${release.tagName}/plugins.json`
  );
  pluginsJsonList.plugins.forEach((plugin: PluginInterface) => {
    // For each plugin sanitize the id and add to registry
    const pluginId = safeSlug(`${repo.nameWithOwner}/${plugin.id}`);
    const pluginVersion = semver.coerce(plugin.version)?.version || '0.0.0';
    console.log('github', pluginId, pluginVersion);
    if (!pluginPack[pluginId]) {
      pluginPack[pluginId] = {
        id: pluginId,
        license: repo.licenseInfo?.key || 'other',
        version: pluginVersion,
        versions: {},
      };
    }
    // Release is different from version and can vary per version
    plugin.release = release.tagName;
    pluginPack[pluginId].versions[pluginVersion] = plugin;
    // If plugin version is greater than the current, set as latest version
    if (semver.gt(pluginVersion, pluginPack[pluginId].version)) {
      pluginPack[pluginId].version = pluginVersion;
    }
  });
  return pluginPack;
}

async function githubGetPlugins(url: string) {
  const pluginsValid: PluginInterface[] = [];
  const pluginsJson = await getJSONSafe(url);
  pluginsJson.plugins.forEach((plugin: PluginInterface) => {
    const error = pluginValidateSchema(plugin as PluginLocal);
    if (error === false) {
      pluginsValid.push(plugin);
    } else {
      console.log(error, plugin);
    }
  });
  return { plugins: pluginsValid };
}

async function getJSONSafe(url: string): Promise<any> {
  console.log('⤓', url);
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    // console.log(error);
    return { plugins: [] };
  }
}

export { githubGetPack };
