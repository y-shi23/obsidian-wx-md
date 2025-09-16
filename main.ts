import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { createDefaultRenderer, convert, IOpts } from './src/md-core';
import { defaultTheme, THEME_VARIANTS } from './src/md-core/theme';
import { copyWeChatRich } from './src/md-core/wechatCopy';
import { WechatPreviewView, WECHAT_PREVIEW_VIEW_TYPE } from './src/WechatPreviewView';

// Remember to rename these classes and interfaces!

interface WechatMDSettings {
	theme: 'default' | 'classic' | 'elegant' | 'simple'
	// 基础排版
	fontSize: string
	fontFamily: string // 正文字体族标识（从预设中选）
	codeFontFamily: string // 等宽字体族标识（从预设中选）
	lineHeight: string
	letterSpacing: string
	containerWidth: string
	primaryColor: string
	blockquoteBg: string
	// 行为开关
	indent: boolean
	justify: boolean
	citeLinks: boolean
	showLineNumber: boolean // 预留：当前尚未实现行号渲染
	macCode: boolean // 预留：Mac 风格代码块装饰
	countStatus: boolean // 是否显示字数/阅读时间统计
	codeTheme: string // 代码高亮主题名称
}

const DEFAULT_SETTINGS: WechatMDSettings = {
	theme: 'classic',
	fontSize: '14px',
	fontFamily: 'sans',
	codeFontFamily: 'mono',
	lineHeight: '1.75',
	letterSpacing: '0.1em',
	containerWidth: '760px',
	primaryColor: '#4a9dff',
	blockquoteBg: '#f7f7f7',
	indent: false,
	justify: false,
	citeLinks: false,
	showLineNumber: false,
	macCode: true,
	countStatus: true,
	codeTheme: 'nord',
}

// 预设字体族
const BODY_FONT_PRESETS: Record<string, string> = {
	sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	serif: 'Georgia, "Times New Roman", Times, serif',
	readable: 'Optima, Candara, "Noto Sans", "Source Sans Pro", Arial, sans-serif',
	classic: 'Helvetica, Arial, sans-serif',
}
const CODE_FONT_PRESETS: Record<string, string> = {
	mono: 'Menlo, Consolas, Monaco, "Courier New", monospace',
	jetbrains: '"JetBrains Mono", Menlo, Consolas, monospace',
	fira: '"Fira Code", Menlo, Consolas, monospace',
	source: '"Source Code Pro", Menlo, Consolas, monospace',
}

// 主题色预设（主色 + 引用背景搭配）
const THEME_COLOR_PRESETS: { name: string; primary: string; blockquoteBg: string }[] = [
	{ name: '默认蓝', primary: '#4a9dff', blockquoteBg: '#f7f7f7' },
	{ name: '墨黑', primary: '#222222', blockquoteBg: '#f2f2f2' },
	{ name: '祖母绿', primary: '#2f9962', blockquoteBg: '#f1f8f5' },
	{ name: '暮光橙', primary: '#ff7e29', blockquoteBg: '#fff4ec' },
	{ name: '葡萄紫', primary: '#6f42c1', blockquoteBg: '#f6f0ff' },
	{ name: '玫红', primary: '#d63384', blockquoteBg: '#fff0f6' },
	{ name: '远山黛', primary: '#4a5e82', blockquoteBg: '#f4f6fa' },
	{ name: '青色', primary: '#099eaf', blockquoteBg: '#e9fbfd' },
	{ name: '极光青', primary: '#00a08a', blockquoteBg: '#e6faf7' },
	{ name: '品红', primary: '#c21460', blockquoteBg: '#fff0f6' },
	{ name: '长春花', primary: '#6667ab', blockquoteBg: '#f3f4fe' },
]

// 代码高亮主题（仅放置颜色 token，真实生成在注入位置使用）
const CODE_THEME_TOKENS: Record<string, Record<string, string>> = {
	nord: { bg: '#2e3440', text: '#eceff4', keyword: '#81a1c1', string: '#a3be8c', number: '#b48ead', comment: '#616e88', func: '#88c0d0' },
	githubLight: { bg: '#f6f8fa', text: '#24292e', keyword: '#d73a49', string: '#032f62', number: '#005cc5', comment: '#6a737d', func: '#6f42c1' },
	dracula: { bg: '#282a36', text: '#f8f8f2', keyword: '#ff79c6', string: '#f1fa8c', number: '#bd93f9', comment: '#6272a4', func: '#50fa7b' },
	monokai: { bg: '#272822', text: '#f8f8f2', keyword: '#f92672', string: '#a6e22e', number: '#ae81ff', comment: '#75715e', func: '#66d9ef' },
	oneDark: { bg: '#282c34', text: '#abb2bf', keyword: '#c678dd', string: '#98c379', number: '#d19a66', comment: '#5c6370', func: '#61afef' },
}

