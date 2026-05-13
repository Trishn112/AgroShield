import * as React from 'react';
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Bug, Lightbulb, MessageCircle, LifeBuoy } from 'lucide-react';
import { useLanguage } from '@/lib/languageStore';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export function FeedbackDialog() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!auth.currentUser) {
        toast.error("Please sign in to provide feedback");
        return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        category,
        message,
        createdAt: serverTimestamp()
      });
      toast.success(t('feedback.success'));
      setMessage('');
      setOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button 
          variant="outline" 
          className="fixed bottom-6 left-6 z-50 rounded-full h-14 w-14 p-0 bg-blue-600 hover:bg-blue-500 border-none shadow-[0_0_30px_rgba(37,99,235,0.3)] group transition-all active:scale-95"
          id="global-feedback-trigger"
        >
          <LifeBuoy className="w-6 h-6 text-white transition-transform group-hover:rotate-45" />
        </Button>
      } />
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[450px] rounded-[32px] overflow-hidden backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="text-emerald-500 w-6 h-6" />
            {t('feedback.title')}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {t('feedback.placeholder')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t('feedback.category')}</label>
            <div className="flex gap-2">
              {[
                { id: 'bug', icon: Bug, label: t('feedback.cat.bug') },
                { id: 'feature', icon: Lightbulb, label: t('feedback.cat.feature') },
                { id: 'general', icon: MessageCircle, label: t('feedback.cat.general') }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    category === cat.id 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'
                  }`}
                >
                  <cat.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t('feedback.msg')}</label>
             <Textarea 
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               placeholder={t('feedback.placeholder')}
               className="bg-black/50 border-white/10 text-white min-h-[150px] rounded-2xl focus:border-emerald-500 transition-all resize-none"
               required
             />
          </div>

          <DialogFooter className="pt-2">
            <Button 
                type="submit" 
                disabled={loading || !message.trim()}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all active:scale-95"
            >
              {loading ? t('common.loading') : t('feedback.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
