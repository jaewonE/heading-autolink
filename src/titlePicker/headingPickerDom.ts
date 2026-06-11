import { HeadingEntry } from '../headingTypes';

export interface HeadingPickerDom {
	rootEl: HTMLDivElement;
	inputEl: HTMLInputElement;
	resultsEl: HTMLDivElement;
	renderResults: (headings: HeadingEntry[], selectedIndex: number) => HTMLElement[];
}

export function createHeadingPickerDom(params: {
	size: 'small' | 'medium' | 'large';
	maxVisibleItems: number;
	onQueryChange: (query: string) => void;
	onItemClick: (heading: HeadingEntry) => void;
	onRecursiveClick: (heading: HeadingEntry) => void;
	hasDescendants: (heading: HeadingEntry) => boolean;
}): HeadingPickerDom {
	const rootEl = activeDocument.createElement('div');
	rootEl.className = `heading-autolink-picker heading-autolink-picker--${params.size}`;
	rootEl.style.setProperty('--heading-autolink-visible-items', String(params.maxVisibleItems));

	const inputEl = activeDocument.createElement('input');
	inputEl.type = 'text';
	inputEl.className = 'heading-autolink-search';
	inputEl.placeholder = 'Search headings';
	inputEl.addEventListener('input', () => params.onQueryChange(inputEl.value));
	rootEl.appendChild(inputEl);

	const resultsEl = activeDocument.createElement('div');
	resultsEl.className = 'heading-autolink-results';
	rootEl.appendChild(resultsEl);

	const renderResults = (headings: HeadingEntry[], selectedIndex: number): HTMLElement[] => {
		resultsEl.empty();
		const rows: HTMLElement[] = [];
		for (const [index, heading] of headings.entries()) {
			const row = activeDocument.createElement('div');
			row.className = 'heading-autolink-result-item';
			if (index === selectedIndex) {
				row.classList.add('is-selected');
			}

			const hasDescendants = params.hasDescendants(heading);
			const recursiveBox = activeDocument.createElement(hasDescendants ? 'button' : 'span');
			recursiveBox.className = hasDescendants
				? 'heading-autolink-recursive-button'
				: 'heading-autolink-recursive-placeholder';
			const levelText = `H${heading.level}`;
			if (hasDescendants) {
				(recursiveBox as HTMLButtonElement).type = 'button';
				(recursiveBox as HTMLButtonElement).ariaLabel = 'Insert heading and child headings';
				recursiveBox.append(createLevelIcon(levelText), createDownArrowSvg());
				recursiveBox.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					params.onRecursiveClick(heading);
				});
			} else {
				recursiveBox.textContent = levelText;
			}

			const button = activeDocument.createElement('button');
			button.type = 'button';
			button.className = 'heading-autolink-heading-button';
			const text = activeDocument.createElement('span');
			text.className = 'heading-autolink-result-text';
			text.textContent = heading.text;
			button.append(text);
			button.addEventListener('click', () => params.onItemClick(heading));
			row.append(recursiveBox, button);
			resultsEl.appendChild(row);
			rows.push(row);
		}
		return rows;
	};

	return { rootEl, inputEl, resultsEl, renderResults };
}

function createLevelIcon(levelText: string): HTMLSpanElement {
	const levelIcon = activeDocument.createElement('span');
	levelIcon.className = 'heading-autolink-level-icon';
	levelIcon.textContent = levelText;
	return levelIcon;
}

function createDownArrowSvg(): SVGSVGElement {
	const svg = activeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.classList.add('heading-autolink-recursive-icon');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('focusable', 'false');

	for (const attributes of [
		{ d: 'M4.5 5h10.5', width: '2.2' },
		{ d: 'M4.5 9.5h9', width: '2.2' },
		{ d: 'M4.5 14h7.5', width: '2.2' },
		{ d: 'M17.5 5v12', width: '2.1' },
		{ d: 'M14.5 14.25l3 3 3-3', width: '2.1', join: 'round' },
	]) {
		const path = activeDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', attributes.d);
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', 'currentColor');
		path.setAttribute('stroke-width', attributes.width);
		path.setAttribute('stroke-linecap', 'round');
		if (attributes.join) {
			path.setAttribute('stroke-linejoin', attributes.join);
		}
		svg.appendChild(path);
	}

	return svg;
}
