import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Lock, Save, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useAuth, useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const { data } = await api.put('/users/me', {
        name: name.trim(),
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        phone: phone.trim() || null,
      });
      updateUser(data.data);
      showToast('success', 'Profile updated successfully!');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      showToast('success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to change password'));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingEmail(true);
    try {
      await api.post('/auth/resend-verification', { email: user?.email });
      showToast('success', 'Verification email sent! Check your inbox.');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to send verification email'));
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage your personal profile, contact information, and security preferences
        </p>
      </div>

      {!user?.isEmailVerified && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--amber)" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--amber)' }}>
                Email Verification Pending
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Please verify your email address to ensure full account access and recovery capabilities.
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleResendVerification}
            disabled={isResendingEmail}
          >
            {isResendingEmail ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}

      {/* Profile Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Personal Information</h3>

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '1.5rem' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <UserIcon size={32} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <label className="input-label">Avatar Image URL</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://images.unsplash.com/photo-..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
                <UserIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email Address (Read-only)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                value={user?.email || ''}
                disabled
                style={{ paddingLeft: '38px', opacity: 0.7 }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Bio / Role Description</label>
            <textarea
              className="input-field"
              placeholder="Tell your team about your specialty, skills, and background..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isUpdatingProfile}>
              <Save size={16} />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Form */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Security & Password</h3>

        <form onSubmit={handleChangePassword}>
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isUpdatingPassword || !currentPassword || !newPassword}
            >
              <ShieldCheck size={16} />
              <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
