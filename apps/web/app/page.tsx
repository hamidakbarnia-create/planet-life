'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4"/>
            <circle cx="15" cy="15" r="7" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="15" cy="15" r="2.5" fill="#fbbf24"/>
          </svg>
          <span style={{fontFamily:'serif',color:'#fbbf24',fontSize:'15px',letterSpacing:'0.15em'}}>Planet Life</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how" className="hover:text-white transition">How it works</a>
          <Link href="/profile" className="hover:text-white transition">Profile</Link>
          <Link href="/dashboard" className="bg-amber-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="text-sm text-amber-400 font-medium mb-4 tracking-widest uppercase">Astrological Intelligence Platform</div>
        <h1 className="text-5xl font-semibold max-w-3xl leading-tight mb-6">
          Make better decisions with <span className="text-amber-400">planetary timing</span>
        </h1>
        <p className="text-white/50 max-w-xl text-lg mb-10">
          Planet Life analyzes your natal chart against current transits to score your business, financial, and real estate decisions from 0 to 100.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard" className="bg-amber-500 text-black px-6 py-3 rounded-lg font-medium hover:bg-amber-400 transition text-sm">
            Analyze now
          </Link>
          <Link href="/profile" className="border border-white/20 px-6 py-3 rounded-lg text-sm hover:border-white/40 transition">
            My Profile
          </Link>
        </div>
      </section>

      <section id="features" className="px-8 py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-12">Three domains. One blueprint.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon:'🏢', title:'Business', desc:'Launch timing, negotiations, hiring, networking and creative work.' },
            { icon:'💰', title:'Finance', desc:'Investment windows, contract signing, financial transactions.' },
            { icon:'🏠', title:'Real Estate', desc:'Property acquisition, valuations, structural soundness timing.' },
          ].map(f => (
            <div key={f.title} className="border border-white/10 rounded-xl p-6 hover:border-amber-500/30 transition">
              <div className="text-3xl mb-4">{f.icon}</div>
              <div className="font-medium mb-2">{f.title}</div>
              <div className="text-white/50 text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="px-8 py-20 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-12">How it works</h2>
        <div className="flex flex-col gap-8">
          {[
            { step:'01', title:'Enter your birth data', desc:'Date, time, and location of birth.' },
            { step:'02', title:'Choose your action', desc:'Business launch, investment, real estate purchase, and more.' },
            { step:'03', title:'Get your score', desc:'Receive a 0–100 score with opportunities, risks, and recommendations.' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-6 text-left">
              <div className="text-amber-400 font-semibold text-lg min-w-[2rem]">{s.step}</div>
              <div>
                <div className="font-medium mb-1">{s.title}</div>
                <div className="text-white/50 text-sm">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center py-20 px-6">
        <h2 className="text-3xl font-semibold mb-4">Ready to align with the cosmos?</h2>
        <p className="text-white/50 mb-8">Start your first analysis in 30 seconds.</p>
        <Link href="/dashboard" className="bg-amber-500 text-black px-8 py-3 rounded-lg font-medium hover:bg-amber-400 transition">
          Go to dashboard
        </Link>
      </section>

      <footer className="border-t border-white/10 px-8 py-6 text-center text-white/30 text-sm">
        Planet Life © 2026
      </footer>
    </main>
  );
}