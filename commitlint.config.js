/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-04-24 00:41:01
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-24 00:41:22
 * @FilePath     : \bilibili-downloader\commitlint.config.js
 * @Description  : 未添加文件描述
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert'],
    ],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never'],
  },
};
