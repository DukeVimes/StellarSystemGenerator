

/**
 * Interpolates a Hex color based on a temperature value.
 * @param {number} temp - The current star temperature.
 * @param {number} minT - Minimum temperature bound.
 * @param {number} maxT - Maximum temperature bound.
 * @param {string} minHex - Hex code for min temperature (e.g., "#ff0000").
 * @param {string} maxHex - Hex code for max temperature (e.g., "#0000ff").
 */
function getStarColor(temp, minT, maxT, minHex, maxHex) {
    // 1. Clamp temperature so it doesn't go out of bounds
    const t = Math.max(minT, Math.min(maxT, temp));

    // 2. Calculate the interpolation factor (0.0 to 1.0)
    const factor = (t - minT) / (maxT - minT);

    // 3. Helper to parse Hex to RGB
    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    };

    const start = hexToRgb(minHex);
    const end = hexToRgb(maxHex);

    // 4. Interpolate each channel
    const r = Math.round(start.r + factor * (end.r - start.r));
    const g = Math.round(start.g + factor * (end.g - start.g));
    const b = Math.round(start.b + factor * (end.b - start.b));

    // 5. Convert back to Hex
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}


function getRealisticStarColor(currentTemp) {
    // 1. Find the two stops the temperature falls between
    let lower = STAR_GRADIENT[0];
    let upper = STAR_GRADIENT[STAR_GRADIENT.length - 1];

    for (let i = 0; i < STAR_GRADIENT.length - 1; i++) {
        if (currentTemp >= STAR_GRADIENT[i].temp && currentTemp <= STAR_GRADIENT[i + 1].temp) {
            lower = STAR_GRADIENT[i];
            upper = STAR_GRADIENT[i + 1];
            break;
        }
    }

    // 2. Interpolate between those two specific colors
    return getStarColor(currentTemp, lower.temp, upper.temp, lower.hex, upper.hex);
}



/**
 * Calculates which gases remain in a planet's atmosphere.
 * @param {number} surfaceTemp - Temperature in Kelvin.
 * @param {number} escapeVelocity - Planet escape velocity in m/s (Earth is ~11186).
 * @returns {Array} List of gases present in the atmosphere.
 */
/**
 * Processes chemical states and generates atmosphere.
 */
function getPlanetChemistry(surfaceTemp, escapeVelocity, threshold = 0.01) {
    const R = 8.314;
    const RETENTION_FACTOR = 6;

    let gaseousCandidates = [];
    let stateSummary = { gas: [], liquid: [], solid: [] };

    for (const [name, gas] of Object.entries(GAS_PROPERTIES)) {
        let state = "";

        // Determine Physical State
        if (surfaceTemp <= gas.freeze) {
            state = "solid";
        } else if (surfaceTemp <= gas.boil) {
            state = "liquid";
        } else {
            state = "gas";
        }

        stateSummary[state].push(name);

        // If it's a gas, check if it's heavy enough to be retained
        if (state === "gas") {
            const vTh = Math.sqrt((2 * R * surfaceTemp) / (gas.molarMass / 1000));
            if (escapeVelocity > (vTh * RETENTION_FACTOR)) {
                gaseousCandidates.push([name, gas]);
            }
        }
    }

    return {
        states: stateSummary,
        atmosphere: generateRandomComposition(gaseousCandidates, threshold)
    };
}



/**
 * Calculates Roche Limit using densities.
 * @param {number} R_M - Radius of the primary body (km)
 * @param {number} rho_M - Density of the primary body (kg/km^3)
 * @param {number} rho_m - Density of the satellite (kg/km^3)
 * @param {boolean} isFluid - Whether to use fluid (true) or rigid (false) formula.
 */
function rocheByDensity(R_M, rho_M, rho_m, isFluid = true) {
    const constant = isFluid ? 2.44 : 1.26;
    return constant * R_M * Math.pow(rho_M / rho_m, 1 / 3);
}


/**
 * Calculates Roche Limit using the mass of the primary.
 * @param {number} M - Mass of the primary body (kg)
 * @param {number} R_M - Radius of the primary body (km)
 * @param {number} rho_m - Density of the satellite (kg/km^3)
 * @param {boolean} isFluid - Whether to use fluid (true) or rigid (false) formula.
 */
function rocheByMass(M, R_M, rho_m, isFluid = true) {
    const constant = isFluid ? 2.44 : 1.26;

    // Density of Primary (rho_M) = M / Volume
    const volume_M = (4 / 3) * Math.PI * Math.pow(R_M, 3);
    const rho_M = M / volume_M;

    return constant * R_M * Math.pow(rho_M / rho_m, 1 / 3);
}


/**
 * Checks the binary configuration type.
 * @param {number} sepAU - Separation in AU
 * @param {number} r1Solar - Radius of star 1
 * @param {number} r2Solar - Radius of star 2
 */
function getBinaryStatus(sepAU, r1Solar, r2Solar) {
    const AU_TO_SOLAR_RADIUS = 215.032;
    const sepSolar = sepAU * AU_TO_SOLAR_RADIUS;
    const combinedRadius = r1Solar + r2Solar;

    if (sepSolar <= combinedRadius * 1.1) return "CONTACT";
    if (sepSolar <= combinedRadius * 2.0) return "SEMI-DETACHED";
    return "DETACHED";
}

