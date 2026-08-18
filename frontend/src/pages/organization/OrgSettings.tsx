import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Trash2, ArrowRightLeft, ShieldAlert, Settings } from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import type { OrganizationMember } from '../../types';

export const OrgSettings: React.FC = () => {
  const { currentOrg, myRole, hasPermission, refreshOrgs } = useOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(currentOrg?.name || '');
  const [logoUrl, setLogoUrl] = useState(currentOrg?.logoUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const [newOwnerUserId, setNewOwnerUserId] = useState('');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (currentOrg) {
      api
        .get(`/organizations/${currentOrg.id}/members`)
        .then((res) => {
          if (isMounted) {
            setMembers(res.data.data || []);
          }
        })
        .catch(() => {
          // ignore
        });
    }
    return () => {
      isMounted = false;
    };
  }, [currentOrg]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsUpdating(true);
    try {
      await api.put(`/organizations/${currentOrg.id}`, {
        name: name.trim(),
        logoUrl: logoUrl.trim() || null,
      });
      showToast('success', 'Workspace settings updated successfully!');
      await refreshOrgs();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update workspace'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !newOwnerUserId) return;
    if (!confirm('Are you absolutely sure you want to transfer ownership of this organization? You will become an ADMIN.')) return;

    setIsTransferring(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/transfer-ownership`, {
        newOwnerUserId,
      });
      showToast('success', 'Organization ownership transferred successfully!');
      await refreshOrgs();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to transfer ownership'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!currentOrg) return;
    const confirmName = prompt(`To confirm deletion, please type the organization name "${currentOrg.name}":`);
    if (confirmName !== currentOrg.name) {
      showToast('error', 'Organization name did not match. Deletion cancelled.');
      return;
    }

    try {
      await api.delete(`/organizations/${currentOrg.id}`);
      showToast('success', 'Organization deleted.');
      await refreshOrgs();
      navigate('/');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete organization'));
    }
  };

  if (!currentOrg) return null;

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Settings size={20} color="var(--primary, #F5AE4D)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)' }}>
            Organization Settings
          </h1>
        </div>
        <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem' }}>
          Manage workspace branding, identifiers, ownership, and destruction controls
        </p>
      </div>

      {/* General Settings */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--foreground)', marginBottom: '1.25rem' }}>
          Workspace Details
        </h3>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label">Workspace Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!hasPermission('ORG_UPDATE')}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Workspace Slug (Unique URI Identifier)</label>
            <input
              type="text"
              className="input-field"
              value={currentOrg.slug}
              disabled
              style={{ opacity: 0.7, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Logo Image URL</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={!hasPermission('ORG_UPDATE')}
            />
          </div>

          {hasPermission('ORG_UPDATE') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUpdating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700 }}
              >
                <Save size={16} />
                <span>{isUpdating ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Transfer Ownership (OWNER only) */}
      {myRole === 'OWNER' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--foreground)', marginBottom: '6px' }}>
            Transfer Ownership
          </h3>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Transfer primary ownership of this organization to another active member. You will automatically retain ADMIN privileges.
          </p>

          <form onSubmit={handleTransferOwnership}>
            <div className="input-group">
              <label className="input-label">Select Successor Member</label>
              <select
                className="input-field"
                value={newOwnerUserId}
                onChange={(e) => setNewOwnerUserId(e.target.value)}
                required
              >
                <option value="">-- Choose an active member --</option>
                {members
                  .filter((m) => m.role !== 'OWNER')
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.user.email}) - {m.role}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isTransferring || !newOwnerUserId}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', fontWeight: 650 }}
              >
                <ArrowRightLeft size={16} />
                <span>{isTransferring ? 'Transferring...' : 'Transfer Ownership'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone */}
      {myRole === 'OWNER' && (
        <div
          className="card"
          style={{
            padding: '1.75rem',
            borderColor: 'rgba(201, 109, 87, 0.35)',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F5E1DB',
                color: '#9F5141',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: '#9F5141' }}>Danger Zone</h3>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Permanently delete this organization, including all associated teams, projects, task boards, and member records. This action cannot be undone.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteOrg}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                background: '#9F5141',
                color: '#FFFDF8',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} />
              <span>Delete Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSettings;
