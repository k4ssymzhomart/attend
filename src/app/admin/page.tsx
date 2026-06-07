"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { User, Plus, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const fetchStudents = async () => {
      const { data } = await supabase
        .from('attendance')
        .select('student_name')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (data) {
        setStudents(data.map(d => d.student_name));
      }
    };
    fetchStudents();

    const channel = supabase
      .channel(`attendance_session_${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setStudents((prev) => [...prev, payload.new.student_name]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const createSession = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .insert({})
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Ошибка при создании урока");
    } else if (data) {
      setSessionId(data.id);
    }
    setLoading(false);
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white text-black">
        <button
          onClick={createSession}
          disabled={loading}
          className="flex items-center gap-4 px-8 py-6 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-xl tracking-wider disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin w-8 h-8" /> : <Plus className="w-8 h-8" />}
          СОЗДАТЬ НОВЫЙ УРОК
        </button>
      </div>
    );
  }

  const attendanceUrl = `${origin}/attend/${sessionId}`;

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-white text-black">
      <h1 className="text-2xl font-bold uppercase mb-8 border-b border-black pb-2 tracking-widest">Урок запущен</h1>
      
      <div className="p-4 border border-black mb-8 bg-white">
        <QRCodeSVG value={attendanceUrl} size={300} fgColor="#000000" bgColor="#FFFFFF" />
      </div>

      <div className="text-sm uppercase mb-8 opacity-50 break-all text-center max-w-md">
        {attendanceUrl}
      </div>

      <div className="w-full max-w-md border border-black">
        <div className="bg-black text-white p-4 uppercase font-bold flex justify-between items-center text-lg">
          <span>Присутствуют</span>
          <span>{students.length}</span>
        </div>
        <ul className="divide-y divide-black max-h-96 overflow-y-auto bg-white">
          {students.length === 0 ? (
            <li className="p-6 text-center uppercase text-sm opacity-50 font-bold">Пока никого нет</li>
          ) : (
            students.map((student, idx) => (
              <li key={idx} className="p-4 uppercase font-bold flex items-center gap-4 text-lg">
                <User className="w-6 h-6" />
                {student}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
