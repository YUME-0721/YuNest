import React from 'react';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';

interface WeatherWidgetProps {
  size: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ size }) => {
  // 静态数据模拟，后期可接入真实的 API (如心知天气或和风天气)
  const weatherData = {
    city: 'New York',
    temperature: '22',
    condition: 'Partly Cloudy',
    high: '25',
    low: '18',
    wind: '12 km/h'
  };

  return (
    <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-blue-400/40 to-blue-600/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg text-white flex flex-col justify-between group hover:scale-[1.02] transition-transform cursor-pointer ${
      size === '1x1' ? 'p-3' : 'p-5'
    }`}>
      <div className={`flex ${size === '1x1' || size === '1x2' ? 'flex-col items-start gap-2' : 'justify-between items-start'}`}>
        <div>
          <h3 className={`font-medium drop-shadow-sm ${size === '1x1' ? 'text-base' : 'text-lg'}`}>{weatherData.city}</h3>
          <p className={`opacity-80 flex items-center gap-1.5 ${size === '1x1' ? 'text-xs mt-0' : 'text-sm mt-0.5'}`}>
            <Cloud className={size === '1x1' ? 'w-3 h-3' : 'w-4 h-4'} /> {weatherData.condition}
          </p>
        </div>
        <div className={`font-bold tracking-tighter drop-shadow-md ${size === '1x1' ? 'text-3xl' : 'text-4xl'}`}>
          {weatherData.temperature}°
        </div>
      </div>
      
      
      {size !== '1x1' && (
        <div className={`flex justify-between items-end mt-4 pt-4 border-t border-white/10 ${size === '1x2' ? 'flex-col items-start gap-4' : ''}`}>
          <div className="flex gap-4 text-xs font-medium opacity-90">
            <div className="flex flex-col">
              <span className="opacity-70">H: {weatherData.high}°</span>
              <span className="opacity-70">L: {weatherData.low}°</span>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1"><Wind className="w-3 h-3"/> {weatherData.wind}</span>
              <span className="flex items-center gap-1"><CloudRain className="w-3 h-3"/> 20%</span>
            </div>
          </div>
          <div className={size === '1x2' ? 'self-end mt-2' : ''}>
            <Sun className={`${size.endsWith('x2') ? 'w-12 h-12' : 'w-10 h-10'} text-yellow-300 drop-shadow-lg`} />
          </div>
        </div>
      )}
    </div>
  );
};
