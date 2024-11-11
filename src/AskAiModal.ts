import {
	App,
	Modal,
	Setting,
	Notice,
	Editor,
	MarkdownView,
} from "obsidian";
import { DeepSeekAPI } from "src/DeepSeekAPI";
import { Marked } from "marked";
import { ImageLib } from "src/ImageLib";
import ObsidianAiBotPlugin from "src/main";

export class AskAiModal extends Modal {
	plugin: ObsidianAiBotPlugin;
	userInput: string;
	selectedText: string;
	wholeText: string;
	deepSeekAPI: DeepSeekAPI;
	marked: Marked;
	inputEl: HTMLInputElement;
	okButton: HTMLButtonElement;
	displayEl: HTMLDivElement;
	loadingEl: HTMLDivElement;
	bottomToolBar: HTMLDivElement;
	replaceSelectionButton: HTMLButtonElement;
	insertToCursorPosButton: HTMLButtonElement;
	appendToTailButton: HTMLButtonElement;
	copyButton: HTMLButtonElement;
	topToolBar: HTMLDivElement;
	noContextRadioButton: HTMLInputElement;
	selectionAsContextRadioButton: HTMLInputElement;
	wholeTextAsContextRadioButton: HTMLInputElement;

	constructor(
		plugin: ObsidianAiBotPlugin,
		selectedText: string,
		wholeText: string
	) {
		super(plugin.app);

		this.plugin = plugin;
		this.selectedText = selectedText;
		this.wholeText = wholeText;

		this.containerEl.setAttr("id", "askAiModal");
		this.deepSeekAPI = new DeepSeekAPI(
			plugin,
			(text) => this.onResult(text),
			() => this.onFinish(),
			(msg) => this.onError(msg)
		);
		this.marked = new Marked();
	}

	onOpen() {
		const { contentEl } = this;

		this.topToolBar = contentEl.createEl("div", {
			attr: { id: "topToolBar" },
		});

		this.noContextRadioButton = this.topToolBar.createEl("input", {
			attr: {
				type: "radio",
				id: "noContextRadioButton",
				name: "contextRadioButton",
			},
		});
		this.topToolBar.createEl("label", {
			attr: { for: "noContextRadioButton" },
		}).innerText = "No context";

		this.selectionAsContextRadioButton = this.topToolBar.createEl("input", {
			attr: {
				type: "radio",
				id: "selectionAsContextRadioButton",
				name: "contextRadioButton",
			},
		});
		this.topToolBar.createEl("label", {
			attr: {
				id: "selectionAsContextLabel",
				for: "selectionAsContextRadioButton",
			},
		}).innerText = "Selected text";

		if (this.selectedText !== "") {
			this.selectionAsContextRadioButton.setAttr("checked", true);
		}

		this.wholeTextAsContextRadioButton = this.topToolBar.createEl("input", {
			attr: {
				type: "radio",
				id: "wholeTextAsContextRadioButton",
				name: "contextRadioButton",
			},
		});
		this.topToolBar.createEl("label", {
			attr: { for: "wholeTextAsContextRadioButton" },
		}).innerText = "Full note";

		if (this.selectedText === "") {
			const selectionAsContextLabel = document.getElementById(
				"selectionAsContextLabel"
			);
			if (selectionAsContextLabel) {
				selectionAsContextLabel.style.display = "none";
			}
			this.selectionAsContextRadioButton.style.display = "none";
			this.wholeTextAsContextRadioButton.setAttr("checked", true);
		}

		new Setting(contentEl)
			.addText((text) => {
				this.inputEl = text.inputEl;
				this.inputEl.placeholder = "Ask Obsidian AI bot";
				this.inputEl.addEventListener("keydown", (event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						this.onOk();
					}
				});
				text.setValue(this.userInput).onChange((value) => {
					this.userInput = value;
				});

				setTimeout(() => {
					this.inputEl.focus();
				}, 100);
			})
			.addButton((btn) => {
				this.okButton = btn.buttonEl;
				this.okButton.setAttr("id", "okButton");
				btn.setButtonText("Ask AI")
					.setCta()
					.setIcon("sparkles")
					.onClick(() => this.onOk());
			})
			.addButton((btn) => {
				btn.buttonEl.setAttr("id", "cancelButton");
				btn.setButtonText("Cancel")
					.setCta()
					.onClick(() => (this.deepSeekAPI.cancel = true));
				this.hideCancelButton();
			});

		this.displayEl = contentEl.createEl("div", {
			attr: { id: "display" },
		});

		this.bottomToolBar = contentEl.createEl("div", {
			attr: { id: "bottomToolBar" },
		});

		this.copyButton = this.bottomToolBar.createEl("button", {
			attr: { id: "copyButton" },
		});
		this.copyButton.textContent = "Copy";
		this.copyButton.addEventListener("click", () => this.copyResult());

		if (this.selectedText !== "") {
			this.replaceSelectionButton = this.bottomToolBar.createEl(
				"button",
				{
					attr: { id: "replaceSelectionButton" },
				}
			);
			this.replaceSelectionButton.textContent = "Replace the selected text";
			this.replaceSelectionButton.addEventListener("click", () =>
				this.replaceSelection()
			);
		}

