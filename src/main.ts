import { Editor, MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { AutolinkService } from './autolinkService';
import { AutoAliasService } from './autoAliasService';
import { HeadingCache } from './headingCache';
import { DEFAULT_SETTINGS, HeadingAutolinkSettings, HeadingAutolinkSettingTab } from './settings';
import { HeadingPicker } from './titlePicker/HeadingPicker';
import { findTitlePickerTrigger } from './wikilinkParser';
import { isLinePositionIgnored } from './markdownContext';
import { resolveMarkdownFile } from './utils';

const METADATA_DEBOUNCE_MS = 250;

export default class HeadingAutolinkPlugin extends Plugin {
	settings!: HeadingAutolinkSettings;
	private headingCache!: HeadingCache;
	private autolinkService!: AutolinkService;
	private autoAliasService!: AutoAliasService;
	private activePicker: HeadingPicker | null = null;
	private metadataTimers = new Map<string, number>();
	private previousEditor: Editor | null = null;
	private previousFile: TFile | null = null;
	private previousLine: number | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.headingCache = new HeadingCache(this.app);
		this.autolinkService = new AutolinkService(this.app, () => this.settings.ignoreLinksInCodeBlocks);
		this.autoAliasService = new AutoAliasService(
			this.app,
			this.headingCache,
			() => this.settings.ignoreLinksInCodeBlocks,
		);

		this.addSettingTab(new HeadingAutolinkSettingTab(this.app, this));
		this.app.workspace.onLayoutReady(() => this.headingCache.initialize());

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.scheduleHeadingRefresh(file);
				}
			}),
		);

		this.registerEvent(
			this.app.workspace.on('editor-change', (editor, view) => {
				const file = this.fileFromEditorInfo(view);
				if (file) {
					this.handleEditorActivity(editor, file);
					this.maybeOpenTitlePicker(editor, file);
				}
			}),
		);

		this.registerDomEvent(activeDocument, 'keyup', () => this.checkActiveEditorLine());
		this.registerDomEvent(activeDocument, 'mouseup', () => this.checkActiveEditorLine());
	}

	onunload(): void {
		this.activePicker?.close();
		for (const timer of this.metadataTimers.values()) {
			window.clearTimeout(timer);
		}
		this.metadataTimers.clear();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<HeadingAutolinkSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private scheduleHeadingRefresh(file: TFile): void {
		const existing = this.metadataTimers.get(file.path);
		if (existing !== undefined) {
			window.clearTimeout(existing);
		}

		const timer = window.setTimeout(() => {
			this.refreshHeadings(file).catch((error: unknown) => {
				console.error('Heading Autolink failed to refresh headings.', error);
			});
		}, METADATA_DEBOUNCE_MS);

		this.metadataTimers.set(file.path, timer);
	}

	private async refreshHeadings(file: TFile): Promise<void> {
		this.metadataTimers.delete(file.path);
		const oldSnapshot = this.headingCache.getSnapshot(file);
		const newSnapshot = this.headingCache.buildSnapshot(file);
		const renameEvent = this.headingCache.detectSingleHeadingRename(oldSnapshot, newSnapshot);

		if (renameEvent && this.settings.enableHeadingRenameUpdates) {
			const result = await this.autolinkService.updateVaultLinks(renameEvent);
			if (result.linksChanged > 0) {
				new Notice(
					`Heading Autolink updated ${result.linksChanged} link${result.linksChanged === 1 ? '' : 's'} in ${result.filesChanged} file${result.filesChanged === 1 ? '' : 's'}.`,
				);
			}
		}

		if (newSnapshot) {
			this.headingCache.updateSnapshot(file, newSnapshot);
		}
	}

	private handleEditorActivity(editor: Editor, file: TFile): void {
		const cursor = editor.getCursor();
		if (this.previousEditor === editor && this.previousFile === file && this.previousLine !== null) {
			if (cursor.line !== this.previousLine && this.settings.enableAutoAlias) {
				this.autoAliasService.processPreviousLine(editor, file, this.previousLine);
			}
		}

		this.previousEditor = editor;
		this.previousFile = file;
		this.previousLine = cursor.line;
	}

	private checkActiveEditorLine(): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const file = view?.file;
		if (!view || !file) {
			return;
		}
		this.handleEditorActivity(view.editor, file);
	}

	private maybeOpenTitlePicker(editor: Editor, sourceFile: TFile): void {
		if (!this.settings.enableTitlePicker) {
			return;
		}

		const cursor = editor.getCursor();
		if (cursor.ch === 0) {
			return;
		}

		const line = editor.getLine(cursor.line);
		if (line[cursor.ch - 1] !== '#') {
			return;
		}

		if (
			this.settings.ignoreLinksInCodeBlocks &&
			isLinePositionIgnored(editor.getValue(), cursor.line, cursor.ch - 1)
		) {
			return;
		}

		const trigger = findTitlePickerTrigger(line.slice(0, cursor.ch));
		if (!trigger) {
			return;
		}

		const targetFile = resolveMarkdownFile(this.app, trigger.targetText, sourceFile.path);
		if (!targetFile) {
			return;
		}

		const snapshot = this.headingCache.getSnapshot(targetFile) ?? this.headingCache.buildSnapshot(targetFile);
		if (!snapshot || snapshot.headings.length === 0) {
			return;
		}

		this.activePicker?.close();
		this.activePicker = new HeadingPicker(
			this.app,
			editor,
			snapshot,
			{
				line: cursor.line,
				startCh: trigger.start,
				endCh: trigger.end,
				originalLinkpathText: trigger.targetText,
			},
			{
				pickerSize: this.settings.pickerSize,
				pickerMaxVisibleItems: this.settings.pickerMaxVisibleItems,
			},
			() => {
				this.activePicker = null;
			},
		);
		this.activePicker.open();
	}

	private fileFromEditorInfo(view: unknown): TFile | null {
		if (view instanceof MarkdownView) {
			return view.file;
		}
		if (view && typeof view === 'object' && 'file' in view) {
			const file = (view as { file?: unknown }).file;
			return file instanceof TFile ? file : null;
		}
		return this.app.workspace.getActiveFile();
	}
}
