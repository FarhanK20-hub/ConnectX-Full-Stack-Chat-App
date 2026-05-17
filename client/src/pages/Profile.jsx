import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [ghostMode, setGhostMode] = useState(user?.ghostMode || false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg');
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      let avatarUrl = user?.avatar;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        avatarUrl = uploadRes.data.url;
      }

      const { data } = await api.patch('/users/profile', { name, bio, avatar: avatarUrl, ghostMode });
      setUser(data);
      setAvatarFile(null); // Clear file after successful upload
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-bgPrimary flex justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-bgCard rounded-[20px] shadow-card border border-borderBase overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-borderBase flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-bgSecondary rounded-full transition-colors text-textMuted hover:text-textPrimary"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-display font-medium">Profile Settings</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 rounded-full transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img 
                  src={avatarPreview} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-bgSecondary shadow-lg"
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-3 bg-accent text-white rounded-full shadow-lg hover:bg-opacity-90 transition-all cursor-pointer"
                >
                  <Camera size={18} />
                </button>
              </div>
              <p className="text-sm text-textMuted">{user?.email}</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleUpdate} className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-textMuted">Display Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-textMuted">Bio</label>
                <textarea 
                  className="input-field min-h-[100px] resize-none" 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Ghost Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-bgSecondary border border-borderBase rounded-xl">
                <div>
                  <h3 className="font-medium text-textPrimary flex items-center gap-2">
                    Ghost Mode 👻
                  </h3>
                  <p className="text-xs text-textMuted mt-1 max-w-[250px]">
                    Hide your online status. You will appear offline to everyone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGhostMode(!ghostMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${ghostMode ? 'bg-accent' : 'bg-borderBase'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ghostMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              
              <div className="pt-4 border-t border-borderBase flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading || (name === user?.name && bio === (user?.bio || '') && ghostMode === (user?.ghostMode || false) && !avatarFile)}
                  className="btn-primary flex items-center justify-center min-w-[120px]"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
