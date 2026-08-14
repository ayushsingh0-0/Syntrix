import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CreateOrgModal } from '../modals/CreateOrgModal';
import { useAuth, useOrg } from '../../context';

import { Building2, Plus } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { orgs, isLoading: orgLoading } = useOrg();

  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
        }}
      >
        Loading Syntrix Platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar onOpenCreateOrgModal={() => setCreateOrgModalOpen(true)} />

      <div
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Navbar />

        <main style={{ flex: 1, padding: '28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {!orgLoading && orgs.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                maxWidth: '560px',
                margin: '40px auto',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                }}
              >
                <Building2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No Workspace Found</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                You are not currently enrolled in any organization. Create your first workspace to manage projects, invite collaborators, and build teams.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setCreateOrgModalOpen(true)}
              >
                <Plus size={18} />
                <span>Create Workspace</span>
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <CreateOrgModal
        isOpen={createOrgModalOpen}
        onClose={() => setCreateOrgModalOpen(false)}
      />
    </div>
  );
};
