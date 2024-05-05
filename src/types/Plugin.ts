export interface PluginRegistry {
  name: string;
  url: string;
  version: string;
  objects: PluginPack;
}

export interface PluginPack {
  [property: string]: PluginEntry;
}

export interface PluginEntry {
  version: string;
  versions: { [version: string]: PluginInterface };
}

interface PluginFile {
  url: string;
  size: number;
}

interface PluginFiles {
  audio: PluginFile;
  image: PluginFile;
  linux: PluginFile;
  mac: PluginFile;
  win: PluginFile;
}

export interface PluginInterface {
  author: string;
  date: string;
  description: string;
  homepage: string;
  name: string;
  files: PluginFiles;
  license: string;
  tags: string[];
}

export interface PluginRelease extends PluginInterface {
  id: string;
  version: string;
}
