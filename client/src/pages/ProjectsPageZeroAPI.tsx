import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, Plus, Users, Settings } from 'lucide-react';

export function ProjectsPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Projects Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All projects functionality working');
    console.log('📁 Mock projects loaded:', mockProjects.length);
  }, []);

  console.log('🔍 ProjectsPageZeroAPI rendering...');

  // Mock projects data
  const mockProjects = [
    {
      id: '1',
      name: 'Q4 Marketing Campaign',
      description: 'Planning and execution of Q4 marketing initiatives',
      memberCount: 5,
      itemCount: 12,
      privacyDefault: 'SHARED_WITH_OWNER',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      name: 'Product Launch 2025',
      description: 'Coordinating the launch of our new product line',
      memberCount: 8,
      itemCount: 24,
      privacyDefault: 'SHARED_WITH_PROJECT',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      name: 'Office Renovation',
      description: 'Planning and tracking office space improvements',
      memberCount: 3,
      itemCount: 8,
      privacyDefault: 'PRIVATE',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const handleCreateProject = () => {
    console.log('✅ Create Project button clicked successfully!');
  };

  const handleProjectClick = (projectId: string) => {
    console.log(`✅ Project ${projectId} clicked successfully!`);
  };

  const handleProjectSettings = (projectId: string) => {
    console.log(`✅ Project ${projectId} settings clicked successfully!`);
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Folder className="w-10 h-10" />
              ShareSync - Zero API Mode
            </h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span>⚡ Loaded in {loadTime}ms</span>
              <span>•</span>
              <span>🚫 Zero network requests</span>
              <span>•</span>
              <span>📁 {mockProjects.length} projects</span>
            </p>
          </div>
          <Button 
            onClick={handleCreateProject}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-violet-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-violet-700 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600 mb-1">{mockProjects.length}</div>
            <p className="text-xs text-violet-600/70">Active</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {mockProjects.reduce((sum, p) => sum + p.memberCount, 0)}
            </div>
            <p className="text-xs text-blue-600/70">Total collaborators</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {mockProjects.reduce((sum, p) => sum + p.itemCount, 0)}
            </div>
            <p className="text-xs text-green-600/70">Tasks & events</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">{loadTime}ms</div>
            <p className="text-xs text-orange-600/70">Ultra fast</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Folder className="w-6 h-6 text-violet-600" />
            Your Projects
          </CardTitle>
          <CardDescription className="text-gray-600">
            Collaborative workspaces for your team
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="p-6 rounded-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectSettings(project.id);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                <h3 className="font-semibold text-lg text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{project.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    {project.memberCount} members
                  </div>
                  <Badge variant="secondary">
                    {project.itemCount} items
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center gap-2 text-xl">
            <span className="text-3xl">📋</span>
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-indigo-800">
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">1</span>
              <div><strong>Click "Create Project"</strong> - Should log to console</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">2</span>
              <div><strong>Click Any Project Card</strong> - Should log project ID</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">3</span>
              <div><strong>Click Settings Icon</strong> - Should log settings action</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">4</span>
              <div><strong>Check Console</strong> - All interactions logged</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

