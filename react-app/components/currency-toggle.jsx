import { Button } from "@/components/ui/button"

export function CurrencyToggle({ currency, setCurrency }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCurrency(currency === "KRW" ? "USD" : "KRW")}
      className="border border-gray-300 px-2 py-1 rounded text-base font-bold min-w-[40px]"
      aria-label="통화 전환"
    >
      {currency === "KRW" ? "₩" : "$"}
    </Button>
  )
}
