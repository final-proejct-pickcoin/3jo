"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"


const OnboardingContext = createContext(undefined)

export const OnboardingProvider = ({ children }) => {
  const { user, updateUser } = useAuth()
  const [isOnboardingActive, setIsOnboardingActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 6

  useEffect(() => {
    if (user && !user.isOnboardingCompleted) {
      const timer = setTimeout(() => setIsOnboardingActive(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [user])

  const startOnboarding = () => {
    setIsOnboardingActive(true)
    setCurrentStep(0)
  }
  const nextStep = () => {
    currentStep < totalSteps - 1 ? setCurrentStep(currentStep + 1) : completeOnboarding()
  }
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }
  const completeOnboarding = () => {
    setIsOnboardingActive(false)
    setCurrentStep(0)
    if (user && updateUser) updateUser({ isOnboardingCompleted: true })
  }
  const skipOnboarding = () => completeOnboarding()

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        currentStep,
        totalSteps,
        startOnboarding,
        nextStep,
        prevStep,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
