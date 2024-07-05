import * as semver from 'semver';
import {
  PluginEntry,
  PluginFile,
  PluginPack,
  PluginVersion,
  PluginVersionLocal,
  pluginLicense,
  pluginValidateField,
  pluginValidateSchema,
  safeSlug,
} from '@studiorack/core';
import fetch from 'node-fetch';
import { gql, GraphQLClient, RequestDocument } from 'graphql-request';

// Plugins need to have a topic `studiorack-plugin` to appear in the results
// https://github.com/topics/studiorack-plugin
const GITHUB_API: string = 'https://api.github.com/graphql';
const GITHUB_TOPIC: string = 'studiorack-plugin';
const GITHUB_REPO_PAGINATION: number = 100;
const GITHUB_RELEASES_PAGINATION: number = 20;
const GITHUB_TOPIC_PAGINATION: number = 20;
const GITHUB_ASSET_PAGINATION: number = 20;

export interface GitHubLicense {
  key: string;
  name: string;
  url: string;
  same: boolean;
}

export interface GitHubOwner {
  login: string;
}

interface GitHubRelease {
  tagName: string;
  updatedAt: string;
  releaseAssets: {
    nodes: GitHubReleaseAsset[];
  };
}

interface GitHubReleaseAsset {
  downloadUrl: string;
  name: string;
  size: number;
}

interface GitHubRepository {
  owner: GitHubOwner;
  homepageUrl: string;
  name: string;
  description: string;
  url: string;
  repositoryTopics: {
    nodes: GitHubTopic[];
  };
  licenseInfo: GitHubLicense;
  releases: {
    nodes: GitHubRelease[];
  };
}

interface GitHubTopic {
  topic: {
    name: string;
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
      githubGetRelease(pluginPack, repo, release);
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
            owner {
              login
            }
            homepageUrl
            name
            description
            url
            repositoryTopics(first: ${GITHUB_TOPIC_PAGINATION}) {
              nodes {
                topic {
                  name
                }
              }
            }
            releases(first: ${GITHUB_RELEASES_PAGINATION}) {
              nodes {
                tagName
                updatedAt
                releaseAssets(first: ${GITHUB_ASSET_PAGINATION}) {
                  nodes {
                    downloadUrl
                    name
                    size
                  }
                }
              }
            }
            licenseInfo {
              key
            }
          }
        }
      }
    }
  `;
  return graphQLClient.request(query);
}

function githubGetRelease(pluginPack: PluginPack, repo: GitHubRepository, release: GitHubRelease) {
  // For each plugin sanitize the id and add to registry
  const pluginId: string = safeSlug(`${repo.owner.login}/${repo.name}`);
  const pluginVersion: string = semver.coerce(release.tagName)?.version || '0.0.0';
  const plugin: PluginVersion = {
    author: repo.owner.login,
    homepage: repo.homepageUrl || repo.url,
    name: repo.name,
    description: repo.description,
    tags: repo.repositoryTopics.nodes
      .filter(topicRepo => topicRepo.topic.name !== 'studiorack-plugin')
      .map(topicRepo => topicRepo.topic.name),
    version: pluginVersion,
    id: safeSlug(repo.name),
    date: release.updatedAt,
    files: {} as any,
    release: release.tagName,
    license: pluginLicense(repo.licenseInfo?.key || 'other'),
    repo: pluginId,
  };

  // For each asset in the release, add to files
  for (const asset of release.releaseAssets.nodes) {
    const name: string = asset.name.toLowerCase();
    const file: any = {
      name,
      size: asset.size,
    };
    if (name.endsWith('json')) continue;
    else if (name.includes('-compact')) continue;
    else if (name.endsWith('jpg') || name.endsWith('png')) plugin.files.image = file;
    else if (name.endsWith('flac') || name.endsWith('wav')) plugin.files.audio = file;
    else if (name.includes('linux')) plugin.files.linux = file;
    else if (name.includes('mac')) plugin.files.mac = file;
    else if (name.includes('win')) plugin.files.win = file;
    else if (name.includes('zip')) {
      plugin.files.linux = file;
      plugin.files.mac = file;
      plugin.files.win = file;
    }
  }

  // Ensure plugin has valid fields.
  const errors: string | boolean = pluginValidateSchema(plugin as PluginVersionLocal);
  const compatibility: string | boolean = pluginCompatibility(plugin);
  if (errors) {
    console.log('⚠', pluginId, release.tagName);
    console.log(compatibility ? errors + compatibility : errors);
  } else {
    console.log('+', pluginId, release.tagName);
    if (compatibility) console.log(compatibility);
  }

  if (!pluginPack[pluginId]) {
    pluginPack[pluginId] = {
      id: pluginId,
      license: repo.licenseInfo?.key || 'other',
      version: pluginVersion,
      versions: {},
    };
  }

  pluginPack[pluginId].versions[pluginVersion] = plugin;
  // If plugin version is greater than the current, set as latest version
  if (semver.gt(pluginVersion, pluginPack[pluginId].version)) {
    pluginPack[pluginId].version = pluginVersion;
  }
  return pluginPack;
}

function pluginCompatibility(plugin: PluginVersion) {
  let error: string = '';
  error += pluginValidateField(plugin.files, 'linux', 'object');
  error += pluginValidateField(plugin.files, 'mac', 'object');
  error += pluginValidateField(plugin.files, 'win', 'object');
  if (!plugin.tags.includes('instrument') || !plugin.tags.includes('effect')) {
    error += '- Tags missing category (instrument, effect)\n';
  }
  return error.length === 0 ? false : error;
}

export { githubGetPack };
