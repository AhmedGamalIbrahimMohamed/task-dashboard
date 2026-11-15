import { httpResource } from '@angular/common/http';
import { Injectable, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Assignee } from '../models';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly resource = httpResource<Assignee[]>(() => `${environment.apiUrl}/users`, {
    defaultValue: [],
  });

  readonly users = computed(() => (this.resource.hasValue() ? this.resource.value() : []));
  readonly isLoading = this.resource.isLoading;
}
