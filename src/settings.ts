import { App, PluginSettingTab, Setting } from 'obsidian';
import HeadingAutolinkPlugin from './main';

export interface HeadingAutolinkSettings {
	enableHeadingRenameUpdates: boolean;
	enableTitlePicker: boolean;
	enableAutoAlias: boolean;
	pickerSize: 'small' | 'medium' | 'large';
	pickerMaxVisibleItems: number;
	ignoreLinksInCodeBlocks: boolean;
}

export const DEFAULT_SETTINGS: HeadingAutolinkSettings = {
	enableHeadingRenameUpdates: false,
	enableTitlePicker: true,
	enableAutoAlias: false,
	pickerSize: 'medium',
	pickerMaxVisibleItems: 5,
	ignoreLinksInCodeBlocks: true,
};

export class HeadingAutolinkSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: HeadingAutolinkPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable heading rename updates')
			.setDesc('Update matching heading wikilinks across the vault after a single heading is renamed.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableHeadingRenameUpdates)
					.onChange(async (value) => {
						this.plugin.settings.enableHeadingRenameUpdates = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Enable title picker')
			.setDesc('Show a heading picker when you type # after a simple file wikilink, such as [[note]]#.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTitlePicker)
					.onChange(async (value) => {
						this.plugin.settings.enableTitlePicker = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Enable auto alias')
			.setDesc('Automatically add display text to heading wikilinks after you move away from the line.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAutoAlias)
					.onChange(async (value) => {
						this.plugin.settings.enableAutoAlias = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Picker size')
			.setDesc('Controls the visual size of the heading picker popup.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ small: 'small', medium: 'medium', large: 'large' })
					.setValue(this.plugin.settings.pickerSize)
					.onChange(async (value) => {
						if (value === 'small' || value === 'medium' || value === 'large') {
							this.plugin.settings.pickerSize = value;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Picker max visible items')
			.setDesc('Sets how many heading results are visible before the picker list starts scrolling.')
			.addText((text) => {
				text.inputEl.type = 'number';
				text.inputEl.min = '1';
				text.inputEl.step = '1';
				text
					.setValue(String(this.plugin.settings.pickerMaxVisibleItems))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						this.plugin.settings.pickerMaxVisibleItems = Number.isFinite(parsed)
							? Math.max(1, parsed)
							: DEFAULT_SETTINGS.pickerMaxVisibleItems;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Ignore links in code blocks')
			.setDesc('Skip wikilinks inside fenced code blocks, inline code, YAML frontmatter, and HTML comments.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.ignoreLinksInCodeBlocks)
					.onChange(async (value) => {
						this.plugin.settings.ignoreLinksInCodeBlocks = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
