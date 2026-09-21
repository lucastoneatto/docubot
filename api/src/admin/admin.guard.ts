import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { config } from '../config';
import { checkBasicAuth } from '../common/basic-auth';

@Injectable()
export class AdminBasicGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { user, password } = config.admin;
    // With no credentials configured, the panel stays closed, never open.
    if (!user || !password) {
      throw new UnauthorizedException('Admin not configured');
    }

    if (!checkBasicAuth(request.headers.authorization, user, password)) {
      this.challenge(response);
    }

    return true;
  }

  private challenge(response: Response): never {
    response.setHeader('WWW-Authenticate', 'Basic realm="DocuBot Admin"');
    throw new UnauthorizedException('Invalid admin credentials');
  }
}
