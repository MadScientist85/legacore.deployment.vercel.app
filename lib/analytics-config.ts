export interface AnalyticsConfig {
  segment: {
    enabled: boolean
    writeKey?: string
    flushAt: number
    flushInterval: number
    debug: boolean
  }
  tracking: {
    pageViews: boolean
    userInteractions: boolean
    agentInteractions: boolean
    taskOperations: boolean
    errorTracking: boolean
  }
  privacy: {
    anonymizeIp: boolean
    respectDoNotTrack: boolean
    cookieConsent: boolean
  }
}

export const defaultAnalyticsConfig: AnalyticsConfig = {
  segment: {
    enabled: process.env.SEGMENT_ENABLED !== "false",
    writeKey: process.env.SEGMENT_WRITE_KEY,
    flushAt: Number.parseInt(process.env.SEGMENT_FLUSH_AT || "1"),
    flushInterval: Number.parseInt(process.env.SEGMENT_FLUSH_INTERVAL || "1000"),
    debug: process.env.NODE_ENV === "development",
  },
  tracking: {
    pageViews: true,
    userInteractions: true,
    agentInteractions: true,
    taskOperations: true,
    errorTracking: true,
  },
  privacy: {
    anonymizeIp: true,
    respectDoNotTrack: true,
    cookieConsent: process.env.NODE_ENV === "production",
  },
}

export function getAnalyticsConfig(): AnalyticsConfig {
  return {
    ...defaultAnalyticsConfig,
    segment: {
      ...defaultAnalyticsConfig.segment,
      enabled: defaultAnalyticsConfig.segment.enabled && !!defaultAnalyticsConfig.segment.writeKey,
    },
  }
}

export function isAnalyticsEnabled(): boolean {
  const config = getAnalyticsConfig()
  return config.segment.enabled && !!config.segment.writeKey
}

export function shouldTrackEvent(eventType: keyof AnalyticsConfig["tracking"]): boolean {
  const config = getAnalyticsConfig()
  return config.segment.enabled && config.tracking[eventType]
}

export default getAnalyticsConfig
