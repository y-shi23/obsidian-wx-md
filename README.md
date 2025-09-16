# Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses TypeScript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does.

This sample plugin demonstrates some of the basic functionality the plugin API can do.
- Adds a ribbon icon, which shows a Notice when clicked.
- Adds a command "Open Sample Modal" which opens a Modal.
- Adds a plugin setting tab to the settings page.
- Registers a global click event and output 'click' to the console.
- Registers a global interval which logs 'setInterval' to the console.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation

See https://github.com/obsidianmd/obsidian-api

---


# Obsidian 示例插件

这是 Obsidian (https://obsidian.md) 的一个示例插件。

该项目使用 TypeScript 提供类型检查和文档。
仓库依赖最新的插件 API (obsidian.d.ts) 的 TypeScript 定义格式，其中包含描述其功能的 TSDoc 注释。

此示例插件演示了插件 API 可以实现的一些基本功能：
- 添加一个功能区图标，点击时显示通知。
- 添加"打开示例模态框"命令，用于打开模态框。
- 在设置页面添加插件设置选项卡。
- 注册全局点击事件并在控制台输出 'click'。
- 注册全局定时器，定时在控制台记录 'setInterval'。

## 首次开发插件？

新插件开发者的快速入门指南：

- 查看[是否已有人开发了你想要的插件](https://obsidian.md/plugins)！可能已有类似的插件，你可以与之合作。
- 使用"Use this template"按钮将此仓库作为模板复制（如果看不到该按钮请登录 GitHub）。
- 将你的仓库克隆到本地开发文件夹。为方便起见，你可以将此文件夹放在你的 `.obsidian/plugins/your-plugin-name` 文件夹中。
- 安装 NodeJS，然后在你的仓库文件夹下运行 `npm i`。
- 运行 `npm run dev` 将你的插件从 `main.ts` 编译到 `main.js`。
- 修改 `main.ts`（或创建新的 `.ts` 文件）。这些更改应该会自动编译到 `main.js` 中。
- 重新加载 Obsidian 以加载新版本的插件。
- 在设置窗口中启用插件。
- 要更新 Obsidian API，请在你的仓库文件夹下运行 `npm update`。

## 发布新版本

- 使用新版本号更新你的 `manifest.json`，例如 `1.0.1`，以及你的最新版本所需的最低 Obsidian 版本。
- 更新你的 `versions.json` 文件，添加 `"new-plugin-version": "minimum-obsidian-version"`，以便旧版本的 Obsidian 可以下载与之兼容的旧版本插件。
- 使用新版本号作为"Tag version"创建新的 GitHub 发布。使用确切的版本号，不要包含前缀 `v`。示例请见：https://github.com/obsidianmd/obsidian-sample-plugin/releases
- 上传文件 `manifest.json`、`main.js`、`styles.css` 作为二进制附件。注意：manifest.json 文件必须在两个地方，首先是在你仓库的根路径，其次是在发布中。
- 发布该版本。

> 在 `manifest.json` 中手动更新 `minAppVersion` 后，你可以通过运行 `npm version patch`、`npm version minor` 或 `npm version major` 来简化版本升级过程。
> 该命令将提升 `manifest.json` 和 `package.json` 中的版本，并将新版本的条目添加到 `versions.json` 中。

## 将你的插件添加到社区插件列表

- 查看[插件指南](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)。
- 发布初始版本。
- 确保你的仓库根目录中有 `README.md` 文件。
- 在 https://github.com/obsidianmd/obsidian-releases 提交拉取请求以添加你的插件。

## 如何使用

- 克隆此仓库。
- 确保你的 NodeJS 至少为 v16 版本（`node --version`）。
- 运行 `npm i` 或 `yarn` 安装依赖项。
- 运行 `npm run dev` 启动监听模式编译。

## 手动安装插件

- 将 `main.js`、`styles.css`、`manifest.json` 复制到你的仓库 `VaultFolder/.obsidian/plugins/your-plugin-id/`。

## 使用 eslint 提高代码质量（可选）
- [ESLint](https://eslint.org/) 是一种分析你的代码以快速发现问题的工具。你可以对插件运行 ESLint 来发现常见错误和改进代码的方法。
- 要在此项目中使用 eslint，请确保从终端安装 eslint：
  - `npm install -g eslint`
- 要使用 eslint 分析此项目，请使用此命令：
  - `eslint main.ts`
  - eslint 将创建一个报告，按文件和行号提供代码改进建议。
- 如果你的源代码在文件夹中，比如 `src`，你可以使用此命令对其中的所有文件进行 eslint 分析：
  - `eslint .\src\`

## 资助链接

你可以包含资助链接，让你插件的使用者可以进行资金支持。

简单的方法是在你的 `manifest.json` 文件中设置 `fundingUrl` 字段为你的链接：

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

如果你有多个链接，也可以这样做：

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API 文档

参见 https://github.com/obsidianmd/obsidian-api