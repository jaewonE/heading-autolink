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
	const rootEl = document.createElement('div');
	rootEl.className = `heading-autolink-picker heading-autolink-picker--${params.size}`;
	rootEl.style.setProperty('--heading-autolink-visible-items', String(params.maxVisibleItems));

	const inputEl = document.createElement('input');
	inputEl.type = 'text';
	inputEl.className = 'heading-autolink-search';
	inputEl.placeholder = 'Search headings';
	inputEl.addEventListener('input', () => params.onQueryChange(inputEl.value));
	rootEl.appendChild(inputEl);

	const resultsEl = document.createElement('div');
	resultsEl.className = 'heading-autolink-results';
	rootEl.appendChild(resultsEl);

	const renderResults = (headings: HeadingEntry[], selectedIndex: number): HTMLElement[] => {
		resultsEl.empty();
		const rows: HTMLElement[] = [];
		for (const [index, heading] of headings.entries()) {
			const row = document.createElement('div');
			row.className = 'heading-autolink-result-item';
			if (index === selectedIndex) {
				row.classList.add('is-selected');
			}

			const hasDescendants = params.hasDescendants(heading);
			const recursiveBox = document.createElement(hasDescendants ? 'button' : 'span');
			recursiveBox.className = hasDescendants
				? 'heading-autolink-recursive-button'
				: 'heading-autolink-recursive-placeholder';
			const levelText = `H${heading.level}`;
			if (hasDescendants) {
				(recursiveBox as HTMLButtonElement).type = 'button';
				(recursiveBox as HTMLButtonElement).ariaLabel = 'Insert heading and child headings';
				recursiveBox.innerHTML = `<span class="heading-autolink-level-icon">${levelText}</span>${downArrowSvg()}`;
				recursiveBox.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					params.onRecursiveClick(heading);
				});
			} else {
				recursiveBox.textContent = levelText;
			}

			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'heading-autolink-heading-button';
			const text = document.createElement('span');
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

function downArrowSvg(): string {
	return `<svg class="heading-autolink-recursive-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M4.5 5h10.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
		<path d="M4.5 9.5h9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
		<path d="M4.5 14h7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
		<path d="M17.5 5v12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
		<path d="M14.5 14.25l3 3 3-3" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>`;
}
