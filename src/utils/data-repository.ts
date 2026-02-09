/**
 * Data Repository Layer
 * 
 * Provides a clean API for working with the canonical backend schema.
 * This layer abstracts data access and will make it easy to swap
 * localStorage with real backend APIs later.
 * 
 * Usage:
 *   const tasks = await TaskRepository.getAll();
 *   await TaskRepository.create(newTask);
 *   await TaskRepository.update(taskId, updates);
 */

import {
  Task,
  Goal,
  Event,
  User,
  Team,
  TeamMember,
  Resource,
  Milestone,
  EnergyDay,
  EnergyLedgerEntry,
  IntegrationConnection,
  ImportCandidate,
  ChatThread,
  ChatMessage,
  Achievement,
  Subscription,
  Plan,
  PLAN_LIMITS,
  PlanName,
} from './backend-schema';

// ============================================================================
// BASE REPOSITORY
// ============================================================================

class BaseRepository<T extends { id: string }> {
  constructor(private storageKey: string) {}

  protected getAll(): T[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  protected setAll(items: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async findAll(): Promise<T[]> {
    return this.getAll();
  }

  async findById(id: string): Promise<T | null> {
    const items = this.getAll();
    return items.find(item => item.id === id) || null;
  }

  async create(item: T): Promise<T> {
    const items = this.getAll();
    items.push(item);
    this.setAll(items);
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.setAll(items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === items.length) return false;
    
    this.setAll(filtered);
    return true;
  }

  async deleteAll(): Promise<void> {
    this.setAll([]);
  }
}

// ============================================================================
// TASK REPOSITORY
// ============================================================================

class TaskRepositoryClass extends BaseRepository<Task> {
  constructor() {
    super('syncscript_tasks');
  }

  async findByUserId(userId: string): Promise<Task[]> {
    const tasks = await this.findAll();
    return tasks.filter(task => task.userId === userId);
  }

  async findByStatus(userId: string, status: Task['status']): Promise<Task[]> {
    const tasks = await this.findByUserId(userId);
    return tasks.filter(task => task.status === status);
  }

  async updateResourceCounts(taskId: string, files: number, links: number): Promise<Task | null> {
    return this.update(taskId, {
      resourcesCountFiles: files,
      resourcesCountLinks: links,
    });
  }

  async completeTask(taskId: string): Promise<Task | null> {
    return this.update(taskId, { status: 'completed' });
  }
}

export const TaskRepository = new TaskRepositoryClass();

// ============================================================================
// GOAL REPOSITORY
// ============================================================================

class GoalRepositoryClass extends BaseRepository<Goal> {
  constructor() {
    super('syncscript_goals');
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    const goals = await this.findAll();
    return goals.filter(goal => goal.userId === userId);
  }

  async findByStatus(userId: string, status: Goal['status']): Promise<Goal[]> {
    const goals = await this.findByUserId(userId);
    return goals.filter(goal => goal.status === status);
  }

  async updateResourceCounts(goalId: string, files: number, links: number): Promise<Goal | null> {
    return this.update(goalId, {
      resourcesCountFiles: files,
      resourcesCountLinks: links,
    });
  }

  async completeGoal(goalId: string): Promise<Goal | null> {
    return this.update(goalId, { status: 'completed' });
  }
}

export const GoalRepository = new GoalRepositoryClass();

// ============================================================================
// EVENT REPOSITORY
// ============================================================================

class EventRepositoryClass extends BaseRepository<Event> {
  constructor() {
    super('syncscript_events');
  }

  async findByCalendarId(calendarId: string): Promise<Event[]> {
    const events = await this.findAll();
    return events.filter(event => event.calendarId === calendarId);
  }

  async findByDateRange(start: Date, end: Date): Promise<Event[]> {
    const events = await this.findAll();
    return events.filter(event => {
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);
      return eventStart >= start && eventEnd <= end;
    });
  }

  async findByTag(tag: string): Promise<Event[]> {
    const events = await this.findAll();
    return events.filter(event => event.tags.includes(tag));
  }
}

export const EventRepository = new EventRepositoryClass();

// ============================================================================
// RESOURCE REPOSITORY
// ============================================================================

class ResourceRepositoryClass extends BaseRepository<Resource> {
  constructor() {
    super('syncscript_resources');
  }

  async findByOwner(ownerType: Resource['ownerType'], ownerId: string): Promise<Resource[]> {
    const resources = await this.findAll();
    return resources.filter(r => r.ownerType === ownerType && r.ownerId === ownerId);
  }

  async findFilesByOwner(ownerType: Resource['ownerType'], ownerId: string): Promise<Resource[]> {
    const resources = await this.findByOwner(ownerType, ownerId);
    return resources.filter(r => r.kind === 'file');
  }

  async findLinksByOwner(ownerType: Resource['ownerType'], ownerId: string): Promise<Resource[]> {
    const resources = await this.findByOwner(ownerType, ownerId);
    return resources.filter(r => r.kind === 'link');
  }

