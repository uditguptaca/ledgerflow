import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      ignoreTLS: true,
    });
  }

  // ─── Signup ──────────────────────────────────────────────

  /**
   * Register a new user, create their workspace, and first company.
   * Returns JWT tokens and user details.
   */
  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);
    const emailVerifyToken = uuidv4();
    const slug = this.generateSlug(dto.workspaceName);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create user
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          emailVerifyToken,
          emailVerifyExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      });

      // 2. Create workspace
      const workspace = await tx.workspace.create({
        data: {
          name: dto.workspaceName,
          slug,
          country: dto.country || 'US',
          baseCurrency: dto.baseCurrency || 'USD',
        },
      });

      // 3. Create workspace member with OWNER role
      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'OWNER',
        },
      });

      // 4. Create first company
      const company = await tx.company.create({
        data: {
          workspaceId: workspace.id,
          name: dto.companyName,
          country: dto.country || 'US',
          baseCurrency: dto.baseCurrency || 'USD',
        },
      });

      // 5. Create company user with COMPANY_ADMIN role
      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'COMPANY_ADMIN',
        },
      });

      return { user, workspace, company };
    });

    // Send verification email (non-blocking)
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    this.sendEmail(
      result.user.email,
      'Verify your LedgerFlow email',
      `<h2>Welcome to LedgerFlow!</h2>
       <p>Click the link below to verify your email:</p>
       <a href="${appUrl}/api/v1/auth/verify-email?token=${emailVerifyToken}">Verify Email</a>
       <p>This link expires in 24 hours.</p>`,
    ).catch((err) => this.logger.error('Failed to send verification email', err));

    const tokens = await this.issueTokens(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        slug: result.workspace.slug,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
      },
      ...tokens,
    };
  }

  // ─── Login ───────────────────────────────────────────────

  /**
   * Authenticate user by email + password.
   * Handles lockout, MFA flow, and failed attempt tracking.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Check lockout
    if (
      user.failedLoginAttempts >= 5 &&
      user.lockedUntil &&
      user.lockedUntil > new Date()
    ) {
      const minutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account locked. Try again in ${minutes} minute(s).`,
      );
    }

    // Validate password
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };

      // Lock for 15 minutes after 5 failed attempts
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed attempts on successful auth
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // If MFA is enabled, return MFA challenge
    if (user.mfaEnabled) {
      const mfaToken = this.jwtService.sign(
        { sub: user.id, purpose: 'mfa' },
        { expiresIn: '5m' },
      );
      return { requiresMfa: true, mfaToken };
    }

    // Issue tokens directly
    return this.issueTokens(user);
  }

  // ─── MFA Verify ──────────────────────────────────────────

  /**
   * Verify TOTP code during MFA login flow.
   * Validates the short-lived mfaToken and the 6-digit code.
   */
  async verifyMfa(dto: MfaVerifyDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.mfaToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (payload.purpose !== 'mfa') {
      throw new UnauthorizedException('Invalid token purpose');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('MFA not configured');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    return this.issueTokens(user);
  }

  // ─── Magic Link ──────────────────────────────────────────

  /**
   * Generate a magic login link and send it to the user's email.
   * Always returns success to avoid user enumeration.
   */
  async magicLink(dto: MagicLinkDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent user enumeration
    if (!user) {
      return { message: 'If the email exists, a magic link has been sent.' };
    }

    const token = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token, // Reuse this field for magic link
        passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    await this.sendEmail(
      user.email,
      'Your LedgerFlow Magic Login Link',
      `<h2>Magic Login</h2>
       <p>Click the link below to log in to LedgerFlow:</p>
       <a href="${appUrl}/api/v1/auth/magic-link/verify?token=${token}">Log In</a>
       <p>This link expires in 15 minutes.</p>`,
    );

    return { message: 'If the email exists, a magic link has been sent.' };
  }

  /**
   * Verify a magic link token and issue JWT tokens.
   */
  async verifyMagicLink(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpiry: null,
        emailVerified: true, // Magic link verifies the email too
        lastLoginAt: new Date(),
      },
    });

    return this.issueTokens(user);
  }

  // ─── Email Verification ──────────────────────────────────

  /**
   * Verify user email using the token sent during signup.
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  // ─── Token Refresh ───────────────────────────────────────

  /**
   * Rotate refresh tokens: validate old token, revoke it, issue new pair.
   * Implements refresh token rotation for enhanced security.
   */
  async refreshToken(dto: RefreshDto) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt) {
      // Possible token reuse attack — revoke all sessions for this user
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token has been revoked. All sessions invalidated for security.',
      );
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!session.user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Revoke old session
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    return this.issueTokens(session.user);
  }

  // ─── Logout ──────────────────────────────────────────────

  /**
   * Revoke the session associated with the given refresh token.
   */
  async logout(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });

    if (session && !session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ────────────────────────────────────

  /**
   * Generate a password reset token and email it to the user.
   * Always returns success to prevent user enumeration.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (user) {
      const token = uuidv4();
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1h
        },
      });

      const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
      this.sendEmail(
        user.email,
        'Reset your LedgerFlow password',
        `<h2>Password Reset</h2>
         <p>Click the link below to reset your password:</p>
         <a href="${appUrl}/reset-password?token=${token}">Reset Password</a>
         <p>This link expires in 1 hour.</p>`,
      ).catch((err) => this.logger.error('Failed to send password reset email', err));
    }

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  // ─── Reset Password ─────────────────────────────────────

  /**
   * Reset user password using a valid reset token.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Revoke all existing sessions for security
    await this.prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ─── MFA Enable ──────────────────────────────────────────

  /**
   * Generate a new TOTP secret for MFA setup.
   * Returns the secret and a QR code URI for authenticator apps.
   */
  async enableMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const secret = authenticator.generateSecret();

    // Store the secret temporarily (not yet activated)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const issuer = this.configService.get<string>('APP_NAME', 'LedgerFlow');
    const qrUri = authenticator.keyuri(user.email, issuer, secret);

    return { secret, qrUri };
  }

  /**
   * Verify a TOTP code and activate MFA for the user.
   * Generates 10 recovery codes, hashes them, and stores as JSON.
   */
  async verifyAndActivateMfa(userId: string, dto: MfaSetupVerifyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated. Call enable first.');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code. Please try again.');
    }

    // Generate 10 recovery codes
    const recoveryCodes: string[] = [];
    const hashedCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex'); // 8-char hex string
      recoveryCodes.push(code);
      hashedCodes.push(await argon2.hash(code));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaRecoveryCodes: hashedCodes,
      },
    });

    return {
      message: 'MFA activated successfully',
      recoveryCodes, // Show once, user must save these
    };
  }

  /**
   * Disable MFA for the user after verifying a valid TOTP code.
   */
  async disableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecoveryCodes: Prisma.DbNull,
      },
    });

    return { message: 'MFA disabled successfully' };
  }

  // ─── Session Management ──────────────────────────────────

  /**
   * List active (non-revoked, non-expired) sessions for a user.
   */
  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }

  /**
   * Revoke a specific session by its ID, owned by the given user.
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revokedAt) {
      throw new BadRequestException('Session already revoked');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
  }

  // ─── Get Current User Profile ────────────────────────────

  /**
   * Get the full profile of the authenticated user.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        emailVerified: true,
        mfaEnabled: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        workspaceMembers: {
          where: { isActive: true },
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        companyUsers: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                baseCurrency: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ─── Helper: Issue Tokens ────────────────────────────────

  /**
   * Create a JWT access token and a new Session with a refresh token.
   * @returns { accessToken, refreshToken }
   */
  private async issueTokens(
    user: { id: string; email: string },
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = uuidv4();
    const refreshExpiryDays = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRY_DAYS',
      7,
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        deviceInfo: deviceInfo || null,
        ipAddress: ipAddress || null,
        expiresAt: new Date(
          Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return { accessToken, refreshToken };
  }

  // ─── Helper: Send Email ──────────────────────────────────

  /**
   * Send an email using the configured SMTP transporter (Mailhog in dev).
   */
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"LedgerFlow" <noreply@ledgerflow.io>',
        ),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  // ─── Helper: Generate Slug ───────────────────────────────

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
  }
}
