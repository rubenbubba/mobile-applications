import type { Business } from '../../types/Business';
import type { Area, ChangeTone, PerformanceData, SeoData } from '../../types/Monitoring';

// Every business here is fictional. The .example domains can never point to a real website.

export interface DemoReview {
  id: string;
  author: string;
  stars: number;
  text: string;
  daysAgo: number;
  replied: boolean;
}

export interface RatingSegment {
  count: number;
  fromDaysAgo: number;
  toDaysAgo: number;
  // Relative weights for 5, 4, 3, 2 and 1 stars.
  weights: [number, number, number, number, number];
}

export interface DemoDefinition {
  business: Business;
  seed: number;
  website: {
    isUp: boolean;
    statusCode: number;
    downForHours: number;
    responseTimeMs: number;
    httpsEnabled: boolean;
    certificateExpiresInDays: number;
    redirectsToHttps: boolean;
    mobileFriendly: boolean;
    uptimeDips: { daysAgo: number; uptimePercent: number }[];
  };
  seo: SeoData;
  performance: PerformanceData;
  reviews: {
    connected: boolean;
    segments: RatingSegment[];
    recent: DemoReview[];
  };
  // Where the numbers stood 11 weeks ago. The history drifts from here to today.
  past: {
    responseTimeMs: number;
    lcpSeconds: number;
    loadTimeSeconds: number;
    inpMs: number;
    cls: number;
    uptimePercent: number;
    pagesWithoutDescription: number;
  };
  changes: { id: string; daysAgo: number; tone: ChangeTone; title: string; area: Area }[];
}