  async countResources(ownerType: Resource['ownerType'], ownerId: string): Promise<{ files: number; links: number }> {
    const resources = await this.findByOwner(ownerType, ownerId);
    return {
      files: resources.filter(r => r.kind === 'file').length,
      links: resources.filter(r => r.kind === 'link').length,
    };
  }
}

export const ResourceRepository = new ResourceRepositoryClass();

// ============================================================================
// MILESTONE REPOSITORY
// ============================================================================

class MilestoneRepositoryClass extends BaseRepository<Milestone> {
  constructor() {
    super('syncscript_milestones');
  }

  async findByParent(parentType: Milestone['parentType'], parentId: string): Promise<Milestone[]> {
    const milestones = await this.findAll();
    return milestones
      .filter(m => m.parentType === parentType && m.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  async completeMilestone(milestoneId: string): Promise<Milestone | null> {
    return this.update(milestoneId, { status: 'completed' });
  }
}

export const MilestoneRepository = new MilestoneRepositoryClass();

// ============================================================================
// ENERGY REPOSITORY
// ============================================================================

class EnergyRepositoryClass {
  private dayKey = 'syncscript_energy_days';
  private ledgerKey = 'syncscript_energy_ledger';

  private getDays(): EnergyDay[] {
    const data = localStorage.getItem(this.dayKey);
    return data ? JSON.parse(data) : [];
  }

  private setDays(days: EnergyDay[]): void {
    localStorage.setItem(this.dayKey, JSON.stringify(days));
  }

  private getLedger(): EnergyLedgerEntry[] {
    const data = localStorage.getItem(this.ledgerKey);
    return data ? JSON.parse(data) : [];
  }

  private setLedger(entries: EnergyLedgerEntry[]): void {
    localStorage.setItem(this.ledgerKey, JSON.stringify(entries));
  }

  async getTodayForUser(userId: string): Promise<EnergyDay | null> {
    const today = new Date().toISOString().split('T')[0];
    const days = this.getDays();
    return days.find(d => d.userId === userId && d.date === today) || null;
  }

  async updateDay(userId: string, date: string, updates: Partial<EnergyDay>): Promise<EnergyDay> {
    const days = this.getDays();
    const index = days.findIndex(d => d.userId === userId && d.date === date);

    if (index === -1) {
      const newDay: EnergyDay = {
        userId,
        date,
        totalPoints: 0,
        displayMode: 'points',
        auraLoops: 0,
        ...updates,
      };
      days.push(newDay);
      this.setDays(days);
      return newDay;
    }

    days[index] = { ...days[index], ...updates };
    this.setDays(days);
    return days[index];
  }

  async addLedgerEntry(entry: EnergyLedgerEntry): Promise<EnergyLedgerEntry> {
    const ledger = this.getLedger();
    ledger.push(entry);
    this.setLedger(ledger);
    return entry;
  }

  async getLedgerForUser(userId: string, startDate?: Date, endDate?: Date): Promise<EnergyLedgerEntry[]> {
    const ledger = this.getLedger();
    let filtered = ledger.filter(e => e.userId === userId);

    if (startDate) {
      filtered = filtered.filter(e => new Date(e.dateTime) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.dateTime) <= endDate);
    }

    return filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }
}

export const EnergyRepository = new EnergyRepositoryClass();

// ============================================================================
// USER REPOSITORY
// ============================================================================

class UserRepositoryClass extends BaseRepository<User> {
  constructor() {
    super('syncscript_users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find(u => u.email === email) || null;
  }

  async findByHandle(handle: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find(u => u.handle === handle) || null;
  }

  async updatePreferences(userId: string, preferences: Partial<User['preferences']>): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    return this.update(userId, {
      preferences: { ...user.preferences, ...preferences },
    });
  }

  async updateTutorialState(userId: string, tutorialState: Partial<User['tutorialState']>): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    return this.update(userId, {
      tutorialState: { ...user.tutorialState, ...tutorialState },
    });
  }
}

export const UserRepository = new UserRepositoryClass();

// ============================================================================
// TEAM REPOSITORY
// ============================================================================

class TeamRepositoryClass extends BaseRepository<Team> {
  constructor() {
    super('syncscript_teams');
  }

  async findByLeadUserId(leadUserId: string): Promise<Team[]> {
    const teams = await this.findAll();
    return teams.filter(t => t.leadUserId === leadUserId);
  }
}

export const TeamRepository = new TeamRepositoryClass();

class TeamMemberRepositoryClass extends BaseRepository<TeamMember> {
  constructor() {
    super('syncscript_team_members');
  }

  async findByTeamId(teamId: string): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(m => m.teamId === teamId);
  }

  async findByUserId(userId: string): Promise<TeamMember[]> {
    const members = await this.findAll();
    return members.filter(m => m.userId === userId);
  }

  async updateRole(teamId: string, userId: string, role: TeamMember['role']): Promise<TeamMember | null> {
    const members = await this.findAll();
    const member = members.find(m => m.teamId === teamId && m.userId === userId);
    if (!member) return null;

    const index = members.indexOf(member);
    members[index] = { ...member, role };
    
    localStorage.setItem('syncscript_team_members', JSON.stringify(members));
    return members[index];
  }
}

