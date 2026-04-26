import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GoogleCallbackGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  InviteRegisterDto,
  CreateInviteDto,
} from './dto/register.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new organization and admin user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req: { user: Express.User }) {
    return this.authService.login(
      req.user as Parameters<AuthService['login']>[0],
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @CurrentUser() user: { id: string },
    @Body() body: { refreshToken?: string },
  ) {
    await this.authService.logout(user.id, body?.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: unknown) {
    return user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Passport handles redirect
  }

  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Request() req: { user: Parameters<AuthService['login']>[0] | null },
    @Res() res: Response,
  ) {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';

    const doRedirect = (url: string) => {
      if (!res.headersSent) res.redirect(url);
    };

    if (!req.user) {
      return doRedirect(`${webUrl}/login?error=google_failed`);
    }

    try {
      const result = await this.authService.login(req.user);
      if ('mfaRequired' in result && result.mfaRequired) {
        return doRedirect(`${webUrl}/login?mfaRequired=true&challengeToken=${result.challengeToken}`);
      }
      const r = result as { tokens: { accessToken: string; refreshToken: string } };
      const params = new URLSearchParams({ accessToken: r.tokens.accessToken, refreshToken: r.tokens.refreshToken });
      return doRedirect(`${webUrl}/auth/google/callback?${params.toString()}`);
    } catch (_err) {
      return doRedirect(`${webUrl}/login?error=google_failed`);
    }
  }

  @Get('invite/:token')
  @ApiOperation({ summary: 'Get invite details by token' })
  async getInvite(@Param('token') token: string) {
    return this.authService.getInviteDetails(token);
  }

  @Post('invite/accept')
  @ApiOperation({ summary: 'Register via invite token' })
  async acceptInvite(@Body() dto: InviteRegisterDto) {
    return this.authService.registerWithInvite(dto);
  }

  @Post('invite/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.HR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invite token for a new user' })
  async createInvite(
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.authService.createInvite(dto, user.organizationId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a reset token' })
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (requires current password)' })
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  // ─── MFA ──────────────────────────────────────────────────────────────────

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate MFA secret and QR code' })
  async mfaSetup(@CurrentUser() user: { id: string }) {
    return this.authService.setupMfa(user.id);
  }

  @Post('mfa/verify-setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm MFA setup with a TOTP code' })
  async mfaVerifySetup(
    @CurrentUser() user: { id: string },
    @Body() body: { token: string },
  ) {
    return this.authService.verifyMfaSetup(user.id, body.token);
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA (requires valid TOTP code)' })
  async mfaDisable(
    @CurrentUser() user: { id: string },
    @Body() body: { token: string },
  ) {
    return this.authService.disableMfa(user.id, body.token);
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete MFA login challenge' })
  async mfaVerify(@Body() body: { challengeToken: string; token: string }) {
    return this.authService.verifyMfaChallenge(body.challengeToken, body.token);
  }

  // ─── SAML SSO ─────────────────────────────────────────────────────────────

  @Get('saml')
  @UseGuards(AuthGuard('saml'))
  @ApiOperation({ summary: 'Initiate SAML SSO login' })
  async samlAuth() {
    // Passport redirects to IdP
  }

  @Post('saml/callback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('saml'))
  @ApiOperation({ summary: 'SAML SSO callback' })
  async samlCallback(
    @Request() req: { user: Parameters<AuthService['login']>[0] | null },
    @Res() res: Response,
  ) {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    if (!req.user) return res.redirect(`${webUrl}/login?error=sso_failed`);
    try {
      const result = await this.authService.login(req.user);
      if ('mfaRequired' in result && result.mfaRequired) {
        return res.redirect(`${webUrl}/login?mfaRequired=true&challengeToken=${result.challengeToken}`);
      }
      const r = result as { tokens: { accessToken: string; refreshToken: string } };
      const params = new URLSearchParams({ accessToken: r.tokens.accessToken, refreshToken: r.tokens.refreshToken });
      return res.redirect(`${webUrl}/auth/google/callback?${params}`);
    } catch {
      return res.redirect(`${webUrl}/login?error=sso_failed`);
    }
  }
}