/**
 * Berechnet den Roche-Lobe-Radius nach Peter Eggleton (1983).
 * @param {number} a - Orbitaler Abstand (große Halbachse).
 * @param {number} m1 - Masse des Sterns, dessen Roche-Lobe berechnet wird.
 * @param {number} m2 - Masse des Begleitsterns.
 * @returns {number} Der effektive Radius RL.
 */
function getEggletonRL(a, m1, m2) {
    const q = m1 / m2;

    // Vorbereiten der Potenzen für bessere Lesbarkeit und Performance
    const q13 = Math.pow(q, 1 / 3);
    const q23 = q13 * q13; // q^(2/3) ist dasselbe wie (q^(1/3))^2

    const numerator = 0.49 * q23;
    const denominator = 0.6 * q23 + Math.log(1 + q13);

    return a * (numerator / denominator);
}

//use this for both stars as donors, the smaller distance would close enough for a contact binary
/**
 * Berechnet den Roche-Lobe-Radius nach Peter Eggleton (1983).
 */
function getMaxDistanceForSemiDetached(rDonor, mDonor, mRecipient) {
    const q = mDonor / mRecipient;
    const q23 = Math.pow(q, 2 / 3);
    const q13 = Math.pow(q, 1 / 3);

    const eggletonFactor = (0.49 * q23) / (0.6 * q23 + Math.log(1 + q13));

    return rDonor / eggletonFactor;
}

function calculateRequiredDistance(star1, star2, targetState) {
    const star1_donor_dist = getMaxDistanceForSemiDetached(star1.radius, star1.mass, star2.mass);
    const star2_donor_dist = getMaxDistanceForSemiDetached(star2.radius, star2.mass, star1.mass);

    switch (targetState) {
        case 'SEMI_DETACHED_BINARY':
            contact_distance = Math.min(star1_donor_dist, star2_donor_dist)
            max_distance_semi_detached = star2_donor_dist
            // Value of the larger of the stars
            if (star1.radius > star2.radius) {
                max_distance_semi_detached = star1_donor_dist
            }
            return getUniformRandomBetween(contact_distance, max_distance_semi_detached)

        case 'CONTACT_BINARY':
            // Der Abstand muss klein genug sein, damit beide/der kritische Stern überlaufen
            return Math.min(star1_donor_dist, star2_donor_dist) * 0.95; // 5% Puffer für echten Kontakt

        case 'DETACHED_BINARY':
            // Abstand groß genug, dass der massereichste/größte Stern viel Platz hat
            min = Math.max(star1_donor_dist, star2_donor_dist) * 2.0;
            max = (star1.radius + star2.radius) * 5;
            return getUniformRandomBetween(min, max)
    }
}


/**
 * Berechnet die Umlaufdauer eines Doppelsternsystems.
 * @param {number} a - Große Halbachse (Abstand) in Sonnenradien (R_sun).
 * @param {number} m1 - Masse Stern 1 in Sonnenmassen (M_sun).
 * @param {number} m2 - Masse Stern 2 in Sonnenmassen (M_sun).
 * @returns {number} Umlaufdauer in Tagen.
 */
function calculateOrbitalPeriodBinary(a, m1, m2) {
    // Gravitationskonstante in Einheiten von R_sun, M_sun und Tagen:
    //G ≈ 2942.206 (R_sun^3 / (M_sun * d^2))
    const G_SPECIAL = 2942.206;

    const sumMass = m1 + m2;
    const pSquared = (4 * Math.PI ** 2 * Math.pow(a, 3)) / (G_SPECIAL * sumMass);

    return Math.sqrt(pSquared);
}


/**
 * Generates binary separation based on desired physical state probabilities.
 * @param {Object} s1 - Primary star (needs radius)
 * @param {Object} s2 - Secondary star (needs radius)
 * @returns {number} Separation in AU
 */
function generateBinarySeparation(s1, s2) {
    const AU_TO_SOLAR_RADIUS = 215.032;
    const combinedRadius = s1.radius + s2.radius;
    const roll = Math.random(); // 0.0 to 1.0

    let sepAU;

    if (roll <= 0.05) {
        // --- 5% CONTACT BINARY ---
        // Separation must be between 0.5x and 1.0x the combined radii
        const overlapFactor = 0.7 + (Math.random() * 0.3);
        sepAU = (combinedRadius * overlapFactor) / AU_TO_SOLAR_RADIUS;
        console.log("State: Contact Binary");
    }
    else if (roll <= 0.15) {
        // --- 10% CLOSE/SEMI-DETACHED ---
        // Separation between 1.1x and 3x combined radii
        const closeFactor = 1.1 + (Math.random() * 1.9);
        sepAU = (combinedRadius * closeFactor) / AU_TO_SOLAR_RADIUS;
        console.log("State: Semi-Detached / Close");
    }
    else {
        // --- 85% WIDE BINARY ---
        // Logarithmic distribution from 0.1 AU to 100 AU
        const minLog = Math.log10(0.1);
        const maxLog = Math.log10(100);
        const randomLog = minLog + Math.random() * (maxLog - minLog);
        sepAU = Math.pow(10, randomLog);
        console.log("State: Wide Binary");
    }

    return parseFloat(sepAU.toFixed(6));
}


