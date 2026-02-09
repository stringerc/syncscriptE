/**
 * TeamCollaborationPage - Restructured
 * 
 * Three internal tabs:
 * 1. Collaboration (default) - Friends & Teams lists
 * 2. Teams - Team view with permissions, activity, add goal
 * 3. Individual - User profile (same as "My Profile")
 * 
 * Features:
 * - Selecting friend/team opens chat panel on right
 * - Share/add to projects (mock modals)
 * - Team permissions (same pattern as event permissions)
 * - Team lead/admin can set permissions
 * - View Activity button
 * - Add Goal button with Smart Goal option
 * - Member click opens profile modal
 * - Chat & Call (call is "Coming Soon")
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users, UserPlus, MessageSquare, Calendar, Target, TrendingUp,
  Clock, Award, CheckCircle2, AlertCircle, MoreVertical,
  Video, Phone, Mail, Star, Zap, Brain, User, Edit, Send,
  Settings, Shield, Crown, Eye, FileText, Share2, Plus, Search,
  X, ChevronRight, Activity, Briefcase, Home
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner@2.0.3';
import { TeamChat } from '../TeamChat';
import { MemberProfileModal } from '../MemberProfileModal';
import { TeamPermissionsModal } from '../TeamPermissionsModal';
import { TeamActivityModal } from '../TeamActivityModal';
import { SmartGoalCreation } from '../SmartItemCreation';
import { IndividualProfileView } from '../IndividualProfileView';

type TeamRole = 'admin' | 'editor' | 'viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: TeamRole;
  energy: number;
  animation: 'glow' | 'heartbeat' | 'pulse' | 'bounce';
  status: 'online' | 'away' | 'offline';
}

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  energy: number;
  animation: 'glow' | 'heartbeat' | 'pulse' | 'bounce';
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  admin: TeamMember;
  members: TeamMember[];
  projectCount: number;
  tasksCompleted: number;
  totalTasks: number;
}

export function TeamCollaborationPage() {
  const [activeTab, setActiveTab] = useState<'collaboration' | 'teams' | 'individual'>('collaboration');
  const [collaborationView, setCollaborationView] = useState<'friends' | 'teams'>('friends');
  
  // Selection state
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddToProjectModal, setShowAddToProjectModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Mock data
  const [friends] = useState<Friend[]>([
    {
      id: 'user_002',
      name: 'Sarah Chen',
      email: 'sarah.chen@syncscript.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      status: 'online',
      energy: 85,
      animation: 'glow',
      lastMessage: 'See you at the meeting!',
      lastMessageTime: '2m ago',
    },
    {
      id: 'user_003',
      name: 'Alex Kumar',
      email: 'alex.kumar@syncscript.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      status: 'away',
      energy: 65,
      animation: 'pulse',
      lastMessage: 'Thanks for the update',
      lastMessageTime: '1h ago',
    },
    {
      id: 'user_004',
      name: 'Emily Rodriguez',
      email: 'emily.r@syncscript.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      status: 'online',
      energy: 92,
      animation: 'heartbeat',
      lastMessage: 'Great work on the project!',
      lastMessageTime: '3h ago',
    },
  ]);

  const [teams, setTeams] = useState<Team[]>([
    {
      id: 'team_001',
      name: 'Design Team',
      description: 'Product design and UX research',
      admin: {
        id: 'user_001',
        name: 'You',
        email: 'you@syncscript.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
        role: 'admin',
        energy: 78,
        animation: 'glow',
        status: 'online',
      },
      members: [
        {
          id: 'user_001',
          name: 'You',
          email: 'you@syncscript.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
          role: 'admin',
          energy: 78,
          animation: 'glow',
          status: 'online',
        },
        {
          id: 'user_002',
          name: 'Sarah Chen',
          email: 'sarah.chen@syncscript.com',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
          role: 'editor',
          energy: 85,
          animation: 'pulse',
          status: 'online',
        },
        {
          id: 'user_004',
          name: 'Emily Rodriguez',
          email: 'emily.r@syncscript.com',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
          role: 'viewer',
          energy: 92,
          animation: 'heartbeat',
          status: 'online',
        },
      ],
      projectCount: 8,
      tasksCompleted: 42,
      totalTasks: 60,
    },
    {
      id: 'team_002',
      name: 'Engineering Team',
      description: 'Full-stack development and DevOps',
      admin: {
        id: 'user_003',
        name: 'Alex Kumar',
        email: 'alex.kumar@syncscript.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        role: 'admin',
        energy: 65,
        animation: 'glow',
        status: 'away',
      },
      members: [
        {
          id: 'user_003',
          name: 'Alex Kumar',
          email: 'alex.kumar@syncscript.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          role: 'admin',
          energy: 65,
          animation: 'glow',
          status: 'away',
        },
        {
          id: 'user_001',
          name: 'You',
          email: 'you@syncscript.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
          role: 'editor',
          energy: 78,
          animation: 'pulse',
          status: 'online',
        },
      ],
      projectCount: 12,
      tasksCompleted: 85,
      totalTasks: 120,
    },
  ]);

  const currentUserId = 'user_001'; // Current user

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setSelectedTeam(null);
    setShowChatPanel(true);
  };

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    setSelectedFriend(null);
    setActiveTab('teams'); // Switch to teams tab when selecting a team
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberProfileModal(true);
  };

  const handleShareToProjects = () => {
    toast.success('Share to projects (Mock)', {
      description: 'This feature will allow sharing items to team projects',
    });
    setShowShareModal(false);
  };

  const handleAddToProject = () => {
    toast.success('Added to project (Mock)', {
      description: 'Item successfully added to project',
    });
    setShowAddToProjectModal(false);
  };

  const handleRoleChange = (memberId: string, newRole: TeamRole) => {
    if (!selectedTeam) return;
    
    setTeams(prev => prev.map(team => {
      if (team.id === selectedTeam.id) {
        return {
          ...team,
          members: team.members.map(m => 
            m.id === memberId ? { ...m, role: newRole } : m
          ),
        };
      }
      return team;
    }));
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedTeam) return;
    
    setTeams(prev => prev.map(team => {
      if (team.id === selectedTeam.id) {
        return {
          ...team,
          members: team.members.filter(m => m.id !== memberId),
        };
      }
      return team;
    }));
  };

  const handleAdminTransfer = (newAdminId: string) => {
    if (!selectedTeam) return;
    
    const newAdmin = selectedTeam.members.find(m => m.id === newAdminId);
    if (!newAdmin) return;

    setTeams(prev => prev.map(team => {
      if (team.id === selectedTeam.id) {
        return {
          ...team,
          admin: { ...newAdmin, role: 'admin' },
          members: team.members.map(m => {
            if (m.id === newAdminId) return { ...m, role: 'admin' as TeamRole };
            if (m.id === currentUserId) return { ...m, role: 'editor' as TeamRole };
            return m;
          }),
        };
      }
      return team;
    }));
  };

  const handleInviteMembers = (emails: string[]) => {
    toast.success(`Invited ${emails.length} member(s)`, {
      description: 'Invitation emails sent successfully',
    });
  };

  const handleCreateGoal = (goal: any) => {
    toast.success('Goal created', {
      description: `"${goal.title}" added to team goals`,
    });
    setShowAddGoalModal(false);
  };

  return (
    <DashboardLayout>
      <motion.div
        className="flex-1 overflow-auto hide-scrollbar p-6 flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Team & Collaboration</h1>
            <p className="text-gray-400">Connect with friends and collaborate with teams</p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600">
            <UserPlus className="w-4 h-4" />
            Invite People
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1">
          <TabsList className="bg-[#1e2128] border-b border-gray-800">
            <TabsTrigger value="collaboration" className="gap-2">
              <Users className="w-4 h-4" />
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="individual" className="gap-2">
              <User className="w-4 h-4" />
              Individual
            </TabsTrigger>
          </TabsList>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Friends & Teams Lists */}
              <div className={`${showChatPanel ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
                {/* Sub-tabs for Friends/Teams */}
                <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                  <Button
                    variant={collaborationView === 'friends' ? 'default' : 'ghost'}
                    onClick={() => setCollaborationView('friends')}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Friends ({friends.length})
                  </Button>
                  <Button
                    variant={collaborationView === 'teams' ? 'default' : 'ghost'}
                    onClick={() => setCollaborationView('teams')}
                    className="gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    Teams ({teams.length})
                  </Button>
                </div>

                {/* Friends List */}
                {collaborationView === 'friends' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => handleFriendClick(friend)}
                        className={`p-4 bg-[#1e2128] border rounded-lg cursor-pointer transition-all hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/10 ${
                          selectedFriend?.id === friend.id ? 'border-teal-600' : 'border-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <AnimatedAvatar
                              src={friend.avatar}
                              alt={friend.name}
                              animation={friend.animation}
                              size="md"
                            />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e2128] ${
                              friend.status === 'online' ? 'bg-green-500' :
                              friend.status === 'away' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium">{friend.name}</h3>
                            <p className="text-sm text-gray-400 truncate">{friend.lastMessage}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {friend.energy} Energy
                              </Badge>
                              <span className="text-xs text-gray-500">{friend.lastMessageTime}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowShareModal(true);
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Teams List */}
                {collaborationView === 'teams' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        onClick={() => handleTeamClick(team)}
                        className={`p-4 bg-[#1e2128] border rounded-lg cursor-pointer transition-all hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/10 ${
                          selectedTeam?.id === team.id ? 'border-teal-600' : 'border-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-white font-medium flex items-center gap-2">
                              {team.name}
                              {team.admin.id === currentUserId && (
                                <Crown className="w-4 h-4 text-yellow-400" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-400">{team.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex -space-x-2">
                            {team.members.slice(0, 4).map((member) => (
                              <Avatar key={member.id} className="w-8 h-8 border-2 border-[#1e2128]">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-sm text-gray-400">
                            {team.members.length} member{team.members.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white">{team.tasksCompleted}/{team.totalTasks}</span>
                          </div>
                          <Progress value={(team.tasksCompleted / team.totalTasks) * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Chat Panel (when friend/team selected) */}
              {showChatPanel && selectedFriend && (
                <div className="lg:col-span-1">
                  <TeamChat
                    recipientName={selectedFriend.name}
                    recipientAvatar={selectedFriend.avatar}
                    recipientStatus={selectedFriend.status}
                    onClose={() => setShowChatPanel(false)}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6">
            {selectedTeam ? (
              <div className="space-y-6">
                {/* Team Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl text-white font-semibold">{selectedTeam.name}</h2>
                      {selectedTeam.admin.id === currentUserId && (
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                          <Crown className="w-3 h-3 mr-1" />
                          Team Lead
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400">{selectedTeam.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowActivityModal(true)}
                      className="gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      View Activity
                    </Button>
                    {selectedTeam.admin.id === currentUserId && (
                      <Button
                        variant="outline"
                        onClick={() => setShowPermissionsModal(true)}
                        className="gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Permissions
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowAddGoalModal(true)}
                      className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600"
                    >
                      <Plus className="w-4 h-4" />
                      Add Goal
                    </Button>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1e2128] border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-400">Members</span>
                    </div>
                    <p className="text-2xl text-white font-semibold">{selectedTeam.members.length}</p>
                  </div>
                  <div className="p-4 bg-[#1e2128] border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-400">Projects</span>
                    </div>
                    <p className="text-2xl text-white font-semibold">{selectedTeam.projectCount}</p>
                  </div>
                  <div className="p-4 bg-[#1e2128] border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Tasks Completed</span>
                    </div>
                    <p className="text-2xl text-white font-semibold">
                      {selectedTeam.tasksCompleted}/{selectedTeam.totalTasks}
                    </p>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h3 className="text-white font-medium mb-4">Team Members</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTeam.members.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleMemberClick(member)}
                        className="p-4 bg-[#1e2128] border border-gray-700 rounded-lg cursor-pointer hover:border-teal-600 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <AnimatedAvatar
                              src={member.avatar}
                              alt={member.name}
                              animation={member.animation}
                              size="md"
                            />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e2128] ${
                              member.status === 'online' ? 'bg-green-500' :
                              member.status === 'away' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium">{member.name}</h4>
                            <Badge variant="outline" className="mt-1 capitalize text-xs">
                              {member.role}
                            </Badge>
                            <p className="text-sm text-gray-400 mt-2">{member.energy} Energy</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl text-white mb-2">No Team Selected</h3>
                <p className="text-gray-400 mb-4">Select a team from the Collaboration tab to view details</p>
                <Button onClick={() => setActiveTab('collaboration')}>
                  View Teams
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Individual Tab */}
          <TabsContent value="individual" className="mt-6">
            <IndividualProfileView />
          </TabsContent>
        </Tabs>

        {/* Share Modal (Mock) */}
        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent className="bg-[#1e2128] border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Share to Projects</DialogTitle>
              <DialogDescription className="text-gray-400">
                Share this item with team projects (Mock)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-300">This feature allows sharing items to team projects.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleShareToProjects} className="bg-gradient-to-r from-teal-600 to-blue-600">
                Share
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add to Project Modal (Mock) */}
        <Dialog open={showAddToProjectModal} onOpenChange={setShowAddToProjectModal}>
          <DialogContent className="bg-[#1e2128] border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Add to Project</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add this item to a project (Mock)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-300">This feature allows adding items to projects.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddToProjectModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddToProject} className="bg-gradient-to-r from-teal-600 to-blue-600">
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team Permissions Modal */}
        {selectedTeam && (
          <TeamPermissionsModal
            team={selectedTeam}
            currentUserId={currentUserId}
            open={showPermissionsModal}
            onClose={() => setShowPermissionsModal(false)}
            onRoleChange={handleRoleChange}
            onRemoveMember={handleRemoveMember}
            onAdminTransfer={handleAdminTransfer}
            onInvite={handleInviteMembers}
          />
        )}

        {/* Team Activity Modal */}
        {selectedTeam && (
          <TeamActivityModal
            teamName={selectedTeam.name}
            open={showActivityModal}
            onClose={() => setShowActivityModal(false)}
          />
        )}

        {/* Add Goal Modal */}
        <SmartGoalCreation
          open={showAddGoalModal}
          onClose={() => setShowAddGoalModal(false)}
          onGoalCreate={handleCreateGoal}
        />

        {/* Member Profile Modal */}
        {selectedMember && (
          <MemberProfileModal
            member={selectedMember}
            open={showMemberProfileModal}
            onClose={() => setShowMemberProfileModal(false)}
            onOpenChat={() => {
              setShowMemberProfileModal(false);
              // Convert member to friend format for chat
              setSelectedFriend({
                id: selectedMember.id,
                name: selectedMember.name,
                email: selectedMember.email,
                avatar: selectedMember.avatar,
                status: selectedMember.status,
                energy: selectedMember.energy,
                animation: selectedMember.animation,
              });
              setShowChatPanel(true);
              setActiveTab('collaboration');
            }}
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
