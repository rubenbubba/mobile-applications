import type { Business } from '../types/Business';

// "Bakery in Leuven", or whatever part the owner filled in, or the website as a last resort.
export function describeBusiness(business: Business): string {
  if (business.category !== '' && business.city !== '') return `${business.category} in ${business.city}`;
  if (business.category !== '' || business.city !== '') return business.category || business.city;
  return business.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
