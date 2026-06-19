import { App, Scope } from 'obsidian';

export interface PickerKeyboardController {
	scope: Scope;
	handleKeyDownCapture: (event: KeyboardEvent) => void;
}

export function createPickerKeyboardController(params: {
	app: App;
	onMove: (delta: number) => void;
	onSubmit: (options: { forceAlias: boolean }) => void;
	onClose: () => void;
}): PickerKeyboardController {
	const handleKeyboardAction = (event: KeyboardEvent): boolean => {
		if (event.key === 'ArrowDown') {
			params.onMove(1);
		} else if (event.key === 'ArrowUp') {
			params.onMove(-1);
		} else if (event.key === 'Enter') {
			params.onSubmit({ forceAlias: event.metaKey || event.ctrlKey });
		} else if (event.key === 'Escape') {
			params.onClose();
		} else {
			return false;
		}
		return true;
	};

	const withKeyboardCapture = (key: string) => {
		return (event: KeyboardEvent) => {
			event.preventDefault();
			event.stopPropagation();
			if (key === event.key) {
				handleKeyboardAction(event);
			}
			return false;
		};
	};

	const scope = new Scope(params.app.scope);
	scope.register([], 'ArrowDown', withKeyboardCapture('ArrowDown'));
	scope.register([], 'ArrowUp', withKeyboardCapture('ArrowUp'));
	scope.register([], 'Enter', withKeyboardCapture('Enter'));
	scope.register([], 'Escape', withKeyboardCapture('Escape'));

	const handleKeyDownCapture = (event: KeyboardEvent) => {
		if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
			return;
		}
		if (handleKeyboardAction(event)) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};

	return { scope, handleKeyDownCapture };
}
