import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PRICING_API_PATH } from '../constants/pricing.constants';
import { PricingItem, SavePricingRequest } from '../models/pricing.model';

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly api = inject(ApiService);

  getAll(): Observable<PricingItem[]> {
    return this.api.get<PricingItem[]>(PRICING_API_PATH);
  }

  getById(id: string): Observable<PricingItem> {
    return this.api.get<PricingItem>(`${PRICING_API_PATH}/${encodeURIComponent(id)}`);
  }

  create(request: SavePricingRequest): Observable<PricingItem> {
    return this.api.post<PricingItem>(PRICING_API_PATH, request);
  }

  update(id: string, request: SavePricingRequest): Observable<PricingItem> {
    return this.api.put<PricingItem>(`${PRICING_API_PATH}/${encodeURIComponent(id)}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${PRICING_API_PATH}/${encodeURIComponent(id)}`);
  }
}
