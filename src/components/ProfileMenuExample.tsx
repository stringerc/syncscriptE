import { ProfileMenu } from './ProfileMenu';

/**
 * ProfileMenu Usage Examples
 * 
 * This component demonstrates various ways to integrate the ProfileMenu
 * throughout your SyncScript application.
 */

export function ProfileMenuExample() {
  return (
    <div className="bg-[#0f172a] min-h-screen p-8 space-y-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-3xl mb-2">ProfileMenu Component Examples</h1>
        <p className="text-gray-400 mb-8">
          The ProfileMenu component can be used throughout your application to provide
          consistent user profile access and navigation.
        </p>

        {/* Example 1: Header Usage */}
        <section className="space-y-4">
          <h2 className="text-white text-xl">1. Header Navigation</h2>
          <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-32 h-8 bg-teal-600/20 rounded flex items-center justify-center">
                  <span className="text-teal-400 text-xs">Logo</span>
                </div>
                <div className="w-64 h-10 bg-[#2a2d35] rounded-lg flex items-center px-3">
                  <span className="text-gray-500 text-sm">Search...</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Other Actions</span>
                <ProfileMenu 
                  userName="Jordan Smith"
                  userEmail="jordan.smith@syncscript.ai"
                  energyLevel={85}
                  dailyStreak={12}
                />
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            ✅ Used in: DashboardHeader component
          </p>
        </section>

        {/* Example 2: Sidebar Usage */}
        <section className="space-y-4">
          <h2 className="text-white text-xl">2. Sidebar Footer</h2>
          <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
            <div className="w-64 space-y-4">
              {/* Sidebar nav items */}
              <div className="space-y-2">
                <div className="h-10 bg-gray-700/30 rounded px-3 flex items-center text-gray-400 text-sm">
                  Dashboard
                </div>
                <div className="h-10 bg-gray-700/30 rounded px-3 flex items-center text-gray-400 text-sm">
                  Tasks
                </div>
                <div className="h-10 bg-gray-700/30 rounded px-3 flex items-center text-gray-400 text-sm">
                  Calendar
                </div>
              </div>
              
              {/* Profile at bottom */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center gap-3">
                  <ProfileMenu 
                    userName="Jordan Smith"
                    userEmail="jordan.smith@syncscript.ai"
                    energyLevel={72}
                    dailyStreak={8}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">Jordan Smith</p>
                    <p className="text-gray-400 text-xs truncate">View Profile</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            💡 Ideal for: Sidebar components with user profile at the bottom
          </p>
        </section>

        {/* Example 3: Settings Page */}
        <section className="space-y-4">
          <h2 className="text-white text-xl">3. Settings & Profile Pages</h2>
          <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <ProfileMenu 
                  userName="Jordan Smith"
                  userEmail="jordan.smith@syncscript.ai"
                  energyLevel={90}
                  dailyStreak={15}
                />
                <div>
                  <h3 className="text-white font-medium">Account Settings</h3>
                  <p className="text-gray-400 text-sm">Manage your profile and preferences</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-[#2a2d35] rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Email</p>
                  <p className="text-white text-sm">jordan.smith@syncscript.ai</p>
                </div>
                <div className="bg-[#2a2d35] rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Member Since</p>
                  <p className="text-white text-sm">Jan 2024</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            💡 Ideal for: Profile pages, account settings, preferences
          </p>
        </section>

        {/* Example 4: Mobile Responsive */}
        <section className="space-y-4">
          <h2 className="text-white text-xl">4. Mobile Navigation</h2>
          <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
            <div className="w-full max-w-sm mx-auto">
              <div className="flex items-center justify-between p-4 bg-[#2a2d35] rounded-lg">
                <button className="text-white">☰</button>
                <div className="text-teal-400 font-medium">SyncScript</div>
                <ProfileMenu 
                  userName="JS"
                  userEmail="jordan.smith@syncscript.ai"
                  energyLevel={85}
                  dailyStreak={12}
                />
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            📱 Ideal for: Mobile responsive layouts and hamburger menus
          </p>
        </section>

        {/* Example 5: Team Collaboration */}
        <section className="space-y-4">
          <h2 className="text-white text-xl">5. Team Members & Collaboration</h2>
          <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6">
            <div className="space-y-3">
              <h3 className="text-white text-sm font-medium mb-3">Active Team Members</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProfileMenu 
                    userName="Jordan Smith"
                    userEmail="jordan.smith@syncscript.ai"
                    energyLevel={85}
                    dailyStreak={12}
                  />
                  <div>
                    <p className="text-white text-sm">Jordan Smith</p>
                    <p className="text-gray-400 text-xs">Team Lead</p>
                  </div>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Active</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProfileMenu 
                    userName="Alex Johnson"
                    userEmail="alex.j@syncscript.ai"
                    energyLevel={62}
                    dailyStreak={5}
                    avatarSrc="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                  />
                  <div>
                    <p className="text-white text-sm">Alex Johnson</p>
                    <p className="text-gray-400 text-xs">Developer</p>
                  </div>
                </div>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Away</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProfileMenu 
                    userName="Sam Taylor"
                    userEmail="sam.t@syncscript.ai"
                    energyLevel={95}
                    dailyStreak={20}
                    avatarSrc="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
                  />
                  <div>
                    <p className="text-white text-sm">Sam Taylor</p>
                    <p className="text-gray-400 text-xs">Designer</p>
                  </div>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Active</span>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            👥 Ideal for: Team collaboration pages, user directories, member lists
          </p>
        </section>

        {/* Example 6: Comments & Activity */}
        <section className="space-y-4">
          <h2 className="text-white text-xl">6. Comments & Activity Feed</h2>
          <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex gap-3">
              <ProfileMenu 
                userName="Jordan Smith"
                userEmail="jordan.smith@syncscript.ai"
                energyLevel={85}
                dailyStreak={12}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">Jordan Smith</span>
                  <span className="text-gray-500 text-xs">• 2 hours ago</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Just completed the quarterly review! Great work everyone 🎉
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <ProfileMenu 
                userName="Alex Johnson"
                userEmail="alex.j@syncscript.ai"
                energyLevel={62}
                dailyStreak={5}
                avatarSrc="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">Alex Johnson</span>
                  <span className="text-gray-500 text-xs">• 5 hours ago</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Updated the dashboard with the new analytics module.
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            💬 Ideal for: Comment sections, activity feeds, social features
          </p>
        </section>

        {/* Usage Tips */}
        <section className="bg-teal-900/20 border border-teal-700 rounded-lg p-6 mt-8">
          <h2 className="text-teal-400 text-xl mb-4">💡 Usage Tips</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>Consistent Experience:</strong> Use ProfileMenu across all pages for unified user experience</li>
            <li>• <strong>Navigation Handler:</strong> Pass custom onNavigate function to control routing behavior</li>
            <li>• <strong>Dynamic Data:</strong> Update userName, userEmail, energyLevel, and dailyStreak from your user state/context</li>
            <li>• <strong>Theming:</strong> Customize colors and styles to match your brand guidelines</li>
            <li>• <strong>Accessibility:</strong> Component includes proper ARIA labels and keyboard navigation</li>
            <li>• <strong>Data Attributes:</strong> All menu items have data-nav attributes for analytics tracking</li>
          </ul>
        </section>

        {/* Component Props */}
        <section className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-white text-xl mb-4">📋 Component Props</h2>
          <div className="space-y-3 text-sm font-mono">
            <div className="grid grid-cols-3 gap-4 text-gray-400 pb-2 border-b border-gray-700">
              <span>Prop</span>
              <span>Type</span>
              <span>Default</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-gray-300">
              <span className="text-teal-400">userName</span>
              <span>string</span>
              <span className="text-gray-500">"Jordan Smith"</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-gray-300">
              <span className="text-teal-400">userEmail</span>
              <span>string</span>
              <span className="text-gray-500">"jordan.smith@..."</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-gray-300">
              <span className="text-teal-400">avatarSrc</span>
              <span>string</span>
              <span className="text-gray-500">unsplash image</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-gray-300">
              <span className="text-teal-400">energyLevel</span>
              <span>number</span>
              <span className="text-gray-500">85</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-gray-300">
              <span className="text-teal-400">dailyStreak</span>
              <span>number</span>
              <span className="text-gray-500">12</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-gray-300">
              <span className="text-teal-400">onNavigate</span>
              <span>(route: string) =&gt; void</span>
              <span className="text-gray-500">undefined</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}