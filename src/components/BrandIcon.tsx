import React from 'react';
import { 
  Camera, Aperture, Sparkles, Film, Crown, 
  Eye, Sun, Palette, Compass, Layers, Flame, Heart 
} from 'lucide-react';
import { BrandIconName } from '../types';

interface BrandIconProps {
  name: BrandIconName;
  className?: string;
}

export const BrandIcon: React.FC<BrandIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Aperture':
      return <Aperture className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Film':
      return <Film className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Eye':
      return <Eye className={className} />;
    case 'Sun':
      return <Sun className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Camera':
    default:
      return <Camera className={className} />;
  }
};
