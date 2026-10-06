import { useProjectStore } from '../store/projectStore';
import { EffectsPanel } from './panels/EffectsPanel';
import { AdjustPanel } from './panels/AdjustPanel';
import { TextPanel } from './panels/TextPanel';
import { StickerPanel } from './panels/StickerPanel';
import { AudioPanel } from './panels/AudioPanel';
import { SpeedPanel } from './panels/SpeedPanel';
import { TransitionPanel } from './panels/TransitionPanel';
import { TrimPanel } from './panels/TrimPanel';
import { CropPanel } from './panels/CropPanel';
import { ChromaKeyPanel } from './panels/ChromaKeyPanel';
import { KeyframePanel } from './panels/KeyframePanel';
import { VolumePanel } from './panels/VolumePanel';
import { BackgroundRemovePanel } from './panels/BackgroundRemovePanel';
import { X } from 'lucide-react';

export function ToolPanel() {
  const { activeTool, setActiveTool } = useProjectStore();

  const panels: Record<string, React.ComponentType> = {
    effects: EffectsPanel,
    adjust: AdjustPanel,
    text: TextPanel,
    sticker: StickerPanel,
    audio: AudioPanel,
    speed: SpeedPanel,
    transition: TransitionPanel,
    trim: TrimPanel,
    crop: CropPanel,
    chromaKey: ChromaKeyPanel,
    keyframe: KeyframePanel,
    volume: VolumePanel,
    bgRemove: BackgroundRemovePanel,
  };

  const Panel = panels[activeTool];
  if (!Panel) return null;

  return (
    <div className="bg-bg-secondary border-t border-border-primary animate-slide-up">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-primary">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {activeTool}
        </h3>
        <button
          onClick={() => setActiveTool('none')}
          className="p-1 rounded hover:bg-bg-tertiary text-text-muted transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-4 max-h-[200px] overflow-y-auto">
        <Panel />
      </div>
    </div>
  );
}
