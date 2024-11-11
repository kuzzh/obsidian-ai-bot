import { App, Setting, PluginSettingTab } from "obsidian";
import ObsidianAiBotPlugin from "main";

export class SettingTab extends PluginSettingTab {
	plugin: ObsidianAiBotPlugin;
	apiKeyInputEl: HTMLInputElement;

	constructor(app: App, plugin: ObsidianAiBotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.setAttr("id", "obsidianAiBotSetting");

		containerEl.empty();

		new Setting(containerEl)
			.setName("Obsidian AI bot")
			.setDesc("Configuration for Obsidian AI bot");

		new Setting(containerEl)
		.setName("Base URL")
		.setDesc("API base URL.")
		.addText((text) => {
			text.inputEl.classList.add("setting-input");
			text.setPlaceholder("Enter your base URL")
				.setValue(this.plugin.settings.baseURL)
				.onChange(async (value) => {
					this.plugin.settings.baseURL = value;
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl)
			.setName("API Key")
			.setDesc("API Key is stored in plain text locally.")
			.addText((text) => {
				this.apiKeyInputEl = text.inputEl;
				this.apiKeyInputEl.classList.add("setting-input");
				this.apiKeyInputEl.setAttr("type", "password");
				text.setPlaceholder("Enter your API key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					});
			})
			.addButton((btn) => {
				btn.setIcon("eye");
				btn.onClick((evt: MouseEvent) => {
					if (this.apiKeyInputEl.type === "password") {
						this.apiKeyInputEl.type = "text";
						btn.setIcon("eye-off");
					} else {
						this.apiKeyInputEl.type = "password";
						btn.setIcon("eye");
					}
				});
			});

		new Setting(containerEl)
		.setName("Model")
		.setDesc("API Model")
		.addText((text) =>
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
