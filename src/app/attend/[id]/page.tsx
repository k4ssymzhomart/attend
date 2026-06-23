"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Loader2, LogOut } from "lucide-react";

export default function AttendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [authModeText, setAuthModeText] = useState("");

  // Check login state and check-in status on mount
  useEffect(() => {
    const savedNickname = localStorage.getItem("student_nickname");
    if (savedNickname) {
      setNickname(savedNickname);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !password.trim()) {
      setError("Введите никнейм и пароль");
      return;
    }
    setLoading(true);
    setError("");
    setAuthModeText("");

    const cleanNickname = nickname.trim().toUpperCase();

    try {
      // 1. Check if student already exists
      const { data: student, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("nickname", cleanNickname)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (student) {
        // Verification: check password
        if (student.password !== password) {
          setError("Неверный пароль для этого никнейма");
          setLoading(false);
          return;
        }
        // Success login
        localStorage.setItem("student_nickname", cleanNickname);
        setIsLoggedIn(true);
      } else {
        // Student does not exist - register them automatically
        const { error: insertError } = await supabase
          .from("students")
          .insert({ nickname: cleanNickname, password: password });

        if (insertError) throw insertError;

        localStorage.setItem("student_nickname", cleanNickname);
        setIsLoggedIn(true);
        setAuthModeText("Вы успешно зарегистрированы!");
      }
    } catch (err: any) {
      console.error(err);
      setError("Ошибка авторизации. Пожалуйста, попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("student_nickname");
    setNickname("");
    setPassword("");
    setIsLoggedIn(false);
    setError("");
    setAuthModeText("");
  };

  const submitAttendance = async () => {
    setLoading(true);
    setError("");

    // Get or create unique device_id
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }

    const { error: dbError } = await supabase
      .from("attendance")
      .insert({
        session_id: sessionId,
        student_name: nickname,
        device_id: deviceId
      });

    if (dbError) {
      console.error(dbError);
      if (dbError.code === "23505") {
        const errorMsg = dbError.message || "";
        const errorDetail = dbError.details || "";
        if (errorMsg.includes("unique_session_device") || errorDetail.includes("unique_session_device")) {
          setError("Это устройство уже использовалось для отметки на этом уроке!");
        } else if (errorMsg.includes("unique_session_student") || errorDetail.includes("unique_session_student")) {
          setError("Вы уже отметились на этом уроке!");
        } else {
          setError("Вы уже отметились или это устройство было использовано.");
        }
      } else {
        setError("Произошла ошибка при отметке. Попробуйте еще раз.");
      }
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
          <p className="uppercase text-sm opacity-60 font-bold">{nickname}, вы успешно отмечены!</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show Login / Auto-Registration form
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white text-black">
        <form onSubmit={handleLoginOrRegister} className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold uppercase tracking-widest">Вход ученика</h1>
            <p className="text-xs uppercase opacity-50 font-bold">
              (Если вы тут впервые, аккаунт создастся автоматически)
            </p>
          </div>

          {error && (
            <div className="border border-black p-4 text-center uppercase text-sm font-bold bg-black text-white">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <label className="uppercase text-sm font-bold tracking-widest">ВАШ НИКНЕЙМ</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-4 border border-black bg-white text-black placeholder:text-gray-400 focus:outline-none uppercase text-lg font-bold"
              placeholder="ИВАНОВ ИВАН"
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="uppercase text-sm font-bold tracking-widest">ПАРОЛЬ</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border border-black bg-white text-black placeholder:text-gray-400 focus:outline-none text-lg font-bold"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !nickname.trim() || !password.trim()}
            className="w-full flex justify-center items-center p-5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-lg tracking-widest disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "ВОЙТИ / СОЗДАТЬ"}
          </button>
        </form>
      </div>
    );
  }

  // Logged in: Show confirmation to mark attendance
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white text-black">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-widest">Отметка</h1>
          <p className="text-sm uppercase font-bold border border-black p-3 bg-gray-50 flex items-center justify-between gap-4">
            <span>Вы вошли как: <strong>{nickname}</strong></span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors font-bold text-xs uppercase"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </p>
        </div>

        {authModeText && (
          <div className="border border-green-600 p-4 text-center uppercase text-sm font-bold bg-green-50 text-green-800">
            {authModeText}
          </div>
        )}

        {error && (
          <div className="border border-black p-4 text-center uppercase text-sm font-bold bg-black text-white">
            {error}
          </div>
        )}

        <button
          onClick={submitAttendance}
          disabled={loading}
          className="w-full flex justify-center items-center p-6 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-xl tracking-widest disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin w-8 h-8" /> : "ОТМЕТИТЬСЯ"}
        </button>
      </div>
    </div>
  );
}

