import React, { useState, useEffect } from 'react';
import { X, FolderKanban } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentOrg } = useOrg();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentOrg) {
      api.get(`/organizations/${currentOrg.id}/teams`).then((res) => {
        setTeams(res.data.data || []);
      });
    }
  }, [isOpen, currentOrg]);

  // Auto-generate project key suggestion from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      const generated = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase();
      if (generated.length >= 2) {
        setKey(generated);
      }
    }
  };

  if (!isOpen || !currentOrg) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/projects`, {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || null,
        priority,
        teamId: teamId || null,
      });
      showToast('success', `Project [${key.toUpperCase()}] "${name}" created! You are designated as LEAD.`);
      setName('');
      setKey('');
      setDescription('');
      setTeamId('');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create project');
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
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Create New Project</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Set up a project workspace, deliverables, and tracking keys
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Project Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Syntrix Engine"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Key (2-10 chars)</label>
              <input
                type="text"
                className="input-field"
                placeholder="SYN"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                required
                minLength={2}
                maxLength={10}
                style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Priority</label>
              <select
                className="input-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Assigned Team (Optional)</label>
              <select
                className="input-field"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              >
                <option value="">-- No Team (Org-wide) --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Description (Optional)</label>
            <textarea
              className="input-field"
              placeholder="Scope, goals, and technical objectives of this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name.trim() || !key.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
