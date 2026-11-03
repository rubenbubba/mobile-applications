import type { Href } from 'expo-router';
import type { IoniconsName } from '@/components/primitives';
import type { Area } from '@/types/Monitoring';

interface AreaMeta {
  label: string;
  icon: IoniconsName;
  href: Href;
}

export const AREA_META: Record<Area, AreaMeta> = {
  website: { label: 'Website', icon: 'globe-outline', href: '/website' },
  reviews: { label: 'Reviews', icon: 'star-outline', href: '/reviews' },
  seo: { label: 'Found on Google', icon: 'search-outline', href: '/seo' },
  performance: { label: 'Speed', icon: 'speedometer-outline', href: '/performance' },
};

export const AREA_ORDER: Area[] = ['website', 'reviews', 'seo', 'performance'];
