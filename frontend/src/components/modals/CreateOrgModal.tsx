import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshOrgs, switchOrg } = useOrg();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/organizations', { name: name.trim() });
      showToast('success', `Workspace "${data.data.name}" created!`);
      await refreshOrgs();
      switchOrg(data.data.id);
      setName('');
      onClose();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create workspace'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Create New Workspace</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Set up a new organization to collaborate with your team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Workspace / Company Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Acme Corporation, Syntrix Labs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
