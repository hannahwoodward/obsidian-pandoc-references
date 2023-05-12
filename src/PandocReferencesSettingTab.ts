import { App, PluginSettingTab, Setting } from 'obsidian';
import { PandocReferences } from 'src/main.ts';

export class PandocReferencesSettingTab extends PluginSettingTab {
    plugin: PandocReferences;

    constructor(app: App, plugin: PandocReferences) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Pandoc References Settings' });

        new Setting(containerEl)
            .setName('Pandoc path')
            .setDesc('If Pandoc path cannot be found, try using outputs from `which pandoc` (via terminal in macOS/Linux) or `Get-Command pandoc` (via powershell in Windows).')
            .setClass('pandoc-refs-setting')
            .addText(
                text => text
                    .setPlaceholder('pandoc')
                    .setValue(this.plugin.settings.pandocPath)
                    .onChange(async (value) => {
                        this.plugin.settings.pandocPath = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Pandoc reference list arguments')
            .setDesc('Set arguments for generating reference list and rendering inline citations in reader view. Add {{file}} where the active filepath should be inserted.')
            .setClass('pandoc-refs-setting')
            .addTextArea(
                text => text
                    .setPlaceholder('-f markdown -t html --bibliography /path/to/Astro.bib --bibliography /path/to/__from_DOI.bib --lua-filter /path/to/doi2cite.lua --citeproc {{file}}')
                    .setValue(this.plugin.settings.pandocArgs)
                    .onChange(async (value) => {
                        this.plugin.settings.pandocArgs = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
