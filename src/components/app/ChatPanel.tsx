import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Msg { id: string; sender_id: string; recipient_id: string; content: string; created_at: string; }

export function ChatPanel({ peerId }: { peerId?: string }) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [coachId, setCoachId] = useState<string | null>(peerId ?? null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (peerId) { setCoachId(peerId); return; }
    if (role !== "client") return;
    // find any coach
    supabase.from("user_roles").select("user_id").eq("role", "coach").limit(1).maybeSingle()
      .then(({ data }) => setCoachId(data?.user_id ?? null));
  }, [role, peerId]);

  useEffect(() => {
    if (!user || !coachId) return;
    const load = async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${coachId}),and(sender_id.eq.${coachId},recipient_id.eq.${user.id})`)
        .order("created_at");
      setMessages((data as Msg[]) ?? []);
    };
    load();
    const ch = supabase.channel(`chat-${user.id}-${coachId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if ((m.sender_id === user.id && m.recipient_id === coachId) || (m.sender_id === coachId && m.recipient_id === user.id)) {
          setMessages((prev) => [...prev, m]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, coachId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !coachId) return;
    const content = text.trim();
    setText("");
    await supabase.from("messages").insert({ sender_id: user.id, recipient_id: coachId, content });
  };

  if (!coachId) return <Card className="p-6 text-center text-muted-foreground">No hay coach disponible aún.</Card>;

  return (
    <Card className="flex flex-col h-[70vh] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-secondary/40">
        {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">Empieza la conversación 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${mine ? "ml-auto bg-gradient-cta text-primary-foreground rounded-br-sm" : "bg-card rounded-bl-sm shadow-soft"}`}>
              {m.content}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-border flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje..." />
        <Button type="submit" variant="hero" size="icon"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
