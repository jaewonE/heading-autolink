import { App, TFile } from 'obsidian';
import { HeadingRenameEvent } from './headingTypes';
import { isDuplicateHeadingText } from './linkBuilder';
import { isIndexIgnored } from './markdownContext';
import { buildLinkFromSegments } from './linkBuilder';
import { parseWikilinks, WikilinkToken } from './wikilinkParser';
import { arraysEqual, resolveMarkdownFile, startsWithSegments } from './utils';

export interface AutolinkUpdateResult {
	filesChanged: number;
	linksChanged: number;
}

interface ContentReplacementResult {
	content: string;
	replacements: number;
}

export class AutolinkService {
	constructor(
		private app: App,
		private shouldIgnoreProtectedRanges: () => boolean,
	) {}

	async updateVaultLinks(renameEvent: HeadingRenameEvent): Promise<AutolinkUpdateResult> {
		const result: AutolinkUpdateResult = {
			filesChanged: 0,
			linksChanged: 0,
		};

		for (const file of this.app.vault.getMarkdownFiles()) {
			await this.app.vault.process(file, (content) => {
				const replacement = this.replaceLinksInContent(content, file, renameEvent);
				if (replacement.replacements > 0) {
					result.filesChanged += 1;
					result.linksChanged += replacement.replacements;
				}
				return replacement.content;
			});
		}

		return result;
	}

	replaceLinksInContent(content: string, sourceFile: TFile, renameEvent: HeadingRenameEvent): ContentReplacementResult {
		const tokens = parseWikilinks(content);
		if (tokens.length === 0) {
			return { content, replacements: 0 };
		}

		let output = content;
		let replacements = 0;
		for (const token of [...tokens].reverse()) {
			const replacement = this.replacementForToken(content, sourceFile, token, renameEvent);
			if (replacement) {
				output = `${output.slice(0, token.start)}${replacement}${output.slice(token.end)}`;
				replacements += 1;
			}
		}
		return { content: output, replacements };
	}

	private replacementForToken(
		content: string,
		sourceFile: TFile,
		token: WikilinkToken,
		renameEvent: HeadingRenameEvent,
	): string | null {
		if (
			token.isEmbed ||
			token.isBlockRef ||
			token.linkpath.length === 0 ||
			token.headingPathSegments.length === 0
		) {
			return null;
		}
		if (this.shouldIgnoreProtectedRanges() && isIndexIgnored(content, token.start)) {
			return null;
		}

		const targetFile = resolveMarkdownFile(this.app, token.linkpath, sourceFile.path);
		if (!targetFile || targetFile.path !== renameEvent.filePath) {
			return null;
		}

		const matched = this.getNewSegments(token.headingPathSegments, renameEvent);
		if (!matched) {
			return null;
		}

		const alias =
			token.hasAlias && token.alias === renameEvent.oldLastText
				? renameEvent.newLastText
				: token.alias;

		return buildLinkFromSegments({
			originalLinkpathText: token.linkpath,
			segments: matched,
			alias,
		});
	}

	private getNewSegments(
		linkSegments: readonly string[],
		renameEvent: HeadingRenameEvent,
	): readonly string[] | null {
		const oldTextWasDuplicate = isDuplicateHeadingText(renameEvent.oldSnapshot, renameEvent.oldLastText);
		const newTextIsDuplicate = isDuplicateHeadingText(renameEvent.newSnapshot, renameEvent.newLastText);

		if (linkSegments.length === 1 && linkSegments[0] === renameEvent.oldLastText) {
			if (oldTextWasDuplicate) {
				return null;
			}
			return newTextIsDuplicate ? renameEvent.newFullPathSegments : [renameEvent.newLastText];
		}

		if (arraysEqual(linkSegments, renameEvent.oldFullPathSegments)) {
			return newTextIsDuplicate ? renameEvent.newFullPathSegments : renameEvent.newFullPathSegments;
		}

		if (startsWithSegments(linkSegments, renameEvent.oldFullPathSegments)) {
			return [...renameEvent.newFullPathSegments, ...linkSegments.slice(renameEvent.oldFullPathSegments.length)];
		}

		return null;
	}
}
