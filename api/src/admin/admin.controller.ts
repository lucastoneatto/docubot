import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminBasicGuard } from './admin.guard';
import { UpdatePlanDto, UpdateQuotaDto } from './admin.dto';
import { AdminService } from './admin.service';

@UseGuards(AdminBasicGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Patch('users/:id/plan')
  setPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.admin.setPlan(id, dto.plan);
  }

  @Get('collections')
  collections() {
    return this.admin.listCollections();
  }

  @Patch('collections/:id/quota')
  setQuota(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuotaDto,
  ) {
    return this.admin.setQuota(id, dto);
  }
}
