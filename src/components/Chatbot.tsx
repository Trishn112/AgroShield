import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Minus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFarmingAdviceStream } from '@/services/ai';
import { useLanguage } from '@/lib/languageStore';
import { ChatMessage } from '@/types';

export default function Chatbot() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: t('chat.welcome') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Add a placeholder message for the assistant
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      let fullResponse = '';
      const stream = getFarmingAdviceStream(newMessages);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { ...updated[lastIndex], content: fullResponse };
          return updated;
        });
      }

      if (!fullResponse) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: t('chat.noProcess') };
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: t('chat.error') };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[380px] h-[550px] bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-6 bg-emerald-500/10 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Bot className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm tracking-tight">AgroAI Systems</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-emerald-500 text-[10px] uppercase font-black tracking-widest">{t('chat.neuralLive')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="text-zinc-500 hover:text-white h-8 w-8">
                  <Minus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden p-4">
              <ScrollArea className="h-full pr-4 custom-scrollbar">
                <div className="space-y-6">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                        m.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white/5 text-zinc-300 rounded-tl-none border border-white/5'
                      }`}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-6 bg-black/40 border-t border-white/5">
               <div className="relative group">
                 <Input 
                   placeholder={t('chat.placeholder')} 
                   className="bg-white/5 border-white/10 h-14 pl-6 pr-14 rounded-2xl text-white focus:border-emerald-500/50 focus:ring-0 transition-all placeholder:text-zinc-600"
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 />
                 <Button 
                   onClick={handleSend}
                   disabled={!input.trim() || loading}
                   className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 w-10 h-10 p-0 rounded-xl transition-all active:scale-95"
                 >
                   <Send className="w-4 h-4" />
                 </Button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {isMinimized && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 px-6 py-3 rounded-full flex items-center gap-3 text-emerald-400 font-bold text-sm cursor-pointer hover:bg-emerald-500/20 transition-all"
            onClick={() => setIsMinimized(false)}
          >
            <Sparkles className="w-4 h-4 animate-slow-spin" />
            {t('chat.restore')}
            <Maximize2 className="w-3 h-3 ml-2" />
          </motion.div>
        )}
        
        <Button 
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`w-16 h-16 rounded-[24px] shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 ${
            isOpen && !isMinimized ? 'bg-zinc-800 rotate-90 scale-0 opacity-0' : 'bg-emerald-600 rotate-0 scale-100 opacity-100'
          }`}
        >
          <MessageSquare className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
