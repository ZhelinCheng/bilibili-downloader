<h1 align="center">Welcome to bilibili-downloader 2.0 👋</h1>

<p align="center">
❗❗❗ 下载1080 60帧清晰度以上视频需要自行<b>开通大会员</b>，普通用户仅仅下载1080P ❗❗❗ <br />
❗❗❗ 该工具会监听B站个人动态，发现你关注的UP主更新了视频，它就会下载。也就是说，你需要<b>关注UP主</b> ❗❗❗
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/github/package-json/v/ZhelinCheng/bilibili-downloader.svg" />
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
    <img alt="Node" src="https://img.shields.io/badge/Node.js-%3E%3D12.0-green.svg" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-%3E%3D3.0-green.svg" />
  </a>
</p>

> B 站个人动态视频下载助手，支持下载 B 站个人动态更新的 4k 视频，运行该程序后，你所关注的 UP 主更新的视频第一时间下载保存。妈妈再也不担心我没时间下载视频啦！🎉

<center>
<img src="./img1.png"/>
<img src="./img2.png"/>
</center>
### 🏠 [Homepage](https://github.com/ZhelinCheng/bilibili-downloader#readme)

## 使用

本应用基于 NodeJS 14 开发，使用前请保证你的 Node 版本大于等于 14。**需要注意的是，只有你是大会员才会下载 4k / 1080 60 帧等会员专享清晰度，如果不是大会员只能下载普通 1080P 清晰度的视频**，本程序不会去突破 B 站的清晰度限制，如果需要保存高清的视频，在活动期间开上一年的大会员，是十分划算的。

本应用监听的是用户的**动态**第一页，为了保证下载不遗漏，最好是 24 小时运行，这就需要小伙伴有一定设备成本。

本程序支持视频保存本地及保存到 FTP 服务器，如何配置将在下面说明。

### 使用

必须的自行提前安装的工具类库，MacOS 和 Linux 平台一般是已经安装过的，不需要自行安装：

[ffmpeg 下载](https://ffmpeg.org/download.html)：用于视频合成

[sqlite3 下载](https://www.sqlite.org/download.html)：用于存储配置及下载信息

#### 1. 检查前置依赖

```sh
# 检查ffmpeg
ffmpeg -version

# 检查sqlite3
sqlite3 -version
```

#### 2. Node 安装构建

```sh
# sqlite3在Windows系统上可能会安装失败，手动自行安装sqlite@5.0.2
npm install

# 执行build命令，每一次更新都需要build一次
npm run build
```

#### 3. 运行

```sh
npm run start
```

如果你使用的是 pm2，那么该项目也提供了`ecosystem.config.js`，你仅需执行它即可。

### 开发

```sh
npm run start:dev
```

## 🤝 贡献

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/ZhelinCheng/bilibili-downloader/issues). You can also take a look at the [contributing guide](https://github.com/ZhelinCheng/bilibili-downloader/blob/master/CONTRIBUTING.md).

## ⭐️ 表示支持

如果你觉得这个项目对你有帮助，欢迎点亮 ⭐️ 来支持我！

## 📝 协议

Copyright © 2021 [ZhelinCheng](https://github.com/ZhelinCheng).<br />
This project is [MIT](https://github.com/ZhelinCheng/bilibili-downloader/blob/master/LICENSE) licensed.
