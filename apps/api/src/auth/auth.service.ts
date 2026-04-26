import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { Role, User } from '@prisma/client';
import {
  RegisterDto,
  InviteRegisterDto,
  CreateInviteDto,
} from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

type SafeUser = Omit<User, 'passwordHash' | 'mfaSecret'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    const { passwordHash: _pw, mfaSecret: _mfa, ...safeUser } = user;
    return safeUser;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // All self-registrations join the primary org as a WORKER
    const org = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!org)
      throw new BadRequestException(
        'No organization found. Contact your administrator.',
      );

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role: Role.WORKER,
        organizationId: org.id,
        isOnboarded: false,
      },
    });

    return this.generateAuthResponse(user);
  }

  async login(user: SafeUser) {
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // Check if user has MFA enabled
    const fullUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { isMfaEnabled: true } });
    if (fullUser?.isMfaEnabled) {
      return { mfaRequired: true, challengeToken: this.generateMfaChallengeToken(user.id) };
    }

    return this.generateAuthResponse(user);
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateAuthResponse(stored.user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  async findOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }) {
    // Existing user matched by Google ID — just return them
    const byGoogleId = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });
    if (byGoogleId) return byGoogleId;

    // Existing user matched by email — link their Google account
    const byEmail = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
        },
      });
    }

    // New user — determine role based on admin email env var
    const adminEmail = this.config.get<string>('ADMIN_GOOGLE_EMAIL', '');
    const isAdmin =
      adminEmail && googleUser.email.toLowerCase() === adminEmail.toLowerCase();

    if (isAdmin) {
      // Admin gets their own organization
      const org = await this.prisma.organization.create({
        data: { name: `${googleUser.firstName}'s Organization` },
      });
      return this.prisma.user.create({
        data: {
          ...googleUser,
          role: Role.COMPANY_ADMIN,
          organizationId: org.id,
          isOnboarded: true,
        },
      });
    }

    // Everyone else becomes a WORKER in the admin's org (or the first org as fallback)
    let orgId: string | null = null;

    if (adminEmail) {
      const adminUser = await this.prisma.user.findFirst({
        where: { email: { equals: adminEmail, mode: 'insensitive' } },
        select: { organizationId: true },
      });
      if (adminUser) orgId = adminUser.organizationId;
    }

    if (!orgId) {
      const firstOrg = await this.prisma.organization.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (firstOrg) orgId = firstOrg.id;
    }

    if (!orgId) {
      throw new BadRequestException(
        'No organization found. Please ask your administrator to set up the platform first.',
      );
    }

    return this.prisma.user.create({
      data: {
        ...googleUser,
        role: Role.WORKER,
        organizationId: orgId,
        isOnboarded: true,
      },
    });
  }

  async registerWithInvite(dto: InviteRegisterDto) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token: dto.token },
    });

    if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: invite.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role: invite.role,
        organizationId: invite.organizationId,
        isOnboarded: invite.role !== Role.WORKER,
      },
    });

    await this.prisma.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return this.generateAuthResponse(user);
  }

  async createInvite(dto: CreateInviteDto, organizationId: string) {
    const token = randomBytes(32).toString('hex');
    const [invite, org] = await Promise.all([
      this.prisma.inviteToken.create({
        data: { email: dto.email, role: dto.role, organizationId, token, expiresAt: addDays(new Date(), 7) },
      }),
      this.prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } }),
    ]);
    const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
    const inviteUrl = `${webUrl}/invite/${token}`;
    this.email.sendInvite(dto.email, org?.name ?? 'WorkSafe', dto.role, inviteUrl).catch(() => {});
    return invite;
  }

  async getInviteDetails(token: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { organization: { select: { name: true } } },
    });

    if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
      throw new NotFoundException('Invalid or expired invite');
    }

    return {
      email: invite.email,
      role: invite.role,
      organizationName: invite.organization.name,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user || !user.passwordHash)
      return { message: 'If that email exists, a reset link has been sent.' };

    // Invalidate existing tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: addDays(new Date(), 1),
      },
    });

    const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
    const resetUrl = `${webUrl}/reset-password?token=${token}`;

    await this.email.sendPasswordReset(user.email, user.firstName, resetUrl);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all refresh tokens on password change
    await this.prisma.refreshToken.deleteMany({
      where: { userId: record.userId },
    });

    return {
      message:
        'Password reset successfully. Please log in with your new password.',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash)
      throw new BadRequestException('No password set on this account');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  // ─── MFA ──────────────────────────────────────────────────────────────────

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
    if (!user) throw new NotFoundException('User not found');

    const secret = speakeasy.generateSecret({ name: `WorkSafe (${user.email})`, issuer: 'WorkSafe', length: 20 });

    // Store temp secret (not yet confirmed)
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret.base32 } });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCode: qrCodeDataUrl };
  }

  async verifyMfaSetup(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { mfaSecret: true } });
    if (!user?.mfaSecret) throw new BadRequestException('MFA setup not started');

    const valid = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token, window: 1 });
    if (!valid) throw new UnauthorizedException('Invalid verification code');

    await this.prisma.user.update({ where: { id: userId }, data: { isMfaEnabled: true } });
    return { message: 'Two-factor authentication enabled' };
  }

  async disableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { mfaSecret: true, isMfaEnabled: true } });
    if (!user?.isMfaEnabled || !user.mfaSecret) throw new BadRequestException('MFA is not enabled');

    const valid = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token, window: 1 });
    if (!valid) throw new UnauthorizedException('Invalid verification code');

    await this.prisma.user.update({ where: { id: userId }, data: { isMfaEnabled: false, mfaSecret: null } });
    return { message: 'Two-factor authentication disabled' };
  }

  async verifyMfaChallenge(challengeToken: string, totpCode: string) {
    let payload: { sub: string; mfaChallenge: boolean };
    try {
      payload = this.jwtService.verify(challengeToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired challenge token');
    }

    if (!payload.mfaChallenge) throw new UnauthorizedException('Invalid challenge token');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, mfaSecret: true, isMfaEnabled: true },
    });

    if (!user?.isMfaEnabled || !user.mfaSecret) throw new UnauthorizedException('MFA not configured');

    const valid = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token: totpCode, window: 1 });
    if (!valid) throw new UnauthorizedException('Invalid verification code');

    const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    return this.generateAuthResponse(fullUser!);
  }

  private generateMfaChallengeToken(userId: string): string {
    return this.jwtService.sign({ sub: userId, mfaChallenge: true }, { expiresIn: '5m' });
  }

  private async generateAuthResponse(user: SafeUser | User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
    });

    const refreshTokenStr = randomBytes(64).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenStr,
        expiresAt: addDays(new Date(), 7),
      },
    });

    const { passwordHash: _pw, mfaSecret: _mfa, ...safeUser } = user as User;

    return {
      user: safeUser,
      tokens: {
        accessToken,
        refreshToken: refreshTokenStr,
      },
    };
  }
}
