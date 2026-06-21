import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * Extract the authenticated user from the request.
 * Populated by JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * Extract the company context from the request.
 * Populated by CompanyGuard from X-Company-Id header.
 */
export const CurrentCompany = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const company = request.company;
    return data ? company?.[data] : company;
  },
);

/** Mark a route as requiring specific permissions */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Mark a route as public (no auth required) */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Mark a route as requiring a specific workspace role */
export const WORKSPACE_ROLE_KEY = 'workspaceRole';
export const RequireWorkspaceRole = (...roles: string[]) =>
  SetMetadata(WORKSPACE_ROLE_KEY, roles);
