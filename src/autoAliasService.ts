import { App, Editor, TFile } from 'obsidian';
import { HeadingCache, findHeadingByPath } from './headingCache';
import { isIndexIgnored } from './markdownContext';
import { buildLinkFromSegments } from './linkBuilder';
import { parseWikilinks } from './wikilinkParser';
import { resolveMarkdownFile } from './utils';

export class AutoAliasService {
	constructor(
		private app: App,
		private headingCache: HeadingCache,
		private shouldIgnoreProtectedRanges: () => boolean,
	) {}

	processPreviousLine(editor: Editor, sourceFile: TFile, lineNumber: number): void {
		if (lineNumber < 0 || lineNumber >= editor.lineCount()) {
			return;
		}

		const content = editor.getValue();
		const lineText = editor.getLine(lineNumber);
		const updated = this.processLineForAutoAlias(lineText, sourceFile, content, lineNumber);
		if (updated !== lineText) {
			editor.replaceRange(updated, { line: lineNumber, ch: 0 }, { line: lineNumber, ch: lineText.length });
		}
	}

	processLineForAutoAlias(lineText: string, sourceFile: TFile, fullContent: string, lineNumber: number): string {
		const tokens = parseWikilinks(lineText);
		if (tokens.length === 0) {
			return lineText;
		}

		let output = lineText;
		for (const token of [...tokens].reverse()) {
			if (
				token.isEmbed ||
				token.hasAlias ||
				token.isBlockRef ||
				token.linkpath.length === 0 ||
				token.headingPathSegments.length === 0
			) {
				continue;
			}
			if (this.shouldIgnoreProtectedRanges() && isIndexIgnored(fullContent, this.lineOffset(fullContent, lineNumber) + token.start)) {
				continue;
			}

			const targetFile = resolveMarkdownFile(this.app, token.linkpath, sourceFile.path);
			if (!targetFile) {
				continue;
			}
			const snapshot = this.headingCache.getSnapshot(targetFile) ?? this.headingCache.buildSnapshot(targetFile);
			if (!snapshot || !findHeadingByPath(snapshot, token.headingPathSegments)) {
				continue;
			}

			const alias = token.headingPathSegments[token.headingPathSegments.length - 1];
			if (!alias) {
				continue;
			}
			const replacement = buildLinkFromSegments({
				originalLinkpathText: token.linkpath,
				segments: token.headingPathSegments,
				alias,
			});
			output = `${output.slice(0, token.start)}${replacement}${output.slice(token.end)}`;
		}

		return output;
	}

	private lineOffset(content: string, lineNumber: number): number {
		const lines = content.split('\n');
		let offset = 0;
		for (let index = 0; index < lineNumber; index += 1) {
			offset += (lines[index]?.length ?? 0) + 1;
		}
		return offset;
	}
}
