type TaskLike = {
  id: string;
  assignees?: unknown;
  collaborators?: unknown;
  assignedTo?: unknown;
};

export interface TaskAssignmentParityReport {
  totalTasks: number;
  validTasks: number;
  shapeValidTasks: number;
  identityValidTasks: number;
  malformedTaskIds: string[];
  unknownIdentityTaskIds: string[];
  unknownIdentityRefs: string[];
  parityScore: number;
}

export interface TaskAssignmentParityOptions {
  canonicalIds?: string[];
  canonicalEmails?: string[];
}

type IdentityRef = {
  id?: string;
  email?: string;
};

function normalizeToken(input: string): string {
  return String(input || '').trim().toLowerCase();
}

function isAssigneeLike(entry: unknown): boolean {
  if (typeof entry === 'string') return entry.trim().length > 0;
  if (!entry || typeof entry !== 'object') return false;
  const candidate = entry as Record<string, unknown>;
  const name = String(candidate.name || '').trim();
  const id = String(candidate.id || candidate.userId || candidate.memberId || '').trim();
  const email = String(candidate.email || '').trim();
  return Boolean(name || id || email);
}

function isAssignmentArrayLike(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value)) return false;
  return value.every((entry) => isAssigneeLike(entry));
}

function extractIdentityRefs(value: unknown): IdentityRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): IdentityRef | null => {
      if (typeof entry === 'string') {
        const token = entry.trim();
        if (!token) return null;
        if (token.includes('@')) return { email: token };
        return { id: token };
      }
      if (!entry || typeof entry !== 'object') return null;
      const candidate = entry as Record<string, unknown>;
      const id = String(candidate.id || candidate.userId || candidate.memberId || '').trim();
      const email = String(candidate.email || '').trim();
      if (!id && !email) return null;
      return { id, email };
    })
    .filter((entry): entry is IdentityRef => Boolean(entry));
}

export function buildTaskAssignmentParityReport(
  tasks: TaskLike[],
  options?: TaskAssignmentParityOptions,
): TaskAssignmentParityReport {
  const malformedTaskIds: string[] = [];
  const unknownIdentityTaskIds: string[] = [];
  const unknownIdentityRefs = new Set<string>();
  const canonicalIds = new Set((options?.canonicalIds || []).map((token) => normalizeToken(token)));
  const canonicalEmails = new Set((options?.canonicalEmails || []).map((token) => normalizeToken(token)));
  const canValidateIdentity = canonicalIds.size > 0 || canonicalEmails.size > 0;

  let shapeValidTasks = 0;
  let identityValidTasks = 0;

  for (const task of tasks) {
    const assigneesValid = isAssignmentArrayLike(task.assignees);
    const collaboratorsValid = isAssignmentArrayLike(task.collaborators);
    const assignedToValid = isAssignmentArrayLike(task.assignedTo);
    const shapeValid = assigneesValid && collaboratorsValid && assignedToValid;
    if (!shapeValid) {
      malformedTaskIds.push(String(task.id));
      continue;
    }
    shapeValidTasks += 1;

    if (!canValidateIdentity) {
      identityValidTasks += 1;
      continue;
    }
    const refs = [
      ...extractIdentityRefs(task.assignees),
      ...extractIdentityRefs(task.collaborators),
      ...extractIdentityRefs(task.assignedTo),
    ];
    const hasUnknownIdentity = refs.some((ref) => {
      const idToken = normalizeToken(String(ref.id || ''));
      const emailToken = normalizeToken(String(ref.email || ''));
      const idKnown = idToken ? canonicalIds.has(idToken) : false;
      const emailKnown = emailToken ? canonicalEmails.has(emailToken) : false;
      const known = idKnown || emailKnown;
      if (!known) {
        unknownIdentityRefs.add(idToken || emailToken);
      }
      return !known;
    });
    if (hasUnknownIdentity) {
      unknownIdentityTaskIds.push(String(task.id));
    } else {
      identityValidTasks += 1;
    }
  }
  const totalTasks = tasks.length;
  const validTasks = Math.max(0, shapeValidTasks - unknownIdentityTaskIds.length);
  const parityScore = totalTasks === 0 ? 1 : validTasks / totalTasks;
  return {
    totalTasks,
    validTasks,
    shapeValidTasks,
    identityValidTasks,
    malformedTaskIds,
    unknownIdentityTaskIds,
    unknownIdentityRefs: Array.from(unknownIdentityRefs),
    parityScore,
  };
}
