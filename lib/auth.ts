'use client';

import { useEffect } from 'react';

const LEADS_PASS_KEY = 'a5a_leads_pwd';
const DEV_PASS_KEY = 'a5a_dev_pwd';
const LEADS_AUTH_SESSION = 'a5a_leads_session';
const DEV_AUTH_SESSION = 'a5a_dev_session';
const LEADS_LAST_ACTIVITY = 'a5a_leads_last_activity';
const DEV_LAST_ACTIVITY = 'a5a_dev_last_activity';

// 1 Hour Inactivity Timeout (60 minutes = 3,600,000 milliseconds)
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

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

export function recordPortalActivity(portal: 'leads' | 'developer'): void {
  if (typeof window === 'undefined') return;
  const key = portal === 'leads' ? LEADS_LAST_ACTIVITY : DEV_LAST_ACTIVITY;
  localStorage.setItem(key, Date.now().toString());
}

export function isPortalAuthenticated(portal: 'leads' | 'developer'): boolean {
  if (typeof window === 'undefined') return false;
  const sessionKey = portal === 'leads' ? LEADS_AUTH_SESSION : DEV_AUTH_SESSION;
  const isAuthed = localStorage.getItem(sessionKey) === 'true';
  if (!isAuthed) return false;

  // Check 1-hour inactivity timeout
  const activityKey = portal === 'leads' ? LEADS_LAST_ACTIVITY : DEV_LAST_ACTIVITY;
  const lastActivityStr = localStorage.getItem(activityKey);
  if (!lastActivityStr) {
    recordPortalActivity(portal);
    return true;
  }

  const lastActivity = parseInt(lastActivityStr, 10);
  if (isNaN(lastActivity) || Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
    logoutPortal(portal);
    return false;
  }

  return true;
}

export function authenticatePortal(portal: 'leads' | 'developer', pass: string): boolean {
  if (typeof window === 'undefined') return false;
  const expected = getStoredPassword(portal);
  if (pass === expected) {
    const sessionKey = portal === 'leads' ? LEADS_AUTH_SESSION : DEV_AUTH_SESSION;
    localStorage.setItem(sessionKey, 'true');
    recordPortalActivity(portal);
    return true;
  }
  return false;
}

export function logoutPortal(portal: 'leads' | 'developer'): void {
  if (typeof window === 'undefined') return;
  const sessionKey = portal === 'leads' ? LEADS_AUTH_SESSION : DEV_AUTH_SESSION;
  const activityKey = portal === 'leads' ? LEADS_LAST_ACTIVITY : DEV_LAST_ACTIVITY;
  localStorage.removeItem(sessionKey);
  localStorage.removeItem(activityKey);
}

/**
 * React hook to track user interaction (mouse, keyboard, scroll, touch)
 * and trigger automatic logout if 1 hour of inactivity passes.
 */
export function useInactivityTracker(portal: 'leads' | 'developer', onTimeout: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastUpdated = Date.now();

    const handleUserInteraction = () => {
      const now = Date.now();
      // Throttle localStorage updates to at most once every 15 seconds
      if (now - lastUpdated > 15000) {
        lastUpdated = now;
        recordPortalActivity(portal);
      }
    };

    // User activity listeners
    window.addEventListener('mousemove', handleUserInteraction, { passive: true });
    window.addEventListener('mousedown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true });

    // Periodic check every 30 seconds for inactivity expiry
    const timer = setInterval(() => {
      if (!isPortalAuthenticated(portal)) {
        onTimeout();
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      clearInterval(timer);
    };
  }, [portal, onTimeout]);
}
