import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    
    // Always try to authenticate, but don't require it for public routes
    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (error) {
      // If authentication fails and it's a public route, allow access
      if (isPublic) {
        return true;
      }
      // If authentication fails and it's not a public route, deny access
      throw error;
    }
  }
}
