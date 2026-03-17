
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
    //prefilled = prefilled || {}
    //console.log( template )
    //console.log( prefilled)
    //console.log( prefilled.code )
    //prefilled.class ??= template.class
    prefilled.type ??= template.type
    prefilled.code ??= template.code
    prefilled.temp ??= getUniformRandomBetween(template.temp_range[MIN], template.temp_range[MAX])
    prefilled.luminosity ??= getUniformRandomBetween(template.luminosity_range[MIN], template.luminosity_range[MAX]) * CONSTANTS.SUN_LUMINOSITY

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


function calculateRadiusPlanet(mass, density) {
    const volumeM3 = mass / (density * 1000);
    const radiusM = Math.pow((3 * volumeM3) / (4 * Math.PI), 1 / 3);

    return roundTo(radiusM / 1000, 0); // Final radius in km
}



function generatePlanet(prefilled, template, system) {
    prefilled.distanceAU ??= roundTo(prefilled.distance / CONSTANTS.KM_PER_AU)

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
    return prefilled //generatePlanet(prefilled, template, system)   //could be a double dwarf-planet!
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
    return prefilled
    innerBelt = generateBelt({}, {}, system, avgDistance - 0.5 * CONSTANTS.KM_PER_AU, insideSharp = false, outsideSharp = true)
    dwarfPlanet = generateDwarfPlanet({ distance: avgDistance }, system)
    outerBelt = generateBelt({}, {}, system, avgDistance + 0.5 * CONSTANTS.KM_PER_AU, insideSharp = true, outsideSharp = false)
    return [innerBelt, dwarfPlanet, outerBelt]

}






