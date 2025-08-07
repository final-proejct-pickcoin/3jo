"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

export const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastCommand, setLastCommand] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  const startListening = () => {
    setIsListening(true)
    setIsVisible(true)
    setTimeout(() => {
      const commands = [
        "Show me Bitcoin price",
        "Add Ethereum to watchlist",
        "What's the market summary?",
        "Buy 0.1 Bitcoin",
        "Check my portfolio balance",
      ]
      const randomCommand = commands[Math.floor(Math.random() * commands.length)]
      setLastCommand(randomCommand)
      setIsListening(false)
      setTimeout(() => {
        setIsSpeaking(true)
        setTimeout(() => {
          setIsSpeaking(false)
          setTimeout(() => setIsVisible(false), 2000)
        }, 3000)
      }, 1000)
    }, 2000)
  }
  const stopListening = () => {
    setIsListening(false)
    setIsVisible(false)
  }
  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={startListening} className="rounded-full w-14 h-14 shadow-lg" size="lg">
          <Mic className="h-6 w-6" />
        </Button>
      </div>
    )
  }
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Voice Assistant</h3>
            <Button variant="ghost" size="sm" onClick={stopListening}>×</Button>
          </div>
          <div className="space-y-4">
            {isListening && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mic className="h-8 w-8 text-primary voice-recording" />
                </div>
                <p className="text-sm text-muted-foreground">Listening...</p>
                <Badge variant="secondary" className="mt-2">Say something like "Show Bitcoin price"</Badge>
              </div>
            )}
            {lastCommand && !isListening && (
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">You said:</p>
                  <p className="text-sm text-muted-foreground">"{lastCommand}"</p>
                </div>
                {isSpeaking ? (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                      <Volume2 className="h-6 w-6 text-green-600 pulse-glow" />
                    </div>
                    <p className="text-sm text-muted-foreground">Speaking response...</p>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Response:</p>
                    <p className="text-sm text-green-600">
                      {lastCommand.includes("Bitcoin") && "Bitcoin is currently trading at $43,100, up 2.5% today."}
                      {lastCommand.includes("Ethereum") && "Ethereum has been added to your watchlist successfully."}
                      {lastCommand.includes("market") && "Today's market is showing positive momentum with most major cryptocurrencies in the green."}
                      {lastCommand.includes("Buy") && "I've prepared a buy order for 0.1 Bitcoin. Please confirm in the trading interface."}
                      {lastCommand.includes("portfolio") && "Your portfolio balance is $45,231.89, up 6.2% this month."}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={startListening}
                disabled={isListening}
                className="flex-1"
                variant={isListening ? "secondary" : "default"}
              >
                {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isListening ? "Stop" : "Listen"}
              </Button>
              <Button variant="outline" size="sm">
                <VolumeX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
