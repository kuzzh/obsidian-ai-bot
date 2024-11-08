import { App, Setting, PluginSettingTab } from "obsidian";
import ObsidianAiBotPlugin from "main";

export class SettingTab extends PluginSettingTab {
	plugin: ObsidianAiBotPlugin;

	constructor(app: App, plugin: ObsidianAiBotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Obsidian AI bot")
			.setDesc("Configuration for Obsidian AI bot");

		new Setting(containerEl).setName("Base URL").addText((text) => {
			text.inputEl.classList.add("setting-input");
			text.setPlaceholder("Enter your base URL")
				.setValue(this.plugin.settings.baseURL)
				.onChange(async (value) => {
					this.plugin.settings.baseURL = value;
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl).setName("API Key").addText((text) => {
            text.inputEl.classList.add("setting-input");
			text.setPlaceholder("Enter your API key")
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl).setName("Model").addText((text) =>
			text
				.setPlaceholder("Enter your model")
				.setValue(this.plugin.settings.model)
				.onChange(async (value) => {
					this.plugin.settings.model = value;
					await this.plugin.saveSettings();
				})
		);
	}
}
