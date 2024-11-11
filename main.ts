import { Editor, MarkdownView, Notice, Plugin, Menu } from "obsidian";
import { AskAiModal } from "AskAiModal";
import { SettingTab } from "SettingTab";

interface ObsidianAiBotPluginSettings {
	baseURL: string;
	apiKey: string;
	model: string;
}

const DEFAULT_SETTINGS: ObsidianAiBotPluginSettings = {
	baseURL: "https://api.deepseek.com",
	apiKey: "",
	model: "deepseek-chat",
};

export default class ObsidianAiBotPlugin extends Plugin {
	settings: ObsidianAiBotPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"sparkles",
			"Ask AI",
			(evt: MouseEvent) => {
				if (!this.isConfigured()) {
					new Notice(
						"Please configure base URL, API Key, model first"
					);
					return;
				}
				const editor = this.getEditor();
				this.openAskAiModal(editor);
			}
		);

		this.addCommand({
			id: "open-ask-ai-modal",
			name: "Ask AI",
			icon: "sparkles",
			callback: async () => {
				const editor = this.getEditor();
				if (editor) {
					this.openAskAiModal(editor);
				}
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle("Ask AI")
						.setIcon("sparkles")
						.onClick(async () => {
							this.openAskAiModal(editor);
						});
				});
			})
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

	openAskAiModal(editor: Editor | null) {
		if (!editor) {
			return;
		}
		new AskAiModal(this, editor.getSelection(), editor.getValue()).open();
	}

	isConfigured(): boolean {
		return (
			this.settings.baseURL !== "" &&
			this.settings.apiKey !== "" &&
			this.settings.model !== ""
		);
	}

	getEditor(): Editor | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			return view.editor;
		}
		return null;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
