function generateStar( star, drawOutline, drawHalo ) {

    let svg = ""
    let width = 0
    let height = 0

    if( star.type === "NEUTRON_STAR" || star.type === "PULSAR" ){
        width = 20
        height = 20
        svg = `<circle cx="${width/2}" cy="${height/2}" r="${width/2}" stroke="black"stroke-width="0" fill="white" />`
    }
    else if( star.type === "BLACK_HOLE") {       
        width = 60
        height = 60
        //svg = `<circle cx="${width/2}" cy="${height/2}" r="${width/2}" stroke="white" stroke-width="1" fill="black" />`
        svg = `<image 
            href="./assets/black-hole.png" 
            x="0" 
            y="0" 
            width="${width}" 
            height="${height}" 
            preserveAspectRatio="xMidYMid meet" 
           />`
    } else if( star.type === "CEPHEID_VARIABLE" ) {
        y = generateStandardStar( star.color_expanded, star.radius_expanded, true, true, false )
        x = generateStandardStar( star.color, star.radius, true, true, false )
        size_diff = Math.abs(x.height - y.height)/2
        svg = `<g>${x.svg}
    <g transform="translate(0, ${size_diff})">${y.svg}</g>
 </g>`
        width = x.width
        height = x.height
    }
    else {
        x = generateStandardStar( star.color, star.radius, false, drawOutline, drawHalo )
        svg = x.svg
        width = x.width
        height = x.height
    }

    return {
       "svg": svg,
       "width": width,
       "height": height
   }
}



/**
 * Generates an SVG string for a star
*/
function generateStandardStar( starColor, xradius, isVariable=false, drawOutline=true, drawHalo=true ) {

    STAR_WIDTH = 60
    const minSolarRadius = 0.1 * CONSTANTS.SUN_RADIUS
    const maxSolarRadius = 100 * CONSTANTS.SUN_RADIUS
    const scalingFactor = xradius  / maxSolarRadius

    // 1. Dynamic dimensions
    const minH = 100 //10;
    const maxH = 200 //140;
    const height = minH + (scalingFactor * (maxH - minH));
    
    // Radius grows exponentially so it flattens fast at the end
    const minR = height / 2; // Semi-circle is the tightest possible
    const maxR = 2000;



    const radius = minR + (Math.pow(scalingFactor, 3) * (maxR - minR));

    // 2. Geometric Calculation: The "Bulge" (Sagitta)
    // How far the curve sticks out from the rectangle
    const halfHeight = height / 2;
    const bulge = radius - Math.sqrt(Math.pow(radius, 2) - Math.pow(halfHeight, 2));
    
    // 3. Constant Width Adjustment
    // Rectangle length is whatever is left over
    const rectLength = STAR_WIDTH - bulge;



    const pathData = `
        M 0,0 
        L ${rectLength},0 
        A ${radius},${radius} 0 0 1 ${rectLength},${height} 
        L 0,${height} 
        Z
    `;

     stroke_width = drawOutline ? 1 : 0
     stroke_color = "white"
     if( isVariable ) {
        stroke_color = "black"
     }

     return {
          "svg": `<path d="${pathData}" fill="${starColor}" stroke="${stroke_color}" stroke-width="${stroke_width}" />`,
          "height": height,
          "width": STAR_WIDTH

     }

}



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





function generateAsteroidBelt( prefilled ) {

  width = 200
  height = 600
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
   return svg

}

function getScaledRadius(realKm) {
    // This formula is tuned to hit your exact targets:
    // 500km results in ~2px
    // 140,000km results in ~60px
const k = 0.0075;
    const p = 0.74;
    
    return Math.pow(realKm, p) * k;
    
}



