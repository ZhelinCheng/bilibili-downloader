FROM node:lts

WORKDIR /app

COPY . /app
# 设置时区为东八区
ENV TZ=Asia/Shanghai

RUN apt-get update
RUN apt-get install ffmpeg sqlite3 -y

RUN corepack enable
RUN corepack prepare yarn@stable --activate
RUN yarn install
RUN npm run build
RUN rm -rf node_modules
RUN yarn install --production
EXPOSE 2233
CMD ["npm", "start"]
