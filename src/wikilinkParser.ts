export interface WikilinkToken {
	raw: string;
	start: number;
	end: number;
	isEmbed: boolean;
	body: string;
	targetPart: string;
	alias?: string;
	hasAlias: boolean;
	linkpath: string;
	headingPathSegments: string[];
	isBlockRef: boolean;
}

export function parseWikilinks(content: string): WikilinkToken[] {
	const tokens: WikilinkToken[] = [];
	const pattern = /!?\[\[([^\]]+?)\]\]/g;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(content)) !== null) {
		const raw = match[0];
		const body = match[1] ?? '';
		const isEmbed = raw.startsWith('!');
		const start = match.index;
		const aliasIndex = body.indexOf('|');
		const hasAlias = aliasIndex >= 0;
		const targetPart = hasAlias ? body.slice(0, aliasIndex) : body;
		const alias = hasAlias ? body.slice(aliasIndex + 1) : undefined;
		const hashIndex = targetPart.indexOf('#');
		const linkpath = hashIndex >= 0 ? targetPart.slice(0, hashIndex) : targetPart;
		const headingPathSegments =
			hashIndex >= 0
				? targetPart
						.slice(hashIndex + 1)
						.split('#')
						.filter((segment) => segment.length > 0)
				: [];

		tokens.push({
			raw,
			start,
			end: start + raw.length,
			isEmbed,
			body,
			targetPart,
			alias,
			hasAlias,
			linkpath,
			headingPathSegments,
			isBlockRef: targetPart.includes('#^'),
		});
	}

	return tokens;
}

export interface TitlePickerTrigger {
	targetText: string;
	start: number;
	end: number;
}

export function findTitlePickerTrigger(linePrefix: string): TitlePickerTrigger | null {
	const match = /(?:^|[^!])\[\[([^|\]#]+)\]\]#$/.exec(linePrefix);
	if (!match || match.index < 0) {
		return null;
	}
	const targetText = match[1]?.trim() ?? '';
	if (!targetText) {
		return null;
	}
	const raw = `[[${match[1]}]]#`;
	return {
		targetText,
		start: linePrefix.length - raw.length,
		end: linePrefix.length,
	};
}
