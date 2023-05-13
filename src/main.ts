import { execa } from 'execa';
import { EventEmitter } from 'node:events';
import { Plugin } from 'obsidian';
import { PandocReferencesSettingTab } from 'src/PandocReferencesSettingTab';
import { PandocReferencesView, VIEW_TYPE_REFERENCE_LIST } from 'src/PandocReferencesView';

interface PandocReferencesSettings {
    pandocArgs: string,
    pandocPath: string
}

const DEFAULT_SETTINGS: PandocReferencesSettings = {
    pandocArgs: null,
    pandocPath: null
}

export default class PandocReferences extends Plugin {
    activeFileLastUpdated: null;
    activeFileName: null;
    activeFileRefsHash: null;
    citationCount: 0;
    emitter: null;
    sidebarReady: false;
    statusBar: null;
    settings: PandocReferencesSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new PandocReferencesSettingTab(this.app, this));

        this.registerView(VIEW_TYPE_REFERENCE_LIST, (leaf: WorkspaceLeaf) => {
            return new PandocReferencesView(leaf, this);
        });

        this.emitter = new EventEmitter();
        this.statusBar = this.addStatusBarItem();
        this.sidebarReady = true;

        if (!this.settings.pandocArgs) {
            return;
        }

        this.emitter.on('previewSectionReady', async () => {
            const renderer = this.app.workspace.activeLeaf.view.previewMode.renderer;
            for (let i = 0; i < renderer.sections.length; i++) {
                if (!renderer.sections[i].rendered) {
                    return;
                }
            }

            await this.renderPreview(renderer);
        });

        this.registerMarkdownPostProcessor((element, context) => {
            this.emitter.emit('previewSectionReady');
        }, 100);
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_REFERENCE_LIST);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_REFERENCE_LIST);

        // Add to right sidebar
        await this.app.workspace.getRightLeaf(false).setViewState({
            type: VIEW_TYPE_REFERENCE_LIST
        });

        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(VIEW_TYPE_REFERENCE_LIST)[0]
        );
    }

    updateCitationCount(count) {
        this.statusBar.setText(`${count} citations`);
    }

    async runPandocCmd(args, filepath = '', opts = {}) {
        const pandocPath = this.settings.pandocPath || 'pandoc';

        // Convert pandocArgs from string into array for execa
        const pandocArgs = args
            .split(' ')
            .map(item => item.replace('{{file}}', filepath))
            .filter(item => item !== '');

        const { stdout } = await execa(pandocPath, pandocArgs, opts);

        return stdout;
    }

    async renderPreview(renderer) {
        try {
            let sectionsHtml = '';
            for (let i = 0; i < renderer.sections.length; i++) {
                if (renderer.sections[i].el.classList.contains('mod-header') || renderer.sections[i].el.classList.contains('mod-footer')) {
                    continue;
                }

                renderer.sections[i].el.setAttribute('data-section-id', i);
                sectionsHtml += renderer.sections[i].el.outerHTML;
            }

            const elHtmlString = await this.runPandocCmd(
                this.settings.pandocArgs,
                '',
                { input: `<div>${sectionsHtml}</div>` }
            );
            const parser = new DOMParser();
            const elHtml = parser.parseFromString(elHtmlString, 'text/html');

            for (let i = 0; i < renderer.sections.length; i++) {
                if (renderer.sections[i].el.classList.contains('mod-header') || renderer.sections[i].el.classList.contains('mod-footer')) {
                    continue;
                }

                const sectionId = renderer.sections[i].el.getAttribute('data-section-id');
                const newSectionHtml = elHtml.querySelector(`[data-section-id="${sectionId}"]`);
                if (newSectionHtml) {
                    renderer.sections[i].el.innerHTML = newSectionHtml.innerHTML;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
}
