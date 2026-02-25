/**
 * Generates an SVG string for a vertical, B-shaped contact binary star.
 * Features a shared glowing atmosphere and a smooth gradient fade between the stars.
 * * @param {string} colorA - Hex color for the top star (e.g., "#ff4500")
 * @param {string} colorB - Hex color for the bottom star (e.g., "#ffd700")
 * @param {string} labelA - Text label for Star A (e.g., "STAR A: 1.5 M☉")
 * @param {string} labelB - Text label for Star B (e.g., "STAR B: 0.9 M☉")
 * @param {string} glowColor - Hex color for the shared atmosphere ring
 * @returns {string} Raw SVG markup
 */
function generateContactBinarySVG(colorA, colorB, labelA, labelB, glowColor = "#ffffff") {
    // Unique IDs are important if you render multiple systems on the same page
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const gradId = `star-fade-${uniqueId}`;
    const filterId = `atmosphere-glow-${uniqueId}`;

    return `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style="background: transparent; width: 100%; height: 100%;">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="100" x2="0" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>

        <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur_base" />
          <feColorMatrix in="blur_base" mode="matrix" 
                         values="1 0 0 0 0  
                                 0 1 0 0 0  
                                 0 0 1 0 0  
                                 0 0 0 18 -7" result="gooey_merged" />
          
          <feMorphology in="gooey_merged" operator="dilate" radius="4" result="outline_thick" />
          <feGaussianBlur in="outline_thick" stdDeviation="6" result="outline_blur" />
          <feFlood flood-color="${glowColor}" flood-opacity="0.5" result="glow_color" />
          <feComposite in="glow_color" in2="outline_blur" operator="in" result="shared_glow" />
          
          <feMerge>
            <feMergeNode in="shared_glow" />
            <feMergeNode in="gooey_merged" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#${filterId})">
        <path d="M 150 100 h 60 q 40 0 40 40 v 20 q 0 40 -40 40 h -60 z" 
              fill="url(#${gradId})" />

        <path d="M 150 200 h 60 q 40 0 40 40 v 20 q 0 40 -40 40 h -60 z" 
              fill="url(#${gradId})" />
      </g>
      
      <text x="155" y="145" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold">${labelA}</text>
      <text x="155" y="245" fill="#111111" font-family="monospace" font-size="10" font-weight="bold">${labelB}</text>
    </svg>
    `;
}


/**
 * Generates an SVG for a Semi-Detached binary with an S-shaped mass bridge.
 */
function generateSBridgeBinarySVG(massiveStar, smallStar) {
    const id = Math.random().toString(36).substr(2, 5);
    
    // Coordinates
    const x1 = 150; // Massive star (Left)
    const y1 = 200;
    const x2 = 300; // Small companion (Right)
    const y2 = 200;

    return `
<svg viewBox="0 0 450 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bridgeGrad_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${massiveStar.color}" />
      <stop offset="100%" stop-color="${smallStar.color}" />
    </linearGradient>

    <filter id="glow_${id}">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <path d="M ${x1 + 40} ${y1} 
           C ${x1 + 80} ${y1 - 60}, ${x2 - 80} ${y2 + 60}, ${x2} ${y2}" 
        stroke="url(#bridgeGrad_${id})" 
        stroke-width="8" 
        fill="none" 
        stroke-linecap="round" 
        filter="url(#glow_${id})" 
        opacity="0.8" />

  <path d="M ${x1 - 40} ${y1 - 50} h 40 q 40 0 40 50 q 0 50 -40 50 h -40 z" 
        fill="${massiveStar.color}" />

  <path d="M ${x2} ${y2 - 20} h 15 q 20 0 20 20 q 0 20 -20 20 h -15 z" 
        fill="${smallStar.color}" />
</svg>`;
}