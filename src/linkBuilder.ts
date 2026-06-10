import { HeadingEntry, HeadingSnapshot } from './headingTypes';

export function buildHeadingLink(params: {
	originalLinkpathText: string;
	headingEntry: HeadingEntry;
	useHierarchicalPath: boolean;
	includeAlias: boolean;
}): string {
	const path = params.useHierarchicalPath
		? params.headingEntry.fullPathSegments.join('#')
		: params.headingEntry.text;
	const alias = params.includeAlias ? `|${params.headingEntry.text}` : '';
	return `[[${params.originalLinkpathText}#${path}${alias}]]`;
}

export function isDuplicateHeadingText(snapshot: HeadingSnapshot, headingText: string): boolean {
	return snapshot.headings.filter((heading) => heading.text === headingText).length > 1;
}

export function buildLinkFromSegments(params: {
	originalLinkpathText: string;
	segments: readonly string[];
	alias?: string;
}): string {
	const alias = params.alias === undefined ? '' : `|${params.alias}`;
	return `[[${params.originalLinkpathText}#${params.segments.join('#')}${alias}]]`;
}
