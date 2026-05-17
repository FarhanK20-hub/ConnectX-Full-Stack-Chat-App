import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, KeyRound } from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function VaultModal() {
  const { setShowVaultModal, verifyPin } = useVaultStore();
  const { user, setUser } = useAuthStore();
  const [pin, setPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(!user?.hasVaultPin);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      if (isSettingPin) {
        await api.post('/vault/pin', { pin });
        toast.success('Vault PIN set successfully! You can now unlock the vault.');
        setUser({ ...user, hasVaultPin: true });
        setIsSettingPin(false);
        setPin('');
      } else {
        await verifyPin(pin);
        toast.success('Vault Unlocked!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-bgCard rounded-[24px] shadow-2xl border border-borderBase overflow-hidden"
      >
        <div className="p-6 text-center relative">
          <button 
            onClick={() => setShowVaultModal(false)}
            className="absolute top-4 right-4 p-2 text-textMuted hover:text-white bg-bgSecondary hover:bg-borderBase rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
            {isSettingPin ? <KeyRound size={32} className="text-accent" /> : <Lock size={32} className="text-accent" />}
          </div>
          
          <h2 className="text-xl font-display font-medium text-textPrimary mb-2">
            {isSettingPin ? 'Set Vault PIN' : 'Enter Vault PIN'}
          </h2>
          <p className="text-sm text-textMuted mb-6">
            {isSettingPin ? 'Create a secure PIN to lock your private conversations.' : 'Enter your PIN to access hidden conversations.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="password" 
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // Only numbers
              placeholder="••••"
              className="w-full bg-bgSecondary border border-borderBase rounded-xl py-3 px-4 text-center text-2xl tracking-[0.5em] text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:tracking-normal"
            />
            
            <button 
              type="submit" 
              disabled={loading || pin.length < 4}
              className="w-full bg-accent hover:bg-opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isSettingPin ? 'Set PIN' : 'Unlock Vault'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
