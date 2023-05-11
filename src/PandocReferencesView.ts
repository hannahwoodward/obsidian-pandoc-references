import { ItemView, WorkspaceLeaf } from 'obsidian';
import { PandocReferences } from 'src/main.ts';

export const VIEW_TYPE_REFERENCE_LIST = 'reference-list-view';

export class PandocReferencesView extends ItemView {
    plugin: PandocReferences;

    constructor(leaf: WorkspaceLeaf, plugin: PandocReferences) {
        super(leaf);
        this.plugin = plugin;

        this.registerEvent(
            this.app.vault.on('modify', () => {
                this.plugin.sidebarReady && this.renderSidebar();
            })
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (!leaf || !this.plugin.sidebarReady) {
                    return;
                }

                this.app.workspace.iterateRootLeaves((rootLeaf) => {
                    rootLeaf === leaf && this.renderSidebar();
                });
            })
        );
    }

    getDisplayText() {
        return 'Reference list view';
    }

    getIcon() {
        // Source: https://lucide.dev
        return 'quote-glyph';
    }

    getViewType() {
        return VIEW_TYPE_REFERENCE_LIST;
    }

    async onOpen() {
        this.renderSidebar();
    }

    async onClose() {
        // Nothing to clean up.
    }

    async renderSidebar() {
        this.plugin.sidebarReady = false;

        const container = this.containerEl.children[1];
        this.plugin.updateCitationCount(0);
        container.empty();
        container.createEl(
            'h3',
            { text: 'References', cls: 'pandoc-refs-heading' }
        );

        const refObj = await this.generateReferences();
        if (refObj.type === 'message') {
            container.createEl('p', { text: refObj.content });

            this.plugin.sidebarReady = true;
            return;
        }

        container.insertAdjacentHTML('beforeend', refObj.content.outerHTML);

        const citationCount = refObj.content.querySelectorAll('.csl-entry').length;
        this.plugin.updateCitationCount(citationCount);
        this.plugin.sidebarReady = true;
    }

    async generateReferences() {
        if (!this.plugin.settings.pandocArgs) {
            return {
                'content': 'Please add arguments for generating the reference list in the Pandoc References plugin settings.',
                'type': 'message'
            };
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            return {
                'content': 'No citations found in the current document.',
                'type': 'message'
            };
        }

        try {
            const filepath = `${activeFile.vault.adapter.basePath}/${activeFile.path}`;
            const docHtmlString = await this.plugin.runPandocCmd(
                this.plugin.settings.pandocArgs,
                filepath
            );
            const parser = new DOMParser();
            const docHtml = parser.parseFromString(docHtmlString, "text/html");
            const refsHtml = docHtml.querySelector('#refs');

            if (!refsHtml) {
                return {
                    'content': 'No citations found in the current document.',
                    'type': 'message'
                };
            }

            return {
                'content': refsHtml,
                'type': 'html'
            };
        } catch (e) {
            console.error(e)
            return {
                'content': 'An error occurred generating reference list.',
                'type': 'message'
            };
        }
    }
}
