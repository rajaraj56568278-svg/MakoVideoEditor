import { openDB, type IDBPDatabase } from 'idb';
import type { Project } from '../types';

const DB_NAME = 'mako-editor-db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const store = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  // Don't save File objects - only metadata
  const serializable = {
    ...project,
    mediaLibrary: project.mediaLibrary.map(m => ({
      ...m,
      file: undefined,
      url: '', // URLs are temporary blob URLs
    })),
  };
  await db.put(PROJECTS_STORE, serializable);
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get(PROJECTS_STORE, id);
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAllFromIndex(PROJECTS_STORE, 'updatedAt');
  return projects.reverse(); // Most recent first
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(PROJECTS_STORE, id);
}

export async function duplicateProject(id: string): Promise<Project | null> {
  const project = await loadProject(id);
  if (!project) return null;
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
    name: `${project.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveProject(newProject);
  return newProject;
}
