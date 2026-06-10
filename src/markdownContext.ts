export type LineContext =
	| { type: 'plain' }
	| { type: 'ordered-list'; baseIndent: string; marker: string }
	| { type: 'unordered-list'; baseIndent: string; marker: '-' | '*' | '+' }
	| { type: 'icon-list'; baseIndent: string; iconText: string };

interface Range {
	start: number;
	end: number;
}

export function isIndexIgnored(content: string, index: number): boolean {
	return buildIgnoredRanges(content).some((range) => index >= range.start && index < range.end);
}

export function isLinePositionIgnored(content: string, lineNumber: number, ch: number): boolean {
	const lines = content.split('\n');
	let offset = 0;
	for (let index = 0; index < lineNumber; index += 1) {
		offset += (lines[index]?.length ?? 0) + 1;
	}
	return isIndexIgnored(content, offset + ch);
}

export function getLineContext(line: string): LineContext {
	const iconMatch = /^(\s*)-\s+\{([^}]+)\}\s+/.exec(line);
	if (iconMatch) {
		return {
			type: 'icon-list',
			baseIndent: iconMatch[1] ?? '',
			iconText: iconMatch[2] ?? '',
		};
	}

	const orderedMatch = /^(\s*)(\d+[.)])\s+/.exec(line);
	if (orderedMatch) {
		return {
			type: 'ordered-list',
			baseIndent: orderedMatch[1] ?? '',
			marker: orderedMatch[2] ?? '1.',
		};
	}

	const unorderedMatch = /^(\s*)([-*+])\s+/.exec(line);
	if (unorderedMatch) {
		const marker = unorderedMatch[2];
		if (marker === '-' || marker === '*' || marker === '+') {
			return {
				type: 'unordered-list',
				baseIndent: unorderedMatch[1] ?? '',
				marker,
			};
		}
	}

	return { type: 'plain' };
}

function buildIgnoredRanges(content: string): Range[] {
	const ranges: Range[] = [];
	const lines = content.split('\n');
	let offset = 0;
	let inFence = false;
	let inFrontmatter = lines[0]?.trim() === '---';
	let inComment = false;

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
		const line = lines[lineIndex] ?? '';
		const lineStart = offset;
		const lineEnd = lineStart + line.length;
		const trimmed = line.trim();

		if (inFrontmatter) {
			ranges.push({ start: lineStart, end: lineEnd });
			if (lineIndex > 0 && (trimmed === '---' || trimmed === '...')) {
				inFrontmatter = false;
			}
			offset = lineEnd + 1;
			continue;
		}

		if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
			ranges.push({ start: lineStart, end: lineEnd });
			inFence = !inFence;
			offset = lineEnd + 1;
			continue;
		}

		if (inFence) {
			ranges.push({ start: lineStart, end: lineEnd });
			offset = lineEnd + 1;
			continue;
		}

		let scan = 0;
		while (scan < line.length) {
			if (inComment) {
				const close = line.indexOf('-->', scan);
				ranges.push({
					start: lineStart + scan,
					end: close >= 0 ? lineStart + close + 3 : lineEnd,
				});
				if (close < 0) {
					break;
				}
				inComment = false;
				scan = close + 3;
				continue;
			}

			const open = line.indexOf('<!--', scan);
			if (open < 0) {
				break;
			}
			const close = line.indexOf('-->', open + 4);
			ranges.push({
				start: lineStart + open,
				end: close >= 0 ? lineStart + close + 3 : lineEnd,
			});
			if (close < 0) {
				inComment = true;
				break;
			}
			scan = close + 3;
		}

		for (const range of inlineCodeRanges(line, lineStart)) {
			ranges.push(range);
		}

		offset = lineEnd + 1;
	}

	return ranges;
}

function inlineCodeRanges(line: string, lineStart: number): Range[] {
	const ranges: Range[] = [];
	let index = 0;
	while (index < line.length) {
		const start = line.indexOf('`', index);
		if (start < 0) {
			break;
		}
		const end = line.indexOf('`', start + 1);
		if (end < 0) {
			break;
		}
		ranges.push({ start: lineStart + start, end: lineStart + end + 1 });
		index = end + 1;
	}
	return ranges;
}
