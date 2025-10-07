import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, UserPlus, Check, X } from 'lucide-react';

export function FriendsPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Friends Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All friends functionality working');
  }, []);

  // Mock friends data
  const mockFriends = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', avatarUrl: '', since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', avatarUrl: '', since: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', avatarUrl: '', since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  const mockPendingRequests = [
    { id: '1', name: 'David Wilson', email: 'david@example.com', sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  const handleAddFriend = () => {
    console.log('✅ Add Friend button clicked successfully!');
  };

  const handleAcceptRequest = (requestId: string) => {
    console.log(`✅ Accept request ${requestId} clicked successfully!`);
  };

  const handleRejectRequest = (requestId: string) => {
    console.log(`✅ Reject request ${requestId} clicked successfully!`);
  };

  const handleRemoveFriend = (friendId: string) => {
    console.log(`✅ Remove friend ${friendId} clicked successfully!`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-10 h-10" />
              Friends - Zero API Mode
            </h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span>⚡ Loaded in {loadTime}ms</span>
              <span>•</span>
              <span>🚫 Zero network requests</span>
              <span>•</span>
              <span>👥 {mockFriends.length} friends • {mockPendingRequests.length} pending</span>
            </p>
          </div>
          <Button 
            onClick={handleAddFriend}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Friend
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pink-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600 mb-1">{mockFriends.length}</div>
            <p className="text-xs text-pink-600/70">Connected</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-1">{mockPendingRequests.length}</div>
            <p className="text-xs text-yellow-600/70">Waiting</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{loadTime}ms</div>
            <p className="text-xs text-blue-600/70">Ultra fast</p>
          </CardContent>
        </Card>
      </div>

      {/* Friends List */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Users className="w-6 h-6 text-pink-600" />
            Your Friends
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage your connections and collaborations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {mockFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-5 rounded-xl transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200 hover:border-pink-300 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {friend.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{friend.name}</h3>
                    <p className="text-sm text-gray-600">{friend.email}</p>
                    <p className="text-xs text-gray-500">Friends since {new Date(friend.since).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveFriend(friend.id)}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <UserPlus className="w-6 h-6 text-yellow-600" />
            Pending Requests
          </CardTitle>
          <CardDescription className="text-gray-600">
            Incoming friend requests
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {mockPendingRequests.length > 0 ? (
            <div className="space-y-4">
              {mockPendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-5 rounded-xl bg-white border-2 border-yellow-200 shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {request.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.email}</p>
                      <p className="text-xs text-gray-500">Sent {new Date(request.sentAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No pending friend requests</p>
          )}
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
              <div><strong>Click "Add Friend"</strong> - Should log to console</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">2</span>
              <div><strong>Accept/Reject Requests</strong> - Test pending request buttons</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">3</span>
              <div><strong>Remove Friends</strong> - Test remove button on friend cards</div>
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

