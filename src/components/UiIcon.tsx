import React from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  Clock,
  CloudRain,
  Code,
  Coffee,
  Droplets,
  Flame,
  Gift,
  HeartHandshake,
  Home,
  Leaf,
  List,
  Moon,
  Rocket,
  Sparkles,
  Sun,
  Sunrise,
  Trees,
  Trophy,
  VolumeX,
  Waves,
  Zap,
} from 'lucide-react';

export type IconKey =
  | 'droplets'
  | 'brain'
  | 'book-open'
  | 'sparkles'
  | 'leaf'
  | 'flame'
  | 'rocket'
  | 'award'
  | 'gift'
  | 'trophy'
  | 'cloud-rain'
  | 'coffee'
  | 'trees'
  | 'waves'
  | 'activity'
  | 'clock'
  | 'volume-x'
  | 'sunrise'
  | 'sun'
  | 'moon'
  | 'zap'
  | 'briefcase'
  | 'code'
  | 'home'
  | 'list'
  | 'calendar'
  | 'heart';

interface UiIconProps {
  name: string;
  className?: string;
}

/**
 * Taste Skill Compliant Icon Renderer:
 * Strictly renders single-weight 1.75px stroke SVG primitives instead of raw emojis.
 */
export const UiIcon: React.FC<UiIconProps> = ({ name, className = 'w-4 h-4' }) => {
  const strokeWidth = 1.75;
  switch (name) {
    case 'droplets':
      return <Droplets className={className} strokeWidth={strokeWidth} />;
    case 'brain':
      return <Brain className={className} strokeWidth={strokeWidth} />;
    case 'book-open':
      return <BookOpen className={className} strokeWidth={strokeWidth} />;
    case 'sparkles':
      return <Sparkles className={className} strokeWidth={strokeWidth} />;
    case 'leaf':
      return <Leaf className={className} strokeWidth={strokeWidth} />;
    case 'flame':
      return <Flame className={className} strokeWidth={strokeWidth} />;
    case 'rocket':
      return <Rocket className={className} strokeWidth={strokeWidth} />;
    case 'award':
      return <Award className={className} strokeWidth={strokeWidth} />;
    case 'gift':
      return <Gift className={className} strokeWidth={strokeWidth} />;
    case 'trophy':
      return <Trophy className={className} strokeWidth={strokeWidth} />;
    case 'cloud-rain':
      return <CloudRain className={className} strokeWidth={strokeWidth} />;
    case 'coffee':
      return <Coffee className={className} strokeWidth={strokeWidth} />;
    case 'trees':
      return <Trees className={className} strokeWidth={strokeWidth} />;
    case 'waves':
      return <Waves className={className} strokeWidth={strokeWidth} />;
    case 'activity':
      return <Activity className={className} strokeWidth={strokeWidth} />;
    case 'clock':
      return <Clock className={className} strokeWidth={strokeWidth} />;
    case 'volume-x':
      return <VolumeX className={className} strokeWidth={strokeWidth} />;
    case 'sunrise':
      return <Sunrise className={className} strokeWidth={strokeWidth} />;
    case 'sun':
      return <Sun className={className} strokeWidth={strokeWidth} />;
    case 'moon':
      return <Moon className={className} strokeWidth={strokeWidth} />;
    case 'zap':
      return <Zap className={className} strokeWidth={strokeWidth} />;
    case 'briefcase':
      return <Briefcase className={className} strokeWidth={strokeWidth} />;
    case 'code':
      return <Code className={className} strokeWidth={strokeWidth} />;
    case 'home':
      return <Home className={className} strokeWidth={strokeWidth} />;
    case 'calendar':
      return <Calendar className={className} strokeWidth={strokeWidth} />;
    case 'heart':
      return <HeartHandshake className={className} strokeWidth={strokeWidth} />;
    default:
      return <List className={className} strokeWidth={strokeWidth} />;
  }
};

export const HABIT_ICON_KEYS: { key: IconKey; label: string }[] = [
  { key: 'flame', label: 'Flame' },
  { key: 'droplets', label: 'Hydration' },
  { key: 'brain', label: 'Deep Work' },
  { key: 'book-open', label: 'Reading' },
  { key: 'sparkles', label: 'Mindfulness' },
  { key: 'leaf', label: 'Wellness' },
  { key: 'zap', label: 'Energy' },
  { key: 'heart', label: 'Health' },
];

export const COUNTDOWN_ICON_KEYS: { key: IconKey; label: string }[] = [
  { key: 'rocket', label: 'Launch' },
  { key: 'award', label: 'Milestone' },
  { key: 'gift', label: 'Celebration' },
  { key: 'trophy', label: 'Achievement' },
  { key: 'calendar', label: 'Deadline' },
  { key: 'briefcase', label: 'Release' },
];