export const TeamMemberRepository = new TeamMemberRepositoryClass();

// ============================================================================
// INTEGRATION REPOSITORY
// ============================================================================

class IntegrationRepositoryClass extends BaseRepository<IntegrationConnection> {
  constructor() {
    super('syncscript_integrations');
  }

  async findByUserId(userId: string): Promise<IntegrationConnection[]> {
    const connections = await this.findAll();
    return connections.filter(c => c.userId === userId);
  }

  async findByProvider(userId: string, provider: IntegrationConnection['provider']): Promise<IntegrationConnection | null> {
    const connections = await this.findByUserId(userId);
    return connections.find(c => c.provider === provider) || null;
  }

  async updateAuthState(id: string, authState: IntegrationConnection['authState']): Promise<IntegrationConnection | null> {
    return this.update(id, { authState });
  }

  async updateLastSync(id: string): Promise<IntegrationConnection | null> {
    return this.update(id, { lastSyncAt: new Date() });
  }
}

export const IntegrationRepository = new IntegrationRepositoryClass();

class ImportCandidateRepositoryClass extends BaseRepository<ImportCandidate> {
  constructor() {
    super('syncscript_import_candidates');
  }

  async findByUserId(userId: string): Promise<ImportCandidate[]> {
    const candidates = await this.findAll();
    return candidates.filter(c => c.userId === userId);
  }

  async findByProvider(userId: string, provider: ImportCandidate['provider']): Promise<ImportCandidate[]> {
    const candidates = await this.findByUserId(userId);
    return candidates.filter(c => c.provider === provider);
  }

  async findRequiringAction(userId: string): Promise<ImportCandidate[]> {
    const candidates = await this.findByUserId(userId);
    return candidates.filter(c => c.requiresUserAction);
  }

  async countRequiringAction(userId: string): Promise<number> {
    const candidates = await this.findRequiringAction(userId);
    return candidates.length;
  }
}

export const ImportCandidateRepository = new ImportCandidateRepositoryClass();

// ============================================================================
// CHAT REPOSITORY
// ============================================================================

class ChatRepositoryClass extends BaseRepository<ChatThread> {
  constructor() {
    super('syncscript_chat_threads');
  }

  async findByParticipant(userId: string): Promise<ChatThread[]> {
    const threads = await this.findAll();
    return threads.filter(t => t.participantIds.includes(userId));
  }

  async findDMThread(userId1: string, userId2: string): Promise<ChatThread | null> {
    const threads = await this.findAll();
    return threads.find(t => 
      t.type === 'dm' &&
      t.participantIds.includes(userId1) &&
      t.participantIds.includes(userId2)
    ) || null;
  }
}

export const ChatRepository = new ChatRepositoryClass();

class ChatMessageRepositoryClass extends BaseRepository<ChatMessage> {
  constructor() {
    super('syncscript_chat_messages');
  }

  async findByThreadId(threadId: string): Promise<ChatMessage[]> {
    const messages = await this.findAll();
    return messages
      .filter(m => m.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const ChatMessageRepository = new ChatMessageRepositoryClass();

// ============================================================================
// ACHIEVEMENT REPOSITORY
// ============================================================================

class AchievementRepositoryClass extends BaseRepository<Achievement> {
  constructor() {
    super('syncscript_achievements');
  }

  async findByUserId(userId: string): Promise<Achievement[]> {
    const achievements = await this.findAll();
    return achievements.filter(a => a.userId === userId);
  }

  async hasAchievement(userId: string, type: Achievement['type']): Promise<boolean> {
    const achievements = await this.findByUserId(userId);
    return achievements.some(a => a.type === type);
  }
}

export const AchievementRepository = new AchievementRepositoryClass();

// ============================================================================
// SUBSCRIPTION REPOSITORY
// ============================================================================

class SubscriptionRepositoryClass extends BaseRepository<Subscription> {
  constructor() {
    super('syncscript_subscriptions');
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const subscriptions = await this.findAll();
    return subscriptions.find(s => s.userId === userId) || null;
  }

  async getPlanForUser(userId: string): Promise<Plan | null> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) return null;

    // Mock plan lookup
    const planName = subscription.planId as PlanName;
    return {
      id: subscription.planId,
      name: planName,
      limits: PLAN_LIMITS[planName],
    };
  }
}

export const SubscriptionRepository = new SubscriptionRepositoryClass();

// ============================================================================
// EXPORT ALL
// ============================================================================

export const Repositories = {
  Task: TaskRepository,
  Goal: GoalRepository,
  Event: EventRepository,
  Resource: ResourceRepository,
  Milestone: MilestoneRepository,
  Energy: EnergyRepository,
  User: UserRepository,
  Team: TeamRepository,
  TeamMember: TeamMemberRepository,
  Integration: IntegrationRepository,
  ImportCandidate: ImportCandidateRepository,
  Chat: ChatRepository,
  ChatMessage: ChatMessageRepository,
  Achievement: AchievementRepository,
  Subscription: SubscriptionRepository,
};
