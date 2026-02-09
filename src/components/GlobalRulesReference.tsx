/**
 * GlobalRulesReference Component
 * 
 * Quick reference card for developers working on SyncScript.
 * Shows key rules and patterns for easy access during development.
 * 
 * Usage:
 * - Add to /all-features page
 * - Show in dev mode with keyboard shortcut
 * - Use as onboarding for new developers
 */

import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Code, FileCode, Layout, MousePointer, Smartphone, AlertTriangle } from 'lucide-react';
import { navigationLinks } from '@/utils/navigation';
import { BREAKPOINTS, Z_INDEX } from '@/utils/global-rules';

export function GlobalRulesReference() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">SyncScript Global System Rules</h1>
        <p className="text-gray-400">
          Quick reference for developers - All rules are NON-NEGOTIABLE
        </p>
      </div>

      {/* Route Lock */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <FileCode className="w-6 h-6 text-teal-400" />
          <div>
            <h2 className="text-xl font-semibold">1. Route Lock</h2>
            <Badge variant="outline" className="mt-1 text-red-400 border-red-400">
              NON-NEGOTIABLE
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-3">
          Only use routes defined in <code className="text-teal-400">/utils/navigation.ts</code>
        </p>
        
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Allowed Sidebar Routes:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {Object.entries(navigationLinks.sidebar).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-gray-400">
                <span className="text-teal-400">→</span>
                {value}
              </div>
            ))}
          </div>
        </div>
        
        <Separator className="my-3 bg-gray-700" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-400">✗</span>
            <span className="text-gray-400">Don't create new top-level routes</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Use modals/drawers for new screens</span>
          </div>
        </div>
      </Card>

      {/* Breakpoint Rules */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <Layout className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold">2. Breakpoint Rules</h2>
            <Badge variant="outline" className="mt-1 text-red-400 border-red-400">
              NON-NEGOTIABLE
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          {Object.entries(BREAKPOINTS).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {key}
                </Badge>
                <span className="text-gray-400">≥ {value}px</span>
              </div>
              <span className="text-xs text-gray-500">
                {key === '2xl' && 'Full layout + AI rail'}
                {key === 'xl' && 'Full sidebar + header'}
                {key === 'lg' && 'Compact sidebar'}
                {key === 'md' && 'Drawer sidebar'}
                {key === 'sm' && 'Mobile layout'}
              </span>
            </div>
          ))}
        </div>
        
        <Separator className="my-3 bg-gray-700" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-400">✗</span>
            <span className="text-gray-400">Don't allow double scroll (body + inner)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Only scroll main content areas</span>
          </div>
        </div>
      </Card>

      {/* No Dead Clicks */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <MousePointer className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold">3. No Dead Clicks</h2>
            <Badge variant="outline" className="mt-1 text-red-400 border-red-400">
              NON-NEGOTIABLE
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-3">
          Every clickable element must do something
        </p>
        
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Every click must:</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1">•</span>
              Navigate to a route, OR
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1">•</span>
              Open a modal/drawer, OR
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1">•</span>
              Toggle a control, OR
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1">•</span>
              Show tooltip/toast explaining "Coming Soon"
            </li>
          </ul>
        </div>
        
        <Separator className="my-3 bg-gray-700" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-400">✗</span>
            <code className="text-xs bg-gray-800 px-2 py-1 rounded">
              &lt;Button disabled&gt;Coming Soon&lt;/Button&gt;
            </code>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✓</span>
            <code className="text-xs bg-gray-800 px-2 py-1 rounded">
              &lt;Button onClick=&#123;showComingSoon&#125;&gt;Feature&lt;/Button&gt;
            </code>
          </div>
        </div>
      </Card>

      {/* Standard Components */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <Code className="w-6 h-6 text-yellow-400" />
          <div>
            <h2 className="text-xl font-semibold">4. Standard Components</h2>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Modal Pattern:</h3>
            <code className="text-xs bg-gray-800 px-3 py-2 rounded block overflow-x-auto">
              <pre className="text-teal-400">{`<StandardModal
  open={isOpen}
  onClose={handleClose}
  title="Delete Task"
  description="Are you sure?"
  primaryAction={{
    label: "Delete",
    onClick: handleDelete,
    variant: "destructive"
  }}
>
  <p>Content here</p>
</StandardModal>`}</pre>
            </code>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Coming Soon Pattern:</h3>
            <code className="text-xs bg-gray-800 px-3 py-2 rounded block overflow-x-auto">
              <pre className="text-teal-400">{`<ComingSoonOverlay
  feature="voiceInput"
  onClose={handleClose}
/>`}</pre>
            </code>
          </div>
        </div>
      </Card>

      {/* Responsive Patterns */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <Smartphone className="w-6 h-6 text-pink-400" />
          <div>
            <h2 className="text-xl font-semibold">5. Responsive Patterns</h2>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Use Hook:</h3>
            <code className="text-xs bg-gray-800 px-3 py-2 rounded block">
              <pre className="text-teal-400">{`const { isDesktop, isMobile, breakpoint } = useResponsive();`}</pre>
            </code>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Conditional Render:</h3>
            <code className="text-xs bg-gray-800 px-3 py-2 rounded block">
              <pre className="text-teal-400">{`{isDesktop && <DesktopComponent />}
{isMobile && <MobileComponent />}`}</pre>
            </code>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Tailwind Classes (Mobile-First):</h3>
            <code className="text-xs bg-gray-800 px-3 py-2 rounded block overflow-x-auto">
              <pre className="text-teal-400">{`className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"`}</pre>
            </code>
          </div>
        </div>
      </Card>

      {/* Z-Index System */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-400" />
          <div>
            <h2 className="text-xl font-semibold">6. Z-Index System</h2>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-3">
          Never hardcode z-index values
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {Object.entries(Z_INDEX).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-gray-400 bg-gray-800 px-2 py-1 rounded">
              <span className="text-teal-400">{key}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        
        <Separator className="my-3 bg-gray-700" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-400">✗</span>
            <code className="text-xs bg-gray-800 px-2 py-1 rounded">
              style=&#123;&#123; zIndex: 9999 &#125;&#125;
            </code>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✓</span>
            <code className="text-xs bg-gray-800 px-2 py-1 rounded">
              style=&#123;&#123; zIndex: Z_INDEX.modal &#125;&#125;
            </code>
          </div>
        </div>
      </Card>

      {/* Quick Import */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700">
        <h2 className="text-xl font-semibold mb-3">Quick Imports</h2>
        
        <div className="space-y-3 text-xs font-mono">
          <div className="bg-gray-800 p-3 rounded overflow-x-auto">
            <pre className="text-teal-400">{`// Navigation
import { navigationLinks } from '@/utils/navigation';
import { useNavigate } from 'react-router';`}</pre>
          </div>
          
          <div className="bg-gray-800 p-3 rounded overflow-x-auto">
            <pre className="text-teal-400">{`// Global Rules
import { 
  BREAKPOINTS, 
  Z_INDEX,
  isBreakpoint,
  validateRoute 
} from '@/utils/global-rules';`}</pre>
          </div>
          
          <div className="bg-gray-800 p-3 rounded overflow-x-auto">
            <pre className="text-teal-400">{`// Hooks
import { 
  useResponsive,
  useComingSoon,
  useScrollLock 
} from '@/hooks/useGlobalRules';`}</pre>
          </div>
          
          <div className="bg-gray-800 p-3 rounded overflow-x-auto">
            <pre className="text-teal-400">{`// Components
import { StandardModal, StandardDrawer } from '@/components/StandardModalDrawer';
import { ComingSoonOverlay } from '@/components/ComingSoonOverlay';`}</pre>
          </div>
          
          <div className="bg-gray-800 p-3 rounded overflow-x-auto">
            <pre className="text-teal-400">{`// Toast
import { toast } from 'sonner';
toast.success('Success message');`}</pre>
          </div>
        </div>
      </Card>

      {/* Testing Checklist */}
      <Card className="p-6 bg-[#1c1e26] border-gray-700 border-2 border-teal-500">
        <h2 className="text-xl font-semibold mb-3">Pre-PR Checklist</h2>
        <p className="text-sm text-gray-400 mb-4">
          Verify all items before submitting PR
        </p>
        
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>All navigation uses routes from navigation.ts</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>No dead clicks (all buttons do something)</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>Tested at xl (1280px) - full layout</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>Tested at md (768px) - drawer sidebar</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>Tested on mobile (&lt;768px) - bottom nav</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>No horizontal scroll (except carousels)</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>No double vertical scroll</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>ESC closes modals/drawers</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>All images have alt text</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input type="checkbox" className="mt-1" disabled />
            <span>Keyboard navigation works</span>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-6">
        <p>For full documentation, see <code className="text-teal-400">/GLOBAL_SYSTEM_RULES.md</code></p>
        <p className="mt-2">Version 1.0 • Last Updated: December 24, 2024</p>
      </div>
    </div>
  );
}
