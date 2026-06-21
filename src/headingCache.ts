import { App, TFile } from 'obsidian';
import { HeadingEntry, HeadingRenameEvent, HeadingSnapshot } from './headingTypes';

export class HeadingCache {
	private snapshots = new Map<string, HeadingSnapshot>();

	constructor(private app: App) {}

	initialize(): void {
		for (const file of this.app.vault.getMarkdownFiles()) {
			const snapshot = this.buildSnapshot(file);
			if (snapshot) {
				this.snapshots.set(file.path, snapshot);
			}
		}
	}

	getSnapshot(file: TFile | string): HeadingSnapshot | null {
		const path = typeof file === 'string' ? file : file.path;
		return this.snapshots.get(path) ?? null;
	}

	updateSnapshot(file: TFile, snapshot: HeadingSnapshot): void {
		this.snapshots.set(file.path, snapshot);
	}

	buildSnapshot(file: TFile): HeadingSnapshot | null {
		const fileCache = this.app.metadataCache.getFileCache(file);
		if (!fileCache) {
			return null;
		}
		const headings = fileCache.headings ?? [];

		const stack: HeadingEntry[] = [];
		const entries = headings.map((heading, index) => {
			while (stack.length > 0 && (stack[stack.length - 1]?.level ?? 0) >= heading.level) {
				stack.pop();
			}

			const ancestors = stack.map((entry) => entry.text);
			const entry: HeadingEntry = {
				text: heading.heading,
				level: heading.level,
				line: heading.position.start.line,
				index,
				ancestorTexts: ancestors,
				fullPathSegments: [...ancestors, heading.heading],
			};
			stack.push(entry);
			return entry;
		});

		return { filePath: file.path, headings: entries };
	}

	detectSingleHeadingRename(
		oldSnapshot: HeadingSnapshot | null,
		newSnapshot: HeadingSnapshot | null,
	): HeadingRenameEvent | null {
		if (!oldSnapshot || !newSnapshot) {
			return null;
		}
		if (oldSnapshot.headings.length !== newSnapshot.headings.length) {
			return null;
		}

		const diffs: { oldHeading: HeadingEntry; newHeading: HeadingEntry }[] = [];

		for (let index = 0; index < oldSnapshot.headings.length; index += 1) {
			const oldHeading = oldSnapshot.headings[index];
			const newHeading = newSnapshot.headings[index];
			if (!oldHeading || !newHeading || oldHeading.level !== newHeading.level) {
				return null;
			}
			if (oldHeading.text !== newHeading.text) {
				diffs.push({ oldHeading, newHeading });
			}
		}

		if (diffs.length !== 1) {
			return null;
		}

		const diff = diffs[0];
		if (!diff) {
			return null;
		}

		return {
			filePath: oldSnapshot.filePath,
			oldHeading: diff.oldHeading,
			newHeading: diff.newHeading,
			oldFullPathSegments: diff.oldHeading.fullPathSegments,
			newFullPathSegments: diff.newHeading.fullPathSegments,
			oldLastText: diff.oldHeading.text,
			newLastText: diff.newHeading.text,
			oldSnapshot,
			newSnapshot,
		};
	}
}

export function isDuplicateHeadingText(snapshot: HeadingSnapshot, headingText: string): boolean {
	return snapshot.headings.filter((heading) => heading.text === headingText).length > 1;
}

export function findHeadingByPath(
	snapshot: HeadingSnapshot,
	pathSegments: readonly string[],
): HeadingEntry | null {
	return (
		snapshot.headings.find((heading) => {
			if (heading.fullPathSegments.length === pathSegments.length) {
				return heading.fullPathSegments.every((segment, index) => segment === pathSegments[index]);
			}
			if (pathSegments.length === 1) {
				return heading.text === pathSegments[0];
			}
			return false;
		}) ?? null
	);
}
