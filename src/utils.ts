import { App, TFile } from 'obsidian';

export function hasUnsafeHeadingChars(text: string): boolean {
	return /[|[\]\n#]/.test(text);
}

export function stripMdExtension(path: string): string {
	return path.toLowerCase().endsWith('.md') ? path.slice(0, -3) : path;
}

export function isSupportedMarkdownLinkpath(linkpath: string): boolean {
	if (!linkpath.trim()) {
		return false;
	}
	const lastSegment = linkpath.split('/').pop() ?? linkpath;
	if (!lastSegment.includes('.')) {
		return true;
	}
	return lastSegment.toLowerCase().endsWith('.md');
}

export function resolveMarkdownFile(
	app: App,
	linkpath: string,
	sourcePath: string,
): TFile | null {
	if (!isSupportedMarkdownLinkpath(linkpath)) {
		return null;
	}

	const withoutMd = stripMdExtension(linkpath);
	const candidates = [linkpath, withoutMd].filter(
		(value, index, arr) => value && arr.indexOf(value) === index,
	);

	for (const candidate of candidates) {
		const file = app.metadataCache.getFirstLinkpathDest(candidate, sourcePath);
		if (file?.extension === 'md') {
			return file;
		}
	}

	return null;
}

export function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function startsWithSegments(
	value: readonly string[],
	prefix: readonly string[],
): boolean {
	return prefix.length <= value.length && prefix.every((segment, index) => segment === value[index]);
}
