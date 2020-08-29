const fs = require('fs');

function createDirectory(path) {
  if (!fs.existsSync(path)) {
    return fs.mkdirSync(path, { recursive: true });
  }
}

function createFile(path, data) {
  return fs.writeFileSync(path, data);
}

function createFileJson(path, data) {
  return createFile(path, JSON.stringify(data, null, 2));
}

function deleteDirectory(path) {
  if (fs.existsSync(path)) {
    return fs.rmdirSync(path, { recursive: true });
  }
}

function directoryEmpty(path) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.DS_Store');
}

function directoryExists(path) {
  return fs.existsSync(path);
}

function directoryRename(oldPath, newPath) {
  return fs.renameSync(oldPath, newPath);
}

function getPlatformPrefix() {
  switch (process.platform) { 
    case 'darwin' : return 'mac';
    case 'win32' : return 'win';
    case 'win64' : return 'win';
    default : return 'linux';
  }
}

function getDate(path) {
  return fs.statSync(path).mtime;
}

function loadFile(path) {
  return fs.readFileSync(path);
}

function loadFileJson(path) {
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path));
  } else {
    return false;
  }
}

module.exports.createDirectory = createDirectory;
module.exports.createFile = createFile;
module.exports.createFileJson = createFileJson;
module.exports.deleteDirectory = deleteDirectory;
module.exports.directoryEmpty = directoryEmpty;
module.exports.directoryExists = directoryExists;
module.exports.directoryRename = directoryRename;
module.exports.getPlatformPrefix = getPlatformPrefix;
module.exports.getDate = getDate;
module.exports.loadFile = loadFile;
module.exports.loadFileJson = loadFileJson;
