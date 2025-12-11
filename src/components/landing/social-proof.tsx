export function SocialProof() {
  const logos = ["Volvo", "Klarna", "Spotify", "H&M", "IKEA", "Ericsson", "Northvolt", "Truecaller"]
  
  return (
    <div className="border-b border-stone-200 bg-white py-8 overflow-hidden">
      <div className="flex animate-marquee">
        {[...logos, ...logos].map((logo, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 px-12 text-xl font-bold text-stone-400 hover:text-stone-600 transition-colors duration-300 cursor-default"
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  )
}
