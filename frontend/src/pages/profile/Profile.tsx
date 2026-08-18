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
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <UserIcon size={20} color="var(--primary, #F5AE4D)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)' }}>
            Account Settings
          </h1>
        </div>
        <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem' }}>
          Manage your personal profile, contact information, and security credentials
        </p>
      </div>

      {!user?.isEmailVerified && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md, 12px)',
            background: '#F8EBD3',
            border: '1px solid #E0A34C',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#986A25" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '750', color: '#986A25' }}>
                Email Verification Pending
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)' }}>
                Please verify your email address to ensure full account access and recovery capabilities.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResendVerification}
            disabled={isResendingEmail}
            style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 650 }}
          >
            {isResendingEmail ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}

      {/* Profile Form */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--foreground)', marginBottom: '1.25rem' }}>
          Personal Information
        </h3>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '8px' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'var(--primary-soft)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#20201D',
                  fontWeight: 750,
                  fontSize: '1.5rem',
                }}
              >
                {name.charAt(0) || <UserIcon size={32} />}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
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
                <UserIcon size={16} color="var(--foreground-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
                <Phone size={16} color="var(--foreground-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
              <Mail size={16} color="var(--foreground-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUpdatingProfile}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700 }}
            >
              <Save size={16} />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Form */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--foreground)', marginBottom: '1.25rem' }}>
          Security & Password
        </h3>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <Lock size={16} color="var(--foreground-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
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
                <Lock size={16} color="var(--foreground-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
                <Lock size={16} color="var(--foreground-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isUpdatingPassword || !currentPassword || !newPassword}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', fontWeight: 650 }}
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

export default Profile;
