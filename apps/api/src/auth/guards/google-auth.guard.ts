import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions() {
    return { session: false };
  }
}

// For the callback route: on failure, mark the request so the controller can redirect.
// Never send a response from the guard — let the controller own all redirects.
@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  getAuthenticateOptions() {
    return { session: false };
  }

  handleRequest(err: any, user: any, _info: any) {
    // Return null on failure; controller checks req.user and redirects accordingly
    if (err || !user) return null;
    return user;
  }
}
