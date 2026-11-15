import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { USERS } from '../../../testing/task-factory';
import { StatisticsApi } from './statistics-api';
import { UserApi } from './user-api';

describe('read only APIs', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
  });

  it('loads users', async () => {
    const api = TestBed.inject(UserApi);
    TestBed.tick();
    controller.expectOne('api/users').flush(USERS);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(api.users()).toEqual(USERS);
  });

  it('loads statistics', async () => {
    const resource = runInInjectionContext(TestBed.inject(Injector), () =>
      TestBed.inject(StatisticsApi).statisticsResource(),
    );
    expect(resource.value()).toEqual([]);

    TestBed.tick();
    controller.expectOne('api/statistics').flush([{ id: 'stat-001' }]);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resource.value()).toEqual([{ id: 'stat-001' }]);
  });
});
