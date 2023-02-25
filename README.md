# studiorack-registry
![Release](https://github.com/studiorack/studiorack-registry/workflows/Release/badge.svg)

Audio plugin registry with searchable plugin list, metadata and download urls using:

* NodeJS 12.x
* TypeScript 4.x


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


## How it works

The StudioRack Registry uses GitHub as a source of truth for plugins. We search the GitHub API for topic `studiosrack-plugin`:

    https://github.com/topics/studiorack-plugin
    https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true

Then for each GitHub repository, the Registry loops through their releases/versions and downloads plugins.json:

    https://github.com/REPOSITORY_NAME/releases/download/RELEASE_NAME/plugins.json

This should be in the format:

    {
      "plugins": [
        {
          "author": "Your Name",
          "homepage": "https://www.yoursite.com",
          "name": "Your Plugin Name",
          "description": "Test Class",
          "tags": [
            "Fx",
            "Delay"
          ],
          "version": "1.1.0",
          "id": "your-plugin",
          "date": "2020-12-09T17:25:12.081Z",
          "files": {
            "audio": {
              "name": "your-plugin.wav",
              "size": 352844
            },
            "image": {
              "name": "your-plugin.png",
              "size": 35091
            },
            "linux": {
              "name": "your-plugin-linux.zip",
              "size": 13089625
            },
            "mac": {
              "name": "your-plugin-mac.zip",
              "size": 13089625
            },
            "win": {
              "name": "your-plugin-win.zip",
              "size": 13089625
            }
          }
        }
      ]
    }

Registry then performs some validation on the plugins.json before compiling into a registry json format:

    {
      "objects": {
        "username/studiorack-template-steinberg/helloworld": {
          "id": "username/studiorack-template-steinberg/helloworld",
          "version": "0.0.1",
          "versions": {
            "0.0.1": {
              "author": "Steinberg Media Technologies",
              "homepage": "http://www.steinberg.net",
              "name": "Hello WorldController",
              "description": "Component Controller Class",
              "tags": [
                "Fx"
              ],
              "version": "1.0.0.1",
              "date": "2020-09-25T22:14:32.178Z",
              "size": 239104
            }
          }
        },
        "username2/studiorack-template-steinberg": { ... }
      },
      "time": "2020-08-29T22:22:41.119Z",
      "total": 2
    }

This registry json is updated once a day, and used for the StudioRack website, app and command line tool:

    https://studiorack.github.io/studiorack-registry/


## Contact

For more information please contact kmturley
