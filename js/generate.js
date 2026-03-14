
            function selectStarType( selected_star_type=null, only_possible_RLOF=false ) {
                ALLOWED_DISTRIBUTION_STAR_TYPE = DISTRIBUTION_STAR_TYPE
                if( only_possible_RLOF ) {
                   const filterFn = (typeData) => typeData.possible_RLOF === true;
                   ALLOWED_STAR_TYPE_KEYS = Object.keys(DISTRIBUTION_STAR_TYPE).filter(key => filterFn(STELLAR_TYPES[key] ));
                   ALLOWED_DISTRIBUTION_STAR_TYPE = ALLOWED_STAR_TYPE_KEYS.reduce((acc, key) => {
                        acc[key] = DISTRIBUTION_STAR_TYPE[key];
                        return acc;
                    }, {});
                   //console.log(ALLOWED_DISTRIBUTION_STAR_TYPE)
                }
                star_type = selected_star_type || getWeightedRandomFromObject( ALLOWED_DISTRIBUTION_STAR_TYPE )
                //console.log(star_type)
                return STELLAR_TYPES[star_type]
            }



       function generateCentralBodies( star1_type, star1_prefilled, star2_type, star2_prefilled, system_type) {

            // DEFAULT IS DETACHED_BINARY or SINGLE_STAR
            star1_RLOF_necessary = false
            star2_RLOF_necessary = false
            if( system_type === "CONTACT_BINARY" ) {
                star1_RLOF_necessary = true
                star2_RLOF_necessary = true
            } else if (  system_type === "SEMI_DETACHED_BINARY" ) {
                star2_RLOF_necessary = true
            }


	    if( star1_prefilled && star1_prefilled.type ) {
                star1_type = star1_prefilled.type
            }
	    if( star2_prefilled && star2_prefilled.type ) {
                star2_type = star2_prefilled.type
            }


            
            //for objects with accretion disk, adjust luminosity (Do this before filling other values!)
            // SEMI_DETACHED_BINARY and code == "S" or "N" luminosity += 1 mio ...
	    
            star1_template = selectStarType( star1_type, star1_RLOF_necessary )
            star1 = fill_values_star(star1_prefilled||{}, star1_template)

            star2 = null
            if( system_type !== "SINGLE_STAR" ) {
                star2_template = selectStarType( star2_type, star2_RLOF_necessary )
                star2 = fill_values_star(star2_prefilled||{}, star2_template)
            }

            //more luminous one gets designation "a" the other one "b"
            if( star1 && star2 ) {
                des1 = "a"
                des2 = "b"
                if( star1.luminosity < star2.luminosity ) {
                    des1 = "b"
                    des2 = "a"
                }
                star1.designation ??= des1
                star2.designation ??= des2
            }


            console.log("Star1:"+ star1)
            console.log("Star2:"+ star2)

            result = [star1]
            if( star2 ) {
                result.push( star2 )
            }
            console.log( "stars:" + JSON.stringify( result ) )
            return result

               

       }

       
       function setDistanceBarycenter( stars, type) {
          if( stars.length == 1) {
              stars[0].distance_barycenter = 1000   // strictly speaking not true, depending on the planets
              return
          }

          if( stars.length == 2) {
             //do something depending on type and radii and roche limit of both stars
             totalDistance = calculateRequiredDistance(  stars[0], stars[1], type )
             console.log( "totalDistance:" + totalDistance )
             barycenter_distances = calculateBarycenterDistances(stars[0].mass, stars[1].mass, totalDistance)
             stars[0].barycenter_distance = barycenter_distances.r1
             stars[1].barycenter_distance = barycenter_distances.r2
             console.log( barycenter_distances )
             orbital_period = calculateOrbitalPeriodBinary(stars[0].mass, stars[1].mass, totalDistance )
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
     ASTEROID_BELT:  0.05      
}


function getReadableMass( mass ) {
    result = mass + " kg"
    if( mass >= 0.1 * CONSTANTS.MASS_MOON ) {
       result = roundTo( mass / CONSTANTS.MASS_MOON ) + " Moon"
    }
    if( mass >= 0.1 * CONSTANTS.MASS_EARTH ) {
       result = roundTo( mass / CONSTANTS.MASS_EARTH ) + " Earth"
    }
    if( mass >= 0.1 * CONSTANTS.MASS_JUPITER ) {
       result = roundTo( mass / CONSTANTS.MASS_JUPITER ) + " Jupiter"
    }
    return result
}


function calculateRadiusPlanet( mass, density ) {
 const volumeM3 = mass / (density * 1000);
 const radiusM = Math.pow((3 * volumeM3) / (4 * Math.PI), 1 / 3);

 return roundTo(radiusM / 1000, 0); // Final radius in km
}



function generatePlanet( prefilled, template, system) {
    prefilled.distanceAU ??= roundTo( prefilled.distance / CONSTANTS.KM_PER_AU )

    interpolation = Math.random()
    prefilled.mass ??= lerp( template.mass_range[MIN],  template.mass_range[MAX], interpolation ) 
    prefilled.massReadable ??= getReadableMass( prefilled.mass )
    
    prefilled.density ??= lerp( template.density_range[MIN],  template.density_range[MAX], interpolation )
    prefilled.radius ??= calculateRadiusPlanet( prefilled.mass, prefilled.density )
    //prefilled.orbitalPeriod = calculateOrbitalPeriod( prefilled.distance, system.boundaries.total_mass )
    determineRotation( prefilled, tidallyLocked=false )


    prefilled.sattelites ??= []
    prefilled.isTidallyLocked ??= false

    
    prefilled.escapeVelocity ??= roundTo( calculateEscapeVelocity( prefilled.mass, prefilled.radius ), 2 )
    prefilled.avgTemp = calculatePlanetTemp( system.boundaries.totalLuminosity, prefilled.distance )


    prefilled.chemistry = getPlanetChemistry( prefilled.avgTemp, prefilled.escapeVelocity )
    prefilled.hasAtmosphere ??= prefilled.chemistry.states.gas ? true : false

    prefilled.solarDay ??= calculateAdvancedSolarDay( {pOrb: prefilled.orbitalPeriod, //yearInHours,  
                                 pRev: null,    // Moon's Revolution around Planet in Hours
                                 pRot: prefilled.rotationPeriod,    // Sidereal Rotation (hours)
                                 orbRetro: false, // Planet orbits Sun backwards
                                 revRetro: false, // Moon orbits Planet backwards
                                 rotRetro: false, // Body spins backwards
                                 isTidallyLocked: false} )

    return prefilled
}
    


function generateDwarfPlanet( prefilled ) {
    return generatePlanet( prefilled, TEMPLATE_DWARF_PLANET )   //could be a double dwarf-planet!
}


function generateBelt( prefilled, system, avgDistance, insideSharp=false, outsideSharp=false ) {
	
    prefilled.avgDistance ??= avgDistance
    prefilled.stdDeviationHorizontal ??= 0.5
    prefilled.minDistance ??= prefilled.avgDistance -  1 * CONSTANTS.KM_PER_AU
    prefilled.maxDistance ??= prefilled.avgDistance +  2 * CONSTANTS.KM_PER_AU
    prefilled.avgHeight  ??= 1 * CONSTANTS.KM_PER_AU
    prefilled.stdDeviationVertical ??= 0.5
    prefilled.maxHeight  ??=  prefilled.avgHeight + 0.2 * CONSTANTS.KM_PER_AU

    prefilled.majorBodies ??= []
    rnd = getRandomUniformBetween(0, 6)
    numberBodies + Math.max(  prefilled.majorBodies.length, rnd )
    generatedBodies = []
    for( let i = 0; i<=numberBodies; ++i) {
       prefilledDwarf = { distance: avgDistance }   //should be randomly within min-max range...
       generatedBodies.push( generateDwarfPlanet( prefilledDwarf ) )
    }
    prefilled.majorBodies = generatedBodies
    return prefilled
}


function generateSplitBelt( system, avgDistance ) {
    
    innerBelt = generateBelt( {}, system, avgDistance-0.5*KM_PER_AU, insideSharp=false, outsideSharp )
    dwarfPlanet = generateDwarfPlanet( { distance: avgDistance } )
    outerBelt = generateBelt( {}, system, avgDistance+0.5*KM_PER_AU, insideSharp=false, outsideSharp )
    return [innerBelt, dwarfPlanet, outerBelt]

}






