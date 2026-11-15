import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
import { TaskDialogResult } from '../app/features/tasks/components/task-form-dialog/task-form-dialog';
import { providePrimeNG } from 'primeng/config';
import { Statistic, Task } from '../app/core/models';
import { USERS } from './task-factory';

export function provideAppTesting(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideRouter([]),
    providePrimeNG(),
    MessageService,
    ConfirmationService,
    DialogService,
  ];
}

export async function settle(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

export async function respond(url: string, body: object | null): Promise<void> {
  TestBed.tick();
  TestBed.inject(HttpTestingController)
    .match(url)
    .forEach((request) => request.flush(body));
  await settle();
}

export async function respondWithError(url: string, status = 404): Promise<void> {
  TestBed.tick();
  TestBed.inject(HttpTestingController)
    .match(url)
    .forEach((request) => request.flush(null, { status, statusText: 'Error' }));
  await settle();
}

export async function respondWithData(tasks: Task[], statistics: Statistic[] = []): Promise<void> {
  await respond('api/tasks', tasks);
  await respond('api/users', USERS);
  await respond('api/statistics', statistics);
}

export function mockTaskDialog(result?: TaskDialogResult) {
  return vi
    .spyOn(TestBed.inject(DialogService), 'open')
    .mockReturnValue({ onClose: of(result) } as unknown as DynamicDialogRef);
}
