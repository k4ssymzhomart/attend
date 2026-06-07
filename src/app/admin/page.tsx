"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { User, Plus, Loader2, X } from "lucide-react";

export default function AdminPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Получаем origin
    setOrigin(window.location.origin);
    
    // ПЕРСИСТЕНТНОСТЬ: Проверяем, есть ли сохраненный урок
    const savedSession = localStorage.getItem("currentSessionId");
    if (savedSession) {
      setSessionId(savedSession);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // Загружаем существующих учеников
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

    // ИСПРАВЛЕНИЕ REAL-TIME ПОДПИСКИ: Слушаем INSERT для текущего session_id
    const channel = supabase
      .channel(`attendance_session_${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'attendance', 
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          setStudents((prev) => [...prev, payload.new.student_name]);
        }
      )
      .subscribe();

    // Отписка при размонтировании
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
      localStorage.setItem("currentSessionId", data.id); // Сохраняем в localStorage
    }
    setLoading(false);
  };

  const finishSession = () => {
    // Завершаем урок: очищаем состояние и удаляем из localStorage
    setSessionId(null);
    setStudents([]);
    localStorage.removeItem("currentSessionId");
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white text-black">
        <button
          onClick={createSession}
          disabled={loading}
          className="flex items-center gap-4 px-8 py-6 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-xl tracking-wider disabled:opacity-50 rounded-none"
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
      
      {/* Шапка с кнопкой завершения */}
      <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-md mb-8 border-b border-black pb-4 gap-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest">Урок запущен</h1>
        <button 
          onClick={finishSession}
          className="flex items-center gap-2 px-4 py-3 bg-black text-white uppercase font-bold text-sm hover:opacity-80 transition-opacity rounded-none border border-black"
        >
          <X className="w-5 h-5" />
          ЗАВЕРШИТЬ УРОК
        </button>
      </div>
      
      <div className="p-4 border border-black mb-8 bg-white rounded-none">
        <QRCodeSVG value={attendanceUrl} size={300} fgColor="#000000" bgColor="#FFFFFF" />
      </div>

      <div className="text-sm uppercase mb-8 opacity-50 break-all text-center max-w-md">
        {attendanceUrl}
      </div>

      <div className="w-full max-w-md border border-black rounded-none">
        {/* МИНИ-СЧЕТЧИК */}
        <div className="bg-white border-b border-black text-black p-4 uppercase font-bold text-lg text-center tracking-widest">
          ОТМЕТИЛОСЬ УЧЕНИКОВ: {students.length}
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
