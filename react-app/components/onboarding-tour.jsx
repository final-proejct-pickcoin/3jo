"use client"

import { useOnboarding } from "@/components/onboarding-provider"

/**
 * Temporarily disabled Joyride tour due to React 18 compatibility issues.
 * TODO: Replace with a React 18 compatible tour library
 */
export const OnboardingTour = () => {
  const { isOnboardingActive } = useOnboarding()
  return null
}
