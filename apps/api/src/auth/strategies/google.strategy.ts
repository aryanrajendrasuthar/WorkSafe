import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
      session: false,
    } as any);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails: { value: string }[]; name: { givenName: string; familyName: string }; photos: { value: string }[] },
    done: VerifyCallback,
  ) {
    try {
      const { id, emails, name, photos } = profile;
      if (!emails?.length) {
        return done(new Error('No email returned from Google'), false as any);
      }
      const googleUser = {
        googleId: id,
        email: emails[0].value,
        firstName: name.givenName || 'User',
        lastName: name.familyName || '',
        avatarUrl: photos[0]?.value,
      };

      const user = await this.authService.findOrCreateGoogleUser(googleUser);
      done(null, user);
    } catch (err) {
      done(err as Error, false as any);
    }
  }
}
