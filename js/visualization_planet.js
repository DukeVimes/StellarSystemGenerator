


function visualizeAsteroidBelt(prefilled) {

    width = 200
    height = 600
    center_x = 100
    center_y = 300
    startX = 0
    y = 0

    svg = ""

    const blur = `<filter id="beltBlur" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
  </filter>`

    // 1. The Mask (Fades top and bottom)
    const mask = `
  <mask id="beltMask" maskContentUnits="objectBoundingBox">
    <linearGradient id="verticalFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" />   
      <stop offset="50%" stop-color="white" />  
      <stop offset="100%" stop-color="black" /> 
    </linearGradient>
    <rect width="1" height="1" fill="url(#verticalFade)" />
  </mask>
`;

    const horizontalGradient = `
  <linearGradient id="asteroidHorizontalGradient" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#888" stop-opacity="0" />
    
    <stop offset="35%" stop-color="#AAA" stop-opacity="0.7" /> 
    
    <stop offset="100%" stop-color="#888" stop-opacity="0" />
  </linearGradient>
`;

    svg += `<defs>
    ${blur}

    ${mask}

    ${horizontalGradient}

</defs>`


    // 2. The Belt (Uses your Horizontal Gradient + the Mask)
    svg += `
  <rect x="${startX}" y="${y}" width="${width}" height="${height}" 
        fill="url(#asteroidHorizontalGradient)" 
        filter="url(#beltBlur)"
        mask="url(#beltMask)" />
`;


    return {
        "svg": svg,
        "width": width,
        "height": height,
        "center_x": center_x,
        "center_y": center_y
    }
}

function getScaledRadius(realKm) {
    // This formula is tuned to hit your exact targets:
    // 500km results in ~2px
    // 140,000km results in ~60px
    const k = 0.0075;
    const p = 0.74;

    return Math.pow(realKm, p) * k;

}







function visualizePlanetarySystem(prefilled) {
    let width = 0
    let height = 0
    let center_x = 0
    let center_y = 0

    let svg = ""

    let radius = getScaledRadius(prefilled.radius)   //dwarf-planet to gas-giant
    
    padding = Math.max( 10, radius ) //minimum padding between planets
    width = 2 * radius + 2 * padding
    height = 2 * radius
    center_x = radius + padding
    center_y = radius

    let excentricity = 90 //getUniformRandomBetween( 2, 100 )

    const svg_defs = `
<defs>
    <clipPath id="planetClip_${prefilled.id}">
        <circle cx="${center_x}" cy="${center_y}" r="${radius}" />
    </clipPath>
    <pattern id="twilightStripes" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="white" stroke-width="2" stroke-opacity="1.0" />   
        <line x1="2" y1="0" x2="2" y2="4" stroke="black" stroke-width="2" stroke-opacity="1.0" />
    </pattern>
</defs>`;

    // 1. Calculate Axis Coordinates
    const axisLength = radius + 10; // How far the axis sticks out
    // Convert degrees to radians for JS Math functions

    const tiltRad = (prefilled.axisTilt || 0) * (Math.PI / 180);
    const seasonalWidth = radius * Math.sin(tiltRad);

    const axisColor = prefilled.axisTilt > 90.0 ? "blue" : "red";


    // 1. Base Planet Layer
    let svg_planet = `<circle class="planet ${prefilled.type}" cx="${center_x}" cy="${center_y}" r="${radius}" 
                                                                   stroke="white" stroke-width="1" fill="#303030" />`;

    if (prefilled.hasAtmosphere) {
        svg_planet += `\n<circle class="planet  ${prefilled.type}" cx="${center_x}" cy="${center_y}" r="${radius}" 
                                          stroke="white" stroke-width="4" fill="#303030" />`;
        svg_planet += `\n<circle class="planet  ${prefilled.type}" cx="${center_x}" cy="${center_y}" r="${radius}" 
                                          stroke="black" stroke-width="2" fill="none" />`;
    }

    // 2. Tidally Locked Layer (Left half white)
    if (!prefilled.isTidallyLocked) {
        // The "d" attribute draws a line to top center, arcs down the left side, and closes the path straight up.
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        let rsurface = radius - 1
        let daySidePath = ``
        if (prefilled.axisTilt <= 90) {
            daySidePath = `M ${center_x} ${center_y - rsurface} A ${rsurface} ${rsurface} 0 0 0 ${center_x} ${center_y + rsurface} Z`;
        }
        else {
            //retrograde rotation, the other side needs to be filled (because we rotate the whole planet later)      
            daySidePath = `M ${center_x} ${center_y + rsurface} A ${rsurface} ${rsurface} 0 0 0 ${center_x} ${center_y - rsurface} Z`;
        }

        const flareWidth = radius * Math.sin(tiltRad);
        // The 'capHeight' is how far down from the pole the seasonal zone extends
        const capHeight = radius * Math.sin(tiltRad);

        // 2. Define the 'Seasonal Zone' Path
        // This path creates a 'bow-tie' shape:

        const hourglassPath = `
    M ${center_x - flareWidth} ${center_y - radius} 
    L ${center_x + flareWidth} ${center_y - radius} 
    L ${center_x} ${center_y} 
    L ${center_x + flareWidth} ${center_y + radius} 
    L ${center_x - flareWidth} ${center_y + radius} 
    L ${center_x} ${center_y} 
    Z`;


        svg_planet += `\n<path d="${daySidePath}" fill="white" />`;
        svg_planet += `\n<path d="${hourglassPath}" fill="url(#twilightStripes)" clip-path="url(#planetClip_${prefilled.id})" />`;


    }


    // 4. Axis of Rotation Layer
    const svg_axis = `<line x1="${center_x}" y1="${center_y - axisLength}" 
              x2="${center_x}" y2="${center_y + axisLength}" 
              stroke="${axisColor}" stroke-width="2" />`


    svg = `${svg_defs}
        <g>
          <g transform="rotate(${prefilled.axisTilt}, ${center_x}, ${center_y})">
            ${svg_planet}
            ${svg_axis}
          </g>
            <text x="${center_x}" y="${center_y + 150}" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold" 
                         text-anchor="middle">
                ${prefilled.designation}
            </text>
       </g>
    `;

    /*
    
    
        let svg_atmosphere = `<circle class="planet ${prefilled.type}" cx=${center_x} cy=${center_y} r="${radius}" stroke="white" stroke-width="1" fill="#303030" >` 
        if( prefilled.hasAtmosphere === true ) {
              svg_atmosphere = `
               <circle class="planet gas-giant" cx=${center_x} cy=${center_y} r="${radius}" stroke="white" stroke-width="4" fill="#303030" ></circle>
               <circle class="planet gas-giant" cx=${center_x} cy=${center_y} r="${radius}" stroke="black" stroke-width="2" fill="none" ></circle>
    `
        }
    
    
    
        if( excentricity < 20 ) {
           svg += generateAsteroidBelt( prefilled )
           width = 200
           height = 600
           center_x = 100
           center_y = 300
    }
    else {
        svg = `<g>
                  ${svg_atmosphere}
                  <text x="${center_x}" y="${center_y + 150}" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${prefilled.designation}</text>
                  <!--line -->
               </g>`
    
    }
    
    */

    return {
        "svg": svg,
        "width": width,
        "height": height,
        "center_x": center_x,
        "center_y": center_y
    }

}