/**
 * Calculates the Critical Radius for orbital stability in a binary system.
 * Based on Holman & Wiegert (1999).
 * Works for planets orbiting binary stars OR moons orbiting binary planets.
 * * @param {number} m1 - Mass of the larger primary body
 * @param {number} m2 - Mass of the smaller secondary body
 * @param {number} separation - Distance between m1 and m2 (AU or km)
 * @param {number} e - Eccentricity of the binary pair's orbit (0 to 1)
 * @returns {number} The minimum stable orbital radius in the same units as separation.
 */
function calculateCriticalOrbit(m1, m2, separation, e = 0) {
    // 1. Calculate the mass ratio mu
    // mu ranges from 0 (m2 is negligible) to 0.5 (equal masses)
    const mu = m2 / (m1 + m2);

    console.log("Mu" + mu)

    // 2. Holman & Wiegert 1999 Stability Coefficients
    // This polynomial determines the multiplier for the separation distance
    const term1 = 1.6;
    const term2 = 5.1 * e;
    const term3 = (-2.27 + 1.59 * e) * mu;
    const term4 = (4.12 - 4.27 * e) * Math.pow(mu, 2);

    const multiplier = term1 + term2 + term3 + term4;

    console.log("multiplier" + multiplier)
    console.log("separation" + separation)
    // 3. Resulting radius
    // Anything inside this value is unstable and will be ejected.
    return separation * multiplier;
}


/**
 * Determines if a star will shed material onto its companion.
 * @param {number} m1 - Mass of the star being checked (e.g. SUN_MASS)
 * @param {number} m2 - Mass of the companion star
 * @param {number} orbitalSeparation - Distance between the centers of the stars (km)
 * @param {number} r1 - Physical radius of the star being checked (km)
 * @returns {Object} { willExchange: boolean, rocheLobeRadius: number, fillFactor: number }
 */
function checkMassTransfer(m1, m2, orbitalSeparation, r1) {
    const q = m1 / m2; // Mass ratio
    const q13 = Math.pow(q, 1 / 3);
    const q23 = Math.pow(q, 2 / 3);

    // Eggleton's Formula for the Roche Lobe radius
    const rL = orbitalSeparation * (0.49 * q23) / (0.6 * q23 + Math.log(1 + q13));

    return {
        willExchange: r1 >= rL,
        rocheLobeRadius: Number(rL.toFixed(2)),
        // How much of the Lobe is filled (1.0 or higher means overflow)
        fillFactor: Number((r1 / rL).toFixed(3))
    };
}



/**
 * Calculates the distance of two bodies to their common barycenter.
 * @param {number} mass1 - Mass of the first body.
 * @param {number} mass2 - Mass of the second body.
 * @param {number} totalDistance - Distance between the centers of the two bodies (km, AU, etc.).
 * @returns {Object} Distances r1 (from body 1) and r2 (from body 2).
 */
function calculateBarycenterDistances(mass1, mass2, totalDistance) {
    const totalMass = mass1 + mass2;

    if (totalMass === 0) return { r1: 0, r2: 0 };

    // Distance from Body 1 to Barycenter
    const r1 = totalDistance * (mass2 / totalMass);

    // Distance from Body 2 to Barycenter
    const r2 = totalDistance * (mass1 / totalMass);

    return {
        r1: r1,
        r2: r2,
        totalDistance: totalDistance
    };
}



/**
 * Determines if a moon-planet system is stable enough to host Trojans. If not it is a binary-Planet!
 * @param {number} planetMass - Mass of the primary body (e.g., JUPITER_MASS)
 * @param {number} moonMass - Mass of the secondary body (e.g., EUROPA_MASS)
 * @returns {Object} { canHaveTrojans: boolean, massRatio: number }
 */
function canHostTrojans(planetMass, moonMass) {
    const totalMass = planetMass + moonMass;
    const massRatio = moonMass / totalMass;

    // The theoretical stability limit for L4/L5 is mu < 0.03852..., the Gascheau Limit
    const STABILITY_LIMIT = 0.0385208965;

    return {
        canHaveTrojans: massRatio < STABILITY_LIMIT,
        massRatio: massRatio,
        limit: STABILITY_LIMIT
    };
}



/**
 * Calculates thermal boundaries based on stellar luminosity.
 * @param {number} =total_luminosity - Luminosity of the both stars  (relative to SUN = 1.0)
 * @returns {Object} Boundaries in AU (Astronomical Units)
 */
