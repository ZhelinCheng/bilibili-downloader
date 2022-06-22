<h1 align="center">Welcome to bilibili-downloader 👋</h1>

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

![bilibili-downloader](https://cdn.jsdelivr.net/gh/ZhelinCheng/storage@master/picture/78ZrEH_55.png)

### 🏠 [Homepage](https://github.com/ZhelinCheng/bilibili-downloader#readme)

## 使用

本应用基于 NodeJS 12.19.0 开发，使用前请保证你的 Node 版本大于等于 12。**需要注意的是，只有你是大会员才会下载 4k / 1080 60 帧等会员专享清晰度，如果不是大会员只能下载普通 1080P 清晰度的视频**，本程序不会去突破 B 站的清晰度限制，如果需要保存高清的视频，在活动期间开上一年的大会员，是十分划算的。

本应用监听的是用户的**动态**第一页，为了保证下载不遗漏，最好是 24 小时运行，这就需要小伙伴有一定的设备让本程序不间断运行。

本程序支持视频保存本地及保存到 FTP 服务器，如何配置将在下面说明。

### 安装

首先你需要[下载 NodeJs](https://nodejs.org/en/)，进入后选择**LTS**版本。NodeJS 会附带自动安装 NPM，所以 NodeJS 安装完成后即可运行程序。

你可以克隆 master 分支，或者直接到[Releases 下载](https://github.com/ZhelinCheng/bilibili-downloader/releases)最新版本解压，进入目录执行：

```sh
# 使用npm安装依赖
npm install

# 执行build命令，每一次更新都需要build一次
npm run build
```

### 运行

```sh
npm run start
```

如果你使用的是 pm2，那么该项目也提供了`ecosystem.config.js`，你仅需执行它即可。

### 开发

```sh
npm run dev
```

## 配置

使用本程序需要在项目根目录`.env`的环境变量文件，如果不设置该文件，程序不会执行。

需要注意的是，**本地保存**和**FTP 保存**不会同时进行，程序判断有`BILIBILI_FTP_HOST`与`BILIBILI_FTP_PASS`参数时，会自动选择 FTP 保存视频，如果仅仅保存到本地，请不要配置这两项参数。

```sh
# 必填 B站账户Cookie
# 不知道如何获取，请查看：https://jingyan.baidu.com/article/5d368d1ea6c6e33f60c057ef.html
BILIBILI_COOKIE = "登录B站后的Cookie"

# 选填 执行间隔（单位分钟），不填则每分钟执行一次
BILIBILI_LISTEN_INTERVAL = "3"

# 选填 必须要包含的UP主，填写UP主UID，多个UP主使用管道符（|）间隔
# 你可以在根目录创建 .include 文件，并将UID一行一个的填写进去，该文件会与下面配置同时生效；
BILIBILI_INCLUDE_UID = ""

# 选填 必须包含的视频及UP主关键字，使用管道符（|）间隔
BILIBILI_INCLUDE_KW = "宅舞|韩舞|中国舞"

# 选填 排除以下UP主，填写UP主UID，多个UP主使用管道符（|）间隔
# 你可以在根目录创建 .exclude 文件，并将UID一行一个的填写进去，该文件会与下面配置同时生效；
BILIBILI_EXCLUDE_UID = ""

# 选填 视频保存到本地的地址，例：/home/xxx/output，默认保存到项目根目录下的output文件夹
BILIBILI_OUTPUT_PATH = ""

# 选填 视频保存到FTP的地址，例：/BotBackup/Bilibili
BILIBILI_FTP_PATH = "/Backup/Bilibili"
BILIBILI_FTP_HOST = "10.0.0.3"
BILIBILI_FTP_USER = "bilibili"
BILIBILI_FTP_PASS = "password"

# 限制视频时长 (单位:秒) 超过此时长的视频不会被下载
LIMIT_DURATION = 600
```

## 使用 Docker

以下为镜像构建和容器启动示例:

```sh
# 创建构建目录:
mkdir -p /data/docker/bilibili-downloader

# 下载配置模板并根据模板创建配置文件:
# 无需在 `.env` 文件中配置 `BILIBILI_OUTPUT_PATH`
cd /data/docker/bilibili-downloader
wget https://raw.githubusercontent.com/ZhelinCheng/bilibili-downloader/master/env_template -O .env
vim .env

# 下载 Dockerfile:
wget https://raw.githubusercontent.com/ZhelinCheng/bilibili-downloader/master/Dockerfile

# 构建镜像:
docker build -t bilibili-downloader .

# 使用镜像启动容器
docker run -d --name bilibili-downloader \
  -v /data/docker/bilibili-downloader/.env:/bilibili-downloader/.env \
  -v /data/docker/bilibili-downloader/download:/bilibili-downloader/output \
  bilibili-downloader:latest
```

如果你完全复制和执行了以上命令:
项目的配置文件将存储在: `/data/docker/bilibili-downloader/.env`
下载后的视频将存储在: `/data/docker/bilibili-downloader/download`

## 🤝 贡献

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/ZhelinCheng/bilibili-downloader/issues). You can also take a look at the [contributing guide](https://github.com/ZhelinCheng/bilibili-downloader/blob/master/CONTRIBUTING.md).

## ⭐️ 表示支持

如果你觉得这个项目对你有帮助，欢迎点亮 ⭐️ 来支持我！

## 📝 协议

Copyright © 2021 [ZhelinCheng](https://github.com/ZhelinCheng).<br />
This project is [MIT](https://github.com/ZhelinCheng/bilibili-downloader/blob/master/LICENSE) licensed.
