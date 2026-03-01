/**
 * Task Repository Service
 * 
 * THIS IS THE ONLY FILE YOU CHANGE TO SWAP BACKENDS
 * 
 * Current: MockTaskRepository (in-memory)
 * Future options:
 *   - SupabaseTaskRepository
 *   - FirebaseTaskRepository
 *   - CustomAPIRepository
 *   - etc.
 * 
 * Just change the import and instantiation below!
 */

import { ITaskRepository } from './ITaskRepository';
import { MockTaskRepository } from './MockTaskRepository';
import { SupabaseTaskRepository } from './SupabaseTaskRepository';

// ==================== ACTIVE REPOSITORY ====================
// Change this ONE line to swap backends!

const useSupabaseTaskRepository =
  import.meta.env.PROD || import.meta.env.VITE_USE_SUPABASE_TASKS === 'true';

export const taskRepository: ITaskRepository = useSupabaseTaskRepository
  ? new SupabaseTaskRepository()
  : new MockTaskRepository();

// ==================== FUTURE EXAMPLES ====================

// When ready for Supabase:
// import { SupabaseTaskRepository } from './SupabaseTaskRepository';
// export const taskRepository: ITaskRepository = new SupabaseTaskRepository();

// When ready for Firebase:
// import { FirebaseTaskRepository } from './FirebaseTaskRepository';
// export const taskRepository: ITaskRepository = new FirebaseTaskRepository();

// When ready for custom API:
// import { CustomAPIRepository } from './CustomAPIRepository';
// export const taskRepository: ITaskRepository = new CustomAPIRepository();
