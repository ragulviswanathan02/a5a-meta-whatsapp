'use client';

const LEADS_PASS_KEY = 'a5a_leads_pwd';
const DEV_PASS_KEY = 'a5a_dev_pwd';
const LEADS_AUTH_SESSION = 'a5a_leads_session';
const DEV_AUTH_SESSION = 'a5a_dev_session';

const DEFAULT_LEADS_PASS = 'a5aleads123';
const DEFAULT_DEV_PASS = 'a5adeveloper123';

export function getStoredPassword(portal: 'leads' | 'developer'): string {
  if (typeof window === 'undefined') {
    return portal === 'leads' ? DEFAULT_LEADS_PASS : DEFAULT_DEV_PASS;
  }
  const key = portal === 'leads' ? LEADS_PASS_KEY : DEV_PASS_KEY;
  const stored = localStorage.getItem(key);
  if (!stored) {
    const defaultVal = portal === 'leads' ? DEFAULT_LEADS_PASS : DEFAULT_DEV_PASS;
    localStorage.setItem(key, defaultVal);
    return defaultVal;
  }
  return stored;
}

export function setStoredPassword(portal: 'leads' | 'developer', newPass: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = portal === 'leads' ? LEADS_PASS_KEY : DEV_PASS_KEY;
  localStorage.setItem(key, newPass);
  return true;
}

export function isPortalAuthenticated(portal: 'leads' | 'developer'): boolean {
  if (typeof window === 'undefined') return false;
  const sessionKey = portal === 'leads' ? LEADS_AUTH_SESSION : DEV_AUTH_SESSION;
  return localStorage.getItem(sessionKey) === 'true';
}

export function authenticatePortal(portal: 'leads' | 'developer', pass: string): boolean {
  if (typeof window === 'undefined') return false;
  const expected = getStoredPassword(portal);
  if (pass === expected) {
    const sessionKey = portal === 'leads' ? LEADS_AUTH_SESSION : DEV_AUTH_SESSION;
    localStorage.setItem(sessionKey, 'true');
    return true;
  }
  return false;
}

export function logoutPortal(portal: 'leads' | 'developer'): void {
  if (typeof window === 'undefined') return;
  const sessionKey = portal === 'leads' ? LEADS_AUTH_SESSION : DEV_AUTH_SESSION;
  localStorage.removeItem(sessionKey);
}
