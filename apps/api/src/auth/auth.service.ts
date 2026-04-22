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
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { Role, User } from '@prisma/client';
import { RegisterDto, InviteRegisterDto, CreateInviteDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

type SafeUser = Omit<User, 'passwordHash' | 'mfaSecret'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    const { passwordHash: _pw, mfaSecret: _mfa, ...safeUser } = user;
    return safeUser;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName || `${dto.firstName}'s Organization`,
      },
    });

    const role = dto.role || Role.COMPANY_ADMIN;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role,
        organizationId: org.id,
        isOnboarded: role !== Role.WORKER,
      },
    });

    return this.generateAuthResponse(user);
  }

  async login(user: SafeUser) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
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
    const byEmail = await this.prisma.user.findUnique({ where: { email: googleUser.email } });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: googleUser.googleId, avatarUrl: googleUser.avatarUrl },
      });
    }

    // New user — determine role based on admin email env var
    const adminEmail = this.config.get<string>('ADMIN_GOOGLE_EMAIL', '');
    const isAdmin = adminEmail && googleUser.email.toLowerCase() === adminEmail.toLowerCase();

    if (isAdmin) {
      // Admin gets their own organization
      const org = await this.prisma.organization.create({
        data: { name: `${googleUser.firstName}'s Organization` },
      });
      return this.prisma.user.create({
        data: { ...googleUser, role: Role.COMPANY_ADMIN, organizationId: org.id, isOnboarded: true },
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
      const firstOrg = await this.prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } });
      if (firstOrg) orgId = firstOrg.id;
    }

    if (!orgId) {
      throw new BadRequestException(
        'No organization found. Please ask your administrator to set up the platform first.',
      );
    }

    return this.prisma.user.create({
      data: { ...googleUser, role: Role.WORKER, organizationId: orgId, isOnboarded: true },
    });
  }

  async registerWithInvite(dto: InviteRegisterDto) {
    const invite = await this.prisma.inviteToken.findUnique({ where: { token: dto.token } });

    if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
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
    const invite = await this.prisma.inviteToken.create({
      data: {
        email: dto.email,
        role: dto.role,
        organizationId,
        token,
        expiresAt: addDays(new Date(), 7),
      },
    });
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
    if (!user || !user.passwordHash) return { message: 'If that email exists, a reset link has been sent.' };

    // Invalidate existing tokens
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

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

    // Log the reset URL (in production this would be sent via email)
    console.log(`[PASSWORD RESET] ${user.email} → ${resetUrl}`);

    return { message: 'If that email exists, a reset link has been sent.', resetUrl };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });

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
    await this.prisma.refreshToken.deleteMany({ where: { userId: record.userId } });

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new BadRequestException('No password set on this account');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Password changed successfully. Please log in again.' };
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
