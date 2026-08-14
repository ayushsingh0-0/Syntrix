import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Trash2, ArrowRightLeft, ShieldAlert } from 'lucide-react';

import { useOrg } from '../../context/OrgContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const OrgSettings: React.FC = () => {
  const { currentOrg, myRole, hasPermission, refreshOrgs } = useOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(currentOrg?.name || '');
  const [logoUrl, setLogoUrl] = useState(currentOrg?.logoUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const [newOwnerUserId, setNewOwnerUserId] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name);
      setLogoUrl(currentOrg.logoUrl || '');
      api.get(`/organizations/${currentOrg.id}/members`).then((res) => {
        setMembers(res.data.data);
      });
    }
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
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update workspace');
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
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to transfer ownership');
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
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete organization');
    }
  };

  if (!currentOrg) return null;

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Organization Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage workspace branding, identifiers, ownership, and destruction controls
        </p>
      </div>

      {/* General Settings */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Workspace Details</h3>

        <form onSubmit={handleUpdate}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                <Save size={16} />
                <span>{isUpdating ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Transfer Ownership (OWNER only) */}
      {myRole === 'OWNER' && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Transfer Ownership</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isTransferring || !newOwnerUserId}
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
            borderColor: 'rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <ShieldAlert size={20} color="var(--rose)" />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--rose)' }}>Danger Zone</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Permanently delete this organization, including all associated teams, projects, task boards, and member records. This action cannot be undone.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-danger" onClick={handleDeleteOrg}>
              <Trash2 size={16} />
              <span>Delete Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
