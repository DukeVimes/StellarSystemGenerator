
function selectStarType(selected_star_type = null, only_possible_RLOF = false) {
    ALLOWED_DISTRIBUTION_STAR_TYPE = DISTRIBUTION_STAR_TYPE
    if (only_possible_RLOF) {
        const filterFn = (typeData) => typeData.possible_RLOF === true;
        ALLOWED_STAR_TYPE_KEYS = Object.keys(DISTRIBUTION_STAR_TYPE).filter(key => filterFn(STELLAR_TYPES[key]));
        ALLOWED_DISTRIBUTION_STAR_TYPE = ALLOWED_STAR_TYPE_KEYS.reduce((acc, key) => {
            acc[key] = DISTRIBUTION_STAR_TYPE[key];
            return acc;
        }, {});
        //console.log(ALLOWED_DISTRIBUTION_STAR_TYPE)
    }
    star_type = selected_star_type || getWeightedRandomFromObject(ALLOWED_DISTRIBUTION_STAR_TYPE)
    //console.log(star_type)
    return STELLAR_TYPES[star_type]
}



function generateCentralBodies(star1_type, star1_prefilled, star2_type, star2_prefilled, system_type) {

    // DEFAULT IS DETACHED_BINARY or SINGLE_STAR
    star1_RLOF_necessary = false
    star2_RLOF_necessary = false
    if (system_type === "CONTACT_BINARY") {
        star1_RLOF_necessary = true
        star2_RLOF_necessary = true
    } else if (system_type === "SEMI_DETACHED_BINARY") {
        star2_RLOF_necessary = true
    }


    if (star1_prefilled && star1_prefilled.type) {
        star1_type = star1_prefilled.type
    }
    if (star2_prefilled && star2_prefilled.type) {
        star2_type = star2_prefilled.type
    }

    //for objects with accretion disk, adjust luminosity (Do this before filling other values!)
    // SEMI_DETACHED_BINARY and code == "S" or "N" luminosity += 1 mio ...

    star1_template = selectStarType(star1_type, star1_RLOF_necessary)
    star1 = fill_values_star(star1_prefilled || {}, star1_template)

    star2 = null
    if (system_type !== "SINGLE_STAR") {
        star2_template = selectStarType(star2_type, star2_RLOF_necessary)
        star2 = fill_values_star(star2_prefilled || {}, star2_template)
    }

    //more luminous one gets designation "a" the other one "b"
    if (star1 && star2) {
        des1 = "a"
        des2 = "b"
        if (star1.luminosity < star2.luminosity) {
            des1 = "b"
            des2 = "a"
        }
        star1.designation ??= des1
        star2.designation ??= des2
    }


    console.log("Star1:" + star1)
    console.log("Star2:" + star2)

    result = [star1]
    if (star2) {
        result.push(star2)
    }
    console.log("stars:" + JSON.stringify(result))
    return result
}




function fill_values_star(prefilled, template) {
    //prefilled.class ??= template.class
    prefilled.type ??= template.type
    prefilled.code ??= template.code
    prefilled.temp ??= getUniformRandomBetween(template.temp_range[MIN], template.temp_range[MAX])
    prefilled.luminosity ??= getUniformRandomBetween(template.luminosity_range[MIN], template.luminosity_range[MAX]) * CONSTANTS.SUN_LUMINOSITY
    prefilled.age ??= roundTo( getUniformRandomBetween(template.age_range[MIN], template.age_range[MAX]), 0 )

    //mass and radius arent independend
    interpolation_factor = getUniformRandomBetween(0, 1)
    prefilled.mass ??= lerp(template.mass_range[MIN], template.mass_range[MAX], interpolation_factor) * CONSTANTS.SUN_MASS
    prefilled.mass_sol ??= mass_to(prefilled.mass, CONSTANTS.SUN_MASS)
    prefilled.radius ??= lerp(template.radius_range[MIN], template.radius_range[MAX], interpolation_factor) * CONSTANTS.SUN_RADIUS
    prefilled.radius_in_sol_radii ??= km_to(prefilled.radius, CONSTANTS.SUN_RADIUS)
    prefilled.density ??= prefilled.mass / ((4 / 3) * Math.PI * Math.pow(prefilled.radius * CONSTANTS.CM_PER_KM, 3))

    prefilled.roche_limit ??= rocheByDensity(prefilled.radius, prefilled.density, HIGH_DENSITY_PLANET)
    prefilled.roche_limit_AU ??= km_to_AU(prefilled.roche_limit)
    prefilled.color ??= getRealisticStarColor(prefilled.temp)
    //for cepheids fill also the secondary values
    if (prefilled.code === "V") {
        //
        prefilled.pulsation_period ??= getUniformRandomBetween(template.pulsation_period_range[MIN], template.pulsation_period_range[MAX])
        //overwrite luminosty depending on pulsation
        prefilled.luminosity = template.luminosity_formula(prefilled.pulsation_period)

        //, use the prefilled ones as min/max limits!
        prefilled.temp_expanded ??= getUniformRandomBetween(template.temp_range[MIN], prefilled.temp)
        prefilled.luminosity_expanded ??= getUniformRandomBetween(template.temp_range[MIN], prefilled.luminosity)
        prefilled.radius_expanded ??= getUniformRandomBetween(prefilled.radius, template.temp_range[MAX])
        prefilled.color_expanded ??= getRealisticStarColor(prefilled.temp_expanded)
    }
    return prefilled
}


