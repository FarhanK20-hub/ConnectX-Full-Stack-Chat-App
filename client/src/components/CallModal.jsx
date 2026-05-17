import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/useAuthStore';

export default function CallModal() {
  const { isReceivingCall, isCallActive, caller, callSignal, callType, peerId, acceptCall, endCall } = useCallStore();
  const { user } = useAuthStore();
  const socket = useSocket();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');

  // Initialization & cleanup
  useEffect(() => {
    // If we're not active or receiving, clean up completely
    if (!isCallActive && !isReceivingCall) {
      cleanupCall();
    }
  }, [isCallActive, isReceivingCall]);

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    endCall();
  };

  // Socket listeners for WebRTC
  useEffect(() => {
    if (!socket) return;
    
    const handleCallAccepted = async (signal) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    };

    const handleIceCandidate = async (candidate) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    socket.on('call_accepted', handleCallAccepted);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('call_accepted', handleCallAccepted);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, isCallActive]);

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const to = caller ? caller.from : peerId;
        socket.emit('ice_candidate', { to, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === 'video',
      audio: true,
    });
    setLocalStream(stream);
    return stream;
  };

  // Caller initiates call
  useEffect(() => {
    if (isCallActive && !isReceivingCall && peerId && !peerConnectionRef.current) {
      const startCall = async () => {
        try {
          const stream = await getMedia();
          const pc = initializePeerConnection();
          
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('call_user', {
            userToCall: peerId,
            signalData: offer,
            from: user._id,
            name: user.name,
            avatar: user.avatar,
            type: callType,
          });
        } catch (error) {
          console.error("Error starting call:", error);
          cleanupCall();
        }
      };
      startCall();
    }
  }, [isCallActive, isReceivingCall, peerId, callType, user, socket]);

  // Handle Video Refs assignment
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCallActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isCallActive]);

  const handleAcceptCall = async () => {
    try {
      const stream = await getMedia();
      const pc = initializePeerConnection();
      
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callSignal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', {
        to: caller.from,
        signal: answer,
      });

      acceptCall();
    } catch (error) {
      console.error("Error accepting call:", error);
      handleDeclineCall();
    }
  };

  const handleDeclineCall = () => {
    socket.emit('end_call', { to: caller?.from || peerId });
    cleanupCall();
  };

  const handleEndCall = () => {
    socket.emit('end_call', { to: caller?.from || peerId });
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!isReceivingCall && !isCallActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Incoming Call Screen */}
      {isReceivingCall && !isCallActive && (
        <div className="bg-bgSecondary p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-borderBase animate-in fade-in zoom-in duration-200">
          <img 
            src={caller?.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
            alt={caller?.name} 
            className="w-24 h-24 rounded-full border-4 border-accent shadow-lg mb-4 object-cover" 
          />
          <h2 className="text-2xl font-display font-bold text-textPrimary mb-1">{caller?.name}</h2>
          <p className="text-textMuted mb-8 capitalize">{callType} call...</p>
          
          <div className="flex gap-6">
            <button 
              onClick={handleDeclineCall}
              className="w-14 h-14 bg-error text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-transform hover:scale-105 shadow-lg"
            >
              <PhoneOff size={24} />
            </button>
            <button 
              onClick={handleAcceptCall}
              className="w-14 h-14 bg-success text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-transform hover:scale-105 shadow-lg animate-pulse"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Active Call Screen */}
      {isCallActive && (
        <div className="relative w-full max-w-4xl h-[80vh] bg-bgCard rounded-2xl overflow-hidden shadow-2xl flex border border-borderBase">
          {/* Main Video (Remote) */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            {callType === 'video' ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center">
                <img 
                  src={caller?.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
                  alt="Remote" 
                  className="w-32 h-32 rounded-full border-4 border-accent shadow-lg mb-4 object-cover animate-pulse"
                />
                <h3 className="text-xl text-white font-medium">{caller?.name || 'In Call'}</h3>
                <p className="text-textMuted">00:00</p>
              </div>
            )}
            
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 text-white">
                <span className="animate-pulse">Connecting...</span>
              </div>
            )}
          </div>

          {/* Local Video (PiP) */}
          {callType === 'video' && (
            <div className="absolute top-4 right-4 w-48 h-32 bg-black rounded-lg border-2 border-borderBase shadow-xl overflow-hidden z-20">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-bgSecondary/80 backdrop-blur-md px-6 py-4 rounded-full border border-borderBase z-30 shadow-2xl">
            <button 
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-bgCard text-error' : 'bg-bgCard text-textPrimary hover:bg-borderBase'}`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            {callType === 'video' && (
              <button 
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-bgCard text-error' : 'bg-bgCard text-textPrimary hover:bg-borderBase'}`}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            )}

            <button 
              onClick={handleEndCall}
              className="w-14 h-14 bg-error text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-transform hover:scale-105 shadow-lg ml-2"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
