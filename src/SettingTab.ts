import { App, Setting, PluginSettingTab, TextComponent } from "obsidian";
import ObsidianAiBotPlugin from "src/main";

export class SettingTab extends PluginSettingTab {
	plugin: ObsidianAiBotPlugin;
	apiKeyInputEl: HTMLInputElement;
	maxTokensEl: TextComponent;

	constructor(app: App, plugin: ObsidianAiBotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.setAttr("id", "aiBotSetting");

		containerEl.empty();

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
			.setName("API key")
			.setDesc("API key is stored in plain text locally.")
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
			.setDesc("API model")
			.addText((text) =>
				text
					.setPlaceholder("Enter your model")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Max tokens")
			.setDesc("The max tokens of the model")
			.addSlider((slider) =>
				slider
					.setLimits(128, 32768, 16)
					.setInstant(true)
					.setValue(this.plugin.settings.maxTokens)
					.onChange(async (value) => {
						this.maxTokensEl.setValue(value.toString());
						this.plugin.settings.maxTokens = value;
						await this.plugin.saveSettings();
					})
			)
			.addText((text) => {
				this.maxTokensEl = text;
				text.inputEl.setAttr("id", "aibotMaxTokensInput");
				text.setDisabled(true).setValue(
					this.plugin.settings.maxTokens.toString()
				);
			});
	}
}
