import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useData, PRESET_SEARCH_ENGINES } from '../../context/DataContext';
import { Search } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';

interface SearchWidgetProps {
  size: string;
  showBackground?: boolean;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ size, showBackground }) => {
  const { state } = useData();
  const { settings } = state;
  const t = TRANSLATIONS[settings.language || 'zh-CN'];
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableEngines = useMemo(() => {
    const hasCustom = !PRESET_SEARCH_ENGINES.some(e => e.url === settings.searchEngine);
    if (hasCustom && settings.searchEngine) {
      let iconUrl = '';
      try {
        const urlObj = new URL(settings.searchEngine);
        iconUrl = `https://favicon.im/${urlObj.hostname}`;
      } catch (e) {
        // Fallback icon handled in render
      }
      return [
        {
          id: 'custom',
          name: t.searchEngineOther || 'Custom',
          url: settings.searchEngine,
          icon: iconUrl
        },
        ...PRESET_SEARCH_ENGINES
      ];
    }
    return PRESET_SEARCH_ENGINES;
  }, [settings.searchEngine, t.searchEngineOther]);

  const [currentEngine, setCurrentEngine] = useState(
    availableEngines.find(e => e.url === settings.searchEngine) || availableEngines[0]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(currentEngine.url.replace('%s', encodeURIComponent(searchQuery)), '_blank');
      setSearchQuery('');
    }
  };

  const handleEngineSwitch = () => {
    const currentIndex = availableEngines.findIndex(e => e.id === currentEngine.id);
    const nextIndex = (currentIndex + 1) % availableEngines.length;
    setCurrentEngine(availableEngines[nextIndex]);
  };

  const bg = showBackground
    ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 shadow-lg'
    : 'bg-transparent hover:bg-white/10 border border-transparent';

  if (size.startsWith('1x')) {
    return (
      <>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`w-full h-full ${bg} rounded-2xl flex flex-col items-center justify-center p-3 text-white transition-all group cursor-pointer`}
        >
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform shadow-inner">
            {currentEngine.icon ? (
              <img src={currentEngine.icon} className="w-5 h-5 object-contain" alt="engine" />
            ) : (
              <Search className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-semibold opacity-85 truncate max-w-full">{currentEngine.name}</span>
        </button>

        {isModalOpen && ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-white/40 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh] px-4"
            style={{ margin: 0, padding: '15vh 1rem 0' }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-5 w-full max-w-xl shadow-2xl flex flex-col gap-4"
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={(e) => { handleSearch(e); setIsModalOpen(false); }} className="relative">
                <button
                  type="button"
                  onClick={handleEngineSwitch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                >
                  {currentEngine.icon ? (
                    <img src={currentEngine.icon} className="w-4 h-4 object-contain" alt="engine" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder.replace('{engine}', currentEngine.name)}
                  className="w-full h-14 pl-14 pr-14 rounded-2xl bg-white/70 border border-slate-200 outline-none text-slate-800 text-base placeholder-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
              <div className="flex gap-2 justify-center flex-wrap pt-1">
                {availableEngines.map(eng => (
                  <button
                    key={eng.id}
                    onClick={() => setCurrentEngine(eng)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      currentEngine.id === eng.id ? 'bg-slate-900/10 text-slate-700 border border-slate-200' : 'bg-slate-100/80 text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                    }`}
                  >
                    {eng.icon && <img src={eng.icon} className="w-3.5 h-3.5 object-contain" alt="" />}
                    {eng.name}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  const heightClass = showBackground ? 'h-full' : 'h-auto';

  return (
    <div className={`w-full ${heightClass} ${bg} rounded-2xl flex items-center justify-center p-4`}>
      <form onSubmit={handleSearch} className={`w-full relative group ${
        size === '3x1' ? 'max-w-lg' :
        size === '4x1' ? 'max-w-xl' :
        'max-w-md'
      }`}>
        <button
          type="button"
          onClick={handleEngineSwitch}
          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-white/10 hover:bg-white/30 rounded-full transition-colors z-10 ${
            size.startsWith('1x') ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-7 h-7'
          }`}
          title={`Switch Engine (Current: ${currentEngine.name})`}
        >
          {currentEngine.icon ? (
            <img src={currentEngine.icon} className={`${size.startsWith('1x') ? 'w-3 h-3' : 'w-4 h-4'} object-contain`} alt="engine" />
          ) : (
            <Search className={`${size.startsWith('1x') ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          )}
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t.searchPlaceholder.replace('{engine}', size.startsWith('1x') ? '' : currentEngine.name)}
          className={`w-full bg-white/10 border outline-none text-white placeholder-white/50 transition-all shadow-inner ${
            isFocused ? 'border-white/40 bg-white/20' : 'border-white/10 hover:border-white/30 hover:bg-white/15'
          } ${
            size.startsWith('1x') ? 'h-10 pl-9 pr-8 sm:pl-11 rounded-xl text-xs' : 'h-14 pl-14 pr-14 rounded-2xl'
          }`}
        />
        <button
          type="submit"
          className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white transition-colors font-medium flex items-center justify-center ${
            size.startsWith('1x') ? 'h-8 w-8 rounded-lg' : 'h-10 px-4 rounded-xl gap-2'
          }`}
        >
          <Search className={size.startsWith('1x') ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>
      </form>
    </div>
  );
};