function calculateStellarThermalBoundaries(total_luminosity) {

    // 1. Normalize to Sun Units
    const totalLuminositySun = total_luminosity / CONSTANTS.SUN_LUMINOSITY

    // 2. The critical "Scale" factor (Inverse Square Law)
    const scale = Math.sqrt(totalLuminositySun);

    // Base distances in AU (for our Sun)
    const baseFrostLineAU = 2.7;
    const baseHZInnerAU = 0.95;
    const baseHZOuterAU = 1.37;

    return {
        totalLuminosity: total_luminosity,
        totalLuminositySun: Number(totalLuminositySun.toFixed(2)),
        //scaleFactor: scale,

        // KM values (For your getXFromKm function)
        frostLine: (baseFrostLineAU * scale) * CONSTANTS.KM_PER_AU,
        frostLineAU: Number((baseFrostLineAU * scale).toFixed(3)),

        habitableZone: {
            inner: (baseHZInnerAU * scale) * CONSTANTS.KM_PER_AU,
            outer: (baseHZOuterAU * scale) * CONSTANTS.KM_PER_AU,
            innerAU: Number((baseHZInnerAU * scale).toFixed(3)),
            outerAU: Number((baseHZOuterAU * scale).toFixed(3))
        },


    };
}


/**
 * Calculates the maximum stable orbital distance (Hill Sphere) for a star.
 * @param {number} starMass - Mass of the star (kg)
 * @param {number} galCenterDistLY - Distance to galactic center in Light Years (default: 26000)
 * @returns {number} Maximum distance in AU
 */
function calculateMaxOrbitalDistance(starMass, galCenterDistLY = 26000) {
    // Estimate Galactic Mass enclosed within the star's orbit 
    // (Roughly 1e11 solar masses for our position in the Milky Way)
    const galacticMassEnclosed = 1e11 * CONSTANTS.SUN_MASS;

    // Convert Light Years to AU
    const orbitalRadius = galCenterDistLY * CONSTANTS.AU_PER_LY * CONSTANTS.KM_PER_AU;

    // 2. Hill Sphere Calculation: r = a * cuberoot(m / 3M)
    const hillRadius = orbitalRadius * Math.pow(starMass / (3 * galacticMassEnclosed), 1 / 3);

    // 3. Stability factor: In reality, orbits are only stable long-term 
    // up to about 1/2 to 1/3 of the Hill Radius due to perturbations.
    return {
        theoreticalLimitAU: Number((hillRadius / CONSTANTS.KM_PER_AU).toFixed(2)),
        stableLimitAU: Number((hillRadius / (3 * CONSTANTS.KM_PER_AU)).toFixed(2)),   //Lund Limit
        theoreticalLimitKM: Number(hillRadius.toFixed(2)),
        stableLimitKM: Number((hillRadius / 3).toFixed(2))
    };
}


/**
 * Calculates the Hill Sphere and stable orbital limit for a planet.
 * @param {number} planetMass - Mass of the planet (kg)
 * @param {number} starMass - Mass of the star (kg)
 * @param {number} orbitalDistanceAU - Distance from star in AU
 * @returns {Object} Boundaries in km
 */
function calculatePlanetHillSphere(planetMass, starMass, orbitalDistanceAU) {
    // Convert AU to km (1 AU ≈ 149,597,871 km)
    const distanceKM = orbitalDistanceAU * CONSTANTS.KM_PER_AU

    // Hill Sphere Formula
    const hillRadius = distanceKM * Math.pow(planetMass / (3 * starMass), 1 / 3);

    return {
        hillSphereRadiusKM: Number(hillRadius.toFixed(2)),
        // The "Lund Limit" / Stable Zone (approx 1/3 of Hill Sphere)
        stableLimitKM: Number((hillRadius / 3).toFixed(2)),
        stableLimitAU: Number(((hillRadius / 3) / CONSTANTS.KM_PER_AU).toFixed(6))
    };
}



/**
 * Distributes a Poisson-calculated number of planets with an inner-system bias.
 * @param {number} count - Total planets (from your getPoissonPlanetCount function)
 * @param {number} rocheLimit - The inner absolute limit (AU or km)
 * @param {number} hillSphere - The outer absolute limit (AU or km)
 * @param {number} bias - Higher numbers (e.g., 2.0) cluster planets tighter to the star
 */
function distributePlanetsInnerBias(count, rocheLimit, hillSphere, bias = 2.5) {
    const orbits = [];
    const totalAvailableSpace = hillSphere - rocheLimit;

    for (let i = 0; i < count; i++) {
        // 1. Create a raw random value 0 to 1
        let rawLocation = Math.random();

        // 2. Apply Power Bias: Raising to a power > 1 pushes values toward 0 (the inner limit)
        // This simulates a "Log-Normal" style distribution
        let biasedLocation = Math.pow(rawLocation, bias);
        let orbit = rocheLimit + (biasedLocation * totalAvailableSpace);

        orbits.push(Math.round(orbit));
    }

    // Sort orbits so Planet 1 is the innermost
    return orbits.sort((a, b) => a - b);
}


function calculateEscapeVelocity(mass, radius) {
    if (radius <= 0) {
        alert("invalid radius")
        return 0
    }
    //console.log("Input Mass:", mass);
    //console.log("Input Radius:", radius);
    //console.log("G Constant:", CONSTANTS.G);
    // Calculate the parts separately
    const numerator = 2 * CONSTANTS.G * mass;
    const denominator = radius * 1000;

    //console.log("Numerator:", numerator);

    if (denominator === 0) return 0;

    const escV = Math.sqrt(numerator / denominator);
    //console.log("Result:", escV);

    return escV
}



