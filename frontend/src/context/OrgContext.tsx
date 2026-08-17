import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';
import type { Organization, OrganizationRole, OrgPermission } from '../types';

export interface OrgContextType {
  orgs: Organization[];
  currentOrg: Organization | null;
  myRole: OrganizationRole | null;
  permissions: OrgPermission[];
  isLoading: boolean;
  switchOrg: (orgId: string) => void;
  refreshOrgs: () => Promise<void>;
  hasPermission: (permission: OrgPermission) => boolean;
}

export const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [myRole, setMyRole] = useState<OrganizationRole | null>(null);
  const [permissions, setPermissions] = useState<OrgPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPermissions = useCallback(async (orgId: string) => {
    try {
      const { data } = await api.get(`/organizations/${orgId}/permissions/me`);
      setMyRole(data.data.role);
      setPermissions(data.data.permissions || []);
    } catch {
      setMyRole(null);
      setPermissions([]);
    }
  }, []);

  const refreshOrgs = useCallback(async () => {
    if (!user) {
      setOrgs([]);
      setCurrentOrg(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.get('/organizations');
      const orgList: Organization[] = data.data;
      setOrgs(orgList);

      const savedOrgId = localStorage.getItem('syntrix_active_org_id');
      const matched = orgList.find((o) => o.id === savedOrgId) || orgList[0] || null;

      setCurrentOrg(matched);
      if (matched) {
        localStorage.setItem('syntrix_active_org_id', matched.id);
        await fetchPermissions(matched.id);
      }
    } catch {
      setOrgs([]);
      setCurrentOrg(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchPermissions]);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      api.get('/organizations').then(async (res) => {
        if (!isMounted) return;
        const orgList: Organization[] = res.data.data;
        setOrgs(orgList);

        const savedOrgId = localStorage.getItem('syntrix_active_org_id');
        const matched = orgList.find((o) => o.id === savedOrgId) || orgList[0] || null;

        setCurrentOrg(matched);
        if (matched) {
          localStorage.setItem('syntrix_active_org_id', matched.id);
          try {
            const permRes = await api.get(`/organizations/${matched.id}/permissions/me`);
            if (isMounted) {
              setMyRole(permRes.data.data.role);
              setPermissions(permRes.data.data.permissions || []);
            }
          } catch {
            if (isMounted) {
              setMyRole(null);
              setPermissions([]);
            }
          }
        }
      }).catch(() => {
        if (isMounted) {
          setOrgs([]);
          setCurrentOrg(null);
        }
      });
    } else {
      setOrgs((prev) => (prev.length > 0 ? [] : prev));
      setCurrentOrg((prev) => (prev !== null ? null : prev));
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const switchOrg = async (orgId: string) => {
    const selected = orgs.find((o) => o.id === orgId);
    if (selected) {
      setCurrentOrg(selected);
      localStorage.setItem('syntrix_active_org_id', selected.id);
      await fetchPermissions(selected.id);
    }
  };

  const hasPermission = (permission: OrgPermission): boolean => {
    return permissions.includes(permission);
  };

  return (
    <OrgContext.Provider
      value={{
        orgs,
        currentOrg,
        myRole,
        permissions,
        isLoading,
        switchOrg,
        refreshOrgs,
        hasPermission,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};
