/**
 * VAT XML Export for Skatteverket
 * Generates eSKD/SRU format XML files
 */

import type { VatReport } from './types'

/**
 * Generates an XML file content for Skatteverket (Simplified eSKD/SRU format)
 */
export function generateVatXML(report: VatReport, orgNumber: string = "556000-0000"): string {
  const timestamp = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSKD xmlns="http://xmls.skatteverket.se/se/skatteverket/ai/instans/info/1.0">
  <Avsandare>
    <Program>Scope AI Accounting</Program>
    <Organisationsnummer>${orgNumber}</Organisationsnummer>
  </Avsandare>
  <Momsdeklaration>
    <Period>${report.period}</Period>
    <SkapaTidpunkt>${timestamp}</SkapaTidpunkt>
    <Uppgifter>
      <MomspliktigForsaljning>
        <Ruta05>${report.ruta05}</Ruta05>
        <Ruta06>${report.ruta06}</Ruta06>
        <Ruta07>${report.ruta07}</Ruta07>
      </MomspliktigForsaljning>
      <UtgåendeMoms>
        <Ruta10>${report.ruta10}</Ruta10>
        <Ruta11>${report.ruta11}</Ruta11>
        <Ruta12>${report.ruta12}</Ruta12>
      </UtgåendeMoms>
      <IngåendeMoms>
        <Ruta48>${report.ruta48}</Ruta48>
      </IngåendeMoms>
      <AttBetalaEllerFaTillbaka>${report.ruta49}</AttBetalaEllerFaTillbaka>
    </Uppgifter>
  </Momsdeklaration>
</eSKD>`
}

/**
 * Generate a complete VAT declaration with all sections
 */
export function generateFullVatXML(report: VatReport, orgNumber: string = "556000-0000"): string {
  const timestamp = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSKD xmlns="http://xmls.skatteverket.se/se/skatteverket/ai/instans/info/1.0">
  <Avsandare>
    <Program>Scope AI Accounting</Program>
    <Organisationsnummer>${orgNumber}</Organisationsnummer>
  </Avsandare>
  <Momsdeklaration>
    <Period>${report.period}</Period>
    <SkapaTidpunkt>${timestamp}</SkapaTidpunkt>
    <Uppgifter>
      <!-- Section A: Momspliktig försäljning -->
      <MomspliktigForsaljning>
        <Ruta05>${report.ruta05}</Ruta05>
        <Ruta06>${report.ruta06}</Ruta06>
        <Ruta07>${report.ruta07}</Ruta07>
        <Ruta08>${report.ruta08}</Ruta08>
      </MomspliktigForsaljning>
      
      <!-- Section B: Utgående moms -->
      <UtgaendeMoms>
        <Ruta10>${report.ruta10}</Ruta10>
        <Ruta11>${report.ruta11}</Ruta11>
        <Ruta12>${report.ruta12}</Ruta12>
      </UtgaendeMoms>
      
      <!-- Section C: Momspliktiga inköp vid omvänd skattskyldighet -->
      <OmvandSkattskyldighet>
        <Ruta20>${report.ruta20}</Ruta20>
        <Ruta21>${report.ruta21}</Ruta21>
        <Ruta22>${report.ruta22}</Ruta22>
        <Ruta23>${report.ruta23}</Ruta23>
        <Ruta24>${report.ruta24}</Ruta24>
      </OmvandSkattskyldighet>
      
      <!-- Section D: Utgående moms på omvänd skattskyldighet -->
      <UtgaendeMomsOmvand>
        <Ruta30>${report.ruta30}</Ruta30>
        <Ruta31>${report.ruta31}</Ruta31>
        <Ruta32>${report.ruta32}</Ruta32>
      </UtgaendeMomsOmvand>
      
      <!-- Section E: Momsfri försäljning -->
      <MomsfriForSaljning>
        <Ruta35>${report.ruta35}</Ruta35>
        <Ruta36>${report.ruta36}</Ruta36>
        <Ruta37>${report.ruta37}</Ruta37>
        <Ruta38>${report.ruta38}</Ruta38>
        <Ruta39>${report.ruta39}</Ruta39>
        <Ruta40>${report.ruta40}</Ruta40>
        <Ruta41>${report.ruta41}</Ruta41>
        <Ruta42>${report.ruta42}</Ruta42>
      </MomsfriForSaljning>
      
      <!-- Section F: Ingående moms -->
      <IngaendeMoms>
        <Ruta48>${report.ruta48}</Ruta48>
      </IngaendeMoms>
      
      <!-- Section G: Resultat -->
      <Resultat>
        <Ruta49>${report.ruta49}</Ruta49>
      </Resultat>
      
      <!-- Section H: Import -->
      <Import>
        <Ruta50>${report.ruta50}</Ruta50>
        <Ruta60>${report.ruta60}</Ruta60>
        <Ruta61>${report.ruta61}</Ruta61>
        <Ruta62>${report.ruta62}</Ruta62>
      </Import>
    </Uppgifter>
  </Momsdeklaration>
</eSKD>`
}
