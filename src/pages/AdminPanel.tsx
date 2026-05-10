import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileText, 
  ShoppingBag, 
  Bell, 
  Shield, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle,
  Send,
  AlertTriangle,
  Info,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [broadcast, setBroadcast] = useState({ title: '', msg: '', type: 'info' });
  const [sending, setSending] = useState(false);

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.msg) {
      toast.error("Please fill all alert fields");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, 'alerts'), {
        ...broadcast,
        createdAt: serverTimestamp()
      });
      toast.success("System-wide broadcast sent!");
      setBroadcast({ title: '', msg: '', type: 'info' });
    } catch (err: any) {
      toast.error("Broadcast failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="text-emerald-500 w-8 h-8" />
              Command Center
            </h1>
            <p className="text-zinc-500 text-sm">System administration and planetary oversight.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-500 rounded-full px-6">
            Generate System Report
          </Button>
        </div>

        {/* Broadcast Form */}
        <Card className="bg-zinc-900 border-white/5 overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
             <CardTitle className="text-white flex items-center gap-2">
               <Bell className="w-5 h-5 text-emerald-500" />
               Emergency Broadcast System
             </CardTitle>
             <CardDescription className="text-zinc-500">Send real-time alerts to all active personnel dashboards.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Alert Type</label>
                 <div className="flex gap-2">
                   {['info', 'warning', 'critical'].map(t => (
                     <button
                        key={t}
                        onClick={() => setBroadcast({ ...broadcast, type: t })}
                        className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${broadcast.type === t ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-500 border-white/10 hover:border-white/20'}`}
                     >
                       {t}
                     </button>
                   ))}
                 </div>
               </div>
               <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Headline</label>
                 <Input 
                   value={broadcast.title}
                   onChange={e => setBroadcast({ ...broadcast, title: e.target.value })}
                   placeholder="e.g. Seismic Shift Detected" 
                   className="bg-black/40 border-white/10 text-white h-12 rounded-xl" 
                 />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Message Details</label>
               <Textarea 
                 value={broadcast.msg}
                 onChange={e => setBroadcast({ ...broadcast, msg: e.target.value })}
                 placeholder="Provide detailed instructions for the broadcasted alert..." 
                 className="bg-black/40 border-white/10 text-white min-h-[100px] rounded-xl"
               />
            </div>
            <Button 
               onClick={handleBroadcast}
               disabled={sending}
               className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest gap-2"
            >
               {sending ? <RefreshCw className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
               Commence System-Wide Broadcast
            </Button>
          </CardContent>
        </Card>

        {/* Admin Tabs */}
        <div className="flex bg-zinc-900 overflow-hidden w-fit rounded-2xl border border-white/5">
          {[
            { id: 'users', label: 'User Registry', icon: Users },
            { id: 'reports', label: 'Crop Reports', icon: FileText },
            { id: 'market', label: 'Marketplace', icon: ShoppingBag },
            { id: 'alerts', label: 'System Alerts', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <Card className="bg-zinc-900 border-white/5 overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
            <div className="relative w-96">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
               <Input placeholder="Filter records..." className="bg-black/40 border-white/10 pl-12 h-12 rounded-2xl text-white" />
            </div>
            <div className="flex gap-2">
               <Button variant="outline" className="border-white/10 text-white h-11 rounded-xl">
                 <Filter className="w-4 h-4 mr-2" /> All Regions
               </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
               <TableHeader className="bg-black/40">
                 <TableRow className="border-white/5">
                   <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest py-6 px-8">Entity</TableHead>
                   <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                   <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Type</TableHead>
                   <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right px-8">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {[1, 2, 3, 4, 5].map(i => (
                   <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors group">
                     <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 font-bold">
                             {String.fromCharCode(64 + i)}
                           </div>
                           <div>
                              <div className="text-white font-bold text-sm">Entity Node {i * 1234}</div>
                              <div className="text-[10px] text-zinc-500 font-medium">Illinois Sector A-{i}</div>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                     </TableCell>
                     <TableCell className="text-zinc-400 text-xs font-medium">Standard Data-Feed</TableCell>
                     <TableCell className="px-8 text-right">
                        <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-white">
                           <MoreVertical className="w-4 h-4" />
                        </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          </CardContent>
        </Card>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: 'CPU Load', val: '12%', color: 'text-emerald-500' },
             { label: 'Storage', val: '4.2TB', color: 'text-blue-400' },
             { label: 'Active Sessions', val: '24,042', color: 'text-white' },
             { label: 'Alert Rate', val: 'Low', color: 'text-zinc-500' },
           ].map((s, i) => (
             <div key={i} className="bg-zinc-900 p-6 rounded-3xl border border-white/5">
                <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
