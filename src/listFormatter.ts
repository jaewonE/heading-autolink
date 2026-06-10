import { HeadingEntry, HeadingSnapshot } from './headingTypes';
import { buildHeadingLink, isDuplicateHeadingText } from './linkBuilder';
import { LineContext } from './markdownContext';

export function getRecursiveHeadings(headings: HeadingEntry[], selected: HeadingEntry): HeadingEntry[] {
	const result = [selected];
	for (const next of headings.slice(selected.index + 1)) {
		if (next.level <= selected.level) {
			break;
		}
		result.push(next);
	}
	return result;
}

export function formatRecursiveLinks(params: {
	snapshot: HeadingSnapshot;
	originalLinkpathText: string;
	selected: HeadingEntry;
	lineContext: LineContext;
}): string {
	const entries = getRecursiveHeadings(params.snapshot.headings, params.selected);
	const links = entries.map((entry) =>
		buildHeadingLink({
			originalLinkpathText: params.originalLinkpathText,
			headingEntry: entry,
			useHierarchicalPath: isDuplicateHeadingText(params.snapshot, entry.text),
			includeAlias: true,
		}),
	);

	if (params.lineContext.type === 'plain') {
		return links.join(', ');
	}

	const lineContext = params.lineContext;
	return entries
		.map((entry, index) => {
			const depth = Math.max(0, entry.fullPathSegments.length - params.selected.fullPathSegments.length);
			const indent = `${lineContext.baseIndent}${'\t'.repeat(depth)}`;
			const link = links[index] ?? '';
			if (index === 0 && lineContext.type === 'icon-list') {
				return `${indent}- {${lineContext.iconText}} ${link}`;
			}
			if (lineContext.type === 'ordered-list') {
				return `${indent}1. ${link}`;
			}
			if (lineContext.type === 'unordered-list') {
				return `${indent}${lineContext.marker} ${link}`;
			}
			return `${indent}- ${link}`;
		})
		.join('\n');
}
