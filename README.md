# studiorack-registry

![Release](https://github.com/studiorack/studiorack-registry/workflows/Release/badge.svg)

Audio plugin registry with searchable plugin list, metadata and download urls.

## How it works

The StudioRack Registry accepts multiple sources for plugin data:

### 1. Yaml files

Create a fork of the repo `studiorack-registry`. Add new folders for your organization and plugin using [kebab-case](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case):

    ./src/plugins/org-name/plugin-name

Add a jpeg screenshot of the plugin, and flac audio file previewing the plugin:

    ./src/plugins/org-name/plugin-name/plugin-name.flac
    ./src/plugins/org-name/plugin-name/plugin-name.jpg

`.jpg` and `.flac` compressed formats were chosen to optimize loading times on the [StudioRack website](https://studiorack.github.io/studiorack-site/).

Create yaml files for each version of the plugin using [Semantic Versioning](https://semver.org).

    ./src/plugins/org-name/plugin-name/1.0.0.yaml
    ./src/plugins/org-name/plugin-name/2.0.0.yaml

Semantic versioning allows the StudioRack installer to install the latest non-breaking version of a plugin.

Use the below template yaml file as a starting point. StudioRack Registry validates each plugin's metadata,
if you miss or enter incorrect information, your plugin will not be included in the registry.

    ---
    name: Sfizz
    author: SFZTools
    homepage: https://github.com/sfztools/sfizz
    description: SFZ parser and synth c++ library, providing AU / LV2 / VST3 plugins and JACK standalone client.
    date: 2024-01-14T00:00:00.000Z
    license: bsd-2-clause
    tags:
      - Instrument
      - Sampler
      - Synth
    files:
      audio:
        url: https://studiorack.github.io/studiorack-registry/plugins/sfztools/sfizz/sfizz.flac
        size: 47910
      image:
        url: https://studiorack.github.io/studiorack-registry/plugins/sfztools/sfizz/sfizz.jpg
        size: 33976
      linux:
        url: https://github.com/sfztools/sfizz/releases/download/1.2.3/sfizz-1.2.3.tar.gz
        size: 19102967
      mac:
        url: https://github.com/sfztools/sfizz/releases/download/1.2.3/sfizz-1.2.3-macos.tar.gz
        size: 1748833
      win:
        url: https://github.com/sfztools/sfizz/releases/download/1.2.3/sfizz-1.2.3-win64.zip
        size: 8286178

For effects, tag your plugin with `Effect` and then any of the following:

- Chorus
- Phaser
- Compression
- Distortion
- Amplifier
- Equalizer
- Pan
- Filter
- Reverb
- Delay

For instruments, tag your plugin with `Instrument` and then any of the following:

- Drums
- Percussion
- Guitar
- String
- Keys
- Piano
- Orchestra
- Sampler
- Synth
- Vocals

For file downloads, StudioRack prefers `.zip` files as these can be extracted automatically and placed into the correct locations without user interaction.
If you use other formats such as `deb, dmg, exe, msi` StudioRack will download and copy the file to the users directory, but not install.

### 2. GitHub repo

StudioRack supports scanning GitHub for compatible plugins. StudioRack registry searches the GitHub API for topic `studiorack-plugin`:

    https://github.com/topics/studiorack-plugin
    https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true

Then for each GitHub repository, the Registry loops through each release/version metadata.
StudioRack will try to automaticallu detect all the ionformation needed for the registry using GitHub metdata as shwon below:

    author = repo.owner.login
    homepage = repo.homepageUrl or repo.url
    name = repo.name
    description = repo.description
    tags = repo.repositoryTopics
    version = release.tagName
    id = repo.name
    date = release.updatedAt
    files = release.releaseAssets
    release = release.tagName,
    license = repo.licenseInfo or 'other'
    repo = repo.owner.login + '/' + repo.name

Files are auto-detected based on their name and extension:

    files.image = file extension is '.jpg' or '.png'
    files.audio = file extension is '.flac' or '.wav'
    files.linux = filename includes 'linux' or extension '.zip'
    files.mac = filename includes 'mac' or extension '.zip'
    files.win = filename includes 'win' or extension '.zip'

If you want to override any of the auto-detected information, or support multiple plugins from a single GitHub repo/release, then you will need to add your own custom `plugins.json` file:

    https://github.com/REPOSITORY_NAME/releases/download/RELEASE_NAME/plugins.json

This should be in the format:

    {
      "plugins": [
        {
          "author": "Rytmenpinne",
          "homepage": "https://rytmenpinne.wordpress.com/sounds-and-such/salamander-drumkit/",
          "name": "Salamander Drumkit",
          "description": "Drumkit recorded in the garage with an acoustic sound/feel.",
          "tags": [
            "Instrument",
            "Drums",
            "sfz"
          ],
          "version": "1.0.0",
          "id": "salamander-drumkit",
          "date": "2012-02-25T07:00:00.000Z",
          "files": {
            "audio": {
              "name": "salamander-drumkit.flac",
              "size": 162704
            },
            "image": {
              "name": "salamander-drumkit.jpg",
              "size": 94023
            },
            "linux": {
              "name": "salamander-drumkit.zip",
              "size": 269599176
            },
            "mac": {
              "name": "salamander-drumkit.zip",
              "size": 269599176
            },
            "win": {
              "name": "salamander-drumkit.zip",
              "size": 269599176
            }
          }
        }
      ]
    }

StudioRack Registry performs validation on auto-detected or manually added `plugins.json` the results are outputted in the most recent job at:

    https://github.com/studiorack/studiorack-registry/actions/workflows/release.yml

For example:

    ⚠ plugin-org/my-plugin 1.0.0
    - audio field missing
    - Tags missing category (instrument, effect)

If you plugin metadata passes validation it will be added to the registry feeds at:

    https://studiorack.github.io/studiorack-registry/v2/
    https://studiorack.github.io/studiorack-registry/v2/instruments.json
    https://studiorack.github.io/studiorack-registry/v2/effects.json
    https://studiorack.github.io/studiorack-registry/v2/sfz.json

This will make the plugin available in the app and the command-line. However the site will have to run it's own build job to display the updated metadata:

    https://github.com/studiorack/studiorack-site/actions/workflows/release.yml

### 3. Owlplug integration (future milestone)

In the future we also plan to include plugins from the [Owlplug](https://owlplug.com) tool:

    https://registry.owlplug.com/registry.json

Owlplug has similar missions and goals to StudioRack and is also a great option for plugin management.

## Developer information

StudioRack Registry was built using:

- NodeJS 20.x
- TypeScript 5.x
- GraphQL
- YAML

## Installation

Install dependencies using:

    npm install

## Usage

Setup a personal access token on [GitHub](https://github.com/settings/tokens) with `public_repo` access. Export in your terminal:

    export GITHUB_TOKEN="your_token"

Run development build:

    npm run dev

Create a production build:

    npm run build

Run the production build:

    npm start

## Contact

For more information please contact kmturley
