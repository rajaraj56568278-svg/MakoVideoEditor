import { useState, useEffect } from 'react';
import { Plus, Film, Trash2, Clock, FolderOpen } from 'lucide-react';
import { getAllProjects, deleteProject } from '../utils/storage';
import type { Project } from '../types';

interface Props {
  onNewProject: (name: string) => void;
  onOpenProject: (project: Project) => void;
}

export function HomeScreen({ onNewProject, onOpenProject }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    getAllProjects().then(setProjects);
  }, []);

  const handleCreate = () => {
    const name = newName.trim() || `Project ${new Date().toLocaleDateString()}`;
    onNewProject(name);
    setShowNewDialog(false);
    setNewName('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
            <Film size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Mako Editor</h1>
            <p className="text-xs text-text-muted">Professional Video Editor</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Project
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-5">
              <Film size={36} className="text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">No Projects Yet</h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs">
              Create your first video project and start editing like a pro
            </p>
            <button
              onClick={() => setShowNewDialog(true)}
              className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors animate-pulse-glow"
            >
              <Plus size={18} />
              Create First Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Recent Projects ({projects.length})
            </h2>
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project)}
                className="w-full flex items-center gap-4 p-4 bg-bg-secondary hover:bg-bg-tertiary rounded-xl border border-border-primary hover:border-border-active transition-all text-left group"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {project.thumbnailUrl ? (
                    <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Film size={24} className="text-text-muted" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-hover transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock size={11} />
                      {formatDate(project.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Film size={11} />
                      {formatDuration(project.duration)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {project.tracks.reduce((sum, t) => sum + t.clips.length, 0)} clips
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => setShowNewDialog(false)}>
          <div className="w-[90%] max-w-sm bg-bg-secondary rounded-2xl border border-border-primary p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-4">New Project</h3>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Project name..."
              className="w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-xl text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNewDialog(false); setNewName(''); }}
                className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-elevated text-text-secondary rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
