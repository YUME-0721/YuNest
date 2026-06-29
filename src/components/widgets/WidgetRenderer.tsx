import React from 'react';
import { Bookmark } from '../../context/DataContext';
import { ClockWidget } from './ClockWidget';
import { SearchWidget } from './SearchWidget';
import { WeatherWidget } from './WeatherWidget';

interface WidgetRendererProps {
  bookmark: Bookmark;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ bookmark }) => {
  switch (bookmark.widgetType) {
    case 'clock':
      return <ClockWidget size={bookmark.size || '1x1'} />;
    case 'search':
      return <SearchWidget size={bookmark.size || '1x1'} />;
    case 'weather':
      return <WeatherWidget size={bookmark.size || '1x1'} />;
    default:
      return (
        <div className="w-full h-full bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white/50 text-sm">
          Unknown Widget
        </div>
      );
  }
};
