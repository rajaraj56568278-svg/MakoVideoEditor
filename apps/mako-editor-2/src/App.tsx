import { useState, useCallback, useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { useHistoryStore } from './store/historyStore';
import { HomeScreen } from './components/HomeScreen';
import { Editor } from './components/Editor';
import type { Project } from './types';

type Screen = 'home' | 'editor';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const { loadProject } = useProjectStore();
  const { clearHistory } = useHistoryStore();

  // Expose navigation for testing
  useEffect(() => {
    (window as any).__navigateToEditor = (name?: string) => {
      if (name) {
        useProjectStore.getState().createProject(name);
      }
      clearHistory();
      setScreen('editor');
    };
    (window as any).__navigateToHome = () => {
      setScreen('home');
    };
  }, [clearHistory]);

  const handleOpenProject = useCallback((project: Project) => {
    loadProject(project);
    clearHistory();
    setScreen('editor');
  }, [loadProject, clearHistory]);

  const handleNewProject = useCallback((name: string) => {
    const { createProject } = useProjectStore.getState();
    createProject(name);
    clearHistory();
    setScreen('editor');
  }, [clearHistory]);

  const handleBack = useCallback(() => {
    setScreen('home');
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-bg-primary">
      {screen === 'home' && (
        <HomeScreen onNewProject={handleNewProject} onOpenProject={handleOpenProject} />
      )}
      {screen === 'editor' && (
        <Editor onBack={handleBack} />
      )}
    </div>
  );
}
