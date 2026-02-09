/**
 * Location Settings Component
 * 
 * Allows users to customize their favorite locations
 * Accessible from user settings/preferences
 */

import { useState, useEffect } from 'react';
import { MapPin, Star, Trash2, Plus, Home, Briefcase, Dumbbell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';

interface FavoriteLocation {
  id: string;
  name: string;
  type: 'favorite';
}

export function LocationSettings() {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('syncscript_favorite_locations');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        // Default favorites
        const defaults = [
          { id: 'fav-1', name: 'Home', type: 'favorite' as const },
          { id: 'fav-2', name: 'Work', type: 'favorite' as const },
          { id: 'fav-3', name: 'Gym', type: 'favorite' as const },
        ];
        setFavorites(defaults);
        saveFavorites(defaults);
      }
    } else {
      // Set defaults
      const defaults = [
        { id: 'fav-1', name: 'Home', type: 'favorite' as const },
        { id: 'fav-2', name: 'Work', type: 'favorite' as const },
        { id: 'fav-3', name: 'Gym', type: 'favorite' as const },
      ];
      setFavorites(defaults);
      saveFavorites(defaults);
    }
  };

  const saveFavorites = (favs: FavoriteLocation[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('syncscript_favorite_locations', JSON.stringify(favs));
  };

  const handleAddFavorite = () => {
    if (!newLocationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    if (favorites.length >= 6) {
      toast.error('Maximum 6 favorite locations allowed');
      return;
    }

    const newFav: FavoriteLocation = {
      id: `fav-${Date.now()}`,
      name: newLocationName.trim(),
      type: 'favorite',
    };

    const updated = [...favorites, newFav];
    setFavorites(updated);
    saveFavorites(updated);
    setNewLocationName('');
    
    toast.success('Favorite location added!');
  };

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
    toast.success('Favorite location removed');
  };

  const handleUpdateFavorite = (id: string, newName: string) => {
    const updated = favorites.map(f => 
      f.id === id ? { ...f, name: newName } : f
    );
    setFavorites(updated);
    saveFavorites(updated);
  };

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('home')) return <Home className="w-4 h-4 text-teal-400" />;
    if (lower.includes('work') || lower.includes('office')) return <Briefcase className="w-4 h-4 text-teal-400" />;
    if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className="w-4 h-4 text-teal-400" />;
    return <MapPin className="w-4 h-4 text-teal-400" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-teal-400" />
          Favorite Locations
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Quick-access locations for tasks, goals, and events
        </p>
      </div>

      {/* Favorite Locations List */}
      <div className="space-y-2">
        {favorites.map(fav => (
          <div 
            key={fav.id}
            className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {getIcon(fav.name)}
            <Input
              value={fav.name}
              onChange={(e) => handleUpdateFavorite(fav.id, e.target.value)}
              className="flex-1 bg-transparent border-none text-white focus:ring-0 focus:outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFavorite(fav.id)}
              className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Favorite */}
      {favorites.length < 6 && (
        <div className="space-y-2">
          <Label className="text-gray-300">Add Favorite Location</Label>
          <div className="flex gap-2">
            <Input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFavorite()}
              placeholder="e.g., Coffee Shop, Park, Library"
              className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleAddFavorite}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            {6 - favorites.length} favorite slots remaining
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-teal-600/10 border border-teal-600/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Star className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-white mb-1">Quick Tips:</p>
            <ul className="space-y-1 text-gray-400">
              <li>• Favorite locations appear at the top of location searches</li>
              <li>• Edit names by clicking on them</li>
              <li>• Up to 6 favorites allowed for optimal performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
