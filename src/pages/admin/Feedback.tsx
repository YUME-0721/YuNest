import { useState } from 'react';
import { Github, Mail, User, ExternalLink, Shield, Info, Heart, Copy, Check, FileText } from 'lucide-react';
import { useData } from '../../context/DataContext.tsx';
import { TRANSLATIONS } from '../../i18n/translations.ts';

export default function Feedback() {
  const { state } = useData();
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const [copied, setCopied] = useState(false);

  const AUTHOR_INFO = {
    name: 'YUME',
    avatar: 'https://img.072199.xyz/file/1773310074248.webp',
    email: 'yume@072199.xyz',
    github: 'https://github.com/YUME-0721',
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(AUTHOR_INFO.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PROJECT_INFO = {
    name: 'YuNest',
    repo: 'https://github.com/YUME-0721/YuNest',
    license: 'GPL-3.0',
    description: t.siteDescription,
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-10">
      {/* 头部标题 */}
      <header className="mb-10 animate-in fade-in slide-in-from-top duration-500">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <Info className="w-8 h-8 text-[#ec5b13]" />
          {t.feedbackTitle}
        </h2>
        <p className="text-slate-500 mt-2">{t.feedbackDesc}</p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2">
        {/* 作者信息卡片 */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.aboutAuthor}</h3>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#ec5b13] to-orange-300 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <img
                src={AUTHOR_INFO.avatar}
                alt={AUTHOR_INFO.name}
                className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">{AUTHOR_INFO.name}</h4>

            </div>
            <div className="w-full pt-6 space-y-3">
              <button
                onClick={handleCopyEmail}
                title={t.contactEmail}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-[#ec5b13]/5 transition-colors group/link cursor-pointer border-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-sm font-bold">
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-400 group-hover/link:text-[#ec5b13] transition-colors" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-600">{t.contactEmail}</span>
                </div>
                <span className={`text-xs font-bold transition-all duration-300 ${copied ? 'text-green-500 scale-110' : 'text-slate-400'}`}>
                  {copied ? t.copied : AUTHOR_INFO.email}
                </span>
              </button>

            </div>
          </div>
        </section>

        {/* 项目信息卡片 */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <a 
            href="http://navdocs.072199.xyz" 
            target="_blank" 
            rel="noreferrer"
            className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-50 hover:bg-[#ec5b13]/10 text-slate-400 hover:text-[#ec5b13] transition-all group/docs border-none cursor-pointer"
            title="查看文档"
          >
            <FileText className="w-5 h-5 transition-transform group-hover/docs:scale-110" />
          </a>
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.aboutProject}</h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-[#ec5b13] italic">{PROJECT_INFO.name}</span>
                <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Version 1.3.0</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {PROJECT_INFO.description}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.licenseLabel}</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-black ring-1 ring-slate-200">
                  <Shield className="w-3.5 h-3.5" />
                  {PROJECT_INFO.license}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">

                <a
                  href={PROJECT_INFO.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 text-white hover:bg-[#ec5b13] transition-all group/repo shadow-xl shadow-slate-200 hover:shadow-[#ec5b13]/20 active:scale-95"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-bold flex-1">{PROJECT_INFO.repo.replace('https://github.com/', '')}</span>
                  <ExternalLink className="w-4 h-4 opacity-30 group-hover/repo:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 反馈说明 */}
      <section className="bg-[#ec5b13]/5 p-8 rounded-3xl border-2 border-dashed border-[#ec5b13]/20 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#ec5b13] flex items-center justify-center shrink-0 shadow-lg shadow-[#ec5b13]/20 animate-pulse">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <h4 className="text-lg font-black text-slate-800">{t.feedbackInstruction.includes('Report') ? 'Got questions or ideas?' : '遇到问题或有好的想法？'}</h4>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {t.feedbackInstruction}
          </p>
        </div>
      </section>

    </div>
  );
}
