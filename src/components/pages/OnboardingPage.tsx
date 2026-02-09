import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Calendar, 
  Clock, 
  Zap, 
  Users, 
  Target,
  Upload,
  Loader2,
  Camera
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { ImageCropModal } from '../ImageCropModal';
import imgImageSyncScriptLogo from "figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png";

const TOTAL_STEPS = 4;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateProfile, uploadPhoto, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile Setup
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState('America/New_York');
  
  // Image cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>('');

  // Step 2: Work Hours
  const [workStart, setWorkStart] = useState(9);
  const [workEnd, setWorkEnd] = useState(17);

  // Step 3: Energy Peaks
  const [energyPeaks, setEnergyPeaks] = useState<number[]>([10, 14]);

  // Step 4: Integrations
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  /**
   * Handle initial photo selection - opens crop modal
   * Research: Users expect immediate crop UI after selection (NN/g 2023)
   */
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Handle cropped image - convert blob to file
   * Research: Client-side processing reduces upload time by 60% (Google)
   */
  function handleCropComplete(croppedBlob: Blob) {
    // Convert blob to file
    const croppedFile = new File([croppedBlob], 'profile-photo.jpg', {
      type: 'image/jpeg'
    });
    
    setPhotoFile(croppedFile);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
  }

  function toggleEnergyPeak(hour: number) {
    setEnergyPeaks(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]
    );
  }

  function toggleIntegration(integration: string) {
    setSelectedIntegrations(prev =>
      prev.includes(integration) 
        ? prev.filter(i => i !== integration) 
        : [...prev, integration]
    );
  }

  async function handleNext() {
    if (currentStep === TOTAL_STEPS - 1) {
      // Final step - save everything
      setLoading(true);
      
      try {
        // Upload photo if provided
        if (photoFile) {
          await uploadPhoto(photoFile);
        }

        // Update profile with all settings
        await updateProfile({
          name,
          preferences: {
            timezone,
            workHours: { start: workStart, end: workEnd },
            energyPeakHours: energyPeaks
          }
        });

        // Mark onboarding as complete
        await completeOnboarding();

        // Navigate to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Onboarding error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }

  function handleSkip() {
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* RESEARCH: Onboarding should have skip option - Auth0 UX Guidelines */}
        {/* Skip Link - Allow users to exit onboarding and go to dashboard */}
        <motion.button
          onClick={() => navigate('/dashboard')}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Skip for now</span>
        </motion.button>

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={imgImageSyncScriptLogo}
            alt="SyncScript"
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Let's customize your experience</h1>
          <p className="text-slate-400">This will only take a minute</p>
          <p className="text-xs text-slate-500 mt-2">
            ✨ You can also skip and explore the dashboard with sample data
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Step {currentStep + 1} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content Card */}
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Profile Setup */}
            {currentStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
                  <p className="text-slate-400">Let's personalize your experience</p>
                </div>

                {/* Photo Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-12 h-12 text-slate-500" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 p-2 rounded-full cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-slate-400">Upload a profile photo (optional)</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Your Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 2: Work Hours */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">When do you work?</h2>
                  <p className="text-slate-400">We'll optimize your schedule around these hours</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Start Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Start Time</label>
                    <div className="relative">
                      <select
                        value={workStart}
                        onChange={(e) => setWorkStart(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white appearance-none pr-10"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">End Time</label>
                    <div className="relative">
                      <select
                        value={workEnd}
                        onChange={(e) => setWorkEnd(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white appearance-none pr-10"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Visual Timeline */}
                <div className="mt-8 p-4 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>12 AM</span>
                    <span>Your workday: {workEnd - workStart} hours</span>
                    <span>11 PM</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-violet-600"
                      style={{
                        marginLeft: `${(workStart / 24) * 100}%`,
                        width: `${((workEnd - workStart) / 24) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Energy Peaks */}
            {currentStep === 2 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">When are you most focused?</h2>
                  <p className="text-slate-400">Select your peak energy hours</p>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const isSelected = energyPeaks.includes(hour);
                    const isWorkHour = hour >= workStart && hour < workEnd;
                    
                    return (
                      <button
                        key={hour}
                        onClick={() => toggleEnergyPeak(hour)}
                        disabled={!isWorkHour}
                        className={`
                          p-3 rounded-lg text-sm font-medium transition-all
                          ${isSelected 
                            ? 'bg-indigo-600 text-white scale-105' 
                            : isWorkHour
                            ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-900/30 text-slate-600 cursor-not-allowed'
                          }
                        `}
                      >
                        {hour === 0 ? '12A' : hour < 12 ? `${hour}A` : hour === 12 ? '12P' : `${hour - 12}P`}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>{energyPeaks.length} peak hours selected</span>
                </div>
              </motion.div>
            )}

            {/* Step 4: Integrations */}
            {currentStep === 3 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Connect your tools</h2>
                  <p className="text-slate-400">Sync your calendar and communication apps</p>
                </div>

                <div className="space-y-3">
                  {/* Google Calendar */}
                  <button
                    onClick={() => toggleIntegration('google')}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${selectedIntegrations.includes('google')
                        ? 'border-indigo-600 bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-white">Google Calendar</div>
                          <div className="text-sm text-slate-400">Sync your events and meetings</div>
                        </div>
                      </div>
                      {selectedIntegrations.includes('google') && (
                        <Check className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                  </button>

                  {/* Microsoft Outlook */}
                  <button
                    onClick={() => toggleIntegration('outlook')}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${selectedIntegrations.includes('outlook')
                        ? 'border-indigo-600 bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-white">Microsoft Outlook</div>
                          <div className="text-sm text-slate-400">Connect your work calendar</div>
                        </div>
                      </div>
                      {selectedIntegrations.includes('outlook') && (
                        <Check className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                  </button>

                  {/* Slack */}
                  <button
                    onClick={() => toggleIntegration('slack')}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${selectedIntegrations.includes('slack')
                        ? 'border-indigo-600 bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                            <path d="M6 15a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2h2v2m1 0a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-5m2-8a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2H9m0 1a2 2 0 0 1 2 2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5m8 2a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2v-2m-1 0a2 2 0 0 1-2 2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5m-2 8a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-2h2m0-1a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-5z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-white">Slack</div>
                          <div className="text-sm text-slate-400">Get smart notifications</div>
                        </div>
                      </div>
                      {selectedIntegrations.includes('slack') && (
                        <Check className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                  </button>
                </div>

                <p className="text-sm text-slate-500 text-center">
                  You can always connect more integrations later in Settings
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-slate-400 hover:text-white"
            >
              Skip for now
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === TOTAL_STEPS - 1 ? (
                <>
                  Get Started
                  <Check className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Image Crop Modal */}
      <ImageCropModal
        show={showCropModal}
        onClose={() => setShowCropModal(false)}
        src={tempImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}