function calculateSurfaceGravity(mass, radius) {



}





/**
 * Evaluates a planet's characteristics based on mass and radius.
 * @param {number} mass - Mass of the planet in kg.
 * @param {number} radius - Radius of the planet in meters.
 * @param {number} surfaceTemp - Average surface temperature in Kelvin.
 * @returns {object} - Analysis of atmosphere and surface.
 */
function analyzePlanet(mass, radius, surfaceTemp) {

    // 1. Calculate Escape Velocity: v_e = sqrt(2GM / R)
    const escapeVelocity = calculateEscapeVelocity(mass, radius)

    // 2. Calculate Thermal Velocity of Hydrogen (lightest gas): v_th = sqrt(3kT / m)
    const thermalVelocityH2 = Math.sqrt((3 * CONSTANTS.BOLTZMANN_K * surfaceTemp) / CONSTANTS.M_HYDROGEN);

    // 3. Determine Atmosphere Potential
    // Rule of thumb: Escape velocity must be ~6x thermal velocity to retain gas over billions of years.
    const canHoldAtmosphere = escapeVelocity > (thermalVelocityH2 * 6);

    // 4. Determine Surface Type
    // Generally, planets > 10 Earth masses tend to accumulate thick gas envelopes (Gas Giants).
    const isHardSurface = mass < (CONSTANTS.EARTH_MASS * 10);

    return {
        escapeVelocity: escapeVelocity.toFixed(2) + " m/s",
        hasAtmosphere: canHoldAtmosphere,
        hasHardSurface: isHardSurface,
        planetType: isHardSurface ? "Terrestrial/Rocky" : "Gas Giant/Gas Dwarf"
    };
}



/**
 * Calculates the equilibrium surface temperature of a planet.
 * @param {number} luminosity - Star luminosity in Watts (Sun ≈ 3.828e26).
 * @param {number} distance - Distance from star in meters (1 AU ≈ 1.496e11).
 * @param {number} albedo - Reflectivity of the planet (0 to 1).
 * @returns {number} - Temperature in Kelvin.
 */
function calculatePlanetTemp(luminosity, distance, albedo = 0.3) {

    // 1. Calculate the Solar Flux (Intensity) at the planet's distance
    // Flux = L / (4 * PI * d^2)
    const flux = luminosity / (4 * Math.PI * Math.pow(distance, 2));

    // 2. Apply the Equilibrium Temperature Formula:
    // T = [ (Flux * (1 - albedo)) / (4 * sigma) ] ^ (1/4)
    const tempK = Math.pow((flux * (1 - albedo)) / (4 * CONSTANTS.STEFAN_BOLTZMANN), 0.25);

    return {
        kelvin: Math.round(tempK),
        celsius: Math.round(tempK - 273.15),
        fahrenheit: Math.round((tempK - 273.15) * 9 / 5 + 32)
    };
}

// Example: Earth's parameters
//const sunLuminosity = 3.828e26; 
//Monday14?const earthDistance = 1.496e11; 
//const earthAlbedo = 0.3;
//console.log(calculatePlanetTemp(sunLuminosity, earthDistance, earthAlbedo));
// Output: ~255K (-18°C). 
// Note: Earth's actual avg is ~15°C due to the Greenhouse Effect!


/**
 * Calculates the orbital period of a planet.
 * @param {number} distance - Average distance (semi-major axis) in meters.
 * @param {number} starMass - Mass of the host star in kg (Sun ≈ 1.989e30).
 * @returns {number} - Orbital period in seconds.
 */
function calculateOrbitalPeriod(distance, starMass) {

    // Kepler's Third Law: P = 2 * PI * sqrt( a^3 / (G * M) )
    const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(distance, 3) / (CONSTANTS.G * starMass));

    return {
        seconds: periodSeconds,
        days: +(periodSeconds / 86400).toFixed(2),
        years: +(periodSeconds / 31557600).toFixed(4)
    };
}




/**
 * Generates axial tilt and rotation period based on orbital characteristics.
 * @param {object} p - The planet data object (needs orbitalPeriod and distance).
 * @param {boolean} isTidallyLocked - Whether the planet is locked to its star.
 * @returns {object} - Updated planet object with tilt and rotation.
 */
function determineRotation(p, isTidallyLocked = false) {
    let axisTilt;
    let rotationPeriod; // in seconds

    if (isTidallyLocked) {
        // Rule: Tidally locked planets have 0 tilt and day = year
        axisTilt = 0;
        rotationPeriod = p.orbitalPeriod;
    } else {
        // 1. Calculate Axis Tilt
        // "Usually < 20°, otherwise uniformly distributed (0-180°)"
        const chance = Math.random();
        if (chance < 0.8) {
            // 80% chance to be a "normal" stable planet (0 to 20 degrees)
            axisTilt = Math.random() * 20;
        } else {
            // 20% chance to be "wild" (uranus-style or retrograde)
            axisTilt = Math.random() * 180;
        }

        // 2. Determine System Plane (Incline)
        // Usually same as tilt, seldom different.
        const isOddball = Math.random() < 0.1; // 10% chance to differ
        p.orbitalInclination = isOddball ? Math.random() * 90 : axisTilt;

        // 3. Generate Rotation Period (Day length)
        // For non-locked planets, we'll randomize between 6 hours and 100 hours.
        // (In reality, this is influenced by collision history).
        rotationPeriod = (Math.random() * 94 + 6) * 3600;
    }

    p.axisTilt = axisTilt;
    p.rotationPeriod = rotationPeriod;
    p.rotationPeriodDays = roundTo(rotationPeriod / 3600 / 24) + " earth-days";
    p.isTidallyLocked = isTidallyLocked;

    return p;
}


