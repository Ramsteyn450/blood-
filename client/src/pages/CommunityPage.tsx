import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { CommunityMessage } from '../types';
import { Send, Users, Zap, Pin } from 'lucide-react';
import { format, isToday } from 'date-fns';

export default function CommunityPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [pinned, setPinned] = useState<CommunityMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchMessages(); fetchPinned(); const t = setInterval(fetchMessages, 10000); return () => clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const fetchMessages = async () => { try { const { data } = await api.get('/community'); setMessages(data.messages); } catch(e){console.error(e);} finally{setLoading(false);} };
  const fetchPinned = async () => { try { const { data } = await api.get('/community/pinned'); setPinned(data.messages); } catch(e){console.error(e);} };

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    const text = newMsg.trim(); setNewMsg(''); setSending(true);
    try { const { data } = await api.post('/community', { text, isUrgent }); setMessages(p => [...p, data.message]); setIsUrgent(false); }
    catch { setNewMsg(text); } finally { setSending(false); }
  };

  const handlePin = async (id: string) => { try { await api.patch(`/community/${id}/pin`); fetchPinned(); } catch(e){console.error(e);} };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-stone-50 page-enter">
      <div className="glass border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blood-500 to-blood-700 rounded-xl flex items-center justify-center shadow-sm"><Users className="w-5 h-5 text-white" /></div>
        <div><h2 className="font-display text-lg font-bold text-gray-800">Community</h2><p className="text-xs text-gray-400">Blood Donor Network — All Members</p></div>
        <div className="ml-auto flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live</div>
      </div>

      {pinned.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 space-y-1">
          {pinned.map(p => <div key={p._id} className="flex items-start gap-2 text-xs text-amber-800"><Pin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" /><span><strong>{(p.senderId as any)?.name}</strong>: {p.text}</span></div>)}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ background:'linear-gradient(180deg,#fefaf7,#f5f0ea)' }}>
        {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
        : messages.length === 0 ? <div className="text-center py-12 text-gray-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="font-semibold text-sm">Be the first to post!</p></div>
        : messages.map(msg => {
          const isMe = (msg.senderId as any)?._id === user?._id;
          const sender = msg.senderId as any;
          return (
            <div key={msg._id} className={`flex items-start gap-2.5 ${isMe?'flex-row-reverse':''} group`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5">{sender?.name?.charAt(0)||'?'}</div>
              <div className={`max-w-sm flex flex-col ${isMe?'items-end':'items-start'}`}>
                {!isMe && <div className="flex items-center gap-1.5 mb-1 ml-1"><span className="text-xs font-bold text-gray-700">{sender?.name}</span><span className="badge-blood text-xs">{sender?.bloodType}</span>{sender?.badges>0&&<span className="text-xs text-amber-500 font-bold">×{sender.badges}</span>}</div>}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${msg.isUrgent?'bg-red-600 text-white border-2 border-red-400':msg.isAnnouncement?'bg-amber-500 text-white':isMe?'bg-blood-600 text-white rounded-br-md':'bg-white text-gray-800 border border-gray-100 rounded-bl-md'}`}>
                  {msg.isUrgent && <div className="flex items-center gap-1 text-red-200 text-xs font-bold mb-1"><Zap className="w-3 h-3" /> URGENT</div>}
                  {msg.text}
                </div>
                <div className={`flex items-center gap-2 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe?'flex-row-reverse':''}`}>
                  <span className="text-xs text-gray-400">{isToday(new Date(msg.createdAt))?format(new Date(msg.createdAt),'h:mm a'):format(new Date(msg.createdAt),'MMM d, h:mm a')}</span>
                  {user?.role==='admin'&&!isMe&&<button onClick={() => handlePin(msg._id)} className="text-xs text-gray-400 hover:text-amber-600 transition-colors"><Pin className="w-3 h-3" /></button>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-100 px-4 py-3">
        {isUrgent && <div className="mb-2 flex items-center gap-2 text-xs text-red-600 font-semibold bg-red-50 rounded-xl px-3 py-1.5 border border-red-200 animate-pulse"><Zap className="w-3.5 h-3.5" /> Sending as URGENT</div>}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsUrgent(!isUrgent)} className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isUrgent?'bg-red-600 text-white':'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'}`}><Zap className="w-4 h-4" /></button>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-1.5">
            <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key==='Enter'&&!e.shiftKey&&handleSend()}
              placeholder="Post to community..." className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none py-1.5" />
            <button onClick={handleSend} disabled={!newMsg.trim()||sending}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${newMsg.trim()?'bg-blood-600 hover:bg-blood-700 text-white':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {sending?<div className="spinner w-4 h-4" />:<Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
