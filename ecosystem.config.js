/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 20:48:38
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-04 22:50:09
 * @FilePath     : /bilibili-downloader/ecosystem.config.js
 * @Description  : 未添加文件描述
 */

module.exports = {
  apps: [
    {
      name: 'bilibili-downloader',
      script: './dist/main.js',
      // eslint-disable-next-line no-undef
      cwd: __dirname,
      // Options reference: https://doc.pm2.io/en/runtime/guide/ecosystem-file/#ecosystem-file
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '250M',
      max_restarts: 3,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
