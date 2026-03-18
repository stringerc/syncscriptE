import type {
  InviteTeamMemberCommand,
  RemoveTeamMemberCommand,
  TeamCommandPort,
  UpdateTeamMemberCommand,
} from '../commands/assignment-commands';
import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import { commandFailure, commandSuccess } from '../core/command-contract';

type TeamMemberLike = {
  userId: string;
  email: string;
  role?: string;
};

type TeamLike = {
  id: string;
  members?: TeamMemberLike[];
};

function commandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export class LocalTeamCommandAdapter implements TeamCommandPort {
  constructor(private readonly getTeams: () => TeamLike[]) {}

  async inviteMember(
    _ctx: ContractCommandContext,
    command: InviteTeamMemberCommand,
  ): Promise<ContractCommandResult<{ teamId: string; invitedEmail: string }>> {
    const id = commandId('team-invite');
    const teamId = String(command.teamId || '').trim();
    const email = String(command.email || '').trim().toLowerCase();
    if (!teamId) return commandFailure(id, ['Missing teamId']);
    if (!email) return commandFailure(id, ['Missing email']);
    const team = this.getTeams().find((entry) => String(entry.id) === teamId);
    if (!team) return commandFailure(id, [`Team not found: ${teamId}`]);
    const exists = (team.members || []).some((member) => String(member.email || '').toLowerCase() === email);
    if (exists) return commandFailure(id, [`User already in team: ${email}`]);
    return commandSuccess(id, { teamId, invitedEmail: email });
  }

  async updateMember(
    _ctx: ContractCommandContext,
    command: UpdateTeamMemberCommand,
  ): Promise<ContractCommandResult<{ teamId: string; userId: string }>> {
    const id = commandId('team-update-member');
    const teamId = String(command.teamId || '').trim();
    const userId = String(command.userId || '').trim();
    if (!teamId) return commandFailure(id, ['Missing teamId']);
    if (!userId) return commandFailure(id, ['Missing userId']);
    const team = this.getTeams().find((entry) => String(entry.id) === teamId);
    if (!team) return commandFailure(id, [`Team not found: ${teamId}`]);
    const exists = (team.members || []).some((member) => String(member.userId || '') === userId);
    if (!exists) return commandFailure(id, [`Team member not found: ${userId}`]);
    return commandSuccess(id, { teamId, userId });
  }

  async removeMember(
    _ctx: ContractCommandContext,
    command: RemoveTeamMemberCommand,
  ): Promise<ContractCommandResult<{ teamId: string; userId: string }>> {
    const id = commandId('team-remove-member');
    const teamId = String(command.teamId || '').trim();
    const userId = String(command.userId || '').trim();
    if (!teamId) return commandFailure(id, ['Missing teamId']);
    if (!userId) return commandFailure(id, ['Missing userId']);
    const team = this.getTeams().find((entry) => String(entry.id) === teamId);
    if (!team) return commandFailure(id, [`Team not found: ${teamId}`]);
    const member = (team.members || []).find((entry) => String(entry.userId || '') === userId);
    if (!member) return commandFailure(id, [`Team member not found: ${userId}`]);
    if (member.role === 'owner') return commandFailure(id, ['Cannot remove team owner']);
    return commandSuccess(id, { teamId, userId });
  }
}
