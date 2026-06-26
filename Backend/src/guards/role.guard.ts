import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      return false;
    }

    // 1. If AuthGuard already ran, check user role
    if (request['user']) {
      return roles.includes(request['user'].role);
    }

    // 2. Fallback: extract token manually
    let token: string | null = null;

    // Try Authorization header
    const authorizationHeader = request.headers.authorization;
    if (authorizationHeader) {
      const parts = authorizationHeader.split(' ');
      if (parts[1] && parts[1] !== 'null' && parts[1] !== 'undefined') {
        token = parts[1];
      }
    }

    // Try Cookies
    if (!token && request.headers.cookie) {
      const cookies = request.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, val] = cookie.trim().split('=');
        if (key) acc[key] = val;
        return acc;
      }, {} as Record<string, string>);
      token = cookies['token'] || null;
    }

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request['user'] = user;
      return roles.includes(user.role);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
