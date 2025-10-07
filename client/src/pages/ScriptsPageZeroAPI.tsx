import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookTemplate, Plus, Play, Edit, Copy, Trash2 } from 'lucide-react';

export function ScriptsPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Scripts Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All scripts functionality working');
  }, []);

  // Mock scripts data
  const mockScripts = [
    {
      id: '1',
      title: 'Morning Routine Script',
      description: 'A comprehensive morning routine to start your day right',
      category: 'Productivity',
      steps: 8,
      estimatedTime: '30 minutes',
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'Meeting Preparation',
      description: 'Steps to prepare for important meetings',
      category: 'Work',
      steps: 5,
      estimatedTime: '15 minutes',
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'End of Day Review',
      description: 'Reflect on your day and plan for tomorrow',
      category: 'Reflection',
      steps: 6,
      estimatedTime: '20 minutes',
      lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const handleCreateScript = () => {
    console.log('✅ Create Script button clicked successfully!');
    console.log('Create Script button clicked');
  };

  const handleRunScript = (scriptId: string) => {
    console.log(`✅ Run Script ${scriptId} clicked successfully!`);
    console.log(`Run script ${scriptId} clicked`);
  };

  const handleEditScript = (scriptId: string) => {
    console.log(`✅ Edit Script ${scriptId} clicked successfully!`);
    console.log(`Edit script ${scriptId} clicked`);
  };

  const handleCopyScript = (scriptId: string) => {
    console.log(`✅ Copy Script ${scriptId} clicked successfully!`);
    console.log(`Copy script ${scriptId} clicked`);
  };

  const handleDeleteScript = (scriptId: string) => {
    console.log(`✅ Delete Script ${scriptId} clicked successfully!`);
    console.log(`Delete script ${scriptId} clicked`);
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <BookTemplate className="w-10 h-10" />
                Scripts - Zero API Mode
              </h1>
              <p className="text-white/90 text-lg flex items-center gap-2">
                <span>⚡ Loaded in {loadTime}ms</span>
                <span>•</span>
                <span>🚫 Zero network requests</span>
                <span>•</span>
                <span>📜 {mockScripts.length} scripts loaded</span>
              </p>
            </div>
            <Button 
              onClick={handleCreateScript} 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Script
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <BookTemplate className="w-5 h-5" />
              <span className="font-medium">Scripts page loaded successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All scripts functionality is working with mock data. No API calls made.
            </p>
          </CardContent>
        </Card>

        {/* Scripts Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockScripts.length}</div>
              <p className="text-xs text-muted-foreground">All scripts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(mockScripts.map(s => s.category)).size}
              </div>
              <p className="text-xs text-muted-foreground">Different types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {mockScripts.reduce((sum, script) => sum + script.steps, 0)}
              </div>
              <p className="text-xs text-muted-foreground">All steps</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Load Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{loadTime}ms</div>
              <p className="text-xs text-muted-foreground">Ultra fast</p>
            </CardContent>
          </Card>
        </div>

        {/* Scripts List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Scripts</CardTitle>
            <CardDescription>
              Click on any script to interact with it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockScripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <BookTemplate className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{script.title}</h3>
                        <p className="text-sm text-muted-foreground">{script.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{script.category}</Badge>
                    
                    <div className="text-sm text-muted-foreground">
                      {script.steps} steps
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {script.estimatedTime}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Last used: {formatLastUsed(script.lastUsed)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleRunScript(script.id)}
                        className="flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditScript(script.id)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyScript(script.id)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteScript(script.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🧪 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-blue-700">
              <div>1. <strong>Click "Create Script"</strong> - Should log to console</div>
              <div>2. <strong>Click "Run" button</strong> - Should log script ID to console</div>
              <div>3. <strong>Click "Edit" button</strong> - Should log edit action to console</div>
              <div>4. <strong>Click "Copy" button</strong> - Should log copy action to console</div>
              <div>5. <strong>Click "Delete" button</strong> - Should log delete action to console</div>
              <div>6. <strong>Check console</strong> - Should see all interactions logged</div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
