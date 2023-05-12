import { ItemView, WorkspaceLeaf } from 'obsidian';
import { PandocReferences } from 'src/main.ts';
import md5 from 'md5';

export const VIEW_TYPE_REFERENCE_LIST = 'reference-list-view';

export class PandocReferencesView extends ItemView {
    plugin: PandocReferences;

    constructor(leaf: WorkspaceLeaf, plugin: PandocReferences) {
        super(leaf);
        this.plugin = plugin;

        this.registerEvent(
            this.app.vault.on('modify', () => {
                this.plugin.sidebarReady && this.renderSidebar(false);
            })
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (!leaf || !this.plugin.sidebarReady) {
                    return;
                }

                this.app.workspace.iterateRootLeaves((rootLeaf) => {
                    rootLeaf === leaf && this.renderSidebar(false);
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
        this.renderSidebar(true);
    }

    async onClose() {
        // Nothing to clean up.
    }

    async renderSidebar(initial = false) {
        this.plugin.sidebarReady = false;

        const container = this.containerEl.children[1];
        if (initial) {
            this.plugin.updateCitationCount(0);

            container.createEl(
                'h3',
                { text: 'References', cls: 'pandoc-refs-heading' }
            );
            container.createEl(
                'div',
                { cls: 'pandoc-refs-list' }
            );
        }

        const refObj = await this.generateReferences();
        if (refObj.type === 'fileUnchanged') {
            this.plugin.sidebarReady = true;

            return;
        }

        const refsListEl = container.querySelector('.pandoc-refs-list');
        if (refObj.type === 'message') {
            refsListEl.empty();
            refsListEl.createEl('p', { text: refObj.content });

            this.plugin.updateCitationCount(0);
            this.plugin.sidebarReady = true;

            return;
        }

        const oldRefsHash = this.plugin.activeFileRefsHash;
        const newRefsHash = md5(refObj.content.outerHTML);
        if (oldRefsHash === newRefsHash) {
            this.plugin.sidebarReady = true;

            return;
        }

        refsListEl.empty();
        refsListEl.innerHTML = refObj.content.outerHTML;

        const citationCount = refObj.content.querySelectorAll('.csl-entry').length;
        this.plugin.updateCitationCount(citationCount);
        this.plugin.activeFileRefsHash = newRefsHash;
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
            this.plugin.activeFilePath = null;
            this.plugin.activeFileLastUpdated = null;

            return {
                'content': 'No document currently open.',
                'type': 'message'
            };
        }

        if (this.plugin.activeFilePath === activeFile.path && this.plugin.activeFileLastUpdated === activeFile.stat.mtime) {
            return {
                'type': 'fileUnchanged'
            };
        }

        this.plugin.activeFilePath = activeFile.path;
        this.plugin.activeFileLastUpdated = activeFile.stat.mtime;

        try {
            const filepath = `${activeFile.vault.adapter.basePath}/${activeFile.path}`;
            const docHtmlString = await this.plugin.runPandocCmd(
                this.plugin.settings.pandocArgs,
                filepath
            );
            const parser = new DOMParser();
            const docHtml = parser.parseFromString(docHtmlString, 'text/html');
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
