import { NativeModules } from 'react-native';

const { GoogleAuthModule, SyncModule } = NativeModules;

export interface User {
  email: string;
  id: string;
  displayName: string;
}

export const signIn = (): Promise<User> => GoogleAuthModule.signIn();
export const signOut = (): Promise<boolean> => GoogleAuthModule.signOut();
export const getCurrentUser = (): Promise<User | null> => GoogleAuthModule.getCurrentUser();

export const scheduleBackup = (): Promise<boolean> => SyncModule.scheduleBackup();
export const restoreFromDrive = (): Promise<boolean> => SyncModule.restoreFromDrive();
