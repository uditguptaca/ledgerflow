import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import {
  UpdateWorkspaceDto,
  CreateInvitationDto,
  AcceptInvitationDto,
} from './workspace.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, Public } from '../common/decorators';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @ApiBearerAuth()
  @Get('current')
  @ApiOperation({ summary: 'Get all workspaces the authenticated user belongs to' })
  async getCurrentUserWorkspaces(@CurrentUser('id') userId: string) {
    return this.workspaceService.getCurrentUserWorkspaces(userId);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace details (OWNER or ADMIN only)' })
  async updateWorkspace(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(workspaceId, userId, dto);
  }

  @ApiBearerAuth()
  @Get(':id/members')
  @ApiOperation({ summary: 'List members of a workspace' })
  async getMembers(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspaceService.getMembers(workspaceId, userId);
  }

  @ApiBearerAuth()
  @Post(':id/invitations')
  @ApiOperation({ summary: 'Invite a user to join the workspace (OWNER or ADMIN only)' })
  async createInvitation(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.workspaceService.createInvitation(workspaceId, userId, dto);
  }

  @ApiBearerAuth()
  @Get(':id/invitations')
  @ApiOperation({ summary: 'List pending invitations for the workspace (OWNER or ADMIN only)' })
  async getInvitations(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspaceService.getInvitations(workspaceId, userId);
  }

  @ApiBearerAuth()
  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke a pending workspace invitation (OWNER or ADMIN only)' })
  async revokeInvitation(
    @Param('id') workspaceId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspaceService.revokeInvitation(workspaceId, invitationId, userId);
  }

  @Public()
  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workspace invitation' })
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.workspaceService.acceptInvitation(dto);
  }
}
