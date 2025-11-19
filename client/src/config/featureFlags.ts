/**
 * Feature Flags for MVP Conversion Gradual Rollout
 *
 * Controls visibility of MVP pages during Base44 → P3 API conversion.
 *
 * Usage:
 * - Set environment variables to enable/disable features
 * - Use isFeatureEnabled() helper to check flag status
 * - Flags default to false for safety
 *
 * Example:
 * ```
 * if (isFeatureEnabled('mvp.home')) {
 *   // Show new Home.jsx (converted)
 * } else {
 *   // Show old dashboard
 * }
 * ```
 */

export interface FeatureFlags {
  mvp: {
    home: {
      enabled: boolean;
      description: string;
    };
    dashboard: {
      enabled: boolean;
      description: string;
    };
    layout: {
      enabled: boolean;
      description: string;
    };
    components: {
      enabled: boolean;
      description: string;
    };
  };
}

export const featureFlags: FeatureFlags = {
  mvp: {
    home: {
      enabled: import.meta.env.VITE_MVP_HOME_ENABLED === 'true' || false,
      description: 'New MVP Home page with Base44 design (converted to P3 APIs)'
    },
    dashboard: {
      enabled: import.meta.env.VITE_MVP_DASHBOARD_ENABLED === 'true' || false,
      description: 'New MVP Dashboard (already uses P3 APIs)'
    },
    layout: {
      enabled: import.meta.env.VITE_MVP_LAYOUT_ENABLED === 'true' || false,
      description: 'New MVP Layout with sidebar navigation'
    },
    components: {
      enabled: import.meta.env.VITE_MVP_COMPONENTS_ENABLED === 'true' || false,
      description: 'New MVP components (SimulationInterface, SelfIntroRecorder, etc.)'
    }
  }
};

/**
 * Check if a feature is enabled by path
 *
 * @param path - Dot-separated path to feature flag (e.g., 'mvp.home')
 * @returns true if feature is enabled, false otherwise
 *
 * @example
 * isFeatureEnabled('mvp.home') // Check if Home page is enabled
 * isFeatureEnabled('mvp.dashboard') // Check if Dashboard is enabled
 */
export const isFeatureEnabled = (path: string): boolean => {
  const parts = path.split('.');
  let current: any = featureFlags;

  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) {
      console.warn(`Feature flag path not found: ${path}`);
      return false;
    }
  }

  return current?.enabled ?? false;
};

/**
 * Get all enabled features
 *
 * @returns Array of enabled feature paths
 *
 * @example
 * getEnabledFeatures() // ['mvp.dashboard', 'mvp.layout']
 */
export const getEnabledFeatures = (): string[] => {
  const enabled: string[] = [];

  // Iterate through mvp features
  Object.entries(featureFlags.mvp).forEach(([key, feature]) => {
    if (feature.enabled) {
      enabled.push(`mvp.${key}`);
    }
  });

  return enabled;
};

/**
 * Get feature flag status summary (useful for debugging)
 *
 * @returns Object with all feature flags and their status
 *
 * @example
 * console.log(getFeatureFlagStatus());
 * // {
 * //   'mvp.home': { enabled: false, description: '...' },
 * //   'mvp.dashboard': { enabled: true, description: '...' }
 * // }
 */
export const getFeatureFlagStatus = (): Record<string, { enabled: boolean; description: string }> => {
  const status: Record<string, { enabled: boolean; description: string }> = {};

  Object.entries(featureFlags.mvp).forEach(([key, feature]) => {
    status[`mvp.${key}`] = {
      enabled: feature.enabled,
      description: feature.description
    };
  });

  return status;
};

// Log feature flag status on initialization (useful for debugging)
if (import.meta.env.DEV) {
  console.log('[Feature Flags] Status:', getFeatureFlagStatus());
  console.log('[Feature Flags] Enabled:', getEnabledFeatures());
}