function calculateAdvancedSolarDay(params) {
    const {
        pOrb,           // Planet's Year (hours)
        pRev = null,    // Moon's Month (hours)
        pRot = null,    // Sidereal Rotation (hours)
        orbRetro = false, // Planet orbits Sun backwards
        revRetro = false, // Moon orbits Planet backwards
        rotRetro = false, // Body spins backwards
        isTidallyLocked = false
    } = params;

    // 1. Calculate Angular Velocities (Degrees per Hour)
    // Planet's orbital velocity
    const wOrb = (orbRetro ? -360 : 360) / pOrb;

    // Moon's orbital velocity (0 if it's a planet)
    const wRev = pRev ? (revRetro ? -360 : 360) / pRev : 0;

    // 2. Determine Sidereal Rotation
    let siderealRotation = pRot;
    let currentRotRetro = rotRetro;

    if (isTidallyLocked) {
        if (pRev) {
            // Moon locks to its orbit around the planet
            siderealRotation = pRev;
            currentRotRetro = revRetro;
        } else {
            // Planet locks to its orbit around the sun
            siderealRotation = pOrb;
            currentRotRetro = orbRetro;
        }
    }

    const wRot = (currentRotRetro ? -360 : 360) / siderealRotation;

    // 3. The Solar Day Calculation
    // For the Sun to return to the same spot, we need the net rotation 
    // relative to the Sun's apparent position.
    const deltaW = Math.abs(wRot - wOrb);

    if (deltaW < 1e-10) return { solarDay: Infinity };

    return {
        solarDayHours: Number((360 / deltaW).toFixed(2)),
        siderealDayHours: Number(siderealRotation.toFixed(2)),
        isRetrogradeSpin: currentRotRetro
    };
}



function solvePlanet(data) {
    const p = { ...data };

    // 1. Calculate Temperature if missing (requires distance & luminosity)
    if (!p.temp && p.distance && p.luminosity) {
        const albedo = p.albedo || 0.3;
        const flux = p.luminosity / (4 * Math.PI * Math.pow(p.distance, 2));
        p.temp = Math.pow((flux * (1 - albedo)) / (4 * CONSTANTS.STEFAN_BOLTZMANN), 0.25);
    }

    // 2. Calculate Escape Velocity (requires mass & radius)
    if (!p.escapeVelocity && p.mass && p.radius) {
        p.escapeVelocity = Math.sqrt((2 * CONSTANTS.G * p.mass) / p.radius);
    }

    // 3. Determine Atmosphere (requires temp & escapeVelocity)
    if (p.temp && p.escapeVelocity) {
        const v_th = Math.sqrt((3 * CONSTANTS.BOLTZMANN_K * p.temp) / CONSTANTS.M_HYDROGEN);
        p.hasAtmosphere = p.escapeVelocity > (v_th * 6);
    }

    // 4. Determine Surface Type (requires mass)
    if (p.mass) {
        p.isHardSurface = p.mass < (CONSTANTS.EARTH_MASS * 10);
    }

    return p;
}





/**
 * Randomly generates a moon and ring system for a planet.
 * * @param {number} planetMass - kg
 * @param {number} planetDiameter - km
 * @param {number} starMass - kg
 * @param {number} orbitalDistAU - AU
 * @param {number} numMoons - Desired number of moons
 * @param {number} numRings - Desired number of rings
 * @returns {Object} The generated system
 */
function generateSatelliteSystem(planetMass, planetDiameter, starMass, orbitalDistAU, numMoons, numRings) {
    const planetRadius = planetDiameter / 2;

    // 1. Calculate the Boundaries
    // We'll assume a standard rocky/icy density for limits
    const avgDensity = planetMass / ((4 / 3) * Math.PI * Math.pow(planetRadius, 3));

    // Roche Limits (using same density for satellite as planet for simplicity)
    const rocheRigid = 1.26 * planetRadius;
    const rocheFluid = 2.44 * planetRadius;

    // Hill Sphere (Lund Limit is ~1/3 for long term stability)
    const orbitalDistKM = orbitalDistAU * 149597871;
    const hillRadius = orbitalDistKM * Math.pow(planetMass / (3 * starMass), 1 / 3);
    const maxStableOrbit = hillRadius / 3;

    const system = {
        limits: {
            rocheRigid: Math.round(rocheRigid),
            rocheFluid: Math.round(rocheFluid),
            hillSphere: Math.round(hillRadius),
            maxStableOrbit: Math.round(maxStableOrbit)
        },
        rings: [],
        moons: []
    };

    // 2. Generate Rings
    // Rings typically exist between the planet surface and the Fluid Roche Limit
    for (let i = 0; i < numRings; i++) {
        const inner = Math.random() * (rocheFluid - planetRadius) + planetRadius;
        const outer = Math.random() * (rocheFluid - inner) + inner;
        system.rings.push({
            innerEdgeKM: Math.round(inner),
            outerEdgeKM: Math.round(outer),
            type: inner < rocheRigid ? "Dust/Debris" : "Icy/Particulate"
        });
    }

    // 3. Generate Moons
    // Moons must be outside the Roche Fluid limit and inside the Stable Hill limit
    if (maxStableOrbit > rocheFluid) {
        for (let i = 0; i < numMoons; i++) {
            const distance = Math.random() * (maxStableOrbit - rocheFluid) + rocheFluid;
            system.moons.push({
                name: `Moon-${i + 1}`,
                orbitKM: Math.round(distance),
                isMajorMoon: distance < (maxStableOrbit * 0.1) // Closer moons tend to be larger
            });
        }
    }

    // Sort moons by distance for a clean output
    system.moons.sort((a, b) => a.orbitKM - b.orbitKM);

    return system;
}



