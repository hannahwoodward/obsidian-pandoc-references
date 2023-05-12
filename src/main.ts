import { execa } from 'execa';
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
    citationCount: 0;
    htmlCache: null;
    sidebarReady: false;
    previewRendering: true;
    statusBar: null;
    settings: PandocReferencesSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new PandocReferencesSettingTab(this.app, this));

        this.registerView(VIEW_TYPE_REFERENCE_LIST, (leaf: WorkspaceLeaf) => {
            return new PandocReferencesView(leaf, this);
        });

        this.statusBar = this.addStatusBarItem();
        this.sidebarReady = true;

        if (!this.settings.pandocArgs) {
            return;
        }

        this.registerEvent(
            this.app.workspace.on('layout-change', async () => {
                await this.renderPreview();
            })
        );

        // NB this does rendering on a section/paragraph basis, which doesn't
        // play well with pandoc same author/year referencing in different sections
        // this.registerMarkdownPostProcessor(async (element, context) => {
        //     // console.log(element)
        //     // await this.renderCitations(element, context);
        // }, 10);
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

    //     async renderCitations(element, context) {
    //         // TODO: fix error with same author + year references in different blocks are not differentiated
    //         if (!context.el || !context.el.outerHTML) {
    //             return;
    //         }
    //
    //         try {
    //             const elHtmlString = await this.runPandocCmd(
    //                 this.settings.pandocArgs,
    //                 '',
    //                 { input: context.el.outerHTML }
    //             );
    //             const parser = new DOMParser();
    //             const elHtml = parser.parseFromString(elHtmlString, 'text/html');
    //             const refsHtml = elHtml.querySelector('#refs');
    //             refsHtml && refsHtml.remove();
    //             context.el.innerHTML = elHtml.body.firstElementChild.innerHTML;
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     }

    async renderPreview() {
        await this.app.workspace.iterateRootLeaves(async (rootLeaf) => {
            if (rootLeaf.type !== 'leaf') {
                return;
            }

            const viewState = rootLeaf.getViewState();
            if (viewState.type !== 'markdown' || viewState.state.mode !== 'preview') {
                return;
            }

            // TODO: find better way than setTimeout to wait for previewEl.outerHTML to be rendered
            await setTimeout(async () => {
                try {
                    const renderer = rootLeaf.view.currentMode.renderer;
                    for (let i = 0; i < renderer.sections.length; i++) {
                        if (renderer.sections[i].el.classList.contains('mod-header') || renderer.sections[i].el.classList.contains('mod-footer')) {
                            continue;
                        }
                        renderer.sections[i].el.setAttribute('data-section-id', i);
                    }
                    const elHtmlString = await this.runPandocCmd(
                        this.settings.pandocArgs,
                        '',
                        { input: renderer.previewEl.outerHTML }
                    );
                    const parser = new DOMParser();
                    const elHtml = parser.parseFromString(elHtmlString, 'text/html');
                    const refsHtml = elHtml.querySelector('#refs');
                    refsHtml && refsHtml.remove();

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

                    renderer.rerender();
                } catch (e) {
                    console.error(e);
                }
            }, 10);

            this.previewReady = true;
        });
    }
}
