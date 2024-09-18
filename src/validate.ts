import {
  apiBuffer,
  dirCreate,
  dirExists,
  fileCreate,
  fileExists,
  fileReadString,
  pathGetExt,
  PluginFile,
  PluginFiles,
} from '@studiorack/core';
import { validatePluginYaml } from './sources/local.js';
import chalk from 'chalk';
import path from 'path';

const DIR_DOWNLOADS = 'downloads';
const DIR_LOG = path.join(DIR_DOWNLOADS, 'log.txt');

const filepath: string = process.argv[2];
const ext: string = pathGetExt(filepath);

if (ext === 'yaml') {
  // Ensure directory and log file exist
  if (!dirExists(DIR_DOWNLOADS)) dirCreate(DIR_DOWNLOADS);
  if (!fileExists(DIR_LOG)) fileCreate(DIR_LOG, '');

  // Validate the schema and fields
  const { plugin } = validatePluginYaml(filepath);
  let log: string = fileReadString(DIR_LOG);

  // Download files and compare
  for (const type in plugin.files) {
    const pluginFile: PluginFile = plugin.files[type as keyof PluginFiles];
    const pluginFileName: string = path.basename(pluginFile.url);
    const pluginFileBuffer: Buffer | void = await apiBuffer(pluginFile.url);
    const pluginFileLocalPath: string = path.join(DIR_DOWNLOADS, pluginFileName);
    if (pluginFile.size === pluginFileBuffer.length) {
      console.log(chalk.green(`✓ ${pluginFile.url}`));
    } else {
      console.log(chalk.red(`X ${pluginFile.url} size needs updating to ${pluginFileBuffer.length}`));
    }
    // Add file to log for virus scanning
    fileCreate(pluginFileLocalPath, pluginFileBuffer);
    log += pluginFileLocalPath + '\n';
  }
  fileCreate(DIR_LOG, log);
}
