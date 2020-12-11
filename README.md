# studiorack-registry
![Release](https://github.com/studiorack/studiorack-registry/workflows/Release/badge.svg)

Audio plugin registry with searchable plugin list, metadata and download urls using:

* NodeJS 12.x
* TypeScript 4.x


## Installation

Install dependencies using:

    npm install


## Usage

Create the registry using:

    npm run build


## How it works

The StudioRack Registry uses GitHub as a source of truth for plugins. We search the GitHub API for topic `studiosrack-plugin`:

    https://api.github.com/search/repositories?q=topic:studiorack-plugin+fork:true

Then for each GitHub repository, the Registry loops through their releases/versions and downloads plugins.json:

    https://github.com/REPOSITORY_NAME/releases/download/RELEASE_NAME/plugins.json

This should be in the format:

    {
      "plugins": [
        {
          "author": "Steinberg Media Technologies",
          "homepage": "http://www.steinberg.net",
          "name": "Hello WorldController",
          "description": "Component Controller Class",
          "tags": [
            "Fx"
          ],
          "version": "1.0.0.1",
          "date": "2020-12-07T04:28:43.733Z",
          "size": 1444424,
          "id": "helloworld",
          "file": "helloworld.vst3",
          "image": "helloworld.png",
          "audio": "helloworld.wav"
        }
      ]
    }

Registry then performs some validation on the plugins.json before compiling into a registry json format:

    {
      "objects": {
        "username/studiorack-plugin-steinberg/helloworld": {
          "id": "username/studiorack-plugin-steinberg/helloworld",
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
        "username2/studiorack-plugin-steinberg": { ... }
      },
      "time": "2020-08-29T22:22:41.119Z",
      "total": 2
    }

This registry json is updated once a day, and used for the StudioRack website, app and command line tool:

    https://studiorack.github.io/studiorack-registry/


## Contact

For more information please contact kmturley
