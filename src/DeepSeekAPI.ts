import OpenAI from "openai";
import ObsidianAiBotPlugin from "src/main";

export class DeepSeekAPI {
	plugin: ObsidianAiBotPlugin;
	openai: OpenAI;
	cancel: boolean;

	onResult: (text: string) => void;
	onFinish: () => void;
	onError: (msg: string) => void;

	constructor(
		plugin: ObsidianAiBotPlugin,
		onResult: (text: string) => void,
		onFinish: () => void,
		onError: (msg: string) => void
	) {
		this.plugin = plugin;
		this.openai = new OpenAI({
			baseURL: this.plugin.settings.baseURL,
			apiKey: this.plugin.settings.apiKey,
			dangerouslyAllowBrowser: true,
		});
		this.onResult = onResult;
		this.onFinish = onFinish;
		this.onError = onError;
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

		try {
			const stream = await this.openai.chat.completions.create({
				model: this.plugin.settings.model,
				messages: [
					{ role: "system", content: "You are a helpful assistant" },
					{ role: "user", content: userInput },
				],
				max_tokens: this.plugin.settings.maxTokens,
				stream: true,
			});

			for await (const chunk of stream) {
				if (this.cancel) {
					break;
				}
				const text = chunk.choices[0]?.delta?.content || "";

				if (this.onResult) {
					console.log(text);
					this.onResult(text);
				}
			}

			if (this.onFinish) {
				this.onFinish();
			}
		} catch (error) {
			console.error("Error occurred during AI request:", error);

			if (this.onError) {
				this.onError(error.message);
			}
		}
	}
}