function generateRandomPlanetarySystem( prefilled ) {
    let width = 0
    let height = 0
    let center_x = 0
    let center_y = 0

    let svg = ""

    let radius = getScaledRadius( prefilled.radius )   //dwarf-planet to gas-giant
    width = 2*radius
    height = 2*radius
    center_x = radius
    center_y = radius
    
    let excentricity = 90 //getUniformRandomBetween( 2, 100 )

const svg_defs = `
<defs>
    <pattern id="twilightStripes" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="white" stroke-width="2" stroke-opacity="0.5" />
    </pattern>
</defs>`;
	
	// 1. Calculate Axis Coordinates
	const axisLength = radius + 25; // How far the axis sticks out
	// Convert degrees to radians for JS Math functions

	const tiltRad = (prefilled.axisTilt || 0) * (Math.PI / 180);
        const seasonalWidth = 20 //radius * Math.sin(tiltRad);

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
   if ( ! prefilled.isTidallyLocked) {
    // The "d" attribute draws a line to top center, arcs down the left side, and closes the path straight up.
    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    let rsurface = radius - 1
    let daySidePath = `M ${center_x} ${center_y - rsurface} A ${rsurface} ${rsurface} 0 0 0 ${center_x} ${center_y + rsurface} Z`;
    // Seasonal Twilight Zone (An ellipse that represents the "wobble" area)
    // We use an elliptical arc with a dynamic X-radius based on the tilt
    const twilightPath = `M ${center_x} ${center_y - radius} 
                          A ${seasonalWidth} ${radius} 0 0 1 ${center_x} ${center_y + radius} 
                          A ${seasonalWidth} ${radius} 0 0 0 ${center_x} ${center_y - radius} Z`;

    svg_planet += `\n<path d="${daySidePath}" fill="white" />`;
    svg_planet += `\n<path d="${twilightPath}" fill="green" />`;   


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





function calculatePositionsLogarithmic(planets, svgWidth, dMin, dMax) {
    let lastX = 0; // Start at the Sun


    return planets.map((p, index) => {
        // 1. Calculate Ideal Logarithmic Position
        const ratio = (Math.log(p.data.distance) - Math.log(dMin)) / (Math.log(dMax) - Math.log(dMin));
        let idealX = ratio * svgWidth;

        // 2. Collision Avoidance (The Nudge)
        // If this is the first planet, it just needs to be MIN_SPACING from the Sun
        // otherwise it has to be at least as far as previous position + width of the element
        let finalX = Math.max(idealX, lastX) + p.visual.width/2;
        
        lastX = finalX; // Update for the next neighbor
        return { ...p, x_pos: finalX };
    });
}


function calculatePositionsEvenlyDistributed(planets, svgWidth, minWidth) {
     numberOfPlanets = planets.length
     if( minWidth <= 0.8*svgWidth ) {
   	deltaX = svgWidth / (numberOfPlanets+1)
           return planets.map( (p, index ) => {
                     finalX = (index+1) * deltaX
                     return {...p, x_pos: finalX}
                  })
     } else {
        lastX = 0
        return planets.map( (p, index ) => {
                     finalX = lastX + p.visual.width / 2
                     lastX = finalX + p.visual.width / 2 
                     return {...p, x_pos: finalX}
                  })
     }    


}




function placeOrbits( roche_limit, orbits, available_width, height ) {

	//to gnerate and place orbital object we do two passes:
        // 1st we generate each orbital object with its svg and width and store it together with the original object
        let svg = ""
        let x_offset = 0
        let padding = 100
	let orbital_objects = []

	//the limits of the system (fost and habitable zone maybe too?)
	min_distance = orbits[0].distance
        max_distance = orbits.at(-1).distance
	min_needed_width = 0

	for( const orbit of orbits ) {
		rp = generateRandomPlanetarySystem( orbit )
                min_needed_width += rp.width
                orbital_objects.push( { data: orbit, visual: rp } )
	}

        //now we have all the svg-objects, their width, the sum of all width, min and maximum distance
        // in phase 2 we can now position the objects an build an x-Axis!
        //positionedOrbits = calculatePositionsLogarithmic( orbital_objects, available_width, roche_limit, max_distance )
	positionedOrbits = calculatePositionsEvenlyDistributed( orbital_objects, available_width, min_needed_width)
	
	let finalOrbit = positionedOrbits.at(-1);
        neededPixels = finalOrbit.x_pos + finalOrbit.visual.width/2
        const SVG_WIDTH = Math.max(available_width, neededPixels );

	distance_scale = []
	for( const pos_orbit of positionedOrbits ) {
            console.log( pos_orbit )
            distance_scale.push( { "distance": pos_orbit.data.distance, "x_pos": pos_orbit.x_pos} )
            svg += `<g transform="translate(${pos_orbit.x_pos - pos_orbit.visual.width/2}, ${height/2-pos_orbit.visual.center_y})">
                       ${pos_orbit.visual.svg}
                   </g>` 
        }


	return {
          svg: svg,
          width: min_needed_width,
          scale: distance_scale
        }

}


/**

const MIN_SPACING = 90; // Minimum pixels between planet centers
const PADDING = 60;


// --- Execution ---
let initialWidth = 800;
let positionedPlanets = calculatePositions(planets, initialWidth);

// 3. Dynamic SVG Growth
// If the last planet was pushed beyond our initial width, we grow the SVG
const finalPlanetX = positionedPlanets[positionedPlanets.length - 1].x;
const SVG_WIDTH = Math.max(initialWidth, finalPlanetX + PADDING);


*/


/**
 * Maps a distance in km to an x-position in pixels based on a non-linear planet array.
 * @param {number} targetKm - The distance you want to map.
 * @param {Array} planets - Your array of {name, km, x} objects.
 * @returns {number} The calculated x-position in pixels.
 */
function getXPosForKm(targetKm, scale) {

let i = 0
const lastIdx = scale.length - 1;

// 1. Determine the segment index
  if (targetKm < scale[0].distance) {
    // Extrapolate backwards using the first segment (e.g., Sun to Mercury)
    i = 0;
  } else if (targetKm >= scale.at(lastIdx).distance) {
    // Extrapolate forwards using the last segment (e.g., Uranus to Neptune)
    i = scale.length - 2;
  } else {
    // Standard interpolation: find the segment the KM falls into
      i = scale.findIndex((p, idx) => 
         targetKm >= p.distance && targetKm < scale[idx + 1].distance
    );
// Final safety: If findIndex still fails (rare rounding edge cases)
    if (i === -1) i = lastIdx - 1;
  }

  const p1 = scale[i];
  const p2 = scale[i + 1];

  // 4. Linear Interpolation within this specific segment
  const kmSpan = p2.distance - p1.distance;
  const pxSpan = p2.x_pos - p1.x_pos;
  
  // Calculate percentage of progress between p1 and p2
  const percentage = (targetKm - p1.distance) / kmSpan;

  // Map that percentage to the pixel range
  return p1.x_pos + (percentage * pxSpan);
}




function createDistanceScale( scale ) {


const tickIntervalKm = 0.25 * CONSTANTS.KM_PER_AU;
const maxKm = scale.at(- 1).distance;

let rulerSvg = `<g class="ruler" transform="translate(0, 80)">`;
// 1. Draw the main horizontal line
rulerSvg += `<line x1="${scale[0].x_pos}" y1="0" x2="${scale.at(-1).x_pos}" y2="0" stroke="#666" />`;


let currentTickKm = 0;

while (currentTickKm <= maxKm) {
    // 1. Find which two scale this tick falls between
    const p1Index = scale.findIndex((p, idx) => 
        currentTickKm >= p.distance && (scale[idx + 1] ? currentTickKm < scale[idx + 1].distance : true)
    );
    
    // Safety check: if we are at the very last planet
    const i = p1Index === -1 ? scale.length - 2 : p1Index;
    const p1 = scale[i];
    const p2 = scale[i + 1];
    
    // Major Tick for Planet
    rulerSvg += `<line x1="${p1.x_pos}" y1="-10" x2="${p1.x_pos}" y2="10" stroke="white" stroke-width="2" />`;
    
    if (p1 && p2) {
        // 2. Map the KM to pixels based on the local scale of this segment
        const kmSpan = p2.distance - p1.distance;
        const pxSpan = p2.x_pos - p1.x_pos;
        const percentage = (currentTickKm - p1.distance) / kmSpan;
        const tickX = p1.x_pos + (percentage * pxSpan);

        const auValue = currentTickKm / CONSTANTS.KM_PER_AU;
        const isMajorAU = Math.abs(auValue - Math.round(auValue)) < 0.01;

        // 3. Draw Tick
        rulerSvg += `<line x1="${tickX}" y1="0" x2="${tickX}" y2="${isMajorAU ? 15 : 7}" 
                           stroke="${isMajorAU ? '#AAA' : '#444'}" stroke-width="1" />`;

        // 4. Label (showing all whole AUs)
        if (isMajorAU && Math.round(auValue) > 0) {
            rulerSvg += `
                <text x="${tickX}" y="30" fill="#888" font-size="10" text-anchor="middle">
                    ${Math.round(auValue)}
                </text>`;
        }
    }
    currentTickKm += tickIntervalKm;
}

// Add final major tick for the last planet
const last = scale.at(- 1);
rulerSvg += `<line x1="${last.x_pos}" y1="-10" x2="${last.x_pos}" y2="10" stroke="white" stroke-width="2" />`;


rulerSvg += `</g>`;
return rulerSvg
   return rulerSvg; 
}



function createFrostLine( frostLineKm, scale, SVG_HEIGHT=700 ) {
// Use your interpolation function to find the exact pixel
const frostLineX = getXPosForKm(frostLineKm, scale);
let frostLineSvg = `
  <g class="frost-line">
    <line x1="${frostLineX}" y1="20" x2="${frostLineX}" y2="${SVG_HEIGHT}" 
          stroke="cyan" stroke-width="1" stroke-dasharray="4 4" opacity="0.5" />
    
    <text x="${frostLineX + 5}" y="30" fill="cyan" font-size="10" font-family="monospace" opacity="0.8">
      FROST LINE
    </text>
  </g>
`;

return frostLineSvg
}



function createHabitableZone( inner, outer, scale, SVG_HEIGHT=700 ) {
// Get the central pixel positions for the defined inner/outer boundaries
const xHZInner = getXPosForKm(inner, scale);
const xHZOuter = getXPosForKm(outer, scale);

// To make the gradient soft, we add a buffer (e.g., 0.1 AU) outside the boundaries
const bufferAU_in_km = 0.1 * CONSTANTS.KM_PER_AU;
const xGradientStart = getXPosForKm(inner - bufferAU_in_km, scale);
const xGradientEnd = getXPosForKm(outer + bufferAU_in_km, scale);

const gradientWidth = xGradientEnd - xGradientStart;

// Calculate the relative percentages of the HZ boundaries within the full gradient span
const startPercent = ((xHZInner - xGradientStart) / gradientWidth) * 100;
const endPercent = ((xHZOuter - xGradientStart) / gradientWidth) * 100;

let hzDefsSvg = `
  <defs>
    <linearGradient id="hzGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4f4" stop-opacity="0" />
      
      <stop offset="${startPercent.toFixed(1)}%" stop-color="#4f4" stop-opacity="0.2" />
      
      <stop offset="${endPercent.toFixed(1)}%" stop-color="#4f4" stop-opacity="0.2" />
      
      <stop offset="100%" stop-color="#4f4" stop-opacity="0" />
    </linearGradient>
  </defs>
`;

let hzDrawSvg = `
  <g class="habitable-zone">
    <rect x="${xGradientStart}" y="30" width="${gradientWidth}" height="${SVG_HEIGHT}" 
          fill="url(#hzGradient)" stroke="none" />
    
    <line x1="${xHZInner}" y1="30" x2="${xHZInner}" y2="${SVG_HEIGHT}" stroke="#4f4" stroke-width="0.5" opacity="0.6" />
    <line x1="${xHZOuter}" y1="30" x2="${xHZOuter}" y2="${SVG_HEIGHT}" stroke="#4f4" stroke-width="0.5" opacity="0.6" />

    <text x="${(xHZInner + xHZOuter) / 2}" y="25" fill="#4f4" font-size="9" text-anchor="middle" font-family="monospace">
      HABITABLE ZONE
    </text>
  </g>
`;

return hzDefsSvg + hzDrawSvg
}



function placeAndCreateStars( system, settings, starsX, middleY ) {
     let starXPos = starsX
     let star1YPos = null
     let star1YCenter = null
     let star2YPos = null
     let star2YCenter = null
     let svg = ""
   
     if( system.meta.system_type ==  "SINGLE_STAR" ) {
        star1_data = generateStar( system.stars[0] )
        star1YPos = middleY  - star1_data.height / 2     
        star1YCenter = middleY

        svg += `<g transform="translate( ${starXPos}, ${star1YPos})">`
        svg += star1_data.svg
        svg += `</g>`
     } 
     else if ( system.meta.system_type == "DETACHED_BINARY" ) {
        star1_data = generateStar( system.stars[0] )
        star2_data = generateStar( system.stars[1] )
        pixelDistance = Math.min( settings.svgHeight / 3, 2* (star1_data.height + star2_data.height) ) 

        const totalMass = system.stars[0].mass + system.stars[1].mass;
        // The ratio determines how much of the distance is assigned to each side
        const d1 = pixelDistance * (system.stars[1].mass / totalMass);
        const d2 = pixelDistance * (system.stars[0].mass / totalMass);

	star1YPos = middleY - d1 - star1_data.height/2      
        star1YCenter = middleY - d1 
        svg += `<g transform="translate( ${starXPos}, ${star1YPos})">`
        svg += star1_data.svg
        svg += `</g>`

	star2YPos = middleY + d2 - star2_data.height/2      
        star2YCenter = middleY + d2 
        svg += `<g transform="translate( ${starXPos}, ${star2YPos})">`
        svg += star2_data.svg
        svg += `</g>`
     }
     else if ( system.meta.system_type == "CONTACT_BINARY" ) {  
      
        const [smaller_star, bigger_star ] = system.stars[0].radius < system.stars[1].radius ? 
                 [system.stars[0], system.stars[1]] : [system.stars[1], system.stars[0]];

        star1_data = generateStar( system.stars[0], false, false )
        star2_data = generateStar( system.stars[1], false, false )
        smaller_star_data = generateStar( smaller_star, false, false )


        pixelDistance = (star1_data.height + star2_data.height) / 2 - (smaller_star_data.height / 2)
 
        const totalMass = system.stars[0].mass + system.stars[1].mass;
        // The ratio determines how much of the distance is assigned to each side
        const d1 = pixelDistance * (system.stars[1].mass / totalMass);
        const d2 = pixelDistance * (system.stars[0].mass / totalMass);


        svg += `<defs>
  <filter id="contact-binary-filter">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
    <feColorMatrix in="blur" mode="matrix" 
                   values="1 0 0 0 0  
                           0 1 0 0 0  
                           0 0 1 0 0  
                           0 0 0 25 -10" result="goo" />
    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
  </filter>

<clipPath id="haloClip">
    <rect 
      x="${starXPos}" 
      y="0" 
      width="300" 
      height="${settings.svgHeight}" />
  </clipPath>

<radialGradient id="haloGradient">
    <stop offset="0%" stop-color="${bigger_star.color}" stop-opacity="0.5" />
    <stop offset="40%" stop-color="${bigger_star.color}" stop-opacity="0.3" />
    <stop offset="100%" stop-color="${bigger_star.color}" stop-opacity="0" />
  </radialGradient>
</defs>`

     
	star1YPos = middleY - d1 - star1_data.height / 2       
        star1YCenter = middleY - d1 

	star2YPos = middleY + d2 - star2_data.height / 2       
        star2YCenter = middleY + d2 


	r1 =  star1_data.height
        r2 =  star2_data.height

// The width (rx) covers the distance between stars plus a padding
// The height (ry) remains roughly constant based on the star sizes
const rx = Math.max(r1, r2) * 1.2;  
const ry = (pixelDistance / 2) + (r1 * 2);

const haloSVG = `
  <ellipse 
    cx="${starXPos}" 
    cy="${star1YPos+r1}" 
    rx="${rx}" 
    ry="${ry}" 
    fill="url(#haloGradient)"
    clip-path="url(#haloClip)"
    style="mix-blend-mode: screen; filter: blur(10px);" />
`;

      svg += `${haloSVG}`
      svg += `<g filter="url(#contact-binary-filter)">` 
        svg += `<g transform="translate( ${starXPos}, ${star1YPos})">`
        svg += star1_data.svg
        svg += `</g>`

        svg += `<g transform="translate( ${starXPos}, ${star2YPos})">`
        svg += star2_data.svg
        svg += `</g>`

      svg += `</g>`

     } else if( system.meta.system_type == "SEMI_DETACHED_BINARY") {

        star1_data = generateStar( system.stars[0] )
        star2_data = generateStar( system.stars[1] )
        const [smaller_star, bigger_star ] = system.stars[0].radius < system.stars[1].radius ? 
                 [system.stars[0], system.stars[1]] : [system.stars[1], system.stars[0]];
        smaller_star_data =  generateStar( smaller_star )
        bigger_star_data  =  generateStar( bigger_star )

        pixelDistance = 100;   

        const totalMass = system.stars[0].mass + system.stars[1].mass;
        // The ratio determines how much of the distance is assigned to each side
        const d1 = pixelDistance * (system.stars[1].mass / totalMass);
        const d2 = pixelDistance * (system.stars[0].mass / totalMass);

	star1YPos = middleY - d1 - star1_data.height     // 2       
        star1YCenter = middleY - d1 

	star2YPos = middleY + d2 + star2_data.height     // 2       
        star2YCenter = middleY + d2 

// Calculate the L1 point (simplified: distance based on mass ratio)
// q = mass2 / mass1
const q = smaller_star.mass / bigger_star.mass;
const rL1 = pixelDistance * (0.5 - 0.227 * Math.log10(q));


const rectWidth = bigger_star_data.width;
const rectHeight = bigger_star_data.height;

// 1. Determine which horizontal face of the rectangle faces the circle
const innerY = (bigger_star_data.y_pos < smaller_star_data.y_pos) 
               ? star1YPos + (rectHeight / 2) // Bottom face
               : star1YPos - (rectHeight / 2); // Top face

// 2. Define the left and right corners of that face
const leftX = 70 //bigger_star.x - (rectWidth / 2);
const rightX = 100  //bigger_star.x + (rectWidth / 2);

// 3. The Target (Center of the smaller circle)
const targetX = starXPos + 20 //smaller_star_data.x_pos;
const targetY = star2YPos;

// 4. The Path
// Starts at the left corner, curves to the target, curves to the right corner
const verticalFunnelPath = `
  M ${leftX} ${innerY}
  C ${leftX} ${targetY}, ${targetX - 2} ${targetY}, ${targetX} ${targetY}
  C ${targetX + 2} ${targetY}, ${rightX} ${targetY}, ${rightX} ${innerY}
  Z
`;

const bridgeGradientSVG = `<defs>
<linearGradient id="accelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#ff7b00" stop-opacity="0.6" />
    <stop offset="60%" stop-color="#ffffff" stop-opacity="0.8" />
    <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
  </linearGradient>

  <radialGradient id="bridgeGradient">
    <stop offset="0%" stop-color="white" stop-opacity="0.8" />
    <stop offset="50%" stop-color="white" stop-opacity="0.3" />
    <stop offset="100%" stop-color="white" stop-opacity="0" />
  </radialGradient>
</defs>`

const verticalFunnel = `<path 
      d="${verticalFunnelPath}" 
      fill="url(#accelGradient)" 
      style="filter: blur(0px); mix-blend-mode: screen;" 
      opacity="0.8" />`


        svg += bridgeGradientSVG
        svg += verticalFunnel

        //svg += generateSBridgeBinarySVG(  system.stars[0],  system.stars[1])
       
        star1_data = generateStar( system.stars[0] )
       
        svg += `<g transform="translate( ${starsX}, ${star1YPos})">`
        svg += star1_data.svg
        svg += `</g>`

        star2_data = generateStar( system.stars[1] )
        svg += `<g transform="translate( ${starsX}, ${star2YPos})">`
        svg += star2_data.svg
        svg += `</g>`


     }


     //add label if multiple stars
     if( system.meta.system_type != "SINGLE_STAR" ) {
        svg += `<g fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
            <text x="${SVG_PADDING}" y="${star1YCenter}" text-anchor="start">
                ${system.stars[0].designation}
            </text>
            <text x="${SVG_PADDING}" y="${star2YCenter}" text-anchor="start">
                ${system.stars[1].designation}
            </text>
            </g>`
      }

   return svg
}




function visualizeSystem( system, settings ) {
    
     SVG_WIDTH=settings.svgWidth
     SVG_HEIGHT=settings.svgHeight
     SVG_PADDING = 20


     const starArea = 200
     const barycenterX = (starArea/3)*2
     const barycenterY = SVG_HEIGHT / 2
     const starsX = starArea / 3
     const middleY = SVG_HEIGHT / 2;

     placedOrbitsResult = placeOrbits( system.boundaries.innermostStableOrbit , system.orbits, SVG_WIDTH-starArea, SVG_HEIGHT )
     scale = placedOrbitsResult.scale

     distanceScaleSvg = createDistanceScale( scale )
     SVG_WIDTH = Math.max( SVG_WIDTH, starArea+placedOrbitsResult.width)

     svg = "";
     svg += `<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}">`
     svg += `<g fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
            <text x="${SVG_WIDTH - SVG_PADDING }" y="${SVG_PADDING}" text-anchor="end">
                ${system.meta.designation}
            </text>
            <text x="${SVG_WIDTH - SVG_PADDING }" y="${SVG_PADDING + 28}" text-anchor="end">
                GSC: xrS-434534-43 
            </text>
        </g>`
     //Ecliptic
     if( settings.showEcliptic ) {
     svg += `<line x1="0" 
             y1="${middleY}" 
             x2="${SVG_WIDTH}" 
             y2="${middleY}" 
             stroke="white" 
             stroke-width="1" 
             stroke-dasharray="5,5" />`;
     }
     if( settings.showInnermostStableOrbit ) {
        svg += `<line x1="${starArea}" 
             y1="0" 
             x2="${starArea}" 
             y2="${SVG_HEIGHT}" 
             stroke="red" 
             stroke-width="1" 
             stroke-dasharray="5,5" />`;
     }

     svg += placeAndCreateStars( system, settings, starsX, middleY )

     //barycenter
     if( settings.showBarycenter ) {
     svg +=`<line x1="${barycenterX}" 
             y1="${middleY-10}" 
             x2="${barycenterX}" 
             y2="${middleY+10}" 
             stroke="green" 
             stroke-width="3" />`;
     svg +=`<line x1="${barycenterX -10}" 
             y1="${middleY}" 
             x2="${barycenterX + 10}" 
             y2="${middleY}" 
             stroke="green" 
             stroke-width="3" />`;
     }

     if( settings.showFrostLine && system.boundaries.frostLine > system.boundaries.innermostStableOrbit ) {
        svg += createFrostLine( system.boundaries.frostLine, scale ) 
     }  
     if( settings.showHabitableZone && system.boundaries.habitableZone.outer > system.boundaries.innermostStableOrbit ) {  
        svg += createHabitableZone( system.boundaries.habitableZone.inner, system.boundaries.habitableZone.outer , scale )
     }
     if( settings.showDistanceScale ) {
         svg += distanceScaleSvg
     }
     svg += `<g transform="translate(${starArea}, 0)">`
     svg += placedOrbitsResult.svg //placeOrbits( system.boundaries.innermostStableOrbit , system.orbits, SVG_WIDTH-starArea, SVG_HEIGHT )
     svg += `</g>`

     svg += `</svg>`



     document.getElementById('svgWrapper').innerHTML = svg
  
}
