import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
  MfaVerifyDto,
  MagicLinkDto,
  RefreshDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  MfaSetupVerifyDto,
} from './auth.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, Public } from '../common/decorators';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user, workspace, and company' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA TOTP code during login' })
  @ApiResponse({ status: 200, description: 'MFA code verified successfully' })
  async verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.authService.verifyMfa(dto);
  }

  @Public()
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate and email magic login link' })
  async magicLink(@Body() dto: MagicLinkDto) {
    return this.authService.magicLink(dto);
  }

  @Public()
  @Get('magic-link/verify')
  @ApiOperation({ summary: 'Verify magic link token (via GET link)' })
  async verifyMagicLinkGet(@Query('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }

  @Public()
  @Post('verify-magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify magic link token (via POST)' })
  async verifyMagicLinkPost(@Body('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email using token' })
  async verifyEmailGet(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using token (via POST)' })
  async verifyEmailPost(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT access token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke session and log out' })
  async logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable MFA setup (generates secret and QR URI)' })
  async enableMfa(@CurrentUser('id') userId: string) {
    return this.authService.enableMfa(userId);
  }

  @ApiBearerAuth()
  @Post('mfa/verify-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP setup and activate MFA' })
  async verifyMfaSetup(
    @CurrentUser('id') userId: string,
    @Body() dto: MfaSetupVerifyDto,
  ) {
    return this.authService.verifyAndActivateMfa(userId, dto);
  }

  @ApiBearerAuth()
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA' })
  async disableMfa(
    @CurrentUser('id') userId: string,
    @Body('code') code: string,
  ) {
    return this.authService.disableMfa(userId, code);
  }

  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  async getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke active session' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.authService.revokeSession(userId, sessionId);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile details' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
