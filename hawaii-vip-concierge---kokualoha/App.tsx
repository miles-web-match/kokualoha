
import { useState, useEffect } from 'react';
import { ja as t } from './translations';
import { askConcierge } from './services/gemini';

// シンプルなMarkdownレンダラーコンポーネント
const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  // 1. セクション（---）で分割
  const sections = text.split(/^---$/gm);

  return (
    <div className="space-y-6">
      {sections.map((section, sIdx) => {
        const lines = section.trim().split('\n');
        return (
          <div key={sIdx} className="space-y-3">
            {lines.map((line, lIdx) => {
              const trimmedLine = line.trim();
              
              // 見出し (###)
              if (trimmedLine.startsWith('###')) {
                const content = trimmedLine.replace(/^###\s*/, '').replace(/\*\*/g, '');
                return (
                  <h3 key={lIdx} className="text-xl sm:text-2xl font-serif font-bold text-[#d4af37] mt-8 mb-4 border-b border-[#d4af3733] pb-2">
                    {content}
                  </h3>
                );
              }

              // 小見出し (####)
              if (trimmedLine.startsWith('####')) {
                const content = trimmedLine.replace(/^####\s*/, '').replace(/\*\*/g, '');
                return (
                  <h4 key={lIdx} className="text-lg font-bold text-[#e6e4df] mt-6 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full"></span>
                    {content}
                  </h4>
                );
              }

              // 箇条書き (* または -)
              if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                const content = trimmedLine.replace(/^[*-]\s*/, '');
                // 箇条書き内の太字処理
                const formattedContent = content.split(/(\*\*.*?\*\*)/).map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className="text-[#d4af37] font-bold">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });
                return (
                  <div key={lIdx} className="flex gap-3 pl-4 py-1">
                    <span className="text-[#d4af37] shrink-0">•</span>
                    <p className="text-[#e6e4df] opacity-90">{formattedContent}</p>
                  </div>
                );
              }

              // 通常の段落（太字処理込み）
              if (trimmedLine === '') return <div key={lIdx} className="h-2" />;
              
              const formattedLine = line.split(/(\*\*.*?\*\*)/).map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx} className="text-[#d4af37] font-bold">{part.slice(2, -2)}</strong>;
                }
                return part;
              });

              return (
                <p key={lIdx} className="text-[#e6e4df] leading-[1.8] opacity-90">
                  {formattedLine}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [aiInput, setAiInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSources, setAiSources] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.fade-in-section');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiMessage('');
    setAiSources([]);

    const result = await askConcierge(aiInput);
    setAiMessage(result.text);
    setAiSources(result.sources as string[]);
    setIsAiLoading(false);
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
    };

    const GAS_URL = 'YOUR_GAS_WEBAPP_URL_HERE'; 

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      alert('お問い合わせありがとうございます。自動返信メールを送信しましたのでご確認ください。');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Submission error:', error);
      alert('送信中にエラーが発生しました。お手数ですが islandmakana@gmail.com まで直接ご連絡ください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: 'service', label: t.nav_service },
    { id: 'about', label: t.nav_about },
    { id: 'greeting', label: t.nav_greeting },
    { id: 'company', label: t.nav_company },
    { id: 'contact', label: t.nav_contact },
  ];

  const gold = "#d4af37";

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0c]">
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0b0b0c]/90 backdrop-blur-md border-b border-[#d4af3726] safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between lg:grid lg:grid-cols-3">
          <div className="flex justify-start">
            <button onClick={() => scrollTo('top')} className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-left" style={{ color: gold }}>
              {t.brand}
            </button>
          </div>

          <nav className="hidden lg:flex items-center justify-center space-x-8 text-sm font-medium tracking-widest">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => scrollTo(item.id)}
                className="hover:text-[#d4af37] transition-colors uppercase text-[#e6e4df] whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-end">
            <button 
              className="lg:hidden p-1.5 text-[#d4af37] hover:bg-[#d4af371a] rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        <div className={`lg:hidden absolute top-full left-0 w-full bg-[#0b0b0c] border-b border-[#d4af3726] transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
          <nav className="px-6 py-8 flex flex-col space-y-6">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => scrollTo(item.id)}
                className="text-lg uppercase font-medium tracking-widest border-l-2 border-transparent hover:border-[#d4af37] hover:pl-4 transition-all text-left text-[#e6e4df]"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section id="top" className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&q=80&w=2000" 
            alt="Hawaii Ocean View" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c]/70 via-[#0b0b0c]/40 to-[#0b0b0c]" />
        </div>
        
        <div className="relative z-10 text-center w-full max-w-5xl px-4 sm:px-6 hero-animate">
          <h1 className="font-serif leading-[1.4] mb-8 tracking-tight" 
              style={{ 
                fontSize: 'clamp(1.15rem, 6.2vw, 4rem)',
              }}>
            <div className="flex flex-col items-center px-4">
              <span className="block mb-2 whitespace-nowrap">
                {t.hero_title_line1}
              </span>
              <span className="block text-[#d4af37] whitespace-nowrap">
                {t.hero_title_line2}
              </span>
            </div>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button 
              onClick={() => scrollTo('service')}
              className="w-64 sm:w-auto px-10 py-4 bg-[#d4af37] text-black font-bold rounded-full hover:bg-[#c29d2e] transition-all transform hover:scale-105 shadow-xl shadow-[#d4af372a] text-sm"
            >
              サービスを見る
            </button>
            <button 
              onClick={() => scrollTo('contact')}
              className="w-64 sm:w-auto px-10 py-4 border border-[#d4af37] text-[#d4af37] font-bold rounded-full hover:bg-[#d4af371a] transition-all text-sm"
            >
              お問い合わせ
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-60 cursor-pointer" onClick={() => scrollTo('service')}>
          <div className="scroll-down-indicator" />
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="bg-[#0b0b0c] py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto fade-in-section">
          <div className="bg-[#17181a] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 border border-[#d4af3733] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37] opacity-[0.03] blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
              <div className="w-14 h-14 bg-[#d4af37] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#d4af3733] shrink-0">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="pt-1">
                <h3 className="text-xl sm:text-2xl font-bold text-[#d4af37] mb-1">{t.ai_assistant_title}</h3>
              </div>
            </div>
            
            <form onSubmit={handleAiAsk} className="relative mb-6">
              <input 
                type="text" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={t.ai_assistant_placeholder}
                className="w-full bg-[#0b0b0c] border border-[#d4af3733] rounded-xl sm:rounded-2xl px-5 py-4 sm:py-5 pr-14 focus:outline-none focus:border-[#d4af37] transition-all text-sm sm:text-base placeholder:opacity-30"
                disabled={isAiLoading}
              />
              <button 
                type="submit"
                disabled={isAiLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#d4af37] text-black p-2 rounded-lg sm:rounded-xl disabled:opacity-50 hover:bg-[#c29d2e] transition-colors"
              >
                {isAiLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>

            {aiMessage && (
              <div className="bg-[#0b0b0c]/50 rounded-xl sm:rounded-2xl p-6 sm:p-10 border border-[#d4af371a] animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-inner">
                <MarkdownText text={aiMessage} />
                {aiSources.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-[#d4af371a]">
                    <p className="text-[10px] uppercase tracking-widest text-[#d4af37] mb-4 font-bold opacity-60">Verified Sources</p>
                    <ul className="flex flex-wrap gap-2">
                      {aiSources.map((url, i) => (
                        <li key={i}>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-[#d4af371a] px-3 py-1.5 rounded-lg border border-[#d4af3726] hover:bg-[#d4af3733] transition-colors overflow-hidden text-ellipsis max-w-[150px] inline-block whitespace-nowrap">
                            {new URL(url).hostname}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="about" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#0c0d0e]">
        <div className="max-w-4xl mx-auto text-center fade-in-section">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-6 sm:mb-10 tracking-tight">{t.about_title}</h2>
          <div className="w-16 h-1 bg-[#d4af37] mx-auto mb-10 sm:mb-14" />
          
          <div className="space-y-10">
            <p className="text-xl sm:text-3xl text-[#d4af37] font-medium leading-tight max-w-3xl mx-auto">
              {t.about_desc}
            </p>
            
            <div className="space-y-8 opacity-80 leading-relaxed text-sm sm:text-lg max-w-3xl mx-auto text-left">
              {t.about_desc_long.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="service" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#0b0b0c]">
        <div className="max-w-7xl mx-auto text-center mb-16 fade-in-section">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-4">{t.service_title}</h2>
          <p className="text-[#d4af37] tracking-[0.2em] uppercase text-xs sm:text-sm mb-12 font-medium">{t.service_subtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[
              { title: t.svc1_title, desc: t.svc1_desc, icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c.456 1.621 1.152 3.026 2.188 4.238 1.04 1.216 2.356 2.028 3.691 2.689C13.69 13.51 11.233 11.751 11 9' },
              { title: t.svc2_title, desc: t.svc2_desc, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { title: t.svc3_title, desc: t.svc3_desc, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
              { title: t.svc4_title, desc: t.svc4_desc, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { title: t.svc5_title, desc: t.svc5_desc, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { title: t.svc6_title, desc: t.svc6_desc, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ].map((svc, i) => (
              <div key={i} className="group bg-[#17181a] p-8 sm:p-10 rounded-2xl sm:rounded-3xl border border-[#d4af371a] hover:border-[#d4af3766] transition-all transform hover:-translate-y-2 text-left">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#d4af371a] rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-[#d4af37] transition-colors">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#d4af37] group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={svc.icon} />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{svc.title}</h3>
                <p className="opacity-60 text-xs sm:text-sm leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 opacity-40 italic text-xs sm:text-sm px-4">{t.service_note_more}</p>
        </div>
      </section>

      <section id="greeting" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#141516]">
        <div className="max-w-4xl mx-auto text-center fade-in-section">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-6 tracking-tight">{t.greeting_title}</h2>
          <div className="w-16 h-1 bg-[#d4af37] mx-auto mb-12" />
          <div className="bg-[#17181a] p-8 sm:p-16 rounded-[2rem] border border-[#d4af371a] max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-8 left-8 text-[#d4af37] opacity-10 select-none">
              <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V3L17.017 3C19.7784 3 22.017 5.23858 22.017 8V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM2.017 21L2.017 18C2.017 16.8954 2.91243 16 4.017 16H7.017C7.56928 16 8.017 15.5523 8.017 15V9C8.017 8.44772 7.56928 8 7.017 8H3.017C2.46472 8 2.017 7.55228 2.017 7V3L5.017 3C7.77842 3 10.017 5.23858 10.017 8V15C10.017 18.3137 7.33072 21 4.017 21H2.017Z" />
              </svg>
            </div>
            
            <p className="text-[#d4af37] font-bold text-lg sm:text-xl mb-10 leading-tight whitespace-pre-wrap relative z-10">{t.greeting_name}</p>
            <div className="space-y-6 opacity-80 leading-relaxed text-sm sm:text-base italic text-left relative z-10">
              {t.greeting_body_long.split('\n\n').map((para, i) => (
                <p key={i}>"{para}"</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="company" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#0c0d0e]">
        <div className="max-w-4xl mx-auto text-center fade-in-section">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-6 tracking-tight">{t.company_title}</h2>
          <div className="w-16 h-1 bg-[#d4af37] mx-auto mb-12" />
          <div className="bg-[#17181a] p-10 rounded-[2rem] border border-[#d4af371a]">
            <h3 className="text-2xl font-bold mb-4">{t.company_name}</h3>
            <p className="opacity-70">{t.company_desc}</p>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#0b0b0c]">
        <div className="max-w-4xl mx-auto fade-in-section">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-4 tracking-tight">{t.contact_title}</h2>
            <p className="text-[#d4af37] text-sm sm:text-base tracking-widest">{t.contact_subtitle}</p>
          </div>
          
          <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleContactSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">{t.contact_name}</label>
              <input name="name" type="text" className="bg-[#17181a] border border-[#d4af3726] rounded-xl px-5 py-4 focus:border-[#d4af37] outline-none transition-all text-sm text-[#e6e4df]" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">{t.contact_email}</label>
              <input name="email" type="email" className="bg-[#17181a] border border-[#d4af3726] rounded-xl px-5 py-4 focus:border-[#d4af37] outline-none transition-all text-sm text-[#e6e4df]" required />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">{t.contact_phone}</label>
              <input name="phone" type="tel" className="bg-[#17181a] border border-[#d4af3726] rounded-xl px-5 py-4 focus:border-[#d4af37] outline-none transition-all text-sm text-[#e6e4df]" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">{t.contact_message}</label>
              <textarea name="message" rows={5} className="bg-[#17181a] border border-[#d4af3726] rounded-xl px-5 py-4 focus:border-[#d4af37] outline-none transition-all resize-none text-sm text-[#e6e4df]" required />
            </div>
            <div className="md:col-span-2 flex justify-center pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto px-16 py-5 bg-[#d4af37] text-black font-bold rounded-full hover:bg-[#c29d2e] transition-all transform hover:scale-105 shadow-xl shadow-[#d4af372a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    送信中...
                  </>
                ) : t.contact_send}
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer className="bg-[#050607] pt-20 pb-12 px-6 border-t border-[#d4af371a]">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <button onClick={() => scrollTo('top')} className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-8" style={{ color: gold }}>
            {t.brand}
          </button>
          
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-12 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold opacity-60">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="hover:text-[#d4af37] transition-colors text-[#e6e4df]">{item.label}</button>
            ))}
          </div>

          <div className="text-center opacity-30 text-[9px] sm:text-[10px] tracking-[0.3em] font-medium border-t border-[#d4af371a] pt-8 w-full max-w-lg">
            {t.footer_copyright} {t.footer_rights}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
