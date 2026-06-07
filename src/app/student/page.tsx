import Link from 'next/link';

export default function StudentInfo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 text-center bg-white text-black">
      <h1 className="text-2xl font-bold uppercase tracking-wider mb-4">Ожидание урока</h1>
      <p className="border border-black p-6 max-w-sm uppercase text-sm leading-relaxed font-bold">
        Отсканируйте QR-код, который показывает учитель, чтобы перейти к отметке присутствия.
      </p>
      <Link href="/" className="mt-8 border border-black px-8 py-4 hover:bg-black hover:text-white transition-colors uppercase font-bold text-lg tracking-wider">
        НАЗАД
      </Link>
    </div>
  );
}
