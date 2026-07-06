import { SiteSettings } from "../types";

export const getPublicAtelierImage = (
  settings: SiteSettings | undefined
): string | undefined => {
  // STRICT RULE: Only isotipo is allowed for public UI.
  return settings?.store_isotipo;
};
