import React, { useRef, useEffect, useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { FILTER_PRESETS } from '../types';
import type { FilterType } from '../types';
import { getFilterPresetCss } from '../utils/mediaUtils';

interface FiltersPanelProps {
  onClose: () => void;
}

export default function FiltersPanel({ onClose }: FiltersPanelProps) {
  const { state, dispatch, selectedClip } = useProject();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIntensity, setShowIntensity] = useState(false);

  const project = state.project;
  if (!project) return null;

  // Find the active video clip at current time (same logic as VideoPreview)
  const activeVideoClip = project.clips
    .filter(c => c.type === 'video' && c.mediaUrl)
    .find(c => state.currentTime >= c.startTime && state.currentTime < c.startTime + c.duration);

  // Use selected clip's filter or the active video clip's filter
  const targetClip = selectedClip?.activeFilter !== undefined ? selectedClip : activeVideoClip;
  const currentFilter: FilterType = targetClip?.activeFilter ?? 'original';
  const currentIntensity: number = targetClip?.filterIntensity ?? 100;
  const targetClipId = targetClip?.id ?? selectedClip?.id ?? activeVideoClip?.id ?? null;

  // Video thumbnail for filter previews
  const videoUrl = activeVideoClip?.mediaUrl;

  function applyFilter(filterId: FilterType) {
    if (!targetClipId) return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: targetClipId,
      updates: { activeFilter: filterId, filterIntensity: 100 },
    });
    setShowIntensity(filterId !== 'original');
  }

  function updateIntensity(value: number) {
    if (!targetClipId) return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: targetClipId,
      updates: { filterIntensity: value },
    });
  }

  function resetFilter() {
    if (!targetClipId) return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: targetClipId,
      updates: { activeFilter: 'original', filterIntensity: 100 },
    });
    setShowIntensity(false);
  }

  // Show intensity slider when a non-original filter is active
  useEffect(() => {
    setShowIntensity(currentFilter !== 'original');
  }, [currentFilter]);

  if (!targetClipId) {
    return (
      <div className="flex flex-col h-full animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-bg-tertiary flex items-center justify-center">
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary">Import a video to apply filters</p>
            <button onClick={onClose} className="mt-3 text-accent text-sm font-medium">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
          {currentFilter !== 'original' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
              {FILTER_PRESETS.find(f => f.id === currentFilter)?.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentFilter !== 'original' && (
            <button
              onClick={resetFilter}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-danger bg-danger/10 hover:bg-danger/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover transition-colors">
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Strip — horizontal scrollable */}
      <div className="px-3 py-3">
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FILTER_PRESETS.map(preset => {
            const isActive = currentFilter === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyFilter(preset.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                  isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {/* Filter Preview Thumbnail */}
                <div
                  className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 ${
                    isActive
                      ? 'ring-2 ring-accent shadow-lg shadow-accent/20'
                      : 'ring-1 ring-white/10 hover:ring-white/20'
                  }`}
                >
                  {/* Background gradient as base */}
                  <div
                    className="absolute inset-0"
                    style={{ background: preset.thumbnailGradient }}
                  />
                  {/* Apply the actual CSS filter to the preview */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: preset.thumbnailGradient,
                      filter: getFilterPresetCss(preset.id, 100),
                    }}
                  />
                  {/* Active check indicator */}
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Filter Name */}
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intensity Slider */}
      {showIntensity && currentFilter !== 'original' && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-muted font-medium min-w-[28px]">0%</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={100}
                value={currentIntensity}
                onChange={e => updateIntensity(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-accent, #527df2) ${currentIntensity}%, rgba(255,255,255,0.1) ${currentIntensity}%)`,
                }}
              />
            </div>
            <span className="text-[10px] text-text-secondary font-semibold min-w-[32px] text-right">
              {currentIntensity}%
            </span>
          </div>
          <p className="text-center text-[10px] text-text-muted mt-1.5">Filter Intensity</p>
        </div>
      )}

      {/* Spacer to push content up nicely */}
      <div className="flex-1" />
    </div>
  );
}
