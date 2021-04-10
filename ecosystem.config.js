/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 20:48:38
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-10 20:07:58
 * @FilePath     : \bilibili-downloader\ecosystem.config.js
 * @Description  : 未添加文件描述
 */

module.exports = {
  apps: [
    {
      name: 'bilibili-downloader',
      script: './dist/index.js',
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
