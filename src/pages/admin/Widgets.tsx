/**
 * 小组件管理页面
 * NOTE: 从个性化设置中独立出来，单独管理首页小组件的增删改排序
 */

import React, { useState } from 'react';
import { useData, type Bookmark } from '../../context/DataContext.tsx';
import { LayoutGrid, Globe, AlarmClock, Search, CloudSun, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';

export default function Widgets() {
  const { state, updateSettings, addWidget, updateWidget, deleteWidget, reorderWidgets } = useData();
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];

  // 小组件模态框状态
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Bookmark | null>(null);
  const [widgetForm, setWidgetForm] = useState<{ title: string; size: string; widgetType: string; showBackground?: boolean; wrapLine?: boolean; }>({
    title: 'Clock', size: '2x1', widgetType: 'clock', showBackground: false, wrapLine: false
  });

  const handleSaveWidget = () => {
    const title = widgetForm.widgetType === 'clock' ? 'Clock' :
                  widgetForm.widgetType === 'search' ? 'Search' :
                  widgetForm.widgetType === 'weather' ? 'Weather' : 'Widget';
    const finalForm = { ...widgetForm, title, itemType: 'widget', url: '', icon: '' } as any;
    if (editingWidget) {
      updateWidget(editingWidget.id, finalForm);
    } else {
      addWidget(finalForm);
    }
    setIsWidgetModalOpen(false);
    setEditingWidget(null);
    setWidgetForm({ title: 'Clock', size: '2x1', widgetType: 'clock', showBackground: false, wrapLine: false });
  };

  const handleEditWidget = (widget: Bookmark) => {
    setEditingWidget(widget);
    setWidgetForm({
      title: widget.title || 'Widget',
      size: widget.size || '1x1',
      widgetType: widget.widgetType || 'clock',
      showBackground: !!widget.showBackground,
      wrapLine: !!widget.wrapLine
    });
    setIsWidgetModalOpen(true);
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    reorderWidgets(index, targetIndex);
  };

  const isZh = (state.settings.language || 'zh-CN') === 'zh-CN';
  const localSettings = state.settings;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 min-w-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{t.navWidgets || '小组件管理'}</h2>
          <p className="text-slate-500 mt-2">{t.widgetSettingsDesc || '配置首页展示的时钟、天气、搜索等扩展小组件'}</p>
        </div>
      </header>

      <div className="space-y-12">
        {/* 对齐方式 & 时区 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.widgetSettings || '小组件设置'}</h3>
          </div>
          <div className="grid gap-6 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">

            {/* 对齐方式 */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                {t.widgetAlignmentLabel || '对齐方式'}
              </label>
              <select
                value={localSettings.widgetAlignment || 'center'}
                onChange={(e) => updateSettings({ ...localSettings, widgetAlignment: e.target.value as any })}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium"
              >
                <option value="left">{t.alignLeft || '左对齐'}</option>
                <option value="center">{t.alignCenter || '居中对齐'}</option>
                <option value="right">{t.alignRight || '右对齐'}</option>
              </select>
            </div>

            {/* 时区 */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                {t.timezoneLabel}
              </label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium cursor-pointer"
                value={localSettings.timezone}
                onChange={(e) => updateSettings({ ...localSettings, timezone: e.target.value })}
              >
                <option value="">{t.timezoneSystem}</option>
                <option value="Asia/Shanghai">中国/北京 (Asia/Shanghai)</option>
                <option value="Asia/Hong_Kong">中国/香港 (Asia/Hong_Kong)</option>
                <option value="Asia/Taipei">中国/台北 (Asia/Taipei)</option>
                <option value="Asia/Tokyo">日本/东京 (Asia/Tokyo)</option>
                <option value="Asia/Singapore">新加坡 (Asia/Singapore)</option>
                <option value="America/New_York">美国/纽约 (America/New_York)</option>
                <option value="America/Los_Angeles">美国/洛杉矶 (America/Los_Angeles)</option>
                <option value="Europe/London">英国/伦敦 (Europe/London)</option>
                <option value="Europe/Paris">法国/巴黎 (Europe/Paris)</option>
                <option value="Europe/Berlin">德国/柏林 (Europe/Berlin)</option>
                <option value="Australia/Sydney">澳大利亚/悉尼 (Australia/Sydney)</option>
              </select>
              <p className="text-xs text-slate-400">{t.timezoneDesc}</p>
            </div>
          </div>
        </section>

        {/* 小组件列表 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.manageWidgets || '小组件列表'}</h3>
          </div>
          <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">{isZh ? '管理并排序首页展示的所有小组件' : 'Manage and reorder all widgets on the home page'}</p>
              <button
                type="button"
                onClick={() => {
                  setEditingWidget(null);
                  setWidgetForm({ title: 'Clock', size: '2x1', widgetType: 'clock' });
                  setIsWidgetModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#ec5b13] text-white rounded-lg text-xs font-semibold hover:bg-[#d4520f] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addWidget || '添加小组件'}
              </button>
            </div>

            {state.widgets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <LayoutGrid className="w-10 h-10 opacity-20" />
                <p className="text-sm">{t.noWidgets || '暂无小组件，点击右上角添加'}</p>
              </div>
            ) : (
              <div
                className="border border-slate-200/80 rounded-2xl p-4 sm:p-6 bg-slate-50/30 shadow-inner"
                style={{
                  backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
                  backgroundSize: '16px 16px'
                }}
              >
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider select-none">
                  <Eye className="w-3.5 h-3.5 text-[#ec5b13]" />
                  布局画布预览 (Mini Canvas Preview)
                </div>
                <div
                  className={`w-full flex flex-wrap gap-2.5 sm:gap-3 transition-all duration-300 ${
                    localSettings.widgetAlignment === 'left' ? 'justify-start' :
                    localSettings.widgetAlignment === 'right' ? 'justify-end' :
                    'justify-center'
                  }`}
                >
                  {state.widgets.map((widget, index) => {
                    const basisClass =
                      widget.size?.startsWith('4x') ? 'basis-full sm:basis-[95%]' :
                      widget.size?.startsWith('3x') ? 'basis-[72%] sm:basis-[70%]' :
                      widget.size?.startsWith('2x') ? 'basis-[47%] sm:basis-[46%]' :
                      'basis-[22%] sm:basis-[21%]';

                    const heightClass = widget.size?.endsWith('x2') ? 'h-32 sm:h-36' : 'h-16 sm:h-20';

                    return (
                      <React.Fragment key={widget.id}>
                        {widget.wrapLine && index > 0 && <div className="w-full h-0 flex-shrink-0" />}
                        <div
                          className={`relative group border border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-sm ${basisClass} ${heightClass} min-w-[70px] overflow-hidden`}
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 bg-[#ec5b13]/10 text-[#ec5b13] rounded-lg flex items-center justify-center shrink-0">
                              {widget.widgetType === 'clock' ? <AlarmClock className="w-4 h-4 sm:w-5 sm:h-5" /> :
                               widget.widgetType === 'search' ? <Search className="w-4 h-4 sm:w-5 sm:h-5" /> :
                               widget.widgetType === 'weather' ? <CloudSun className="w-4 h-4 sm:w-5 sm:h-5" /> :
                               <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="font-bold text-slate-700 text-[11px] sm:text-xs truncate">
                                {widget.widgetType === 'clock' ? (t.widgetClock || '时钟与日期') :
                                 widget.widgetType === 'search' ? (t.widgetSearch || '快速搜索') :
                                 widget.widgetType === 'weather' ? (t.widgetWeather || '天气预报') : widget.title}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[8px] sm:text-[9px] font-bold font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-slate-500">{widget.size}</span>
                                {widget.wrapLine && (
                                  <span className="text-[8px] sm:text-[9px] font-medium bg-purple-50 border border-purple-200 px-1 py-0.2 rounded text-purple-600 shrink-0">{isZh ? '换行' : 'Line Wrap'}</span>
                                )}
                                {widget.showBackground && (
                                  <span className="text-[8px] sm:text-[9px] font-medium bg-blue-50 border border-blue-200 px-1 py-0.2 rounded text-blue-600 shrink-0">{isZh ? '卡片' : 'Card BG'}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 sm:opacity-100 group-hover:opacity-100 transition-opacity shrink-0">
                            <div className="flex items-center border border-slate-150 bg-slate-50 rounded-lg p-0.5">
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveWidget(index, 'up')}
                                className={`p-0.5 rounded transition-colors ${index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                                title={isZh ? '前移' : 'Move Left'}
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                disabled={index === state.widgets.length - 1}
                                onClick={() => handleMoveWidget(index, 'down')}
                                className={`p-0.5 rounded transition-colors ${index === state.widgets.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                                title={isZh ? '后移' : 'Move Right'}
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleEditWidget(widget)}
                              className="p-1 text-slate-400 hover:text-[#ec5b13] hover:bg-slate-100 rounded-lg transition-colors"
                              title={t.edit || '编辑'}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteWidget(widget.id)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={t.delete || '删除'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 小组件编辑模态框 */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsWidgetModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800">{editingWidget ? (t.editWidget || '编辑小组件') : (t.addWidget || '添加小组件')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.widgetTypeLabel || '组件类型'}</label>
                <select
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors appearance-none"
                  value={widgetForm.widgetType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let newSize = widgetForm.size;
                    if (newType !== 'search' && (newSize === '3x1' || newSize === '4x1')) newSize = '2x1';
                    setWidgetForm({ ...widgetForm, widgetType: newType, size: newSize });
                  }}
                >
                  <option value="clock">{t.widgetClock || '时钟与日期'}</option>
                  <option value="search">{t.widgetSearch || '快速搜索'}</option>
                  <option value="weather">{t.widgetWeather || '天气预报'}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.itemSizeLabel || '显示尺寸'}</label>
                <div
                  className="grid gap-2 mt-1.5"
                  style={{ gridTemplateColumns: `repeat(${widgetForm.widgetType === 'search' ? 6 : 4}, minmax(0, 1fr))` }}
                >
                  {(widgetForm.widgetType === 'search'
                    ? ['1x1', '2x1', '3x1', '4x1', '1x2', '2x2']
                    : ['1x1', '2x1', '1x2', '2x2']
                  ).map(s => (
                    <button
                      key={s}
                      onClick={() => setWidgetForm({ ...widgetForm, size: s })}
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-bold font-mono tracking-wider ${
                        (widgetForm.size || '1x1') === s
                          ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]'
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-700">{t.widgetBackgroundLabel || '卡片背景'}</label>
                  <p className="text-[11px] text-slate-400">开启后将显示白色半透明卡片背景</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWidgetForm({ ...widgetForm, showBackground: !widgetForm.showBackground })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    widgetForm.showBackground ? 'bg-[#ec5b13]' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    widgetForm.showBackground ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-700">另起一行 (换行显示)</label>
                  <p className="text-[11px] text-slate-400">开启后此小组件将强制从新行开头显示</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWidgetForm({ ...widgetForm, wrapLine: !widgetForm.wrapLine })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    widgetForm.wrapLine ? 'bg-[#ec5b13]' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    widgetForm.wrapLine ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsWidgetModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors">{t.cancel}</button>
              <button onClick={handleSaveWidget} className="px-5 py-2.5 rounded-xl bg-[#ec5b13] text-white font-semibold hover:bg-[#d4520f] transition-colors shadow-lg shadow-[#ec5b13]/20">{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
