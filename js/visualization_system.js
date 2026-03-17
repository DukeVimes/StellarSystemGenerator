


function calculatePositionsLogarithmic(planets, svgWidth, dMin, dMax) {
  let lastX = 0; // Start at the Sun


  return planets.map((p, index) => {
    // 1. Calculate Ideal Logarithmic Position
    const ratio = (Math.log(p.data.distance) - Math.log(dMin)) / (Math.log(dMax) - Math.log(dMin));
    let idealX = ratio * svgWidth;

    // 2. Collision Avoidance (The Nudge)
    // If this is the first planet, it just needs to be MIN_SPACING from the Sun
    // otherwise it has to be at least as far as previous position + width of the element
    let finalX = Math.max(idealX, lastX) + p.visual.width / 2;

    lastX = finalX; // Update for the next neighbor
    return { ...p, x_pos: finalX };
  });
}


function calculatePositionsEvenlyDistributed(planets, svgWidth, minWidth) {
  numberOfPlanets = planets.length
  if (minWidth <= 0.8 * svgWidth) {
    deltaX = svgWidth / (numberOfPlanets + 1)
    return planets.map((p, index) => {
      finalX = (index + 1) * deltaX
      return { ...p, x_pos: finalX }
    })
  } else {
    lastX = 0
    return planets.map((p, index) => {
      finalX = lastX + p.visual.width / 2
      lastX = finalX + p.visual.width / 2
      return { ...p, x_pos: finalX }
    })
  }


}




function placeOrbits(roche_limit, orbits, available_width, height) {

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

  for (const orbit of orbits) {
    let rp = null
    if (["DWARF_PLANET", "GAS_GIANT", "ICE_GIANT", "TERRESTIAL_PLANET"].includes(orbit.type)) {
      rp = visualizePlanetarySystem(orbit)
    }
    else if (orbit.type === "ASTEROID_BELT") {
      rp = visualizeAsteroidBelt(orbit)
    }

    if( rp ) {
      min_needed_width += rp.width
      orbital_objects.push({ data: orbit, visual: rp })
    }
  }

  //now we have all the svg-objects, their width, the sum of all width, min and maximum distance
  // in phase 2 we can now position the objects an build an x-Axis!
  //positionedOrbits = calculatePositionsLogarithmic( orbital_objects, available_width, roche_limit, max_distance )
  positionedOrbits = calculatePositionsEvenlyDistributed(orbital_objects, available_width, min_needed_width)

  let finalOrbit = positionedOrbits.at(-1);
  neededPixels = finalOrbit.x_pos + finalOrbit.visual.width / 2
  const SVG_WIDTH = Math.max(available_width, neededPixels);

  distance_scale = []
  for (const pos_orbit of positionedOrbits) {
    console.log(pos_orbit)
    distance_scale.push({ "distance": pos_orbit.data.distance, "x_pos": pos_orbit.x_pos })
    svg += `<g transform="translate(${pos_orbit.x_pos - pos_orbit.visual.width / 2}, ${height / 2 - pos_orbit.visual.center_y})">
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




function createDistanceScale(scale) {


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



function createFrostLine(frostLineKm, scale, SVG_HEIGHT = 700) {
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



function createHabitableZone(inner, outer, scale, SVG_HEIGHT = 700) {
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




function assignLanes(planets) {
  // 1. Sort by the start of the range (r_min)
  const sorted = [...planets].sort((a, b) => a.r_min - b.r_min);

  // 2. Track the "end point" of the last planet placed in each lane
  const laneEnds = [];

  return sorted.map(planet => {
    let assignedLane = 0;

    // 3. Find the first lane where this planet doesn't overlap with the last one
    // We add a small 'padding' so the lines don't touch tip-to-tail
    const padding = 10;

    while (laneEnds[assignedLane] > planet.r_min - padding) {
      assignedLane++;
    }

    // 4. Update the lane's end point to this planet's max range
    laneEnds[assignedLane] = planet.r_max;

    return { ...planet, lane: assignedLane };
  });
}




function visualizeSystem(system, settings) {

  SVG_WIDTH = settings.svgWidth
  SVG_HEIGHT = settings.svgHeight
  SVG_PADDING = 20


  const starArea = 200
  const barycenterX = (starArea / 3) * 2
  const barycenterY = SVG_HEIGHT / 2
  const starsX = starArea / 3
  const middleY = SVG_HEIGHT / 2;

  placedOrbitsResult = placeOrbits(system.boundaries.innermostStableOrbit, system.orbits, SVG_WIDTH - starArea, SVG_HEIGHT)
  scale = placedOrbitsResult.scale

  distanceScaleSvg = createDistanceScale(scale)
  SVG_WIDTH = Math.max(SVG_WIDTH, starArea + placedOrbitsResult.width)

  svg = "";
  svg += `<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}">`
  svg += `<g fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
            <text x="${SVG_WIDTH - SVG_PADDING}" y="${SVG_PADDING}" text-anchor="end">
                ${system.meta.designation}
            </text>
            <text x="${SVG_WIDTH - SVG_PADDING}" y="${SVG_PADDING + 28}" text-anchor="end">
                GSC: xrS-434534-43 
            </text>
        </g>`
  //Ecliptic
  if (settings.showEcliptic) {
    svg += `<line x1="0" 
             y1="${middleY}" 
             x2="${SVG_WIDTH}" 
             y2="${middleY}" 
             stroke="white" 
             stroke-width="1" 
             stroke-dasharray="5,5" />`;
  }
  if (settings.showInnermostStableOrbit) {
    svg += `<line x1="${starArea}" 
             y1="0" 
             x2="${starArea}" 
             y2="${SVG_HEIGHT}" 
             stroke="red" 
             stroke-width="1" 
             stroke-dasharray="5,5" />`;
  }

  svg += placeAndCreateStars(system, settings, starsX, middleY)

  //barycenter
  if (settings.showBarycenter) {
    svg += `<line x1="${barycenterX}" 
             y1="${middleY - 10}" 
             x2="${barycenterX}" 
             y2="${middleY + 10}" 
             stroke="green" 
             stroke-width="3" />`;
    svg += `<line x1="${barycenterX - 10}" 
             y1="${middleY}" 
             x2="${barycenterX + 10}" 
             y2="${middleY}" 
             stroke="green" 
             stroke-width="3" />`;
  }

  if (settings.showFrostLine && system.boundaries.frostLine > system.boundaries.innermostStableOrbit) {
    svg += createFrostLine(system.boundaries.frostLine, scale)
  }
  if (settings.showHabitableZone && system.boundaries.habitableZone.outer > system.boundaries.innermostStableOrbit) {
    svg += createHabitableZone(system.boundaries.habitableZone.inner, system.boundaries.habitableZone.outer, scale)
  }
  if (settings.showDistanceScale) {
    svg += distanceScaleSvg
  }
  svg += `<g transform="translate(${starArea}, 0)">`
  svg += placedOrbitsResult.svg //placeOrbits( system.boundaries.innermostStableOrbit , system.orbits, SVG_WIDTH-starArea, SVG_HEIGHT )
  svg += `</g>`

  svg += `</svg>`



  document.getElementById('svgWrapper').innerHTML = svg

}
