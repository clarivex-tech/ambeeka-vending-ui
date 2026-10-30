export interface PricingItem {
  id: string;
  systemProductId: string;
  systemProductName: string;
  vendPrice: number;
  productName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavePricingRequest {
  systemProductId: string;
  systemProductName: string;
  vendPrice: number;
  productName: string;
}
