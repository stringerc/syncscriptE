/**
 * Pick the right face for task rows: match current user by id/email/name,
 * not only collaborators[0] (which showed the wrong person for solo tasks
 * and for "you" when you were not listed first).
 */

export type ProfileForTaskAvatar = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status?: string;
};

export type CollaboratorEntry = {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  fallback?: string;
  animationType?: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake';
  status?: 'online' | 'away' | 'offline';
};

export type TaskLikeForAvatar = {
  collaborators?: CollaboratorEntry[];
  createdBy?: string;
};

const STOCK_AVATAR =
  'https://images.unsplash.com/photo-1656313826909-1f89d1702a81?w=100&h=100&fit=crop';

function norm(s: string | undefined): string {
  return String(s || '').trim().toLowerCase();
}

/** True if this collaborator row is the logged-in user. */
export function collaboratorMatchesProfile(
  entry: CollaboratorEntry | undefined,
  profile: ProfileForTaskAvatar,
): boolean {
  if (!entry) return false;
  const eid = String(entry.id || '').trim();
  const pid = String(profile.id || '').trim();
  if (eid && pid && eid === pid) return true;
  const em = norm(entry.email);
  const pm = norm(profile.email);
  if (em && pm && em === pm) return true;
  const n1 = norm(entry.name);
  const n2 = norm(profile.name);
  return Boolean(n1 && n2 && n1 === n2);
}

/**
 * - Solo / no collaborators → treat as current user's task (dashboard list is theirs).
 * - Has collaborators → if any row matches profile, it's "you"; else first non-agent display peer.
 * - createdBy === profile.id → your task even if collaborator list omits you.
 */
export function resolveTaskCardAvatar(
  task: TaskLikeForAvatar,
  profile: ProfileForTaskAvatar,
): {
  showAsSelf: boolean;
  /** Collaborator to show when showAsSelf is false; may be set when showAsSelf true (matched row). */
  peer: CollaboratorEntry | null;
} {
  const list = Array.isArray(task.collaborators) ? task.collaborators : [];
  const meEntry = list.find((c) => collaboratorMatchesProfile(c, profile));
  if (meEntry) {
    return { showAsSelf: true, peer: meEntry };
  }
  if (list.length === 0) {
    return { showAsSelf: true, peer: null };
  }
  const created = String(task.createdBy || '').trim();
  if (created && profile.id && created === profile.id) {
    return { showAsSelf: true, peer: null };
  }
  return { showAsSelf: false, peer: list[0] };
}

export function defaultCollaboratorImage(): string {
  return STOCK_AVATAR;
}

/** Faces for overlapping stacks (Weather & Route–style). Deduped; uses profile avatar when a row is “you”. */
export function getTaskParticipantFaces(
  task: TaskLikeForAvatar,
  profile: ProfileForTaskAvatar,
): Array<{ id?: string; name: string; image: string; fallback: string }> {
  const list = Array.isArray(task.collaborators) ? task.collaborators : [];
  if (list.length === 0) return [];

  const seen = new Set<string>();
  const out: Array<{ id?: string; name: string; image: string; fallback: string }> = [];

  for (const c of list) {
    const key = String(c.id || c.email || c.name || '').trim() || JSON.stringify(c);
    if (seen.has(key)) continue;
    seen.add(key);

    const isMe = collaboratorMatchesProfile(c, profile);
    const name = (c.name || 'Teammate').trim();
    const fallback =
      (c.fallback && String(c.fallback).trim()) ||
      name
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ||
      '?';
    const image = isMe ? profile.avatar : c.image || defaultCollaboratorImage();

    out.push({ id: c.id, name, image, fallback });
  }

  return out;
}