export default class MyPlugin extends Plugin {
	settings: WechatMDSettings;
	renderer = createDefaultRenderer();

	async onload() {
		await this.loadSettings();
		// 注册自定义视图
		this.registerView(WECHAT_PREVIEW_VIEW_TYPE, (leaf) => new WechatPreviewView(leaf, this));

		const ribbonIconEl = this.addRibbonIcon('dice', '复制为公众号富文本', async () => {
			await this.convertActiveFile({ copy: true });
		});
		ribbonIconEl.addClass('wechat-md-ribbon');

		// 新增：独立预览视图按钮
		const previewRibbon = this.addRibbonIcon('layout', '打开公众号预览视图', async () => {
			await this.activatePreviewView();
		});
		previewRibbon.addClass('wechat-md-preview-ribbon');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		this.addCoreCommands();
		this.addCommand({
			id: 'wechat-md-open-preview-pane',
			name: '打开公众号预览侧栏',
			callback: async () => { await this.activatePreviewView(); }
		});
		this.addCommand({
			id: 'wechat-md-focus-preview-pane',
			name: '聚焦公众号预览侧栏',
			checkCallback: (checking) => {
				const leaf = this.app.workspace.getLeavesOfType(WECHAT_PREVIEW_VIEW_TYPE)[0];
				if (leaf) { if (!checking) this.app.workspace.revealLeaf(leaf); return true; }
			}
		});

    this.addSettingTab(new WechatMDSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	private buildThemedOptions(): Partial<IOpts> {
		// 基于默认主题构造一个可修改副本
		const baseTheme = THEME_VARIANTS[this.settings.theme] || defaultTheme;
		const themeClone = JSON.parse(JSON.stringify(baseTheme));
		// 覆盖基础色与行高
		themeClone.base['--md-primary-color'] = this.settings.primaryColor;
		themeClone.base['--blockquote-background'] = this.settings.blockquoteBg; // 供 renderer 输出 & 复制过程替换
		themeClone.base['line-height'] = this.settings.lineHeight;
		themeClone.base['font-family'] = BODY_FONT_PRESETS[this.settings.fontFamily] || this.settings.fontFamily;
		themeClone.base['font-size'] = this.settings.fontSize;
		// 段落字距
		if (themeClone.block.p) themeClone.block.p['letter-spacing'] = this.settings.letterSpacing;
		// 代码字体
		const codeFont = CODE_FONT_PRESETS[this.settings.codeFontFamily] || this.settings.codeFontFamily;
		if (themeClone.block.code) themeClone.block.code['font-family'] = codeFont;
		// 行内代码也增加字体（若需要）
		if (themeClone.inline.codespan) themeClone.inline.codespan['font-family'] = codeFont;
		// 容器宽度（用于包裹）
		if (themeClone.block.container) {
			themeClone.block.container['max-width'] = this.settings.containerWidth;
			themeClone.block.container['margin'] = '0 auto';
		}
		return {
			theme: themeClone,
			fonts: BODY_FONT_PRESETS[this.settings.fontFamily] || this.settings.fontFamily,
			size: this.settings.fontSize,
			isUseIndent: this.settings.indent,
			isUseJustify: this.settings.justify,
			citeStatus: this.settings.citeLinks,
			countStatus: this.settings.countStatus,
			isMacCodeBlock: this.settings.macCode,
			isShowLineNumber: this.settings.showLineNumber,
			codeThemeName: this.settings.codeTheme,
			codeColorMap: CODE_THEME_TOKENS[this.settings.codeTheme] || CODE_THEME_TOKENS['nord'],
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.renderer.setOptions(this.buildThemedOptions());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.renderer.setOptions(this.buildThemedOptions());
		// 广播设置已更新，预览可监听
		// @ts-ignore 自定义事件
		this.app.workspace.trigger('wechat-md-settings-changed');
	}

		getActiveMarkdownFile(): TFile | null {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view && view.file && view.file.extension === 'md') return view.file;
			return null;
		}

		async convertActiveFile(options: { copy?: boolean; preview?: boolean; export?: boolean }) {
			const file = this.getActiveMarkdownFile();
			if (!file) {
				new Notice('未找到当前 Markdown 文件');
				return;
			}
			const content = await this.app.vault.read(file);
			const rawHtml = convert(content, this.renderer);
			const finalHtml = this.postProcess(rawHtml);
			if (options.copy) {
				try {
					const result = await copyWeChatRich({ html: finalHtml, primaryColor: this.settings.primaryColor, blockquoteBg: this.settings.blockquoteBg });
					console.debug('[wechat-copy] copy method =', result.method);
					new Notice('已复制为公众号富文本，可直接粘贴 (' + result.method + ')');
				} catch (e) {
					console.error('[wechat-copy] failed', e);
					new Notice('复制失败：请按 Ctrl+Shift+I 打开开发者工具查看 Console 日志');
				}
			}
			if (options.preview) {
				new HtmlPreviewModal(this.app, finalHtml).open();
			}
			if (options.export) {
				const exportPath = file.path.replace(/\.md$/, '.wx.html');
						// 如果已存在则覆盖
						const existing = this.app.vault.getAbstractFileByPath(exportPath);
						if (existing && existing instanceof TFile) {
							await this.app.vault.modify(existing, finalHtml);
						} else {
							await this.app.vault.create(exportPath, finalHtml);
						}
				new Notice('已导出 HTML: ' + exportPath);
			}
		}

	convertRaw(md: string) {
		const rawHtml = convert(md, this.renderer);
		return this.postProcess(rawHtml);
	}

	private postProcess(html: string) {
		// 后续可追加统一样式注入
		return html;
	}

	private async activatePreviewView() {
		const rightLeaf = this.app.workspace.getRightLeaf(false) || this.app.workspace.getRightLeaf(true);
		if (rightLeaf) {
			await rightLeaf.setViewState({ type: WECHAT_PREVIEW_VIEW_TYPE, active: true });
			this.app.workspace.revealLeaf(rightLeaf);
		}
	}

	private addCoreCommands() {
		this.addCommand({
			id: 'wechat-md-copy-rich',
			name: '复制当前笔记（公众号富文本）',
			checkCallback: (checking) => {
				const file = this.getActiveMarkdownFile();
				if (file) { if (!checking) this.convertActiveFile({ copy: true }); return true; }
			}
		});
		this.addCommand({
			id: 'wechat-md-preview',
			name: '在弹窗预览当前笔记公众号 HTML',
			checkCallback: (checking) => {
				const file = this.getActiveMarkdownFile();
				if (file) { if (!checking) this.convertActiveFile({ preview: true }); return true; }
			}
		});
		this.addCommand({
			id: 'wechat-md-export-file',
			name: '导出当前笔记公众号 HTML 到同目录',
			checkCallback: (checking) => {
				const file = this.getActiveMarkdownFile();
				if (file) { if (!checking) this.convertActiveFile({ export: true }); return true; }
			}
		});
	}
}

			class HtmlPreviewModal extends Modal {
				constructor(app: App, private html: string) { super(app); }
				onOpen() {
					const { contentEl } = this;
					contentEl.empty();
					const container = contentEl.createDiv({ cls: 'wechat-md-preview' });
					container.setAttr('style', 'max-height:60vh;overflow:auto;padding:12px;');
					container.innerHTML = this.html;
				}
				onClose() { this.contentEl.empty(); }
			}

	class WechatMDSettingTab extends PluginSettingTab {
		plugin: MyPlugin;
		constructor(app: App, plugin: MyPlugin) { super(app, plugin); this.plugin = plugin; }
		display(): void {
			const { containerEl } = this;
			containerEl.empty();
			containerEl.createEl('h3', { text: 'Wechat Markdown 设置' });

			containerEl.createEl('h4', { text: '排版' });
			new Setting(containerEl).setName('主题风格').setDesc('classic / elegant / simple').addDropdown(d => {
				(['classic','elegant','simple'] as const).forEach(k => d.addOption(k, k))
					d.setValue(this.plugin.settings.theme).onChange(async v => { this.plugin.settings.theme = v as ('classic'|'elegant'|'simple'|'default'); await this.plugin.saveSettings(); })
			});
			new Setting(containerEl).setName('字体大小').setDesc('示例: 14px / 1rem').addText(t => t.setPlaceholder('14px').setValue(this.plugin.settings.fontSize).onChange(async v => { this.plugin.settings.fontSize = v || '14px'; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('正文字体').setDesc('选择一个预设或手动修改 settings.json').addDropdown(d => {
				Object.keys(BODY_FONT_PRESETS).forEach(k => d.addOption(k, k))
				d.setValue(this.plugin.settings.fontFamily).onChange(async v => { this.plugin.settings.fontFamily = v; await this.plugin.saveSettings(); })
			});
			new Setting(containerEl).setName('代码字体').addDropdown(d => {
				Object.keys(CODE_FONT_PRESETS).forEach(k => d.addOption(k, k))
				d.setValue(this.plugin.settings.codeFontFamily).onChange(async v => { this.plugin.settings.codeFontFamily = v; await this.plugin.saveSettings(); })
			});
			new Setting(containerEl).setName('行高 line-height').addText(t => t.setPlaceholder('1.75').setValue(this.plugin.settings.lineHeight).onChange(async v => { this.plugin.settings.lineHeight = v || '1.75'; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('字距 letter-spacing').addText(t => t.setPlaceholder('0.1em').setValue(this.plugin.settings.letterSpacing).onChange(async v => { this.plugin.settings.letterSpacing = v || '0.1em'; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('容器最大宽度').addText(t => t.setPlaceholder('760px').setValue(this.plugin.settings.containerWidth).onChange(async v => { this.plugin.settings.containerWidth = v || '760px'; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('主题色预设').setDesc('主色 + 引用背景联动').addDropdown(d => {
				THEME_COLOR_PRESETS.forEach(p => d.addOption(p.name, p.name))
				d.setValue(THEME_COLOR_PRESETS.find(p => p.primary === this.plugin.settings.primaryColor && p.blockquoteBg === this.plugin.settings.blockquoteBg)?.name || '默认蓝')
				.onChange(async v => {
					const preset = THEME_COLOR_PRESETS.find(p => p.name === v)
					if (preset) { this.plugin.settings.primaryColor = preset.primary; this.plugin.settings.blockquoteBg = preset.blockquoteBg; await this.plugin.saveSettings(); }
				})
			});
			new Setting(containerEl).setName('自定义主色').addText(t => t.setPlaceholder('#4a9dff').setValue(this.plugin.settings.primaryColor).onChange(async v => { this.plugin.settings.primaryColor = v || '#4a9dff'; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('自定义引用背景').addText(t => t.setPlaceholder('#f7f7f7').setValue(this.plugin.settings.blockquoteBg).onChange(async v => { this.plugin.settings.blockquoteBg = v || '#f7f7f7'; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('代码高亮主题').addDropdown(d => {
				Object.keys(CODE_THEME_TOKENS).forEach(k => d.addOption(k, k))
				d.setValue(this.plugin.settings.codeTheme).onChange(async v => { this.plugin.settings.codeTheme = v; await this.plugin.saveSettings(); })
			});

			containerEl.createEl('h4', { text: '行为' });
			new Setting(containerEl).setName('首行缩进').addToggle(t => t.setValue(this.plugin.settings.indent).onChange(async v => { this.plugin.settings.indent = v; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('两端对齐').addToggle(t => t.setValue(this.plugin.settings.justify).onChange(async v => { this.plugin.settings.justify = v; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('链接脚注引用').setDesc('为外链添加引用编号并集中列于文末').addToggle(t => t.setValue(this.plugin.settings.citeLinks).onChange(async v => { this.plugin.settings.citeLinks = v; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('显示代码行号').addToggle(t => t.setValue(this.plugin.settings.showLineNumber).onChange(async v => { this.plugin.settings.showLineNumber = v; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('Mac 风格代码栏').addToggle(t => t.setValue(this.plugin.settings.macCode).onChange(async v => { this.plugin.settings.macCode = v; await this.plugin.saveSettings(); }));
			new Setting(containerEl).setName('统计字数/阅读时间').addToggle(t => t.setValue(this.plugin.settings.countStatus).onChange(async v => { this.plugin.settings.countStatus = v; await this.plugin.saveSettings(); }));
		}
	}
