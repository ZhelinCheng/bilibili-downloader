FROM node:lts

# ENV BLI_PORT 2233

WORKDIR /app

COPY . /app
# 设置时区为东八区
ENV TZ=Asia/Shanghai

RUN npm config set registry https://registry.npm.taobao.org/
RUN corepack enable
RUN corepack prepare yarn@stable --activate
RUN yarn install --production
RUN npm run build
RUN rm -rf node_modules
RUN yarn install --production

RUN apt-get update
RUN apt-get install ffmpeg sqlite3 -y

# EXPOSE 2233
CMD ["npm", "start"]
