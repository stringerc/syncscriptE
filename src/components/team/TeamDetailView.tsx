import { TeamEnergyDashboard } from './TeamEnergyDashboardWrapper';
import { TeamResonanceDashboard } from './TeamResonanceDashboard';
import { TeamGamificationDashboard } from './TeamGamificationDashboard';
import { TeamTasksTab } from './TeamTasksTab';
import { TaskAnalyticsTab } from './TaskAnalyticsTab';
import { useState } from 'react';
import { 
  ArrowLeft, Users, Zap, Settings, Plus, Crown, Shield,
  Mail, TrendingUp, Activity, Calendar, Target, ListChecks
} from 'lucide-react';
import { Team } from '../../types/team';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTeam } from '../../contexts/TeamContext';
import { InviteMemberDialog } from './InviteMemberDialog';

interface TeamDetailViewProps {
  team: Team;
  onBack: () => void;
}

const CURRENT_USER_ID = 'user-1';

/**
 * TeamDetailView Component
 * 
 * Detailed view of a team with tabs for:
 * - Overview (members, stats, activity)
 * - Energy (energy dashboard)
 * - Resonance (resonance dashboard)
 * - Events (team events and hierarchies)
 * - Templates (shared templates)
 * - Settings (permissions, configuration)
 */
export function TeamDetailView({ team, onBack }: TeamDetailViewProps) {
  const { getTeamActivity } = useTeam();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  const currentMember = team.members.find(m => m.userId === CURRENT_USER_ID);
  const canInvite = currentMember?.permissions.canInviteMembers || false;
  const activities = getTeamActivity(team.id, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${team.color}20`, 
                borderColor: `${team.color}40`, 
                borderWidth: 1 
              }}
            >
              <Users className="w-8 h-8" style={{ color: team.color }} />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{team.name}</h1>
              {team.description && (
                <p className="text-gray-400 text-sm">{team.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={
                    currentMember?.role === 'owner' 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : currentMember?.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }
                >
                  {currentMember?.role === 'owner' && <Crown className="w-3 h-3 mr-1" />}
                  {currentMember?.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                  {currentMember?.role || 'Member'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canInvite && (
            <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Members</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{team.memberCount}</div>
        </div>

        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Energy</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {team.energyStats.totalEnergyEarned.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Events</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{team.stats.activeEvents}</div>
        </div>

        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Templates</span>
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{team.stats.templatesCreated}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#1e2128] border border-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
          <TabsTrigger value="resonance">Resonance</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Members List */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {member.fallback}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.stats.energyContributed > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {member.stats.energyContributed}
                        </div>
                      )}
                      <Badge 
                        variant="outline" 
                        className={
                          member.role === 'owner' 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : member.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }
                      >
                        {member.role === 'owner' && <Crown className="w-3 h-3 mr-1" />}
                        {member.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No activity yet
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {activity.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-white">{activity.userName}</span>
                          {' '}
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <TeamTasksTab teamId={team.id} />
        </TabsContent>

        <TabsContent value="energy">
          <TeamEnergyDashboard teamId={team.id} />
        </TabsContent>

        <TabsContent value="resonance">
          <TeamResonanceDashboard team={team} />
        </TabsContent>

        <TabsContent value="gamification">
          <TeamGamificationDashboard team={team} />
        </TabsContent>

        <TabsContent value="events">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Team events integration coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-8 text-center">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Team templates integration coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-8 text-center">
            <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Team settings coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        teamId={team.id}
      />
    </div>
  );
}