function calculateSystemBoundaries(star1, star2 = null) {
    limits = {}
    total_lum = star1.luminosity
    total_lum += star2?.luminosity || 0

    total_mass = star1.mass
    total_mass =+ star2?.mass || 0
    limits.totalMass = total_mass
    limits.totalMassReadable = getReadableMass( total_mass )

    limits = calculateStellarThermalBoundaries(total_lum)

    roche_limit_star1 = rocheByDensity(star1.radius, star1.density, HIGH_DENSITY_PLANET, isFluid = false)
    roche_limit_rigid_system = roche_limit_star1
    inner_stable_orbit = roche_limit_rigid_system
    max_orbital_distance = calculateMaxOrbitalDistance(star1.mass)

    if (star2) {
        roche_limit_star2 = rocheByDensity(star2.radius, star2.density, HIGH_DENSITY_PLANET, isFluid = false)
        roche_limit_rigid_system = Math.max(roche_limit_star1, roche_limit_star2)
        inner_stable_orbit = calculateCriticalOrbit(star1.mass, star2.mass, star1.barycenter_distance + star2.barycenter_distance)
        max_orbital_distance = calculateMaxOrbitalDistance(star1.mass + star2.mass)
    }

    limits.rocheLimitRigid = roche_limit_rigid_system
    limits.innermostStableOrbit = inner_stable_orbit
    limits.outermostStableOrbit = max_orbital_distance

    limits.rocheLimitRigidAU = km_to_AU(limits.rocheLimitRigid)
    limits.innermostStableOrbitAU = km_to_AU(limits.innermostStableOrbit)
    limits.outermostStableOrbitAU = km_to_AU(limits.outermostStableOrbit.stableLimitKM)

    
    limits.protoplanetaryDisk =  getDiskBoundaries(total_mass/CONSTANTS.SUN_MASS) 

    return limits
}



function setDistanceBarycenter(stars, type) {
    if (stars.length == 1) {
        stars[0].distance_barycenter = 1000   // strictly speaking not true, depending on the planets
        return
    }

    if (stars.length == 2) {
        //do something depending on type and radii and roche limit of both stars
        totalDistance = calculateRequiredDistance(stars[0], stars[1], type)
        console.log("totalDistance:" + totalDistance)
        barycenter_distances = calculateBarycenterDistances(stars[0].mass, stars[1].mass, totalDistance)
        stars[0].barycenter_distance = barycenter_distances.r1
        stars[1].barycenter_distance = barycenter_distances.r2
        console.log(barycenter_distances)
        orbital_period = calculateOrbitalPeriodBinary(stars[0].mass, stars[1].mass, totalDistance)
        stars[0].orbital_period = orbital_period
        stars[1].orbital_period = orbital_period

        /*
        generateBinarySeparation(s1, s2) 
        checkMassTransfer
        rocheByMass / rocheByDensity
        getBinaryStatus
        getDistanceForSemiDetached
        calculateRequiredDistance
        calculateOrbitalPeriod
        */
    }
    return
}


ORBIT_AREA_DISTRIBUTION = {
    GAS_GIANT: 0.1,
    ICE_GIANT: 0.1,
    TERRESTIAL_PLANET: 0.15,
    DWARF_PLANET: 0.6,
    ASTEROID_BELT: 0.05
}


