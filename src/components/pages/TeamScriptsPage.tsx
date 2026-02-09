/**
 * TeamScriptsPage Component (Phase 6B Integration)
 * 
 * Displays team scripts marketplace integrated into the main app.
 * Shows team scripts, my scripts, and favorites with full CRUD operations.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Users,
  Star,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Zap,
  Clock,
  Heart,
  Eye,
  Settings,
  Sparkles,
  Target,
} from 'lucide-react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useTeamScripts } from '../../hooks/useTeamScripts';
import { useTeam } from '../../contexts/TeamContext';
import { TeamScriptCard } from '../team/TeamScriptCard';
import { TeamScript } from '../../utils/team-script-integration';
import { PAGE_INSIGHTS_CONFIG } from '../../utils/insights-config';

export function TeamScriptsPage() {
  const {
    scripts: allScripts,
    searchScripts,
    getMyScripts,
    getFavoriteScripts,
    favoriteScript,
    unfavoriteScript,
    canEdit,
    canDelete,
  } = useTeamScripts();

  const { teams, getUserTeams } = useTeam();
  const CURRENT_USER_ID = 'user-1';
  const userTeams = getUserTeams(CURRENT_USER_ID);

  const [activeTab, setActiveTab] = useState<'all' | 'my-scripts' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedComplexity, setSelectedComplexity] = useState('all');
  const [selectedPricing, setSelectedPricing] = useState('all');

  // Filter scripts based on active tab and filters
  const getFilteredScripts = (): TeamScript[] => {
    let filtered: TeamScript[] = [];

    // Get base scripts for tab
    switch (activeTab) {
      case 'my-scripts':
        filtered = getMyScripts();
        break;
      case 'favorites':
        filtered = getFavoriteScripts();
        break;
      default:
        filtered = allScripts;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Apply team filter
    if (selectedTeam !== 'all') {
      filtered = filtered.filter((s) => s.teamId === selectedTeam);
    }

    // Apply complexity filter
    if (selectedComplexity !== 'all') {
      filtered = filtered.filter((s) => s.complexity === selectedComplexity);
    }

    // Apply pricing filter
    if (selectedPricing !== 'all') {
      filtered = filtered.filter((s) => s.pricing === selectedPricing);
    }

    return filtered;
  };

  const filteredScripts = getFilteredScripts();
  const favoriteScripts = getFavoriteScripts();
  const myScripts = getMyScripts();

  // Calculate stats
  const totalScripts = allScripts.length;
  const totalUsage = allScripts.reduce((sum, s) => sum + s.usageCount, 0);
  const avgRating =
    allScripts.reduce((sum, s) => sum + s.rating, 0) / totalScripts || 0;

  const aiInsightsContent = PAGE_INSIGHTS_CONFIG.scripts || null;

  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      <div className="flex-1 overflow-auto hide-scrollbar p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Team Scripts</h1>
            <p className="text-gray-400">
              Reusable event templates shared across your teams
            </p>

            {/* Stats */}
            <div className="flex gap-6 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">{totalScripts} scripts</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">{totalUsage} uses</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-gray-400">{avgRating.toFixed(1)} avg rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400">{userTeams.length} teams</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1e2128] border border-gray-800">
            <TabsTrigger value="all">
              <Sparkles className="w-4 h-4 mr-2" />
              All Scripts ({allScripts.length})
            </TabsTrigger>
            <TabsTrigger value="my-scripts">
              <FileText className="w-4 h-4 mr-2" />
              My Scripts ({myScripts.length})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favoriteScripts.length})
            </TabsTrigger>
          </TabsList>

          {/* All Scripts Tab */}
          <TabsContent value="all" className="space-y-4 mt-6">
            <ScriptsList
              scripts={filteredScripts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedTeam={selectedTeam}
              onTeamChange={setSelectedTeam}
              selectedComplexity={selectedComplexity}
              onComplexityChange={setSelectedComplexity}
              selectedPricing={selectedPricing}
              onPricingChange={setSelectedPricing}
              teams={userTeams}
              onFavorite={(script) => favoriteScript(script.id)}
              onUnfavorite={(script) => unfavoriteScript(script.id)}
              favoriteScripts={favoriteScripts}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </TabsContent>

          {/* My Scripts Tab */}
          <TabsContent value="my-scripts" className="space-y-4 mt-6">
            <ScriptsList
              scripts={filteredScripts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedTeam={selectedTeam}
              onTeamChange={setSelectedTeam}
              selectedComplexity={selectedComplexity}
              onComplexityChange={setSelectedComplexity}
              selectedPricing={selectedPricing}
              onPricingChange={setSelectedPricing}
              teams={userTeams}
              onFavorite={(script) => favoriteScript(script.id)}
              onUnfavorite={(script) => unfavoriteScript(script.id)}
              favoriteScripts={favoriteScripts}
              canEdit={canEdit}
              canDelete={canDelete}
              showEditDelete
            />
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4 mt-6">
            <ScriptsList
              scripts={filteredScripts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedTeam={selectedTeam}
              onTeamChange={setSelectedTeam}
              selectedComplexity={selectedComplexity}
              onComplexityChange={setSelectedComplexity}
              selectedPricing={selectedPricing}
              onPricingChange={setSelectedPricing}
              teams={userTeams}
              onFavorite={(script) => favoriteScript(script.id)}
              onUnfavorite={(script) => unfavoriteScript(script.id)}
              favoriteScripts={favoriteScripts}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Scripts List Component
interface ScriptsListProps {
  scripts: TeamScript[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedTeam: string;
  onTeamChange: (teamId: string) => void;
  selectedComplexity: string;
  onComplexityChange: (complexity: string) => void;
  selectedPricing: string;
  onPricingChange: (pricing: string) => void;
  teams: any[];
  onFavorite: (script: TeamScript) => void;
  onUnfavorite: (script: TeamScript) => void;
  favoriteScripts: TeamScript[];
  canEdit: (id: string) => boolean;
  canDelete: (id: string) => boolean;
  showEditDelete?: boolean;
}

function ScriptsList({
  scripts,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTeam,
  onTeamChange,
  selectedComplexity,
  onComplexityChange,
  selectedPricing,
  onPricingChange,
  teams,
  onFavorite,
  onUnfavorite,
  favoriteScripts,
  canEdit,
  canDelete,
  showEditDelete = false,
}: ScriptsListProps) {
  return (
    <>
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search scripts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-[#1e2128] border-gray-800 text-white"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="bg-[#1e2128] border-gray-800 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e2128] border-gray-800">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="task-management">Task Management</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTeam} onValueChange={onTeamChange}>
            <SelectTrigger className="bg-[#1e2128] border-gray-800 text-white">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e2128] border-gray-800">
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedComplexity} onValueChange={onComplexityChange}>
            <SelectTrigger className="bg-[#1e2128] border-gray-800 text-white">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e2128] border-gray-800">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPricing} onValueChange={onPricingChange}>
            <SelectTrigger className="bg-[#1e2128] border-gray-800 text-white">
              <SelectValue placeholder="Pricing" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e2128] border-gray-800">
              <SelectItem value="all">All Pricing</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-400">
          {scripts.length} {scripts.length === 1 ? 'script' : 'scripts'} found
        </div>
      </div>

      {/* Scripts Grid */}
      {scripts.length === 0 ? (
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No scripts found</h3>
          <p className="text-gray-400">
            Try adjusting your filters or create your first team script
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((script, idx) => (
            <TeamScriptCard
              key={script.id}
              script={script}
              isFavorite={favoriteScripts.some((f) => f.id === script.id)}
              onFavorite={() => onFavorite(script)}
              onViewDetails={(s) => console.log('View details:', s)}
              canEdit={showEditDelete && canEdit(script.id)}
              canDelete={showEditDelete && canDelete(script.id)}
              variant="library"
            />
          ))}
        </div>
      )}
    </>
  );
}
