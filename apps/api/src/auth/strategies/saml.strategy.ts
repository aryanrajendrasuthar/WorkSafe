import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@node-saml/passport-saml';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  private readonly logger = new Logger(SamlStrategy.name);

  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super(
      {
        entryPoint: config.get<string>('SAML_ENTRY_POINT', ''),
        issuer: config.get<string>('SAML_ISSUER', 'worksafe'),
        callbackUrl: config.get<string>('SAML_CALLBACK_URL', 'http://localhost:3001/auth/saml/callback'),
        cert: config.get<string>('SAML_CERT', 'placeholder'),
        wantAuthnResponseSigned: false,
        audience: false as any,
      } as any,
      async (profile: any, done: (err: any, user?: any) => void) => {
        try {
          const user = await this.validateProfile(profile);
          done(null, user ?? false);
        } catch (err) {
          done(err);
        }
      },
    );
  }

  private async validateProfile(profile: any) {
    const email =
      profile?.email ??
      profile?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
      profile?.nameID;

    if (!email) {
      this.logger.warn('SAML profile missing email');
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, organizationId: true, departmentId: true,
        isActive: true, isOnboarded: true, avatarUrl: true,
      },
    });

    if (!user || !user.isActive) return null;
    return user;
  }

  async validate(profile: any) {
    return this.validateProfile(profile);
  }
}
