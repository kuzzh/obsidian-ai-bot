import OpenAI from "openai";
import ObsidianAiBotPlugin from "main";

export class DeepSeekAPI {
	plugin: ObsidianAiBotPlugin;
	openai: OpenAI;
	cancel: boolean;

	onResult: (text: string) => void;
	onFinish: () => void;

	constructor(
		plugin: ObsidianAiBotPlugin,
		onResult: (text: string) => void,
		onFinish: () => void
	) {
		this.plugin = plugin;
		this.openai = new OpenAI({
			baseURL: this.plugin.settings.baseURL,
			apiKey: this.plugin.settings.apiKey,
			dangerouslyAllowBrowser: true,
		});
		this.onResult = onResult;
		this.onFinish = onFinish;
		this.cancel = false;
	}

	async askAI(userInput: string, contextText: string) {
		if (userInput === "") {
			return;
		}
		this.cancel = false;

		if (contextText) {
			userInput = `针对以下文字，${userInput}\n\n${contextText}`;
		}
		const stream = await this.openai.chat.completions.create({
			model: this.plugin.settings.model,
			messages: [
				{ role: "system", content: "你是一个有用的助手。" },
				{ role: "user", content: userInput },
			],
			max_tokens: 4096,
			stream: true, // 启用流式返回
		});

		for await (const chunk of stream) {
			if (this.cancel) {
				break;
			}
			// console.log(chunk);

			const text = chunk.choices[0]?.delta?.content || "";

			if (this.onResult) {
				this.onResult(text);
			}
		}

		if (this.onFinish) {
			this.onFinish();
		}
	}
}
