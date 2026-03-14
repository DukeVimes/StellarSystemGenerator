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



