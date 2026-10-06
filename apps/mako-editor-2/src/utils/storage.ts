import { openDB, type IDBPDatabase } from 'idb';
import type { Project } from '../types';

const DB_NAME = 'mako-editor-db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const THUMBNAILS_STORE = 'thumbnails';

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) {
        db.createObjectStore(THUMBNAILS_STORE);
      }
    },
  });
  return dbInstance;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  project.updatedAt = Date.now();
  await db.put(PROJECTS_STORE, project);
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get(PROJECTS_STORE, id);
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAll(PROJECTS_STORE);
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(PROJECTS_STORE, id);
  await db.delete(THUMBNAILS_STORE, id);
}

export async function saveThumbnail(id: string, dataUrl: string): Promise<void> {
  const db = await getDB();
  await db.put(THUMBNAILS_STORE, dataUrl, id);
}

export async function loadThumbnail(id: string): Promise<string | undefined> {
  const db = await getDB();
  return db.get(THUMBNAILS_STORE, id);
}

/**
 * Store a File object as a blob URL reference
 * Returns an object URL that can be used as src for video/img
 */
export function createFileUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeFileUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
