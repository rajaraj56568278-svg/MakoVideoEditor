import React, { useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { getAllProjects, deleteProject } from '../utils/db';
import type { Project } from '../types';

export default function HomeScreen() {
  const { createNewProject, loadProjectFromData, dispatch } = useProject();
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const projects = await getAllProjects();
      setSavedProjects(projects);
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
    setLoading(false);
  }

  function handleNewProject() {
    const name = projectName.trim() || 'Untitled Project';
    createNewProject(name);
    setShowNewDialog(false);
    setProjectName('');
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      await deleteProject(id);
      loadProjects();
    }
  }

  function handleOpenProject(project: Project) {
    loadProjectFromData(project);
  }

  function formatDate(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Mako Editor</h1>
            <p className="text-sm text-text-secondary mt-0.5">Professional Video Editor</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </header>

      {/* New Project Button */}
      <div className="px-5 mb-6">
        <button
          onClick={() => setShowNewDialog(true)}
          className="w-full py-4 rounded-2xl bg-accent hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-white font-semibold text-lg shadow-lg shadow-accent/20"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Saved Projects */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Recent Projects
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : savedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-tertiary flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.75 0h-1.5c-.621 0-1.125.504-1.125 1.125v1.5m2.625 0V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.5A1.125 1.125 0 003.375 5.625v0" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm">No projects yet</p>
            <p className="text-text-muted text-xs mt-1">Create your first video project</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedProjects.map(project => (
              <button
                key={project.id}
                onClick={() => handleOpenProject(project)}
                className="w-full p-4 rounded-xl bg-bg-secondary border border-border hover:border-border-light transition-all text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-text-secondary">
                        {project.clips.length} clip{project.clips.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-text-muted">•</span>
                      <span className="text-xs text-text-secondary">{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-danger/10 transition-all"
                  >
                    <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fade-in" onClick={() => setShowNewDialog(false)}>
          <div className="w-full max-w-md mx-4 mb-4 sm:mb-0 p-6 rounded-2xl bg-bg-secondary border border-border animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">New Project</h3>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Project name..."
              className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleNewProject()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewDialog(false)}
                className="flex-1 py-3 rounded-xl bg-bg-tertiary text-text-secondary font-medium hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNewProject}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
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
