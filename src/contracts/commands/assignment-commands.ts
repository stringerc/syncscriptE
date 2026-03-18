import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';

export interface InviteTeamMemberCommand {
  teamId: string;
  email: string;
  role: string;
}

export interface UpdateTeamMemberCommand {
  teamId: string;
  userId: string;
  role?: string;
}

export interface RemoveTeamMemberCommand {
  teamId: string;
  userId: string;
}

export interface TeamCommandPort {
  inviteMember: (
    ctx: ContractCommandContext,
    command: InviteTeamMemberCommand,
  ) => Promise<ContractCommandResult<{ teamId: string; invitedEmail: string }>>;
  updateMember: (
    ctx: ContractCommandContext,
    command: UpdateTeamMemberCommand,
  ) => Promise<ContractCommandResult<{ teamId: string; userId: string }>>;
  removeMember: (
    ctx: ContractCommandContext,
    command: RemoveTeamMemberCommand,
  ) => Promise<ContractCommandResult<{ teamId: string; userId: string }>>;
}