const bakery: DemoDefinition = {
  business: {
    id: 'bakkerij-zonneveld',
    name: 'Bakkerij Zonneveld',
    category: 'Bakery',
    city: 'Leuven',
    websiteUrl: 'https://www.bakkerij-zonneveld.example',
  },
  seed: 1187,
  website: {
    isUp: true,
    statusCode: 200,
    downForHours: 0,
    responseTimeMs: 640,
    httpsEnabled: true,
    certificateExpiresInDays: 11,
    redirectsToHttps: true,
    mobileFriendly: true,
    uptimeDips: [
      { daysAgo: 12, uptimePercent: 98.6 },
      { daysAgo: 3, uptimePercent: 99.1 },
    ],
  },
  seo: {
    pages: [
      {
        path: '/',
        name: 'Homepage',
        title: 'Bakkerij Zonneveld | Artisan bread in Leuven',
        metaDescription: 'Fresh sourdough, pastries and celebration cakes, baked every morning in the centre of Leuven.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/brood',
        name: 'Our bread',
        title: 'Our bread | Bakkerij Zonneveld',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/taarten',
        name: 'Cakes and pastries',
        title: 'Cakes and pastries | Bakkerij Zonneveld',
        metaDescription: 'Order a celebration cake for birthdays, weddings and every other occasion.',
        h1Count: 2,
        headingsInOrder: true,
        indexable: false,
      },
      {
        path: '/bestellen',
        name: 'Order online',
        title: 'Order online | Bakkerij Zonneveld',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/openingsuren',
        name: 'Opening hours',
        title: 'Opening hours | Bakkerij Zonneveld',
        metaDescription: 'We are open Tuesday to Saturday from 7:00 and on Sunday morning until noon.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/contact',
        name: 'Contact',
        title: 'Contact | Bakkerij Zonneveld',
        metaDescription: 'Call us, email us or drop by the shop. Find our address and directions here.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
    ],
    brokenLinks: [
      { fromPath: '/contact', target: '/route-naar-de-winkel', statusCode: 404 },
      { fromPath: '/brood', target: '/seizoensbrood-2025', statusCode: 404 },
    ],
    hasSitemap: true,
    hasStructuredData: false,
  },
  performance: {
    loadTimeSeconds: 5.8,
    lcpSeconds: 4.4,
    inpMs: 240,
    cls: 0.14,
    weightParts: [
      { id: 'images', label: 'Images', sizeMb: 3.6 },
      { id: 'scripts', label: 'Scripts', sizeMb: 0.9 },
      { id: 'other', label: 'Other', sizeMb: 0.3 },
      { id: 'fonts', label: 'Fonts', sizeMb: 0.2 },
    ],
  },
  reviews: {
    connected: true,
    segments: [
      { count: 100, fromDaysAgo: 180, toDaysAgo: 900, weights: [62, 25, 8, 3, 2] },
      { count: 20, fromDaysAgo: 90, toDaysAgo: 180, weights: [68, 22, 6, 3, 1] },
      { count: 18, fromDaysAgo: 48, toDaysAgo: 90, weights: [38, 28, 16, 10, 8] },
    ],
    recent: [
      {
        id: 'bz-1',
        author: 'Marie L.',
        stars: 5,
        text: 'Best sourdough in Leuven. It was still warm when I picked it up on Saturday morning.',
        daysAgo: 2,
        replied: true,
      },
      {
        id: 'bz-2',
        author: 'Thomas V.',
        stars: 1,
        text: 'I ordered a birthday cake online and it was not ready when I came to pick it up. Nobody called me.',
        daysAgo: 4,
        replied: false,
      },
      {
        id: 'bz-3',
        author: 'Sofie D.',
        stars: 5,
        text: 'Friendly staff and a lovely pistachio cake. Everyone at the party asked where it came from.',
        daysAgo: 9,
        replied: true,
      },
      {
        id: 'bz-4',
        author: 'Karim B.',
        stars: 2,
        text: 'The website said you were open on Monday, but the shop was closed. Please update your hours.',
        daysAgo: 13,
        replied: false,
      },
      {
        id: 'bz-5',
        author: 'Elke P.',
        stars: 4,
        text: 'Great croissants. It can get busy on Sundays, so go early.',
        daysAgo: 20,
        replied: true,
      },
      {
        id: 'bz-6',
        author: 'Jan H.',
        stars: 5,
        text: 'We have been coming here for years and the quality never drops.',
        daysAgo: 27,
        replied: false,
      },
      {
        id: 'bz-7',
        author: 'An W.',
        stars: 3,
        text: 'Good bread, but the queue moved slowly and they had run out of what I wanted.',
        daysAgo: 38,
        replied: false,
      },
      {
        id: 'bz-8',
        author: 'Lotte G.',
        stars: 4,
        text: 'Lovely little shop with a nice selection of rolls.',
        daysAgo: 46,
        replied: true,
      },
    ],
  },
  past: {
    responseTimeMs: 520,
    lcpSeconds: 3.9,
    loadTimeSeconds: 5.1,
    inpMs: 210,
    cls: 0.12,
    uptimePercent: 99.9,
    pagesWithoutDescription: 2,
  },
  changes: [
    { id: 'bz-c1', daysAgo: 3, tone: 'bad', title: 'Website had a short outage', area: 'website' },
    { id: 'bz-c2', daysAgo: 6, tone: 'bad', title: 'Homepage got slower after new photos were added', area: 'performance' },
    { id: 'bz-c3', daysAgo: 18, tone: 'good', title: 'Two pages gained a description', area: 'seo' },
  ],
};

const physio: DemoDefinition = {
  business: {
    id: 'praktijk-lindenhof',
    name: 'Praktijk Lindenhof',
    category: 'Physiotherapy practice',
    city: 'Hasselt',
    websiteUrl: 'https://www.praktijk-lindenhof.example',
  },
  seed: 2311,
  website: {
    isUp: true,
    statusCode: 200,
    downForHours: 0,
    responseTimeMs: 240,
    httpsEnabled: true,
    certificateExpiresInDays: 72,
    redirectsToHttps: true,
    mobileFriendly: true,
    uptimeDips: [],
  },
  seo: {
    pages: [
      {
        path: '/',
        name: 'Homepage',
        title: 'Praktijk Lindenhof | Physiotherapy in Hasselt',
        metaDescription: 'Personal physiotherapy for back and neck pain, sports injuries and recovery after surgery.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/behandelingen',
        name: 'Treatments',
        title: 'Treatments | Praktijk Lindenhof',
        metaDescription: 'See how we treat back pain, sports injuries and rehabilitation after surgery.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/team',
        name: 'Our team',
        title: 'Our team | Praktijk Lindenhof',
        metaDescription: 'Meet the physiotherapists at Praktijk Lindenhof and find out what each of them specialises in.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/afspraak',
        name: 'Book an appointment',
        title: 'Book an appointment | Praktijk Lindenhof',
        metaDescription: 'Book online or call us. New patients can usually be seen within a week.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
    ],
    brokenLinks: [],
    hasSitemap: true,
    hasStructuredData: false,
  },
  performance: {
    loadTimeSeconds: 2.1,
    lcpSeconds: 1.9,
    cls: 0.03,
    weightParts: [
      { id: 'images', label: 'Images', sizeMb: 0.6 },
      { id: 'scripts', label: 'Scripts', sizeMb: 0.4 },
      { id: 'other', label: 'Other', sizeMb: 0.1 },
      { id: 'fonts', label: 'Fonts', sizeMb: 0.1 },
    ],
  },
  reviews: {
    connected: true,
    segments: [
      { count: 62, fromDaysAgo: 90, toDaysAgo: 900, weights: [82, 14, 3, 1, 0] },
      { count: 12, fromDaysAgo: 40, toDaysAgo: 90, weights: [85, 12, 3, 0, 0] },
    ],
    recent: [
      {
        id: 'pl-1',
        author: 'Greet M.',
        stars: 5,
        text: 'After six sessions my shoulder finally moves without pain. They really take the time to explain everything.',
        daysAgo: 5,
        replied: true,
      },
      {
        id: 'pl-2',
        author: 'Dries C.',
        stars: 5,
        text: 'I was back running within two months of my knee injury. Clear plan and very motivating.',
        daysAgo: 11,
        replied: true,
      },
      {
        id: 'pl-3',
        author: 'Nadia R.',
        stars: 4,
        text: 'Very professional. Parking nearby can be tricky, but the treatment is worth it.',
        daysAgo: 24,
        replied: true,
      },
      {
        id: 'pl-4',
        author: 'Wim S.',
        stars: 5,
        text: 'Easy to book online and always on time.',
        daysAgo: 33,
        replied: true,
      },
    ],
  },
  past: {
    responseTimeMs: 310,
    lcpSeconds: 2.3,
    loadTimeSeconds: 2.8,
    inpMs: 150,
    cls: 0.05,
    uptimePercent: 100,
    pagesWithoutDescription: 1,
  },
  changes: [
    { id: 'pl-c1', daysAgo: 8, tone: 'good', title: 'Homepage now loads 0.4 seconds faster', area: 'performance' },
    { id: 'pl-c2', daysAgo: 21, tone: 'good', title: 'All pages now have a description', area: 'seo' },
  ],
};

const bikeShop: DemoDefinition = {
  business: {
    id: 'fietsatelier-de-spaak',
    name: 'Fietsatelier De Spaak',
    category: 'Bike repair shop',
    city: 'Mechelen',
    websiteUrl: 'https://www.fietsatelier-de-spaak.example',
  },
  seed: 3407,
  website: {
    isUp: false,
    statusCode: 502,
    downForHours: 3,
    responseTimeMs: 1200,
    httpsEnabled: true,
    certificateExpiresInDays: 44,
    redirectsToHttps: false,
    mobileFriendly: false,
    uptimeDips: [
      { daysAgo: 0, uptimePercent: 87.5 },
      { daysAgo: 2, uptimePercent: 98.2 },
      { daysAgo: 9, uptimePercent: 96.4 },
      { daysAgo: 21, uptimePercent: 99 },
    ],
  },
  seo: {
    pages: [
      {
        path: '/',
        name: 'Homepage',
        title: 'Fietsatelier De Spaak',
        h1Count: 0,
        headingsInOrder: false,
        indexable: true,
      },
      {
        path: '/herstellingen',
        name: 'Repairs',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
      {
        path: '/prijzen',
        name: 'Prices',
        h1Count: 1,
        headingsInOrder: false,
        indexable: true,
      },
      {
        path: '/contact',
        name: 'Contact',
        title: 'Contact',
        metaDescription: 'Find our workshop in Mechelen or call us to book a repair.',
        h1Count: 1,
        headingsInOrder: true,
        indexable: true,
      },
    ],
    brokenLinks: [{ fromPath: '/prijzen', target: '/tarieven-2023.pdf', statusCode: 404 }],
    hasSitemap: false,
    hasStructuredData: false,
  },
  performance: {
    loadTimeSeconds: 7.2,
    lcpSeconds: 5.2,
    inpMs: 420,
    cls: 0.3,
    weightParts: [
      { id: 'images', label: 'Images', sizeMb: 4.8 },
      { id: 'scripts', label: 'Scripts', sizeMb: 1.6 },
      { id: 'other', label: 'Other', sizeMb: 0.4 },
      { id: 'fonts', label: 'Fonts', sizeMb: 0.3 },
    ],
  },
  reviews: {
    connected: false,
    segments: [
      { count: 30, fromDaysAgo: 60, toDaysAgo: 700, weights: [45, 30, 12, 8, 5] },
      { count: 8, fromDaysAgo: 25, toDaysAgo: 60, weights: [40, 30, 15, 10, 5] },
    ],
    recent: [
      {
        id: 'ds-1',
        author: 'Bram T.',
        stars: 5,
        text: 'My gears work like new. Fast and fairly priced.',
        daysAgo: 6,
        replied: false,
      },
      {
        id: 'ds-2',
        author: 'Inge F.',
        stars: 2,
        text: 'I wanted to check your prices but the website would not load, and nobody answered the phone.',
        daysAgo: 10,
        replied: false,
      },
      {
        id: 'ds-3',
        author: 'Yusuf A.',
        stars: 4,
        text: 'Knows his bikes. It took a few days longer than promised.',
        daysAgo: 22,
        replied: false,
      },
    ],
  },
  past: {
    responseTimeMs: 950,
    lcpSeconds: 4.6,
    loadTimeSeconds: 6.4,
    inpMs: 380,
    cls: 0.24,
    uptimePercent: 99.2,
    pagesWithoutDescription: 3,
  },
  changes: [
    { id: 'ds-c1', daysAgo: 0, tone: 'bad', title: 'Website stopped responding', area: 'website' },
    { id: 'ds-c2', daysAgo: 2, tone: 'bad', title: 'Website had a short outage', area: 'website' },
    { id: 'ds-c3', daysAgo: 9, tone: 'bad', title: 'Website was unreachable for almost an hour', area: 'website' },
  ],
};

export const DEMO_DEFINITIONS: DemoDefinition[] = [bakery, physio, bikeShop];
export const DEFAULT_BUSINESS_ID = bakery.business.id;
