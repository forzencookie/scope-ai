import { Calculator, TrendingUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"

interface TaxSettingsCardProps {
    annualProfit: number
    setAnnualProfit: (val: number) => void
    realProfit: number
    isReduced: boolean
    setIsReduced: (val: boolean) => void
    includeKarensReduction: boolean
    setIncludeKarensReduction: (val: boolean) => void
}

export function TaxSettingsCard({
    annualProfit,
    setAnnualProfit,
    realProfit,
    isReduced,
    setIsReduced,
    includeKarensReduction,
    setIncludeKarensReduction
}: TaxSettingsCardProps) {
    return (
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Beräkningsunderlag
              </CardTitle>
              <CardDescription>
                Ange din beräknade årsvinst (resultat efter finansnetto) för att se
                hur mycket egenavgifter du ska betala.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profit">Beräknad vinst {new Date().getFullYear()}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="profit"
                      type="number"
                      value={annualProfit}
                      onChange={(e) => setAnnualProfit(Number(e.target.value))}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-2.5 text-muted-foreground">SEK</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                           variant="outline" 
                           onClick={() => setAnnualProfit(realProfit)}
                           className="shrink-0"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Använd bokfört resultat ({formatCurrency(realProfit)})
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Hämta resultatet från dina registrerade verifikationer
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
    
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                     id="reduced" 
                     checked={isReduced}
                     onCheckedChange={(c) => setIsReduced(!!c)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="reduced"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Reducerad avgift (ålderspension)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Gäller om du är född 1957 eller tidigare, eller är ungdom (född 2006 eller senare).
                    </p>
                  </div>
                </div>
    
                <div className="flex items-start space-x-2">
                  <Checkbox 
                      id="karens" 
                      checked={includeKarensReduction}
                      onCheckedChange={(c) => setIncludeKarensReduction(!!c)}
                      disabled={isReduced}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <div className="flex items-center gap-2">
                        <Label
                        htmlFor="karens"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        Avdrag för karensdagar (7 dagar)
                        </Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Normalt 7 karensdagar. Ger 0.04 - 0.17% lägre avgift beroende på val.
                                    Här räknar vi schablonmässigt.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     </div>
                     <p className="text-sm text-muted-foreground">
                       Standardavdrag om du har 7 karensdagar.
                     </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
    )
}
