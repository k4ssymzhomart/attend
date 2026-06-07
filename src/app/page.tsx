import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 bg-white">
      <Link 
        href="/admin" 
        className="w-full max-w-sm p-8 text-center border border-black bg-white text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-xl tracking-wider"
      >
        Я УЧИТЕЛЬ
      </Link>
      <Link 
        href="/student" 
        className="w-full max-w-sm p-8 text-center border border-black bg-white text-black hover:bg-black hover:text-white transition-colors uppercase font-bold text-xl tracking-wider"
      >
        Я УЧЕНИК
      </Link>
    </div>
  );
}
