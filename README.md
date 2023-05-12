# Obsidian Pandoc References Plugin

- A plugin for [Obsidian](https://obsidian.md) which uses Pandoc to generate a reference list in the sidebar from the current active file, and to render the Pandoc-style inline citations in reader/preview mode.
- Can understand citekeys (e.g. `[@Kasting_1993]`), as well as doi (e.g. `[@doi:10.1006/icar.1993.1010]`) by using the [doi2cite filter](https://github.com/hannahwoodward/pandoc-doi2cite/blob/main/doi2cite.lua).
- Recommended to be installed alongside the [Citations plugin](https://github.com/hans/obsidian-citation-plugin), which allows for Pandoc-style inline citations to be inserted into markdown, and the [Pandoc plugin](https://github.com/OliverBalfour/obsidian-pandoc), which adds support for exporting files such as pdf, docx, and LaTeX through Pandoc.

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
- Install LaTeX & pandoc, e.g. via brew:

```
brew install --cask basictex
brew install pandoc
```

- Open Obsidian and enable the plugin in `Obsidian > Preferences`


### Plugin settings

- Export bibliography from your reference manager
  - Note that the same bibliography can be used as in the [Citations plugin](https://github.com/hans/obsidian-citation-plugin)
- Update plugin settings in `Obsidian > Preferences > Community plugins > Pandoc References` 
- Basic usage for Pandoc reference list arguments (replacing the `/path/to` with the full paths to the respective files):

```
-f markdown -t html --bibliography /path/to/bibliography.bib --citeproc {{file}}
```

- Note that `{{file}}` will be automatically be replaced by the plugin with the current active file
- The Pandoc reader view arguments will likely be the same, but without the `{{file}}` suffix

#### Example with doi citekeys (e.g. `[@doi:10.1006/icar.1993.1010]`)

- [Download the modified doi2cite filter](https://github.com/hannahwoodward/pandoc-doi2cite/blob/main/doi2cite.lua)
- Update settings (the `__from_DOI.bib` file does not need to exist, but will be created and updated by the filter to internally track citations)
- Note that `--citeproc {{file}}` should appear at the end of the script

```
-f markdown -t html --bibliography /path/to/bibliography.bib --bibliography /path/to/__from_DOI.bib --lua-filter /path/to/pandoc-doi2cite/doi2cite.lua --citeproc {{file}}
```

- If using the [Citations plugin](https://github.com/hans/obsidian-citation-plugin), you may want to update the following settings:

```
Markdown citation templates:
Primary: [@doi:{{DOI}}]
Secondary: @doi:{{DOI}}
```

#### Example with custom citation style language (CSL):

- Browse and download a style from https://github.com/citation-style-language/styles
- Example with `apa.csl`:

```
-f markdown -t html --bibliography /path/to/bibliography.bib --csl /path/to/apa.csl --citeproc {{file}}
```


## Development

- Follow the instructions in the Installation section, instead running `npm run dev` to compile `main.js` and start the watcher, so any changes made to your source code (in `./src`) will recompile a new `main.js` file
- In Obsidian, enable developer tools via `View > Toggle Developer Tools`
- Whenever you make changes, copy over the changed files (`main.js`, `styles.css`, and/or `manifest.json`) from the repo to the plugin directory. Then, reload Obsidian, which you can do in the menu bar via `View > Force Reload`


## Useful links

- [Obsidian plugins](https://obsidian.md/plugins)
- [Obsidian plugin development](https://docs.obsidian.md/Plugins)
- [Obsidian API definitions](https://github.com/obsidianmd/obsidian-api/)
- [Unofficial plugins docs](https://marcus.se.net/obsidian-plugin-docs/)
