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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--foreground-secondary, #77756D)',
          fontSize: '0.95rem',
          background: 'var(--background, #F5F3EB)',
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background, #F5F3EB)' }}>
      {/* Sidebar (Desktop fixed, Mobile responsive drawer) */}
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenCreateOrgModal={() => {
          setMobileMenuOpen(false);
          setCreateOrgModalOpen(true);
        }}
      />

      <div
        className="main-content-wrapper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />

        <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {!orgLoading && orgs.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                maxWidth: '560px',
                margin: '40px auto',
                background: 'var(--surface, #FFFDF8)',
                border: '1px solid var(--border, #DDD9CC)',
                borderRadius: '20px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: 'var(--primary-soft, #FCE5C2)',
                  color: '#20201D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                }}
              >
                <Building2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground, #20201D)', marginBottom: '8px' }}>
                No Workspace Found
              </h2>
              <p style={{ color: 'var(--foreground-secondary, #77756D)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
                You are not currently enrolled in any organization. Create your first workspace to manage projects, invite collaborators, and build teams.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCreateOrgModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
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

export default DashboardLayout;
