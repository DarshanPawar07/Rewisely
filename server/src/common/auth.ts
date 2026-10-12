import { CanActivate, createParamDecorator, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService, JwtUser } from '../auth/auth.service';
export type AuthenticatedUser = JwtUser;
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user);
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  canActivate(context: ExecutionContext) { const header = context.switchToHttp().getRequest<{ headers: Record<string,string>; user?: JwtUser }>().headers.authorization; if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('A bearer token is required'); context.switchToHttp().getRequest<{ user?: JwtUser }>().user = this.auth.verify(header.slice(7)); return true; }
}
