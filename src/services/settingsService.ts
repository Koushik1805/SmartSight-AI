import { UserSettings } from "../types";

const SETTINGS_KEY = 'smartsight_settings';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'English',
  autoSpeak: false,
  voiceEnabled: true,
};

export const getSettings = (): UserSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
