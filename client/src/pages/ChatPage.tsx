import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Message, User } from '../types';
import { Send, ArrowLeft, MessageSquare, Info } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

function fmtTime(d: string) {
  const dt = new Date(d);
  if (isToday(dt)) return format(dt,'h:mm a');
  if (isYesterday(dt)) return 'Yesterday '+format(dt,'h:mm a');
  return format(dt,'MMM d, h:mm a');
}

export default function ChatPage() {
  const { partnerId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selPartner, setSelPartner] = useState<User|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchPartners(); }, []);
  useEffect(() => { if (partnerId) fetchMessages(partnerId); }, [partnerId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const fetchPartners = async () => {
    try {
      const { data } = await api.get('/messages/partners');
      setPartners(data.partners);
      if (partnerId) { const p = data.partners.find((x: User) => x._id === partnerId); if (p) setSelPartner(p); }
    } catch(e) { console.error(e); }
  };

  const fetchMessages = async (pid: string) => {
    setLoading(true);
    try { const { data } = await api.get(`/messages/${pid}`); setMessages(data.messages); }
    catch { setMessages([]); } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !partnerId) return;
    const text = newMsg.trim(); setNewMsg(''); setSending(true);
    try { const { data } = await api.post('/messages', { receiverId: partnerId, content: text }); setMessages(p => [...p, data.message]); }
    catch { setNewMsg(text); } finally { setSending(false); }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-stone-50 page-enter">
      {/* Sidebar */}
      <div className={`${partnerId?'hidden md:flex':'flex'} w-full md:w-72 lg:w-80 flex-col bg-white border-r border-gray-100`}>
        <div className="px-4 pt-5 pb-3 border-b border-gray-50">
          <h2 className="font-display text-xl font-bold text-gray-800">Messages</h2>
          <p className="text-xs text-gray-400 mt-0.5">Post-donation chats</p>
        </div>
        {partners.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-500 text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Accept a donation request to unlock chat</p>
            <button onClick={() => navigate('/map')} className="mt-4 text-xs text-blood-600 font-semibold hover:underline">Find donors →</button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {partners.map(p => (
              <button key={p._id} onClick={() => { setSelPartner(p); navigate(`/chat/${p._id}`); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${selPartner?._id===p._id?'bg-blood-50 border-r-2 border-blood-500':''}`}>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{p.name.charAt(0)}</div>
                <div className="min-w-0"><p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p><span className="badge-blood text-xs">{p.bloodType}</span></div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`${!partnerId?'hidden md:flex':'flex'} flex-1 flex-col`}>
        {!partnerId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-14 h-14 text-gray-200 mb-3" />
            <p className="font-semibold text-gray-500">Select a conversation</p>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
              <button onClick={() => navigate('/chat')} className="md:hidden p-1.5 hover:bg-gray-100 rounded-xl mr-1"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
              {selPartner ? <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-bold shadow-sm">{selPartner.name.charAt(0)}</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{selPartner.name}</p>
                  <div className="flex items-center gap-2"><span className="badge-blood text-xs">{selPartner.bloodType}</span><span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Donation partner</span></div>
                </div>
                <button onClick={() => navigate(`/profile/${selPartner._id}`)} className="p-2 hover:bg-gray-100 rounded-xl"><Info className="w-4 h-4 text-gray-400" /></button>
              </> : <div className="h-10 w-48 skeleton" />}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ background:'linear-gradient(180deg,#fefaf7,#f5f0ea)' }}>
              {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
              : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-5 py-3 rounded-2xl mb-3">✓ Chat unlocked! Say hello 👋</div>
                </div>
              ) : messages.map((msg, idx) => {
                const senderObj = msg.senderId as unknown as User | string | undefined;
                const senderId = typeof senderObj === 'string' ? senderObj : senderObj?._id;
                const isMe = !!senderId && !!user?._id && senderId === user?._id;
                const prev = idx > 0 ? messages[idx-1] : null;
                const prevSid = prev ? ((prev.senderId as User)?._id || prev.senderId) : null;
                const curSid = (msg.senderId as User)?._id || msg.senderId;
                const showAv = !isMe && prevSid !== curSid;
                return (
                  <div key={msg._id} className={`flex items-end gap-2 ${isMe?'justify-end':'justify-start'} mt-1`}>
                    {!isMe && <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${showAv?'opacity-100':'opacity-0'}`}>{(msg.senderId as User)?.name?.charAt(0)||'?'}</div>}
                    <div className={`max-w-xs lg:max-w-sm xl:max-w-md group flex flex-col ${isMe?'items-end':'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe?'bg-blood-600 text-white rounded-br-md':'bg-white text-gray-800 border border-gray-100 rounded-bl-md'}`}>{msg.content}</div>
                      <p className={`text-xs text-gray-400 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe?'text-right':''}`}>{fmtTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="bg-white border-t border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-1.5">
                <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key==='Enter'&&!e.shiftKey&&handleSend()}
                  placeholder="Type a message..." className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none py-1.5" />
                <button onClick={handleSend} disabled={!newMsg.trim()||sending}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${newMsg.trim()?'bg-blood-600 hover:bg-blood-700 text-white shadow-sm hover:-translate-y-0.5':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {sending?<div className="spinner w-4 h-4" />:<Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
