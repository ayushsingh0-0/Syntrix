import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useOrg } from '../../context';
import { PageLoader } from '../common/Skeleton';
import type { OrganizationRole, OrgPermission } from '../../types';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerifiedEmail = false,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireVerifiedEmail && !user.isEmailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: OrganizationRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { myRole, isLoading } = useOrg();

  if (isLoading) {
    return null;
  }

  if (!myRole || !allowedRoles.includes(myRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: OrgPermission;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  fallback = null,
}) => {
  const { hasPermission, isLoading } = useOrg();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
