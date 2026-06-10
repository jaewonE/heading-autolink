export interface HeadingEntry {
	text: string;
	level: number;
	line: number;
	index: number;
	ancestorTexts: string[];
	fullPathSegments: string[];
}

export interface HeadingSnapshot {
	filePath: string;
	headings: HeadingEntry[];
}

export interface HeadingRenameEvent {
	filePath: string;
	oldHeading: HeadingEntry;
	newHeading: HeadingEntry;
	oldFullPathSegments: string[];
	newFullPathSegments: string[];
	oldLastText: string;
	newLastText: string;
	oldSnapshot: HeadingSnapshot;
	newSnapshot: HeadingSnapshot;
}

export type PickerSelectionMode = 'single' | 'recursive';
