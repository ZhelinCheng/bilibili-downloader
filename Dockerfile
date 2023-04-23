FROM ubuntu:latest

WORKDIR /app

COPY . /app
# 设置时区为东八区
ENV TZ=Asia/Shanghai

RUN apt-get update
RUN apt-get install gcc g++ make curl -y
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash
RUN apt-get install nodejs ffmpeg sqlite3 -y

RUN corepack enable
RUN corepack prepare yarn@stable --activate
RUN yarn install
RUN npm run build
EXPOSE 2233
CMD ["npm", "start"]