/**
 * Generates a satellite system with masses and collision-avoidance logic.
 */
function generateStableSatelliteSystem(planetMass, planetDiameter, starMass, orbitalDistAU, numMoons, numRings) {
    const planetRadius = planetDiameter / 2;
    const orbitalDistKM = orbitalDistAU * 149597871;

    // 1. Calculate System Boundaries
    const rocheFluid = 2.44 * planetRadius;
    const hillRadius = orbitalDistKM * Math.pow(planetMass / (3 * starMass), 1 / 3);
    const maxStableOrbit = hillRadius / 3;

    const system = {
        limits: { rocheFluid, maxStableOrbit },
        rings: [],
        moons: []
    };

    // 2. Generate Rings (Same logic as before)
    for (let i = 0; i < numRings; i++) {
        const inner = Math.random() * (rocheFluid - planetRadius) + planetRadius;
        const outer = Math.random() * (rocheFluid - inner) + inner;
        system.rings.push({ innerEdgeKM: Math.round(inner), outerEdgeKM: Math.round(outer) });
    }

    // 3. Generate Moons with Mass and Spacing
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops

    while (system.moons.length < numMoons && attempts < maxAttempts) {
        attempts++;

        // A. Generate a random orbital distance
        const distance = Math.random() * (maxStableOrbit - rocheFluid) + rocheFluid;

        // B. Generate a random mass (from small asteroid to Moon-sized)
        // Using a log-scale approach so small moons are more common than big ones
        const exponent = Math.random() * (22 - 15) + 15; // 10^15 kg to 10^22 kg
        const moonMass = Math.pow(10, exponent);

        // C. Calculate this moon's Hill Sphere relative to the planet
        const moonHill = distance * Math.pow(moonMass / (3 * planetMass), 1 / 3);

        // D. Check for overlaps with existing moons
        // We use a safety factor (e.g., 3x Hill Sphere) to represent the "feeding zone"
        const safetyFactor = 3.5;
        const isOverlap = system.moons.some(m => {
            const distanceBetween = Math.abs(m.orbitKM - distance);
            const combinedZones = (m.hillSphereKM + moonHill) * safetyFactor;
            return distanceBetween < combinedZones;
        });

        if (!isOverlap) {
            system.moons.push({
                name: `Moon-${system.moons.length + 1}`,
                massKG: moonMass,
                orbitKM: Math.round(distance),
                hillSphereKM: Math.round(moonHill),
                stableZoneKM: Math.round(moonHill * safetyFactor)
            });
        }
    }

    system.moons.sort((a, b) => a.orbitKM - b.orbitKM);
    return system;
}


/*

// ==========================================
// Example: A Jupiter-like setup
// ==========================================
const myPlanet = generateSatelliteSystem(
    1.898e27,   // Jupiter Mass
    142984,     // Jupiter Diameter
    1.989e30,   // Sun Mass
    5.2,        // 5.2 AU from Sun
    5,          // 5 Moons
    2           // 2 Rings
);

console.log(myPlanet);

// ==========================================
// Test Run
// ==========================================
const result = generateStableSatelliteSystem(
    5.97e24, // Earth Mass
    12756,   // Earth Diameter
    1.98e30, // Sun Mass
    1.0,     // 1 AU
    3,       // Try to place 3 moons
    1        // 1 Ring
);


*/





/**
 * Advanced System Generator
 * @param {number} starMass - kg
 * @param {number} starLuminosity - Relative to Sun
 * @param {number} starDiameter - km
 * @param {number} numObjects - Target number of major bodies/belts
 */
