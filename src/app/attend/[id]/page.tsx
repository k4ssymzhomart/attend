"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Loader2 } from "lucide-react";

export default function AttendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    setLoading(true);
    setError("");

    const { error: dbError } = await supabase
      .from("attendance")
      .insert({ session_id: sessionId, student_name: name.trim() });

    if (dbError) {
      console.error(dbError);
      setError("Произошла ошибка. Попробуйте еще раз.");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white text-black">
        <div className="flex flex-col items-center gap-6 p-12 border border-black">
          <Check className="w-20 h-20 text-black" />
          <h1 className="text-3xl font-bold uppercase tracking-widest">ГОТОВО</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white text-black">
      <form onSubmit={submitAttendance} className="w-full max-w-sm flex flex-col gap-8">
        <h1 className="text-3xl font-bold uppercase text-center mb-4 tracking-widest">Отметка</h1>
        
        {error && (
          <div className="border border-black p-4 text-center uppercase text-sm font-bold bg-black text-white">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="uppercase text-sm font-bold tracking-widest">ВАШЕ ИМЯ</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-5 border border-black bg-white text-black placeholder:text-gray-400 focus:outline-none uppercase text-xl font-bold"
            placeholder="ИВАНОВ ИВАН"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full flex justify-center items-center p-6 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-xl tracking-widest disabled:opacity-50 mt-4"
        >
          {loading ? <Loader2 className="animate-spin w-8 h-8" /> : "ОТМЕТИТЬСЯ"}
        </button>
      </form>
    </div>
  );
}
