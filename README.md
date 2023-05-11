# Obsidian Pandoc References Plugin

## Installation

- Install [NodeJS](https://nodejs.org/en)
- Clone this repo `git clone git@github.com:hannahwoodward/obsidian-pandoc-references.git`
- Navigate into repo `cd obsidian-pandoc-references`
- Install node packages with `npm i`
- Start the compilation process `npm run production` which will compile the source code to create a `main.js` file in repo root directory
- In a new terminal window, navigate to your Obsidian vault `cd path/to/dir` and then into the hidden obsidian plugins directory `cd .obsidian/plugins`
- Create a new directory for the plugin `mkdir obsidian-pandoc-references`
- Open the new plugin directory in Finder `open obsidian-pandoc-references`
- Copy over the following files from the repo into the plugin directory:
  - `main.js`
  - `manifest.json`
  - `styles.css`
- Open Obsidian and enable the plugin in `Obsidian > Preferences`


## Development

- Follow the instructions in the Installation section, instead running `npm run dev` to compile `main.js` and start the watcher, so any changes made to your source code (in `./src`) will recompile a new `main.js` file
- In Obsidian, enable developer tools via `View > Toggle Developer Tools`
- Whenever you make changes, copy over the changed files (`main.js`, `styles.css`, and/or `manifest.json`) from the repo to the plugin directory. Then, reload Obsidian, which you can do in the menu bar via `View > Force Reload`


## Useful links

- [Obsidian plugins](https://obsidian.md/plugins)
- [Obsidian plugin development](https://docs.obsidian.md/Plugins)
- [Obsidian API definitions](https://github.com/obsidianmd/obsidian-api/)
- [Unofficial plugins docs](https://marcus.se.net/obsidian-plugin-docs/)