		this.insertToCursorPosButton = this.bottomToolBar.createEl("button", {
			attr: { id: "insertToCursorPosButton" },
		});
		this.insertToCursorPosButton.textContent = "Insert at cursor position";
		this.insertToCursorPosButton.addEventListener("click", () =>
			this.insertToCursorPos()
		);

		this.appendToTailButton = this.bottomToolBar.createEl("button", {
			attr: { id: "appendToTailButton" },
		});
		this.appendToTailButton.textContent = "Append to the end";
		this.appendToTailButton.addEventListener("click", () =>
			this.appendToTail()
		);

		this.loadingEl = contentEl.createEl("div", {
			attr: { id: "loading" },
		});
		this.loadingEl.innerHTML = `<img src="${
			new ImageLib().loadingGif
		}" width=48 height=48 />`;
	}

	onResult(text: string) {
		this.hideLoading();
		this.showDisplay();
		this.showCancelButton();
		this.appendToDisplay(text);
	}

	onFinish() {
		this.showToolBar();
		this.hideCancelButton();
		this.enableGUI(true);
	}

	onError(msg: string) {
		msg = `<span class="error-text">${msg}</span>`;
		
		this.showDisplay();
		this.appendToDisplay(msg);

		this.hideLoading();
		this.hideCancelButton();
		this.enableGUI(true);
	}

	insertToCursorPos() {
		const editor = this.getEditor();
		const textToInsert = this.getResult();

		if (!editor) {
			return;
		}
		const cursor = editor.getCursor();

		editor.replaceRange("\n" + textToInsert + "\n", cursor);

		const newCursorPos = {
			line: cursor.line,
			ch: cursor.ch + textToInsert.length + 1,
		};
		editor.setCursor(newCursorPos);

		this.close();
	}

	appendToTail() {
		const editor = this.getEditor();
		const textToAppend = this.getResult();

		if (!editor) {
			return;
		}

		const currentContent = editor.getValue();
		const newContent = currentContent + "\n\n" + textToAppend;
		editor.setValue(newContent);

		const lastLine = editor.lastLine();
		const lastLineContent = editor.getLine(lastLine);
		editor.setCursor({
			line: lastLine,
			ch: lastLineContent.length,
		});

		this.close();
	}

	replaceSelection() {
		const editor = this.getEditor();
		const replaceText = this.getResult();

		if (!editor) {
			return;
		}
		editor.replaceSelection(replaceText);

		this.close();
	}

	copyResult() {
		const textToCopy = this.getResult();

		navigator.clipboard
			.writeText(textToCopy)
			.then(() => {
				new Notice("Text has been successfully copied to the clipboard.");
			})
			.catch((error) => {
				new Notice("Copy failed, please try again.");
				console.error("Copy failed: ", error);
			});
	}

	getResult(): string {
		return this.displayEl.innerText;
	}

	getEditor(): Editor | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			return view.editor;
		}
		return null;
	}

	appendToDisplay(markdownText: string) {
		markdownText = markdownText.replace("\n", "<br />");
		if (this.displayEl) {
			this.displayEl.innerHTML += markdownText;

			this.displayEl.lastElementChild?.scrollIntoView({
				behavior: "smooth",
			});
		}
	}

	onOk() {
		this.hideDisplay();
		this.hideToolBar();
		this.showLoading();
		this.clearDisplay();
		this.enableGUI(false);

		let context = "";
		if (this.wholeTextAsContextRadioButton.checked) {
			context = this.wholeText;
		} else if (
			this.selectedText !== "" &&
			this.selectionAsContextRadioButton.checked
		) {
			context = this.selectedText;
		}

		this.deepSeekAPI.askAI(this.userInput, context);
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}

	enableGUI(enable: boolean) {
		this.okButton.disabled = !enable;
		this.inputEl.disabled = !enable;
		this.noContextRadioButton.disabled = !enable;
		this.selectionAsContextRadioButton.disabled = !enable;
		this.wholeTextAsContextRadioButton.disabled = !enable;
	}

	clearDisplay() {
		this.displayEl.empty();
	}

	showDisplay() {
		this.displayEl.style.display = "flex";
	}

	hideDisplay() {
		this.displayEl.style.display = "none";
	}

	showToolBar() {
		this.bottomToolBar.style.display = "flex";
	}

	hideToolBar() {
		this.bottomToolBar.style.display = "none";
	}

	showLoading() {
		this.loadingEl.style.display = "flex";
	}

	hideLoading() {
		this.loadingEl.style.display = "none";
	}

	showCancelButton() {
		const cancelButton = document.getElementById("cancelButton");
		if (cancelButton) {
			cancelButton.style.display = "inline-flex";
		}
	}

	hideCancelButton() {
		const cancelButton = document.getElementById("cancelButton");
		if (cancelButton) {
			cancelButton.style.display = "none";
		}
	}
}
