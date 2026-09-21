import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { AuthGuard, type AuthenticatedUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FilesService } from '../files/files.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';
import { CollectionsService } from './collections.service';

const MAX_UPLOAD_FILES = 2000;
const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024; // hard ceiling; per-collection limits are enforced in FilesService

@UseGuards(AuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly collections: CollectionsService,
    private readonly files: FilesService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCollectionDto) {
    return this.collections.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.collections.list(user.userId);
  }

  @Get(':id')
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.detail(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collections.update(id, user.userId, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.remove(id, user.userId);
  }

  /**
   * Accepts either loose files or an entire folder (the browser's
   * `<input webkitdirectory>` sends every file inside it, each carrying its
   * relative path via `webkitRelativePath`, forwarded here as a matching
   * `paths[]` field since multipart file parts don't carry custom metadata).
   */
  @Post(':id/upload')
  @UseInterceptors(
    FilesInterceptor('files', MAX_UPLOAD_FILES, {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() uploaded: Express.Multer.File[],
    @Body('paths') paths?: string | string[],
  ) {
    await this.collections.findOwned(id, user.userId);
    if (!uploaded || uploaded.length === 0) {
      throw new BadRequestException('No files were uploaded');
    }

    const relativePaths = Array.isArray(paths) ? paths : paths ? [paths] : [];

    const files = uploaded.map((file, index) => ({
      relativePath: relativePaths[index] || file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      buffer: file.buffer,
      size: file.size,
    }));

    return this.files.ingestUpload(id, files);
  }

  @Get(':id/status')
  status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.status(id, user.userId);
  }

  @Get(':id/documents')
  documents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.collections.listDocuments(
      id,
      user.userId,
      offset ? Number(offset) : 0,
      limit ? Number(limit) : 50,
    );
  }

  @Get(':id/documents/:documentId')
  document(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.collections.getDocument(id, documentId, user.userId);
  }

  @Delete(':id/documents/:documentId')
  async removeDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    await this.collections.findOwned(id, user.userId);
    return this.files.removeDocument(id, documentId);
  }

  @Post(':id/summary')
  regenerateSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.regenerateSummary(id, user.userId);
  }

  @Get(':id/conversations')
  conversations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.collections.listConversations(
      id,
      user.userId,
      offset ? Number(offset) : 0,
      limit ? Number(limit) : 50,
    );
  }

  @Get(':id/conversations/:sessionId')
  conversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.collections.getConversation(id, sessionId, user.userId);
  }
}
