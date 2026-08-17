import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Save,
  ShieldCheck,
  AlertTriangle,
  Laptop,
  Globe,
  Key,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth, useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';
import { FormField, Input, Textarea } from '../../components/common/FormComponents';

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Account & Security</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile, credentials, and active device sessions
        </p>
      </div>

      {!user?.isEmailVerified && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300">Email Verification Pending</div>
              <div className="text-[11px] text-slate-300">
                Please verify your email address to ensure full account access and recovery.
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResendVerification}
            isLoading={isResendingEmail}
          >
            Resend Email
          </Button>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-400" />
          <span>Personal Information</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-indigo-400 shadow-md">
                {name ? name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
              </div>
            )}
            <div className="flex-1">
              <FormField label="Avatar Image URL">
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
              />
            </FormField>

            <FormField label="Phone Number">
              <Input
                type="tel"
                placeholder="+1-555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </FormField>
          </div>

          <FormField label="Email Address (Immutable)">
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              className="opacity-70 font-mono text-slate-400 cursor-not-allowed"
            />
          </FormField>

          <FormField label="Bio / Role Specialty">
            <Textarea
              placeholder="Tell your team about your specialty, skills, and engineering focus..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUpdatingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Security & Password */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Key className="w-5 h-5 text-violet-400" />
          <span>Security & Password</span>
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormField label="Current Password" required>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="New Password" required>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                minLength={8}
              />
            </FormField>

            <FormField label="Confirm New Password" required>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                minLength={8}
              />
            </FormField>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={isUpdatingPassword}
              disabled={!currentPassword || !newPassword}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Active Session Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-emerald-400" />
            <span>Active Authentication Sessions</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Current Session
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">Web Browser Client</div>
              <div className="text-[11px] text-slate-400 font-mono">
                IP: 127.0.0.1 • Verified Refresh Cookie
              </div>
            </div>
          </div>
          <span className="text-emerald-400 font-medium">Active Now</span>
        </div>
      </div>
    </div>
  );
};
