import * as semver from 'semver';
import {
  PluginFiles,
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
import chalk from 'chalk';

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
  console.log('-- GitHub plugins --');
  const pluginPack: PluginPack = {};
  const results: GitHubSearch = await githubSearchRepos(GITHUB_API);
  for (const repo of results.search.nodes) {
    for (const release of repo.releases.nodes) {
      await githubGetRelease(pluginPack, repo, release);
    }
  }
  console.log(`-- ${Object.keys(pluginPack).length} GitHub plugins added --`);
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

async function githubGetRelease(pluginPack: PluginPack, repo: GitHubRepository, release: GitHubRelease) {
  const { pluginDefault, pluginJsonFile } = githubPluginDefault(repo, release);

  // If we detect a plugins.json file, use that data as overrides
  if (pluginJsonFile) {
    const pluginsJsonList = await getJSONSafe(
      `https://github.com/${repo.owner.login}/${repo.name}/releases/download/${release.tagName}/plugins.json`,
    );
    pluginsJsonList.plugins.forEach((pluginJson: PluginVersion) => {
      // For each plugin sanitize the id and add to registry
      const pluginVersion: string = semver.coerce(pluginJson.version)?.version || '0.0.0';
      const plugin: PluginVersion = JSON.parse(JSON.stringify(pluginDefault));

      // Update required fields
      if (pluginJson.id) plugin.id = safeSlug(pluginJson.id);
      plugin.version = pluginVersion;
      plugin.release = release.tagName;
      plugin.license = pluginLicense(repo.licenseInfo?.key || 'other');
      plugin.repo = safeSlug(`${repo.owner.login}/${repo.name}`);

      // Update optional fields
      if (pluginJson.author) plugin.author = pluginJson.author;
      if (pluginJson.homepage) plugin.homepage = pluginJson.homepage;
      if (pluginJson.date) plugin.date = pluginJson.date;
      if (pluginJson.name) plugin.name = pluginJson.name;
      if (pluginJson.description) plugin.description = pluginJson.description;
      if (pluginJson.tags) plugin.tags = pluginJson.tags;
      updateNestedFields(pluginJson, plugin, 'audio');
      updateNestedFields(pluginJson, plugin, 'image');
      updateNestedFields(pluginJson, plugin, 'linux');
      updateNestedFields(pluginJson, plugin, 'mac');
      updateNestedFields(pluginJson, plugin, 'win');

      // Add plugin version to pack
      githubAddPlugin(pluginPack, plugin);
    });
  } else {
    githubAddPlugin(pluginPack, pluginDefault);
  }
  return pluginPack;
}

function githubPluginDefault(repo: GitHubRepository, release: GitHubRelease) {
  // For each plugin sanitize the id and add to registry
  const pluginId: string = safeSlug(`${repo.owner.login}/${repo.name}`);
  const pluginVersion: string = semver.coerce(release.tagName)?.version || '0.0.0';
  const pluginDefault: PluginVersion = {
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
  let pluginJsonFile: boolean = false;
  for (const asset of release.releaseAssets.nodes) {
    const name: string = asset.name.toLowerCase();
    const file: any = {
      name,
      size: asset.size,
    };
    if (name === 'plugins.json') pluginJsonFile = true;
    if (name.endsWith('json')) continue;
    else if (name.includes('-compact')) continue;
    else if (name.endsWith('jpg') || name.endsWith('png')) pluginDefault.files.image = file;
    else if (name.endsWith('flac') || name.endsWith('wav')) pluginDefault.files.audio = file;
    else if (name.includes('linux')) pluginDefault.files.linux = file;
    else if (name.includes('mac')) pluginDefault.files.mac = file;
    else if (name.includes('win')) pluginDefault.files.win = file;
    else if (name.endsWith('zip')) {
      pluginDefault.files.linux = file;
      pluginDefault.files.mac = file;
      pluginDefault.files.win = file;
    }
  }
  return {
    pluginDefault,
    pluginJsonFile,
  };
}

function updateNestedFields(pluginJson: PluginVersion, plugin: PluginVersion, field: keyof PluginFiles) {
  if (pluginJson.files[field] && !plugin.files[field]) {
    plugin.files[field] = pluginJson.files[field];
  } else {
    if (pluginJson.files[field].name) plugin.files[field].name = pluginJson.files[field].name;
    if (pluginJson.files[field].size) plugin.files[field].size = pluginJson.files[field].size;
  }
}

function githubAddPlugin(pluginPack: PluginPack, plugin: PluginVersion) {
  const pluginId: string = safeSlug(`${plugin.repo}/${plugin.id}`);
  const pluginVersion: string = semver.coerce(plugin.version)?.version || '0.0.0';

  // Ensure plugin has valid fields.
  const errors: string | boolean = pluginValidateSchema(plugin as PluginVersionLocal);
  const compatibility: string | boolean = pluginCompatibility(plugin);
  if (errors) {
    console.log(chalk.red(`X ${pluginId} ${plugin.version}`));
    console.log(chalk.yellow(compatibility) ? chalk.red(errors) + chalk.yellow(compatibility) : chalk.red(errors));
  } else {
    console.log(chalk.green(`✓ ${pluginId} ${plugin.version}`));
    if (compatibility) console.log(chalk.yellow(compatibility));
  }

  // Ensure there is a plugin entry
  if (!pluginPack[pluginId]) {
    pluginPack[pluginId] = {
      id: pluginId,
      license: typeof plugin.license === 'string' ? plugin.license : plugin.license.key,
      version: pluginVersion,
      versions: {},
    };
  }

  pluginPack[pluginId].versions[pluginVersion] = plugin;
  // If plugin version is greater than the current, set as latest version
  if (semver.gt(pluginVersion, pluginPack[pluginId].version)) {
    pluginPack[pluginId].version = pluginVersion;
  }
}

async function getJSONSafe(url: string): Promise<any> {
  // console.log('⤓', url);
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    return error;
  }
}

export function pluginCompatibility(plugin: PluginVersion) {
  let error: string = '';
  if (!plugin.homepage.startsWith('https://')) {
    error += '- Homepage should use https url\n';
  }
  if (!plugin.homepage.includes('github.com') && !plugin.homepage.includes('github.io')) {
    error += '- Homepage should point to GitHub\n';
  }
  error += pluginValidateField(plugin.files, 'linux', 'object');
  error += pluginValidateField(plugin.files, 'mac', 'object');
  error += pluginValidateField(plugin.files, 'win', 'object');
  const pluginTags: string[] = plugin.tags.map(tag => tag.toLowerCase());
  if (!pluginTags.includes('instrument') && !pluginTags.includes('effect')) {
    error += '- Tags missing category (instrument, effect)\n';
  }
  if (pluginTags.length < 2) {
    error += '- Tags list not fully populated\n';
  }

  if (!plugin.license) {
    error += '- License should be defined\n';
  } else if (typeof plugin.license === 'string' && plugin.license === 'other') {
    error += '- License should be defined\n';
  } else if (typeof plugin.license !== 'string' && plugin.license.key === 'other') {
    error += '- License should be defined\n';
  }
  return error.length === 0 ? false : error;
}

export { githubGetPack };
