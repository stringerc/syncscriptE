import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Palette, 
  Type, 
  Layout, 
  Check,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Zap
} from 'lucide-react';

interface ThemeSettings {
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  layoutDensity: 'compact' | 'normal' | 'comfortable';
  darkMode: 'light' | 'dark' | 'system';
}

const colorPresets = [
  { id: 'purple', name: 'Purple', color: 'rgb(168 85 247)', gradient: 'linear-gradient(to right, rgb(168 85 247), rgb(236 72 153))' },
  { id: 'blue', name: 'Blue', color: 'rgb(59 130 246)', gradient: 'linear-gradient(to right, rgb(59 130 246), rgb(6 182 212))' },
  { id: 'green', name: 'Green', color: 'rgb(34 197 94)', gradient: 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))' },
  { id: 'orange', name: 'Orange', color: 'rgb(249 115 22)', gradient: 'linear-gradient(to right, rgb(249 115 22), rgb(239 68 68))' },
  { id: 'pink', name: 'Pink', color: 'rgb(236 72 153)', gradient: 'linear-gradient(to right, rgb(236 72 153), rgb(244 63 94))' },
  { id: 'indigo', name: 'Indigo', color: 'rgb(99 102 241)', gradient: 'linear-gradient(to right, rgb(99 102 241), rgb(139 92 246))' },
];

const fontSizes = [
  { id: 'small', name: 'Small', description: 'Compact text', preview: 'text-sm' },
  { id: 'medium', name: 'Medium', description: 'Default size', preview: 'text-base' },
  { id: 'large', name: 'Large', description: 'Easy to read', preview: 'text-lg' },
];

const layoutDensities = [
  { id: 'compact', name: 'Compact', description: 'More content, less space', spacing: 'p-2', icon: Layout },
  { id: 'normal', name: 'Normal', description: 'Balanced spacing', spacing: 'p-4', icon: Layout },
  { id: 'comfortable', name: 'Comfortable', description: 'More breathing room', spacing: 'p-6', icon: Layout },
];

const darkModes = [
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'system', name: 'System', icon: Monitor },
];

export function ThemeCustomizer() {
  const { toast } = useToast();
  const { settings: globalSettings, updateSettings: updateGlobalSettings, resetSettings: resetGlobalSettings } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>(globalSettings);
  const [selectedColorId, setSelectedColorId] = useState(() => {
    // Find which color preset matches the current primary color
    const preset = colorPresets.find(p => p.gradient === globalSettings.primaryColor);
    return preset?.id || 'purple';
  });
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sync with global settings when they change
  useEffect(() => {
    setSettings(globalSettings);
    const preset = colorPresets.find(p => p.gradient === globalSettings.primaryColor);
    if (preset) {
      setSelectedColorId(preset.id);
    }
  }, [globalSettings]);

  const handleColorChange = (preset: typeof colorPresets[0]) => {
    setSettings(prev => ({ ...prev, primaryColor: preset.gradient }));
    setSelectedColorId(preset.id);
    setHasChanges(true);
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({ ...prev, fontSize: size }));
    setHasChanges(true);
  };

  const handleDensityChange = (density: 'compact' | 'normal' | 'comfortable') => {
    setSettings(prev => ({ ...prev, layoutDensity: density }));
    setHasChanges(true);
  };

  const handleDarkModeChange = (mode: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, darkMode: mode }));
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('💾 Saving theme settings:', settings);
    
    // Apply to global theme context (which saves to localStorage and applies to DOM)
    updateGlobalSettings(settings);
    
    toast({
      title: '✨ Theme Saved!',
      description: 'Your personalized theme has been applied',
      duration: 3000,
    });
    
    // TODO: Save to backend when connected
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset global theme
    resetGlobalSettings();
    
    // Reset local state
    setSettings({
      primaryColor: colorPresets[0].gradient,
      fontSize: 'medium',
      layoutDensity: 'normal',
      darkMode: 'light',
    });
    setSelectedColorId('purple');
    setHasChanges(false);
    
    toast({
      title: '🔄 Theme Reset',
      description: 'Restored default theme settings',
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Customizer Card */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Palette className="w-5 h-5 text-purple-600" />
                Theme Customization
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium mt-1">
                Personalize your SyncScript experience
              </CardDescription>
            </div>
            {hasChanges && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-300 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                Changes Pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Primary Color */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Primary Color</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleColorChange(preset)}
                  className={`relative p-4 rounded-xl transition-all ${
                    selectedColorId === preset.id
                      ? 'ring-4 ring-purple-300 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundImage: preset.gradient }}
                >
                  {selectedColorId === preset.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  )}
                  <div className="text-xs text-white font-semibold mt-8">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Font Size</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {fontSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => handleFontSizeChange(size.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    settings.fontSize === size.id
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className={`font-semibold mb-1 ${size.preview}`}>
                    {size.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {size.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Density */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Layout Density</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {layoutDensities.map((density) => {
                const Icon = density.icon;
                return (
                  <button
                    key={density.id}
                    onClick={() => handleDensityChange(density.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      settings.layoutDensity === density.id
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${
                      settings.layoutDensity === density.id ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div className="font-semibold text-sm mb-1">
                      {density.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {density.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Appearance</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {darkModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleDarkModeChange(mode.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.darkMode === mode.id
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 mx-auto ${
                      settings.darkMode === mode.id ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-semibold text-center">
                      {mode.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              disabled={!hasChanges}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 text-white"
              style={{ backgroundImage: settings.primaryColor }}
              disabled={!hasChanges}
            >
              <Check className="w-4 h-4 mr-2" />
              Save Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Card */}
      <Card className="border-none shadow-xl">
        <CardHeader 
          className="rounded-t-lg"
          style={{ backgroundImage: settings.primaryColor }}
        >
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5" />
            Live Preview
          </CardTitle>
          <CardDescription className="text-white/90 font-medium">
            See your theme in action
          </CardDescription>
        </CardHeader>
        <CardContent className={`${
          settings.layoutDensity === 'compact' ? 'p-4' :
          settings.layoutDensity === 'normal' ? 'p-6' :
          'p-8'
        }`}>
          <div className={`space-y-${
            settings.layoutDensity === 'compact' ? '2' :
            settings.layoutDensity === 'normal' ? '4' :
            '6'
          }`}>
            {/* Sample Content */}
            <div className={`${
              settings.fontSize === 'small' ? 'text-sm' :
              settings.fontSize === 'medium' ? 'text-base' :
              'text-lg'
            }`}>
              <h4 className="font-bold text-gray-900 mb-2">Sample Content</h4>
              <p className="text-gray-700 mb-4">
                This is how your text will look with the selected font size and layout density. 
                The spacing and readability adjust based on your preferences.
              </p>
              
              {/* Sample Button */}
              <Button
                className="text-white"
                style={{ backgroundImage: settings.primaryColor }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Sample Button
              </Button>
            </div>

            {/* Sample Card */}
            <div 
              className={`rounded-lg border-2 ${
                settings.layoutDensity === 'compact' ? 'p-3' :
                settings.layoutDensity === 'normal' ? 'p-4' :
                'p-6'
              }`}
              style={{ borderColor: colorPresets.find(c => c.id === selectedColorId)?.color }}
            >
              <div className={`${
                settings.fontSize === 'small' ? 'text-sm' :
                settings.fontSize === 'medium' ? 'text-base' :
                'text-lg'
              }`}>
                <div className="font-semibold text-gray-900 mb-1">Sample Card</div>
                <div className="text-gray-600">
                  This card demonstrates your layout density preference.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

