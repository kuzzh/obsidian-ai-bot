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
			userInput = `Based on the following text: ${userInput}\n\n${contextText}`;
		}
		const stream = await this.openai.chat.completions.create({
			model: this.plugin.settings.model,
			messages: [
				{ role: "system", content: "You are a helpful assistant" },
				{ role: "user", content: userInput },
			],
			max_tokens: 4096,
			stream: true,
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
