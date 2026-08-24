import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Share2,
  ShieldCheck,
  Stethoscope,
  Send,
  User,
  Sparkles,
} from 'lucide-react';
import { appointmentApi } from '../../api';
import { useCurrentUser } from '../../store/authStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TelehealthRoom: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: 'Encrypted HIPAA-compliant telehealth consultation room started.', time: 'Just now' },
  ]);
  const [inputText, setInputText] = useState('');

  const { data: appt, isLoading } = useQuery({
    queryKey: ['telehealth-appointment', appointmentId],
    queryFn: async () => (await appointmentApi.getById(Number(appointmentId))).data,
    enabled: !!appointmentId,
  });

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: currentUser?.name || 'Me', text: inputText, time: now }]);
    setInputText('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isDoctor = currentUser?.role === 'DOCTOR';
  const otherPartyName = isDoctor ? appt?.patientName : `Dr. ${appt?.doctorName}`;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Main Video Grid */}
      <div className="flex-1 flex flex-col h-full">
        {/* Top bar */}
        <div className="h-14 px-6 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary-400 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-200">
                Telehealth Consultation with {otherPartyName}
              </h2>
              <p className="text-[10px] text-slate-400">
                {appt?.doctorSpecialization} • {appt?.appointmentDate} ({appt?.startTime} - {appt?.endTime})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit E2E Encrypted</span>
          </div>
        </div>

        {/* Video Feeds Container */}
        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
          {/* Remote Feed */}
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
            <div className="text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center mx-auto text-3xl font-bold shadow-lg ring-4 ring-slate-800">
                {otherPartyName?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-200">{otherPartyName}</div>
                <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live HD Stream</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-md text-xs font-medium border border-slate-800">
              {otherPartyName}
            </div>
          </div>

          {/* Local Feed */}
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
            {videoOn ? (
              <div className="text-center space-y-3">
                <div className="w-24 h-24 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto text-3xl font-bold shadow-lg ring-4 ring-slate-800">
                  {currentUser?.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-200">{currentUser?.name} (You)</div>
                  <div className="text-xs text-slate-400">Camera Active</div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 text-slate-500">
                <VideoOff className="w-12 h-12 mx-auto" />
                <div className="text-xs">Your camera is turned off</div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-md text-xs font-medium border border-slate-800">
              {currentUser?.name} (You)
            </div>
          </div>
        </div>

        {/* In-Call Controls Bottom Bar */}
        <div className="h-20 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-center gap-4 flex-shrink-0">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`p-3.5 rounded-full transition-all ${
              micOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={micOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setVideoOn(!videoOn)}
            className={`p-3.5 rounded-full transition-all ${
              videoOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={videoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-3.5 rounded-full transition-all ${
              chatOpen ? 'bg-primary hover:bg-primary-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Toggle In-Call Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-red-600/30"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* In-Call Chat Sidebar */}
      {chatOpen && (
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full animate-slide-up">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>In-Call Clinical Chat</span>
            </h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg max-w-[90%] space-y-0.5 ${
                  m.sender === 'System'
                    ? 'bg-slate-800/60 border border-slate-700 text-slate-300 text-[11px]'
                    : m.sender === currentUser?.name
                    ? 'ml-auto bg-primary text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] opacity-75">
                  <span className="font-semibold">{m.sender}</span>
                  <span>{m.time}</span>
                </div>
                <div className="leading-relaxed">{m.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
            />
            <button type="submit" className="p-2 bg-primary hover:bg-primary-600 text-white rounded-lg">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TelehealthRoom;
