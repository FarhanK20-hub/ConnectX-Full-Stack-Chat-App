import { create } from 'zustand';

export const useCallStore = create((set) => ({
  isReceivingCall: false,
  isCallActive: false,
  caller: null, // { name, avatar, from (userId), type ('audio'|'video') }
  callSignal: null, // WebRTC offer
  callType: 'audio', // 'audio' or 'video'
  peerId: null, // the user id of the person on the other end

  setIncomingCall: (callerInfo, signal) => set({
    isReceivingCall: true,
    caller: callerInfo,
    callSignal: signal,
    callType: callerInfo.type
  }),

  acceptCall: () => set({
    isReceivingCall: false,
    isCallActive: true,
  }),

  startCall: (peerId, type) => set({
    isCallActive: true,
    peerId: peerId,
    callType: type,
  }),

  endCall: () => set({
    isReceivingCall: false,
    isCallActive: false,
    caller: null,
    callSignal: null,
    peerId: null,
  }),
}));
