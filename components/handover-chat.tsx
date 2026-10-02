'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage } from '@/lib/actions/handover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';

type Msg = { id: string; sender_id: string; body: string; created_at: string };
export function HandoverChat({ handoverId, me, finderId, locked }: { handoverId: string; me: string; finderId: string; locked: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState(''); const [err, setErr] = useState(''); const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    const { data } = await createClient().from('handover_messages').select('id,sender_id,body,created_at').eq('handover_id', handoverId).order('created_at');
    if (data) setMsgs(data);
  }, [handoverId]);
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [msgs.length]);
  const send = () => start(async () => {
    setErr(''); const r = await sendMessage(handoverId, text);
    if (r.error) setErr(r.error); else { setText(''); load(); }
  });
  return (
    <div className="flex h-[420px] flex-col rounded-lg border bg-white">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {!msgs.length && <p className="pt-10 text-center text-sm text-muted-foreground">No messages yet. Agree a time and a public meeting point.</p>}
        {msgs.map((m) => { const mine = m.sender_id === me;
          return (<div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
            <span className="mb-0.5 text-[10px] text-muted-foreground">{mine ? 'You' : m.sender_id === finderId ? 'Finder' : 'Owner'}</span>
            <p className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-accent text-white' : 'bg-muted')}>{m.body}</p></div>); })}
        <div ref={end} />
      </div>
      {!locked && <div className="border-t p-3">
        {err && <p className="mb-2 text-xs text-red-600">{err}</p>}
        <div className="flex gap-2"><Input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && text.trim() && send()} placeholder="Message (no phone numbers / emails)" />
          <Button variant="accent" disabled={pending || !text.trim()} onClick={send} aria-label="Send"><Send className="h-4 w-4" /></Button></div></div>}
    </div>
  );
}
