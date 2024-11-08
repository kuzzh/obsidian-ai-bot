import { App, Modal, Setting, Notice, Editor, MarkdownView, Platform } from "obsidian";
import { DeepSeekAPI } from "DeepSeekAPI";
import { Marked } from "marked";
import { ImageLib } from "ImageLib";
import ObsidianAiBotPlugin from "main";

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
			() => this.onFinish()
		);
		this.marked = new Marked();
	}

	onOpen() {
		const { contentEl } = this;

		// contentEl.createEl("h1", { text: "Ask AI" });

		// 顶部工具栏
		this.topToolBar = contentEl.createEl("div", {
			attr: { id: "topToolBar" },
		});
		this.topToolBar.createEl("label", {
			attr: { for: "selectionAsContextRadioButton" },
		}).innerText = "选中的文本";
		this.selectionAsContextRadioButton = this.topToolBar.createEl("input", {
			attr: {
				type: "radio",
				id: "selectionAsContextRadioButton",
				name: "contextRadioButton",
			},
		});
		if (this.selectedText !== "") {
			this.selectionAsContextRadioButton.setAttr("checked", true);
		}

		this.topToolBar.createEl("label", {
			attr: { for: "wholeTextAsContextRadioButton" },
		}).innerText = "整篇笔记";
		this.wholeTextAsContextRadioButton = this.topToolBar.createEl("input", {
			attr: {
				type: "radio",
				id: "wholeTextAsContextRadioButton",
				name: "contextRadioButton",
			},
		});
		if (this.selectedText === "") {
			this.wholeTextAsContextRadioButton.setAttr("checked", true);
		}

		if (this.selectedText === "") {
			this.topToolBar.style.display = "none";
		}

		new Setting(contentEl)
			.addText((text) => {
				this.inputEl = text.inputEl; // 获取 input 元素的引用
				this.inputEl.placeholder = "Ask Obsidian AI bot";
				this.inputEl.addEventListener("keydown", (event) => {
					if (event.key === "Enter") {
						event.preventDefault(); // 阻止默认的回车行为
						this.onOk(); // 触发按钮的点击事件
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

		// 结果显示区域
		this.displayEl = contentEl.createEl("div", {
			attr: { id: "display" },
		});

		// 底部工具栏
		this.bottomToolBar = contentEl.createEl("div", {
			attr: { id: "bottomToolBar" },
		});

		this.copyButton = this.bottomToolBar.createEl("button", {
			attr: { id: "copyButton" },
		});
		this.copyButton.textContent = "复制";
		this.copyButton.addEventListener("click", () => this.copyResult());

		if (this.selectedText !== "") {
			this.replaceSelectionButton = this.bottomToolBar.createEl(
				"button",
				{
					attr: { id: "replaceSelectionButton" },
				}
			);
			this.replaceSelectionButton.textContent = "替换选中";
			this.replaceSelectionButton.addEventListener("click", () =>
				this.replaceSelection()
			);
		}

		this.insertToCursorPosButton = this.bottomToolBar.createEl("button", {
			attr: { id: "insertToCursorPosButton" },
		});
		this.insertToCursorPosButton.textContent = "插入光标位置";
		this.insertToCursorPosButton.addEventListener("click", () =>
			this.insertToCursorPos()
		);

		this.appendToTailButton = this.bottomToolBar.createEl("button", {
			attr: { id: "appendToTailButton" },
		});
		this.appendToTailButton.textContent = "追加到末尾";
		this.appendToTailButton.addEventListener("click", () =>
			this.appendToTail()
		);

		// 等待框
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
		this.enableOkButton(true);
	}

	insertToCursorPos() {
		const editor = this.getEditor();
		const textToInsert = this.getResult();

		if (!editor) {
			return;
		}
		// 获取当前光标位置
		const cursor = editor.getCursor();

		// 在光标位置插入文本
		editor.replaceRange("\n" + textToInsert + "\n", cursor);

		// 将光标移动到插入文本的末尾
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

		// 获取当前编辑器的内容
		const currentContent = editor.getValue();

		// 在末尾追加文本
		const newContent = currentContent + "\n\n" + textToAppend;

		// 设置新的编辑器内容
		editor.setValue(newContent);

		// 获取编辑器的最后一行的行号
		const lastLine = editor.lastLine();

		// 获取最后一行的内容
		const lastLineContent = editor.getLine(lastLine);

		// 将光标移动到最后一行的末尾
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

		// 将文本复制到剪贴板
		navigator.clipboard
			.writeText(textToCopy)
			.then(() => {
				// 用 Notice 提示复制成功
				new Notice("文本已成功复制到剪贴板");
			})
			.catch((error) => {
				// 处理复制失败的情况
				new Notice("复制失败，请重试");
				console.error("复制失败:", error);
			});
	}

	getResult(): string {
		return this.displayEl.innerText;
	}

	getEditor(): Editor | null {
		// 获取当前活动的 MarkdownView
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			return view.editor;
		}
		return null;
	}

	appendToDisplay(markdownText: string) {
		// const htmlContent = this.marked.parseInline(markdownText);
		markdownText = markdownText.replace("\n", "<br />");
		if (this.displayEl) {
			this.displayEl.innerHTML += markdownText;

			// 滚动到底部
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
		this.enableOkButton(false);

		let context = this.wholeText;
		if (
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

	enableOkButton(enable: boolean) {
		this.okButton.disabled = !enable;
		this.inputEl.disabled = !enable;
	}

	clearDisplay() {
		this.displayEl.innerHTML = "";
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
