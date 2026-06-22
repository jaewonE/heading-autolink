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
	aliasTargetText: string;
	start: number;
	end: number;
}

export function findTitlePickerTrigger(linePrefix: string): TitlePickerTrigger | null {
	const match = /(?:^|[^!])\[\[([^\]]+)\]\]#$/.exec(linePrefix);
	if (!match || match.index < 0) {
		return null;
	}
	const body = match[1] ?? '';
	const aliasIndex = body.indexOf('|');
	const targetPart = aliasIndex >= 0 ? body.slice(0, aliasIndex) : body;
	if (targetPart.includes('#^')) {
		return null;
	}
	const hashIndex = targetPart.indexOf('#');
	const targetText = (hashIndex >= 0 ? targetPart.slice(0, hashIndex) : targetPart).trim();
	if (!targetText) {
		return null;
	}
	const aliasTargetText = targetPart.trim();
	const triggerStart = linePrefix.lastIndexOf('[[', linePrefix.length - 1);
	if (triggerStart < 0) {
		return null;
	}
	return {
		targetText,
		aliasTargetText,
		start: triggerStart,
		end: linePrefix.length,
	};
}
