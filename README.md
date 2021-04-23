<h1 align="center">Welcome to bilibili-downloader 👋</h1>

<p align="center">
❗❗❗ 下载1080 60P清晰度以上视频需要自行<b>开通大会员</b> ❗❗❗ <br />
❗❗❗ 该工具仅仅监听个人动态更新的视频，也就是说，你需要<b>关注UP主</b> ❗❗❗
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/ZhelinCheng/bilibili-downloader#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/ZhelinCheng/bilibili-downloader/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/ZhelinCheng/bilibili-downloader/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/ZhelinCheng/bilibili-downloader" />
  </a>
  <a href="https://nodejs.org/en/" target="_blank">
    <img alt="Node" src="https://img.shields.io/badge/Node.js-%3E%3D7.6.0-green.svg" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-%3E%3D3.0-green.svg" />
  </a>
</p>

> B 站个人动态视频下载助手，支持下载B站个人动态更新的4k视频，运行该程序后，你所关注的UP主更新的视频第一时间下载保存。妈妈再也不担心我没时间下载视频啦！🎉

![bilibili-downloader](https://cdn.jsdelivr.net/gh/ZhelinCheng/storage@master/picture/78ZrEH_55.png)

### 🏠 [Homepage](https://github.com/ZhelinCheng/bilibili-downloader#readme)

## 使用

本应用基于 NodeJS 12.19.0 开发，使用前请保证你的 Node 版本大于等于 12。_需要注意的是，只有你是大会员才会下载 4k/1080 60+等会员专享清晰度，如果不是大会员只能下载普通清晰度的视频_，本程序不会去突破 B 站的清晰度限制，如果需要保存高清的视频，在活动期间开上一年的大会员，是十分划算的。

本程序支持视频保存本地及保存到 FTP 服务器，如何配置将在下面说明。

### 安装

```sh
# 克隆当前项目
git clone https://github.com/ZhelinCheng/bilibili-downloader.git && cd bilibili-downloader

# 如果你安装了yarn
yarn install
# 或者使用npm
npm install
```

### 运行

```sh
yarn start
# 或者
npm run start
```

如果你使用的是 pm2，那么该项目也提供了`ecosystem.config.js`，你仅需执行它即可。

### 开发

```sh
yarn dev
# 或者
npm run dev
```

## 配置

使用本程序需要在项目根目录`.env`的环境变量文件，如果不设置该文件，程序不会执行。

需要注意的是，*本地保存*和*FTP 保存*不会同时进行，程序判断有`BILIBILI_FTP_HOST`与`BILIBILI_FTP_PASS`参数时，会自动选择 FTP 保存视频，如果仅仅保存到本地，请不要配置这两项参数。

```sh
# 必填 B站账户Cookie
# 不知道如何获取，请查看：https://jingyan.baidu.com/article/5d368d1ea6c6e33f60c057ef.html
BILIBILI_COOKIE = "登录站后的Cookie"

# 选填 执行间隔（单位分钟），不填则每分钟执行一次
BILIBILI_LISTEN_INTERVAL = "3"

# 选填 必须要包含的UP主，填写UP主UID，多个UP主使用管道符（|）间隔
BILIBILI_INCLUDE_UID = ""

# 选填 必须包含的视频及UP主关键字，使用管道符（|）间隔
BILIBILI_INCLUDE_KW = "宅舞|韩舞|中国舞"

# 选填 排除以下UP主，填写UP主UID，多个UP主使用管道符（|）间隔
BILIBILI_EXCLUDE_UID = ""

# 选填 视频保存到本地的地址，例：/home/xxx/output，默认保存到项目根目录下的output文件夹
BILIBILI_OUTPUT_PATH = ""

# 选填 频保存到FTP的地址，例：/BotBackup/Bilibili
BILIBILI_FTP_PATH = ""
BILIBILI_FTP_HOST = "10.0.0.3"
BILIBILI_FTP_USER = "bilibili"
BILIBILI_FTP_PASS = "password"

```

## 🤝 贡献

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/ZhelinCheng/bilibili-downloader/issues). You can also take a look at the [contributing guide](https://github.com/ZhelinCheng/bilibili-downloader/blob/master/CONTRIBUTING.md).

## ⭐️ 表示支持

如果你觉得这个项目对你有帮助，欢迎点亮 ⭐️ 来支持我！

## 📝 协议

Copyright © 2021 [ZhelinCheng](https://github.com/ZhelinCheng).<br />
This project is [MIT](https://github.com/ZhelinCheng/bilibili-downloader/blob/master/LICENSE) licensed.
