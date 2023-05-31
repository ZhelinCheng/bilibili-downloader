/*
 * @Author       : 程哲林
 * @Date         : 2023-05-30 22:41:18
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-31 20:37:22
 * @FilePath     : /bilibili-downloader/src/app.dto/update.dto.ts
 * @Description  : 未添加文件描述
 */
import {
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

type CfgType = Array<{
  group: string;
  key: string;
  value: string;
}>;

@ValidatorConstraint({ name: 'ids', async: false })
class IsConfig implements ValidatorConstraintInterface {
  validate(cfg: CfgType) {
    if (!Array.isArray(cfg)) {
      return false;
    }

    return cfg.every((obj) => {
      return 'group' in obj && 'key' in obj && 'value' in obj;
    });
  }
  defaultMessage() {
    return '数据格式不正确!';
  }
}

export class UpdateConfigDto {
  @Validate(IsConfig)
  readonly config: CfgType;
}
