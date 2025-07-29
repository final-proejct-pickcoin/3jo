"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sun, Moon, Palette } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {theme === "lavender" ? (
            <Palette className="h-[1.2rem] w-[1.2rem] text-primary transition-all" />
          ) : theme === "dark" ? (
            <Moon className="h-[1.2rem] w-[1.2rem] text-primary transition-all" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem] text-primary transition-all" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={"cursor-pointer flex items-center" + (theme === "light" ? " font-bold text-primary" : "")}
        >
          <Sun className="mr-2 h-4 w-4" />
          라이트
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={"cursor-pointer flex items-center" + (theme === "dark" ? " font-bold text-primary" : "")}
        >
          <Moon className="mr-2 h-4 w-4" />
          다크
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("lavender")}
          className={"cursor-pointer flex items-center" + (theme === "lavender" ? " font-bold text-primary" : "")}
        >
          <Palette className="mr-2 h-4 w-4" />
          라벤더
          {theme === "lavender" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
