import { App, Editor } from 'obsidian';
import { HeadingEntry, HeadingSnapshot } from '../headingTypes';
import { buildFileAliasLink, buildHeadingLink, isDuplicateHeadingText } from '../linkBuilder';
import { formatRecursiveLinks } from '../listFormatter';
import { getLineContext } from '../markdownContext';
import { hasUnsafeHeadingChars } from '../utils';
import { createHeadingPickerDom, HeadingPickerDom } from './headingPickerDom';
import { createPickerKeyboardController, PickerKeyboardController } from './headingPickerKeyboard';

interface EditorWithCoords extends Editor {
	cm?: {
		coordsAtPos?: (pos: number) => { left: number; top: number } | null;
	};
}

export interface HeadingPickerTriggerRange {
	line: number;
	startCh: number;
	endCh: number;
	originalLinkpathText: string;
}

export class HeadingPicker {
	private dom: HeadingPickerDom | null = null;
	private keyboard: PickerKeyboardController | null = null;
	private allHeadings: HeadingEntry[] = [];
	private filteredHeadings: HeadingEntry[] = [];
	private selectedIndex = 0;
	private optionEls: HTMLElement[] = [];
	private isClosed = false;
	private query = '';
	private readonly initialCursor: ReturnType<Editor['getCursor']>;

	constructor(
		private app: App,
		private editor: Editor,
		private snapshot: HeadingSnapshot,
		private trigger: HeadingPickerTriggerRange,
		private settings: {
			pickerSize: 'small' | 'medium' | 'large';
			pickerMaxVisibleItems: number;
		},
		private onClose: () => void,
	) {
		this.initialCursor = editor.getCursor();
	}

	open(): void {
		this.allHeadings = this.snapshot.headings.filter((heading) => !hasUnsafeHeadingChars(heading.text));
		this.filteredHeadings = this.allHeadings;

		this.dom = createHeadingPickerDom({
			size: this.settings.pickerSize,
			maxVisibleItems: this.settings.pickerMaxVisibleItems,
			onQueryChange: (query) => this.filter(query),
			onItemClick: (heading) => this.selectHeading(heading, false),
			onRecursiveClick: (heading) => this.selectHeading(heading, true),
			hasDescendants: (heading) => this.hasDescendants(heading),
		});

		this.keyboard = createPickerKeyboardController({
			app: this.app,
			onMove: (delta) => this.moveSelection(delta),
			onSubmit: (options) => this.submit(options),
			onClose: () => this.close(),
		});

		this.positionPicker();
		activeDocument.body.appendChild(this.dom.rootEl);
		this.app.keymap.pushScope(this.keyboard.scope);
		activeDocument.addEventListener('keydown', this.keyboard.handleKeyDownCapture, true);
		window.setTimeout(() => this.dom?.inputEl.focus(), 0);
		window.setTimeout(() => activeDocument.addEventListener('click', this.handleClickOutside), 0);
		this.render();
	}

	close(restoreEditorFocus = true): void {
		if (this.isClosed) {
			return;
		}
		this.isClosed = true;
		if (this.dom?.rootEl.parentNode) {
			activeDocument.body.removeChild(this.dom.rootEl);
		}
		if (this.keyboard) {
			this.app.keymap.popScope(this.keyboard.scope);
			activeDocument.removeEventListener('keydown', this.keyboard.handleKeyDownCapture, true);
		}
		activeDocument.removeEventListener('click', this.handleClickOutside);
		this.onClose();
		if (restoreEditorFocus) {
			window.setTimeout(() => {
				this.editor.focus();
				this.editor.setCursor(this.initialCursor);
			}, 0);
		}
	}

	private filter(query: string): void {
		this.query = query;
		const normalized = query.toLowerCase();
		this.filteredHeadings = this.allHeadings.filter((heading) =>
			heading.text.toLowerCase().includes(normalized),
		);
		this.selectedIndex = 0;
		this.render();
	}

	private moveSelection(delta: number): void {
		if (this.filteredHeadings.length === 0) {
			return;
		}
		this.selectedIndex =
			(this.selectedIndex + delta + this.filteredHeadings.length) % this.filteredHeadings.length;
		this.render();
		this.optionEls[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
	}

	private submit(options: { forceAlias: boolean }): void {
		const heading = this.filteredHeadings[this.selectedIndex];
		const alias = this.query.trim();
		if (options.forceAlias && alias) {
			this.selectAlias(alias);
		} else if (heading) {
			this.selectHeading(heading, false);
		} else if (alias) {
			this.selectAlias(alias);
		}
	}

	private selectAlias(alias: string): void {
		this.editor.replaceRange(
			buildFileAliasLink({
				originalLinkpathText: this.trigger.originalLinkpathText,
				alias,
			}),
			{ line: this.trigger.line, ch: this.trigger.startCh },
			{ line: this.trigger.line, ch: this.trigger.endCh },
		);
		this.close(false);
		window.setTimeout(() => this.editor.focus(), 0);
	}

	private selectHeading(heading: HeadingEntry, recursive: boolean): void {
		const lineContext = getLineContext(this.editor.getLine(this.trigger.line));
		const replacement = recursive
			? formatRecursiveLinks({
					snapshot: this.snapshot,
					originalLinkpathText: this.trigger.originalLinkpathText,
					selected: heading,
					lineContext,
				})
			: buildHeadingLink({
					originalLinkpathText: this.trigger.originalLinkpathText,
					headingEntry: heading,
					useHierarchicalPath: isDuplicateHeadingText(this.snapshot, heading.text),
					includeAlias: true,
				});

		const replaceFrom = recursive && lineContext.type !== 'plain' ? 0 : this.trigger.startCh;
		const replaceTo =
			recursive && lineContext.type !== 'plain'
				? this.editor.getLine(this.trigger.line).length
				: this.trigger.endCh;

		this.editor.replaceRange(
			replacement,
			{ line: this.trigger.line, ch: replaceFrom },
			{ line: this.trigger.line, ch: replaceTo },
		);
		this.close(false);
		window.setTimeout(() => this.editor.focus(), 0);
	}

	private hasDescendants(heading: HeadingEntry): boolean {
		const next = this.snapshot.headings[heading.index + 1];
		return next !== undefined && next.level > heading.level;
	}

	private render(): void {
		if (!this.dom) {
			return;
		}
		this.optionEls = this.dom.renderResults(this.filteredHeadings, this.selectedIndex);
	}

	private positionPicker(): void {
		if (!this.dom) {
			return;
		}
		const editorWithCoords = this.editor as EditorWithCoords;
		const coords = editorWithCoords.cm?.coordsAtPos?.(this.editor.posToOffset(this.editor.getCursor()));
		const left = coords?.left ?? window.innerWidth / 2;
		const top = coords?.top ?? window.innerHeight / 2;
		this.dom.rootEl.style.left = `${left}px`;
		this.dom.rootEl.style.top = `${top + 20}px`;
	}

	private handleClickOutside = (event: MouseEvent): void => {
		if (this.dom && !this.dom.rootEl.contains(event.target as Node)) {
			this.close();
		}
	};
}
