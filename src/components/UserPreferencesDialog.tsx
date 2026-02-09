import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useUserPreferences } from '../utils/user-preferences';
import { toast } from 'sonner@2.0.3';
import { 
  Sparkles, Zap, Clock, Settings, Save, RotateCcw,
  Sun, Moon, Sunrise, Sunset
} from 'lucide-react';

interface UserPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPreferencesDialog({ open, onOpenChange }: UserPreferencesDialogProps) {
  const { preferences, updatePreferences, resetPreferences } = useUserPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    updatePreferences(localPrefs);
    toast.success('Preferences Saved!', {
      description: 'Your resonance profile has been updated'
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    resetPreferences();
    setLocalPrefs(preferences);
    toast.info('Preferences Reset', {
      description: 'Back to default settings'
    });
  };

  const energyIcons = {
    morning: Sunrise,
    afternoon: Sun,
    evening: Sunset,
    night: Moon
  };

  const EnergyIcon = energyIcons[localPrefs.peakEnergyTime];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1c20] border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-400" />
            Your Resonance Profile
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Tell us about your work style so we can tune scripts to your unique rhythm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Energy & Timing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <EnergyIcon className="w-5 h-5 text-amber-400" />
              <h3 className="text-white">Energy & Timing</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-gray-300">When is your peak energy?</Label>
                <Select
                  value={localPrefs.peakEnergyTime}
                  onValueChange={(value: any) => 
                    setLocalPrefs({ ...localPrefs, peakEnergyTime: value })
                  }
                >
                  <SelectTrigger className="bg-[#1e2128] border-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1c20] border-gray-800">
                    <SelectItem value="morning">🌅 Morning (6AM - 11AM)</SelectItem>
                    <SelectItem value="afternoon">☀️ Afternoon (12PM - 5PM)</SelectItem>
                    <SelectItem value="evening">🌆 Evening (6PM - 9PM)</SelectItem>
                    <SelectItem value="night">🌙 Night (10PM - 5AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Preferred Start Time</Label>
                  <Select
                    value={localPrefs.preferredStartTime}
                    onValueChange={(value) => 
                      setLocalPrefs({ ...localPrefs, preferredStartTime: value })
                    }
                  >
                    <SelectTrigger className="bg-[#1e2128] border-gray-800 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1c20] border-gray-800">
                      {['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM'].map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Preferred End Time</Label>
                  <Select
                    value={localPrefs.preferredEndTime}
                    onValueChange={(value) => 
                      setLocalPrefs({ ...localPrefs, preferredEndTime: value })
                    }
                  >
                    <SelectTrigger className="bg-[#1e2128] border-gray-800 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1c20] border-gray-800">
                      {['4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Work Style */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="text-white">Work Style</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Task Completion Speed</Label>
                  <Badge variant="outline" className="text-white">
                    {localPrefs.taskCompletionSpeed < 0.8 && 'Thoughtful'}
                    {localPrefs.taskCompletionSpeed >= 0.8 && localPrefs.taskCompletionSpeed <= 1.2 && 'Average'}
                    {localPrefs.taskCompletionSpeed > 1.2 && 'Fast'}
                  </Badge>
                </div>
                <Slider
                  value={[localPrefs.taskCompletionSpeed]}
                  onValueChange={([value]) => 
                    setLocalPrefs({ ...localPrefs, taskCompletionSpeed: value })
                  }
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Slower</span>
                  <span>Faster</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Break Duration (min)</Label>
                  <Select
                    value={localPrefs.breakDuration.toString()}
                    onValueChange={(value) => 
                      setLocalPrefs({ ...localPrefs, breakDuration: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-[#1e2128] border-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1c20] border-gray-800">
                      {[5, 10, 15, 20, 30].map(min => (
                        <SelectItem key={min} value={min.toString()}>{min} minutes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Focus Session (min)</Label>
                  <Select
                    value={localPrefs.focusSessionDuration.toString()}
                    onValueChange={(value) => 
                      setLocalPrefs({ ...localPrefs, focusSessionDuration: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-[#1e2128] border-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1c20] border-gray-800">
                      {[45, 60, 90, 120].map(min => (
                        <SelectItem key={min} value={min.toString()}>{min} minutes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-300">Prefer longer breaks</Label>
                  <p className="text-sm text-gray-500">Extended rest improves your focus</p>
                </div>
                <Switch
                  checked={localPrefs.prefersLongerBreaks}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, prefersLongerBreaks: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white">Preferences</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Complexity Preference</Label>
                <Select
                  value={localPrefs.complexityPreference}
                  onValueChange={(value: any) => 
                    setLocalPrefs({ ...localPrefs, complexityPreference: value })
                  }
                >
                  <SelectTrigger className="bg-[#1e2128] border-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1c20] border-gray-800">
                    <SelectItem value="simple">Simple - Quick wins</SelectItem>
                    <SelectItem value="moderate">Moderate - Balanced</SelectItem>
                    <SelectItem value="complex">Complex - Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-300">Enable Resonance Adaptation</Label>
                  <p className="text-sm text-gray-500">Auto-tune scripts to your rhythm</p>
                </div>
                <Switch
                  checked={localPrefs.enableResonanceAdaptation}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, enableResonanceAdaptation: checked })
                  }
                />
              </div>

              {localPrefs.enableResonanceAdaptation && (
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Adaptation Intensity</Label>
                  <Select
                    value={localPrefs.adaptationIntensity}
                    onValueChange={(value: any) => 
                      setLocalPrefs({ ...localPrefs, adaptationIntensity: value })
                    }
                  >
                    <SelectTrigger className="bg-[#1e2128] border-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1c20] border-gray-800">
                      <SelectItem value="minimal">Minimal - Light touches</SelectItem>
                      <SelectItem value="moderate">Moderate - Balanced</SelectItem>
                      <SelectItem value="full">Full - Maximum personalization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm mb-1">Your Resonance Profile is Active</p>
                <p className="text-gray-400 text-xs">
                  These preferences will be used to personalize scripts and templates when you choose "Adapt to My Resonance"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-teal-600 to-blue-600"
            onClick={handleSave}
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
