import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Clock } from 'lucide-react';

interface ClockWidgetProps {
  size: string;
  showBackground?: boolean;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ size, showBackground }) => {
  const { state } = useData();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWithFallback = (options: Intl.DateTimeFormatOptions) => {
    const lang = state.settings.language || 'zh-CN';
    try {
      return new Intl.DateTimeFormat(lang, options).format(now);
    } catch (e) {
      return new Intl.DateTimeFormat(lang, { ...options, timeZone: 'Asia/Shanghai' }).format(now);
    }
  };

  const getTzTime = () => {
    try {
      const str = now.toLocaleString('en-US', {
        timeZone: state.settings.timezone || undefined,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const [h, m, s] = str.split(':');
      return { hour: h, minute: m, second: s };
    } catch (e) {
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      return { hour: h, minute: m, second: s };
    }
  };

  const { hour, minute, second } = getTzTime();

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: state.settings.timezone || undefined
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: state.settings.timezone || undefined
  };

  const bg = showBackground
    ? 'bg-white/20 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/30'
    : 'bg-transparent border border-transparent hover:bg-white/10';
  if (size === '1x2') {
    return (
      <div className={`w-full h-full relative overflow-hidden ${bg} rounded-2xl flex flex-col items-center justify-between text-white p-5 transition-all cursor-default`}>
        {/* Stacked Time */}
        <div className="flex flex-col items-center justify-center my-auto py-4">
          <div className="text-6xl font-extrabold tracking-tight leading-none text-white drop-shadow-md">
            {hour}
          </div>
          <div className="text-6xl font-extrabold tracking-tight leading-none text-white/75 drop-shadow-md mt-2">
            {minute}
          </div>
          <div className="text-3xl font-medium tracking-tight leading-none text-white/45 drop-shadow-sm mt-3 font-mono">
            {second}
          </div>
        </div>

        {/* Date Info */}
        <div className="w-full text-center space-y-1 mt-auto pb-2 border-t border-white/5 pt-4">
          <div className="text-xs font-semibold opacity-90 truncate">
            {formatWithFallback({ month: 'short', day: 'numeric', timeZone: state.settings.timezone || undefined })}
          </div>
          <div className="text-[10px] opacity-60 tracking-wider">
            {formatWithFallback({ weekday: 'short', timeZone: state.settings.timezone || undefined })}
          </div>
        </div>

        {state.settings.timezone && (
          <div className="absolute top-2 right-2 text-[9px] uppercase tracking-widest opacity-40 bg-black/10 px-1.5 py-0.2 rounded-full">
            {state.settings.timezone.split('/')[1]?.replace('_', ' ') || state.settings.timezone}
          </div>
        )}
      </div>
    );
  }

  const heightClass = showBackground ? 'h-full' : 'h-auto';
  const justifyClass = showBackground ? 'justify-center' : 'justify-start pt-2';

  return (
    <div className={`w-full ${heightClass} relative overflow-hidden ${bg} rounded-2xl flex flex-col items-center ${justifyClass} text-white transition-all cursor-default ${
      size === '1x1' ? 'p-2' : 'p-4'
    }`}>
      <div className={`font-bold tracking-tight drop-shadow-md text-center ${
        size.startsWith('1x') ? 'text-2xl sm:text-3xl mb-1' : 'text-4xl sm:text-5xl md:text-6xl mb-2'
      }`}>
        {formatWithFallback(timeOptions)}
      </div>
      <div className={`opacity-90 drop-shadow text-center ${
        size === '1x1' ? 'text-[10px] sm:text-xs' : 'text-sm md:text-base'
      }`}>
        {formatWithFallback(dateOptions)}
      </div>
      {state.settings.timezone && (
        <div className="absolute top-3 left-3 text-[10px] uppercase tracking-widest opacity-60 bg-black/20 px-2 py-0.5 rounded-full">
          {state.settings.timezone.split('/')[1]?.replace('_', ' ') || state.settings.timezone}
        </div>
      )}
    </div>
  );
};
