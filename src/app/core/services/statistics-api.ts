import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Statistic } from '../models';

@Injectable({ providedIn: 'root' })
export class StatisticsApi {
  private readonly url = `${environment.apiUrl}/statistics`;

  statisticsResource() {
    return httpResource<Statistic[]>(() => this.url, { defaultValue: [] });
  }
}
