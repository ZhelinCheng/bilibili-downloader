FROM node:alpine

ARG REPO_URL=https://github.com/ZhelinCheng/bilibili-downloader
ARG REPO_BRANCH=master
ARG REPO_DIR=/bilibili-downloader

ENV LANG=zh_CN.UTF-8 \
    SHELL=/bin/bash

WORKDIR /bilibili-downloader

RUN set -x \
    && sed -i 's/dl-cdn.alpinelinux.org/mirrors.bfsu.edu.cn/g' /etc/apk/repositories \
    && apk update -f \
    && apk upgrade \
    && apk --no-cache add -f git \
    && rm -rf /var/cache/apk/* \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && mkdir /download \
    && npm config set registry https://registry.npmmirror.com \
    && npm add -g pm2 \
    && git clone -b ${REPO_BRANCH} ${REPO_URL} ${REPO_DIR} \
    && cd ${REPO_DIR} \
    && npm install \
    && npm run build

CMD ["pm2-runtime", "ecosystem.config.js"]
