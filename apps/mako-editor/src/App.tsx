import { ProjectProvider, useProject } from './store/ProjectContext';
import HomeScreen from './components/HomeScreen';
import Editor from './components/Editor';

function AppContent() {
  const { state } = useProject();

  if (state.view === 'editor' && state.project) {
    return <Editor />;
  }

  return <HomeScreen />;
}

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
