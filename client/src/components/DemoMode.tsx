import React from 'react';
import { CheckCircle, Globe, Smartphone, Users } from 'lucide-react';

const DemoMode: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              SyncScript Demo
            </h1>
            <p className="text-lg text-gray-600">
              AI-Powered Life Management Platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Task Management</h3>
              <p className="text-sm text-gray-600">Smart prioritization & AI suggestions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Calendar Sync</h3>
              <p className="text-sm text-gray-600">Google Calendar integration</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Weather & Location</h3>
              <p className="text-sm text-gray-600">Smart location-based features</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-3">🚀 Full Version Available</h2>
            <p className="mb-4">
              This demo shows the SyncScript interface. For the full experience with all features:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <span>✅ Run locally: <code className="bg-black/20 px-2 py-1 rounded">npm run dev</code></span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>✅ Access from anywhere: Use tunnel services</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>Built with React, TypeScript, Node.js, and AI integration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoMode;
