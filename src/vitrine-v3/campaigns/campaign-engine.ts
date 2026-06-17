import { CAMPAIGNS_DATA, WeeklyCampaign } from './campaign-data';
import { PRODUCTS_V3, VitrineV3Product } from '../data/products';

// Retrieve active campaign index or configure based on user selected ID
export function getActiveCampaign(campaignId?: string): WeeklyCampaign {
  if (campaignId) {
    const found = CAMPAIGNS_DATA.find(c => c.id === campaignId);
    if (found) return found;
  }
  // Default is the first Campaign
  return CAMPAIGNS_DATA[0];
}

// Get Products of the current campaign
export function getCampaignProducts(campaign: WeeklyCampaign): VitrineV3Product[] {
  return PRODUCTS_V3.filter(p => campaign.productIds.includes(p.id));
}

// Get the Highlight product
export function getHighlightProduct(campaign: WeeklyCampaign): VitrineV3Product | undefined {
  return PRODUCTS_V3.find(p => p.id === campaign.highlightProductId);
}

// Calculated timer logic (persists countdown end date in localStorage so it doesn't reset on refresh)
export function getCampaignEndDate(campaignId: string, daysDefault: number): Date {
  const storageKey = `vt3_campaign_end_${campaignId}`;
  const saved = localStorage.getItem(storageKey);
  
  if (saved) {
    const dateOutput = new Date(saved);
    // If the saved date has already passed, we reset it to tomorrow for premium user-experience simulation, or keep it.
    if (dateOutput.getTime() > Date.now()) {
      return dateOutput;
    }
  }

  // Create new end date
  const newEnd = new Date();
  newEnd.setHours(newEnd.getHours() + (daysDefault * 24));
  localStorage.setItem(storageKey, newEnd.toISOString());
  return newEnd;
}