function generateAdvancedSystem(starMass, starLuminosity, starDiameter, numObjects) {
    const starRadius = starDiameter / 2;
    const rocheLimitAU = (2.44 * starRadius) / 149597871;
    const frostLineAU = 2.7 * Math.sqrt(starLuminosity);
    const maxStableAU = 40000 * Math.pow(starMass / 1.9885e30, 1 / 3);

    const system = {
        metadata: { rocheLimitAU, frostLineAU, maxStableAU },
        bodies: []
    };

    let attempts = 0;
    while (system.bodies.length < numObjects && attempts < 300) {
        attempts++;

        // Logarithmic distance for realistic spacing
        const logMin = Math.log10(rocheLimitAU * 1.5);
        const logMax = Math.log10(maxStableAU * 0.1);
        const distanceAU = Math.pow(10, Math.random() * (logMax - logMin) + logMin);

        let massKG, type, hillSphereAU;
        const roll = Math.random();

        // 1. Determine Type based on Distance and Probability
        if (distanceAU < 0.1 && roll < 0.05) {
            // HOT JUPITER (Rare migration)
            massKG = Math.pow(10, Math.random() * (28.3 - 27) + 27);
            type = "Hot Jupiter";
        } else if (roll < 0.15) {
            // ASTEROID BELT (Failed planet)
            type = "Asteroid Belt";
            massKG = 1e21; // Negligible total mass
        } else if (roll < 0.30) {
            // DWARF PLANET
            massKG = Math.pow(10, Math.random() * (23 - 20) + 20);
            type = "Dwarf Planet";
        } else {
            // MAJOR PLANETS
            if (distanceAU > frostLineAU) {
                massKG = Math.pow(10, Math.random() * (28 - 25.5) + 25.5);
                type = distanceAU > frostLineAU * 4 ? "Ice Giant" : "Gas Giant";
            } else {
                massKG = Math.pow(10, Math.random() * (25 - 23.5) + 23.5);
                type = "Terrestrial";
            }
        }

        // 2. Stability Check
        hillSphereAU = distanceAU * Math.pow(massKG / (3 * starMass), 1 / 3);
        const safetyFactor = type === "Asteroid Belt" ? 4 : 12;

        const isOverlap = system.bodies.some(b => {
            const distBetween = Math.abs(b.orbitAU - distanceAU);
            const combinedZones = (b.hillSphereAU + hillSphereAU) * safetyFactor;
            return distBetween < combinedZones;
        });

        if (!isOverlap) {
            system.bodies.push({
                name: `${type}-${system.bodies.length + 1}`,
                orbitAU: Number(distanceAU.toFixed(4)),
                massKG: type === "Asteroid Belt" ? 0 : massKG,
                type: type,
                hillSphereAU: hillSphereAU,
                isHabitable: false // Logic to be added next
            });
        }
    }

    system.bodies.sort((a, b) => a.orbitAU - b.orbitAU);
    return system;
}




/**
 * Cleans the system of orbital conflicts and identifies resonances/locking.
 */
function auditSystem(system, starMass) {
    let bodies = system.bodies;

    // 1. SYSTEM CLEANER: Migration Sweep
    // If a Giant is inside 0.5 AU, it destroys smaller neighbors within 3x its Hill Sphere
    for (let i = 0; i < bodies.length; i++) {
        if (bodies[i].type.includes("Giant") && bodies[i].orbitAU < 0.5) {
            const dangerZone = bodies[i].hillSphereAU * 5;
            bodies = bodies.filter(other => {
                if (other === bodies[i]) return true; // Don't delete self
                if (other.type === "Terrestrial" || other.type === "Dwarf Planet") {
                    const dist = Math.abs(other.orbitAU - bodies[i].orbitAU);
                    return dist > dangerZone; // Keep if outside the giant's "clearing path"
                }
                return true;
            });
        }
    }

    // 2. TIDAL LOCKING & RESONANCE CHECK
    for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];

        // Tidal Locking Check: Simple heuristic (Distance < 0.2 AU for Sun-like stars)
        // More accurately: d < 0.05 * (StarMass)^1/3 is a common "Locking Zone"
        const lockingLimit = 0.2 * Math.pow(starMass / 1.988e30, 1 / 3);
        b.isTidallyLocked = b.orbitAU < lockingLimit;

        // Orbital Resonance Check (Compare with the next planet out)
        if (i < bodies.length - 1) {
            const next = bodies[i + 1];
            // Kepler's 3rd Law: Period^2 proportional to Distance^3
            // Period Ratio = (d2 / d1)^1.5
            const periodRatio = Math.pow(next.orbitAU / b.orbitAU, 1.5);

            b.resonance = checkResonance(periodRatio);
        }
    }

    system.bodies = bodies;
    return system;
}

/**
 * Helper to identify common integer resonance ratios
 */
function checkResonance(ratio) {
    const commonRatios = {
        "2:1": 2.0, "3:2": 1.5, "4:3": 1.33, "5:2": 2.5, "3:1": 3.0
    };
    const tolerance = 0.02; // 2% margin for "near-resonance"

    for (const [label, val] of Object.entries(commonRatios)) {
        if (Math.abs(ratio - val) < tolerance) return label;
    }
    return null;
}




/*

let rawSystem = generateAdvancedSystem(starMass, luminosity, diameter, 10);
let finalSystem = auditSystem(rawSystem, starMass);

console.log("System Processed. Checking for survivors...");
finalSystem.bodies.forEach(b => {
    let status = b.isTidallyLocked ? "[Tidally Locked] " : "";
    let res = b.resonance ? `(In ${b.resonance} resonance with next planet)` : "";
    console.log(`${b.name} at ${b.orbitAU} AU ${status}${res}`);
});


*/