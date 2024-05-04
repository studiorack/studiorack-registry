export interface PluginRegistry {
  name: string;
  url: string;
  version: string;
  objects: PluginPack[];
}

export interface PluginPack {
  [property: string]: PluginEntry;
}

export interface PluginEntry {
  id: string;
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
  license?: PluginLicense;
  tags: string[];
}

interface PluginLicense {
  key: string;
  name: string;
  url: string;
  same: boolean;
}