function getReadableMass(mass) {
    result = mass + " kg"
    if (mass >= 0.1 * CONSTANTS.MASS_MOON) {
        result = roundTo(mass / CONSTANTS.MASS_MOON) + " Moon"
    }
    if (mass >= 0.1 * CONSTANTS.MASS_EARTH) {
        result = roundTo(mass / CONSTANTS.MASS_EARTH) + " Earth"
    }
    if (mass >= 0.1 * CONSTANTS.MASS_JUPITER) {
        result = roundTo(mass / CONSTANTS.MASS_JUPITER) + " Jupiter"
    }
    return result
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






function assignOrbitalDistances(objects, min, max) {
  // 1. Create our "Anchors" (fixed points that cannot move)
  // We start with a virtual anchor for the absolute minimum
  const anchors = [{ index: -1, distance: min }];  //min
  
  // Find all preset distances in the list and log their positions
  objects.forEach((obj, i) => {
    if (typeof obj.distance === 'number') {
      anchors.push({ index: i, distance: obj.distance });
    }
  });
  
  // End with a virtual anchor for the absolute maximum
  anchors.push({ index: objects.length, distance: max });

  // 2. Process each segment between the anchors
  for (let i = 0; i < anchors.length - 1; i++) {
    const startAnchor = anchors[i];
    const endAnchor = anchors[i + 1];
    
    // Calculate how many empty objects are in this specific gap
    const emptyCount = endAnchor.index - startAnchor.index - 1;
    if (emptyCount <= 0) continue; // Skip if no empty objects in this gap

    const segmentMin = startAnchor.distance;
    const segmentMax = endAnchor.distance;
    const gapSize = segmentMax - segmentMin;
    
    // Configuration for this segment
    const curvePower = 1.5;       // The planetary curve (1.0 = linear, 2.0+ = curved)
    const jitterVariance = 0.15;  // +/- 15% randomness to make it look natural

    let segmentDistances = [];

    // 3. Generate the distances for this segment
    for (let j = 0; j < emptyCount; j++) {
      // Normalize position: spaces objects evenly *between* the anchors 
      // (prevents them from sitting directly on top of the preset values)
      const t = (j + 1) / (emptyCount + 1);
      
      // Apply the power curve
      const curvePoint = Math.pow(t, curvePower);
      const idealDist = segmentMin + (gapSize * curvePoint);
      
      // Calculate jitter (random offset)
      // We scale the jitter by the gap size and number of objects so they don't jump too wildly
      const maxJitter = gapSize * (jitterVariance / emptyCount);
      const jitterOffset = (Math.random() * 2 - 1) * maxJitter; 
      
      // Apply jitter and ensure it absolutely cannot cross the segment min/max boundaries
      let finalDist = idealDist + jitterOffset;
      finalDist = Math.max(segmentMin + 0.1, Math.min(segmentMax - 0.1, finalDist));
      
      segmentDistances.push( min + finalDist);
    }

    // 4. CRITICAL STEP: Sort the segment to prevent leapfrogging
    // Jitter might cause a later object to randomly generate a lower number than an earlier one.
    // Sorting guarantees strict ascending order before we apply them.
    segmentDistances.sort((a, b) => a - b);

    // 5. Assign the finalized, sorted distances back to the objects
    let distIndex = 0;
    for (let k = startAnchor.index + 1; k < endAnchor.index; k++) {
      objects[k].distance = roundTo( segmentDistances[distIndex++], 0); // Rounded for neatness
      objects[k].distanceAU = roundTo(  objects[k].distance / CONSTANTS.KM_PER_AU, 2)
    }
  }

  return objects;
}






function calculateRadiusPlanet(mass, density) {
    const volumeM3 = mass / (density * 1000);
    const radiusM = Math.pow((3 * volumeM3) / (4 * Math.PI), 1 / 3);

    return roundTo(radiusM / 1000, 0); // Final radius in km
}



function generatePlanet(prefilled, template, system) {
    prefilled.distanceAU ??= roundTo(prefilled.distance / CONSTANTS.KM_PER_AU)
    prefilled.orbitalPeriod ??=  calculateOrbitalPeriod( prefilled.distance, system.boundaries.totalMass)

    interpolation = Math.random()
    prefilled.mass ??= lerp(template.mass_range[MIN], template.mass_range[MAX], interpolation)
    prefilled.massReadable ??= getReadableMass(prefilled.mass)

    prefilled.density ??= lerp(template.density_range[MIN], template.density_range[MAX], interpolation)
    prefilled.radius ??= calculateRadiusPlanet(prefilled.mass, prefilled.density)
    //prefilled.orbitalPeriod = calculateOrbitalPeriod( prefilled.distance, system.boundaries.total_mass )
    determineRotation(prefilled, tidallyLocked = false)


    prefilled.sattelites ??= []
    prefilled.isTidallyLocked ??= false


    prefilled.escapeVelocity ??= roundTo(calculateEscapeVelocity(prefilled.mass, prefilled.radius), 2)
    prefilled.avgTemp = calculatePlanetTemp(system.boundaries.totalLuminosity, prefilled.distance)


    prefilled.chemistry = getPlanetChemistry(prefilled.avgTemp, prefilled.escapeVelocity)
    //prefilled.hasAtmosphere ??= prefilled.chemistry.states.gas ? true : false

    prefilled.solarDay ??= calculateAdvancedSolarDay({
        pOrb: prefilled.orbitalPeriod, //yearInHours,  
        pRev: null,    // Moon's Revolution around Planet in Hours
        pRot: prefilled.rotationPeriod,    // Sidereal Rotation (hours)
        orbRetro: false, // Planet orbits Sun backwards
        revRetro: false, // Moon orbits Planet backwards
        rotRetro: false, // Body spins backwards
        isTidallyLocked: false
    })

    return prefilled

}



function generateDwarfPlanet(prefilled, system) {
    const DWARF_PLANET_TEMPLATE = PLANET_TYPES["DWARF_PLANET"]
    //console.log(PLANET_TYPES)
    //console.log(DWARF_PLANET_TEMPLATE)
    //console.log(system)
    return generatePlanet(prefilled, DWARF_PLANET_TEMPLATE, system)   //could be a double dwarf-planet!
}



function generateDoublePlanet(prefilled, template, system ) {
    let type1 = prefilled?.planet1?.type ||  getWeightedRandomFromObject(DISTRIBUTION_PLANETS)
    let template1 = PLANET_TYPES[type1]
    let prefilled1 = prefilled.planet1 || { distance: prefilled.distance, type: type1, class: "PLANET" }
    let planet1 = generatePlanet( prefilled1, template1, system)

    let type2 = prefilled?.planet1?.type || type1
    let template2 = PLANET_TYPES[type2]
    let prefilled2 = prefilled.planet2 || { distance: prefilled.distance, type: type2, class: "PLANET" }
    prefilled2.mass ??= prefilled1.mass // minus random percentage!
    planet2 = generatePlanet( prefilled2, template2, system)

    prefilled.planet1 = planet1
    prefilled.planet2 = planet2
    prefilled.distance ??= 100000 // randomized based on radius
    //barycenter distance

    return prefilled //generatePlanet(prefilled, template, system)   //could be a  ccffhjvhhhhhhhhhhcxcbxvdouble dwarf-planet!
}


function generateBelt(prefilled, template, system, insideSharp = false, outsideSharp = false) {
    //console.log( "generating belt..." )
    prefilled.avgDistance ??= prefilled.distance
    prefilled.stdDeviationHorizontal ??= 0.5
    prefilled.minDistance ??= prefilled.avgDistance - 1 * CONSTANTS.KM_PER_AU
    prefilled.maxDistance ??= prefilled.avgDistance + 2 * CONSTANTS.KM_PER_AU
    prefilled.avgHeight ??= 1 * CONSTANTS.KM_PER_AU
    prefilled.stdDeviationVertical ??= 0.5
    prefilled.maxHeight ??= prefilled.avgHeight + 0.2 * CONSTANTS.KM_PER_AU

    prefilled.majorBodies ??= []
    rnd = getUniformRandomBetween(0, 6)
    numberBodies = Math.max(prefilled.majorBodies.length, rnd)
    generatedBodies = []
    for (let i = 0; i <= numberBodies; ++i) {
        prefilledDwarf = { distance: prefilled.avgDistance }   //should be randomly within min-max range...
        generatedBodies.push(generateDwarfPlanet(prefilledDwarf, system))
    }
    prefilled.majorBodies = generatedBodies
    return prefilled
}


function generateSplitBelt(prefilled, system, avgDistance) {
    return generateBelt(prefilled, null, system, true, true)
    return prefilled
    innerBelt = generateBelt({}, {}, system, avgDistance - 0.5 * CONSTANTS.KM_PER_AU, insideSharp = false, outsideSharp = true)
    dwarfPlanet = generateDwarfPlanet({ distance: avgDistance }, system)
    outerBelt = generateBelt({}, {}, system, avgDistance + 0.5 * CONSTANTS.KM_PER_AU, insideSharp = true, outsideSharp = false)
    return [innerBelt, dwarfPlanet, outerBelt]

}






            function generateSystem(system_type, star1_type, star2_type, n_orbits, seed, template) {

                seed = calculateRandomSeed()
                params.seed = seed
                setUrl(params)
                setGui(params)



                system = {}
                system.meta = {}
                system_name = createNames('fake', false)
                system.meta.designation = system_name
                system.meta.system_type = system_type
                system.meta.number_of_orbits = n_orbits
                //console.log(system)

                stars = generateCentralBodies(star1_type, null, star2_type, null, system_type)
                system.stars = stars
                //console.log( "stars:" + stars)


                //now position distance from barycenter according to type and mass ratios...
                setDistanceBarycenter(stars, system_type)
                //console.log( stars )

                // calculate system limits (hill sphere, combined roche limit, innermost stable orbit, frost limit, ...)
                limits = calculateSystemBoundaries(...stars)
                system.boundaries = limits

                //if more planets are required as defined in template, add empty orbits
                console.log( template.orbits)
                orbits = Array.from(template.orbits || [] ) 
                for( let i = orbits.length; i < n_orbits; ++i ) {
                    orbits.push( {} )
                }
                console.log( `pre-created ${orbits.length} orbital areas` ) 
                //n_orbits = Math.max(n_orbits, n_orbits_template)

                // fill all the missing distances
                assignOrbitalDistances( orbits, limits.innermostStableOrbit, limits.outermostStableOrbit.stableLimitKM / 1000 )

                fillObjectMap = {
                        "PLANET":        generatePlanet,
                        "DOUBLE_PLANET": generateDoublePlanet,
                        "ASTEROID_BELT":          generateBelt,
                        "SPLIT_ASTEROID_BELT":    generateSplitBelt
                }

                //planet_counter
                n_planets = 0
                n_belts = 0
                MAX_BELTS = 3
                // we create as many objects as required
                for (let i = 0; i < orbits.length; ++i) {
                    //always based on the template (which might be empty)
                    orbit_prefilled = orbits[i]  
                    //decide for an object-type (could also be dependend on frostline, etc.)
                    
                    orbit_class = orbit_prefilled.class || getWeightedRandomFromObject(DISTRIBUTION_ORBIT_CONTENT)
                    designation = null
                    type = null
                    if( ["DWARF_PLANET", "TERRESTIAL_PLANET", "ICE_GIANT", "GAS_GIANT"].includes( orbit_prefilled.type)) {
                        orbit_class = "PLANET"
                    }
                    template = null
                    if (orbit_class === "PLANET" ) {
                        n_planets += 1;
                        designation = toRoman(n_planets)
                        type = orbit_prefilled.type ||  getWeightedRandomFromObject(DISTRIBUTION_PLANETS)
                        template = PLANET_TYPES[type]
                    }                   
                    else if (orbit_class === "DOUBLE_PLANET") {
                        n_planets += 1;
                        designation = toRoman(n_planets) + " a/b"
                        type = "DOUBLE_PLANET" //getWeightedRandomFromObject(DISTRIBUTION_PLANETS)
                        template = DOUBLE_PLANET
                    }
                    else if (orbit_class === "ASTEROID_BELT") {
                        n_belts += 1;
                        type = "ASTEROID_BELT"
                        designation = `${n_belts}. belt`
                        template = ASTEROID_BELT
                    }
                    else if (orbit_class === "SPLIT_ASTEROID_BELT") {
                        n_belts += 1;
                        type = "SPLIT_BELT"
                        designation = `${n_belts} belt inner/outer`
                        template = SPLIT_ASTEROID_BELT
                    }


                    
                    //ID is always a good idea
                    orbit_prefilled.id ??= crypto.randomUUID();
                    orbit_prefilled.class ??= orbit_class
                    orbit_prefilled.designation ??= designation
                    orbit_prefilled.type ??= type

                    //now create the actual object
                    fillObjectMap[orbit_class]( orbit_prefilled, template, system )
                }

                system.orbits = orbits
                return system
            }

