import { PartialType } from '@nestjs/mapped-types';
import { CreateDownloadDto } from './create-download.dto';

export class UpdateDownloadDto extends PartialType(CreateDownloadDto) {}
