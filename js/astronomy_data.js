/**
 * Stellar & Planetary Statistical Engine
 * Provides physical constants and likelihood weights.
 */

const MIN = 0 // in ranges
const MAX = 1

const CONSTANTS = {
    G: 6.67430e-11,
    STEFAN_BOLTZMANN: 5.67037e-8, // Stefan-Boltzmann constant (W⋅m⁻²⋅K⁻⁴)
    BOLTZMANN_K: 1.380649e-23,
    M_HYDROGEN: 1.67e-27,

    ROCHE_RIGID: 2.44,
    ROCHE_FLUID: 1.26,

    AU_PER_LY: 63241.1,
    KM_PER_AU: 149597871,
    CM_PER_KM: 100000,

    EARTH_MASS: 5.972e24,

    SUN_MASS: 1.9885e30,
    SUN_LUMINOSITY: 3.828e26,
    SUN_RADIUS: 695700,

    MASS_JUPITER: 1.898e27,
    MASS_EARTH: 5.972e24,
    MASS_MOON: 7.346e22
};




//diameter in km
const RADIUS_FACTORS = {
    "SUN_DIAMETER": 1392700,
    "MERCURY_RADIUS": 2439,//4879,
    "VENUS_DIAMETER": 12104,
    "EARTH_DIAMETER": 12756,
    "MOON_DIAMETER": 3475,
    "MARS_DIAMETER": 6792,
    "JUPITER_DIAMETER": 142984,
    "SATURN_DIAMETER": 120536,
    "URANUS_DIAMETER": 51118,
    "NEPTUNE_DIAMETER": 49528,
    "PLUTO_DIAMETER": 2377,
    "ERIS_DIAMETER": 2326,
    "HAUMEA_DIAMETER": 1632,
    "MAKEMAKE_DIAMETER": 1430,
    "CERES_DIAMETER": 939,
    "GANYMEDE_DIAMETER": 5268,
    "TITAN_DIAMETER": 5150,
    "CALLISTO_DIAMETER": 4821,
    "IO_DIAMETER": 3643,
    "EUROPA_DIAMETER": 3122,
    "TRITON_DIAMETER": 2707,
    "TITANIA_DIAMETER": 1578,
    "RHEA_DIAMETER": 1527,
    "OBERON_DIAMETER": 1523,
    "IAPETUS_DIAMETER": 1469,
    "CHARON_DIAMETER": 1212
};


//mass in kg
const MASS_FACTORS = {
    "SUN_MASS": 1.9885e30,
    "MERCURY_MASS": 3.3011e23,
    "VENUS_MASS": 4.8675e24,
    "EARTH_MASS": 5.9722e24,
    "MOON_MASS": 7.342e22,
    "MARS_MASS": 6.4171e23,
    "JUPITER_MASS": 1.8982e27,
    "SATURN_MASS": 5.6834e26,
    "URANUS_MASS": 8.681e25,
    "NEPTUNE_MASS": 1.0241e26,
    "PLUTO_MASS": 1.303e22,
    "ERIS_MASS": 1.67e22,
    "HAUMEA_MASS": 4.01e21,
    "MAKEMAKE_MASS": 3.1e21,
    "CERES_MASS": 9.38e20,
    "GANYMEDE_MASS": 1.482e23,
    "TITAN_MASS": 1.345e23,
    "CALLISTO_MASS": 1.076e23,
    "IO_MASS": 8.932e22,
    "EUROPA_MASS": 4.800e22,
    "TRITON_MASS": 2.139e22,
    "TITANIA_MASS": 3.4e21,
    "RHEA_MASS": 2.307e21,
    "OBERON_MASS": 3.01e21,
    "IAPETUS_MASS": 1.806e21,
    "CHARON_MASS": 1.586e21
};

HIGH_DENSITY_PLANET = 6 //g/cm^3


const GAS_PROPERTIES = {
    // --- Primordial / Light ---
    "Hydrogen": { molarMass: 2.016, freeze: 14.01, boil: 20.28, weight: 100, symbol: "H2" },
    "Helium": { molarMass: 4.002, freeze: 0.95, boil: 4.22, weight: 85, symbol: "He" },

    // --- Common Volatiles (Biogenic & Atmospheric) ---
    "Methane": { molarMass: 16.04, freeze: 90.7, boil: 111.6, weight: 40, symbol: "CH4" },
    "Ammonia": { molarMass: 17.03, freeze: 195.4, boil: 239.8, weight: 25, symbol: "NH3" },
    "Water Vapor": { molarMass: 18.01, freeze: 273.15, boil: 373.15, weight: 60, symbol: "H2O" },
    "Neon": { molarMass: 20.18, freeze: 24.56, boil: 27.07, weight: 15, symbol: "Ne" },
    "Nitrogen": { molarMass: 28.01, freeze: 63.15, boil: 77.36, weight: 80, symbol: "N2" },
    "Oxygen": { molarMass: 32.00, freeze: 54.36, boil: 90.20, weight: 50, symbol: "O2" },

    // --- Volcanic & Geologic ---
    "Carbon Monoxide": { molarMass: 28.01, freeze: 68.15, boil: 81.65, weight: 45, symbol: "CO" },
    "Carbon Dioxide": { molarMass: 44.01, freeze: 194.7, boil: 216.6, weight: 75, symbol: "CO2" },
    "Nitrous Oxide": { molarMass: 44.01, freeze: 182.3, boil: 184.7, weight: 5, symbol: "N2O" },
    "Hydrogen Sulfide": { molarMass: 34.08, freeze: 187.6, boil: 212.8, weight: 20, symbol: "H2S" },
    "Sulfur Dioxide": { molarMass: 64.06, freeze: 197.6, boil: 263.1, weight: 15, symbol: "SO2" },
    "Hydrogen Chloride": { molarMass: 36.46, freeze: 158.9, boil: 188.1, weight: 10, symbol: "HCl" },

    // --- Heavy / Noble / Exotic ---
    "Argon": { molarMass: 39.95, freeze: 83.8, boil: 87.3, weight: 20, symbol: "Ar" },
    "Krypton": { molarMass: 83.80, freeze: 115.7, boil: 119.9, weight: 5, symbol: "Kr" },
    "Xenon": { molarMass: 131.29, freeze: 161.4, boil: 165.0, weight: 2, symbol: "Xe" },
    "Radon": { molarMass: 222.0, freeze: 202.0, boil: 211.3, weight: 1, symbol: "Rn" },

    // --- Organic / Hydrocarbons ---
    "Ethane": { molarMass: 30.07, freeze: 90.3, boil: 184.5, weight: 10, symbol: "C2H6" },
    "Ethylene": { molarMass: 28.05, freeze: 104.0, boil: 169.4, weight: 8, symbol: "C2H4" },
    "Acetylene": { molarMass: 26.04, freeze: 192.4, boil: 189.1, weight: 5, symbol: "C2H2" },

    // --- Corrosive / Reactive ---
    "Fluorine": { molarMass: 37.99, freeze: 53.48, boil: 85.03, weight: 2, symbol: "F2" },
    "Chlorine": { molarMass: 70.90, freeze: 171.6, boil: 239.1, weight: 5, symbol: "Cl2" }
};

const STAR_GRADIENT = [
    { temp: 0, hex: "#000000" }, // Black
    { temp: 300, hex: "#502010" }, // Brown
    { temp: 2000, hex: "#ff3300" }, // Deep Red
    { temp: 3500, hex: "#ff8833" }, // Orange
    { temp: 5500, hex: "#ffffcc" }, // Pale Yellow (Sun-like)
    { temp: 8000, hex: "#ffffff" }, // Pure White
    { temp: 15000, hex: "#99ccff" }, // Light Blue
    { temp: 30000, hex: "#5D7BFF" },  // Ultra-Hot Blue
    { temp: 150000, hex: "#ffffff" } // Pure White (again)
];



const STELLAR_TYPES = {
    // --- MAIN SEQUENCE STARS ---
    "O": {
        type: "BLUE_GIANT",
        class: "Blue Giant",
        code: "O",
        mass_range: [16.0, 100.0],
        radius_range: [6.6, 20.0],
        luminosity_range: [30000, 1000000],
        temp_range: [30000, 50000],
        possible_RLOF: true,
        frequency_percent: 0.00003
    },
    "B": {
        type: "BLUE_WHITE",
        class: "Blue-White",
        code: "B",
        mass_range: [2.1, 16.0],
        radius_range: [1.8, 6.6],
        luminosity_range: [25, 30000],
        temp_range: [10000, 30000],
        possible_RLOF: true,
        frequency_percent: 0.13
    },
    "A": {
        type: "WHITE",
        class: "White",
        code: "A",
        mass_range: [1.4, 2.1],
        radius_range: [1.4, 1.8],
        luminosity_range: [5, 25],
        temp_range: [7500, 10000],
        possible_RLOF: true,
        frequency_percent: 0.6
    },
    "F": {
        type: "YELLOW_WHITE",
        class: "Yellow-White",
        code: "F",
        mass_range: [1.04, 1.4],
        radius_range: [1.15, 1.4],
        luminosity_range: [1.5, 5],
        temp_range: [6000, 7500],
        possible_RLOF: true,
        frequency_percent: 3.0
    },
    "G": {
        type: "YELLOW_DWARF",
        class: "Yellow Dwarf",
        code: "G",
        mass_range: [0.8, 1.04],
        radius_range: [0.96, 1.15],
        luminosity_range: [0.6, 1.5],
        temp_range: [5200, 6000],
        possible_RLOF: false,
        frequency_percent: 7.6
    },
    "K": {
        type: "ORANGE_DWARF",
        class: "Orange Dwarf",
        code: "K",
        mass_range: [0.45, 0.8],
        radius_range: [0.7, 0.96],
        luminosity_range: [0.08, 0.6],
        temp_range: [3700, 5200],
        possible_RLOF: false,
        frequency_percent: 12.1
    },
    "M": {
        type: "RED_DWARF",
        class: "Red Dwarf",
        code: "M",
        mass_range: [0.08, 0.45],
        radius_range: [0.1, 0.7],
        luminosity_range: [0.0001, 0.08],
        temp_range: [2400, 3700],
        possible_RLOF: false,
        frequency_percent: 76.45
    },
    "M_III": {  // ????????????????
        type: "RED_GIANT",
        class: "Red Giant",
        code: "M_III",
        mass_range: [0.08, 0.45],
        radius_range: [10, 50],
        luminosity_range: [0.0001, 0.08],
        temp_range: [2400, 3700],
        possible_RLOF: true,
        frequency_percent: 76.45
    },

    // --- SUB-STELLAR & DEAD STARS ---
    "BROWN_DWARF": {
        type: "BROWN_DWARF",
        class: "Sub-stellar Object",
        code: "Y",  // L, T for Standard spectral class for "Lithium" dwarfs. and Standard spectral class for "Methane" dwarfs.
        mass_range: [0.013, 0.08], // 13 to 80 Jupiter masses
        radius_range: [0.08, 0.12], // Roughly Jupiter sized
        luminosity_range: [0.00001, 0.0001],
        temp_range: [300, 2400],
        possible_RLOF: false,
        frequency_percent: 1.5 // Estimated relative to stars
    },
    "WHITE_DWARF": {
        type: "WHITE_DWARF",
        class: "Degenerate Stellar Remnant",
        code: "D",
        mass_range: [0.5, 1.4],
        radius_range: [0.008, 0.02], // Roughly Earth sized
        luminosity_range: [0.0001, 0.01],
        temp_range: [4000, 150000],
        possible_RLOF: false,
        frequency_percent: 0.4
    },
    "CEPHEID_VARIABLE": {
        type: "CEPHEID_VARIABLE",
        class: "High-Mass Pulsating Variable",
        code: "V",
        mass_range: [3.0, 20.0],       // Massive stars in the "instability strip"
        radius_range: [30.0, 100.0], // Large yellow supergiants
        luminosity_range: [1e-6, 1.0], // Initial heat is high, but surface area is tiny
        temp_range: [5000, 6500],      // They sit in a very specific temp window
        pulsation_period_range: [1.0, 100.0], // Days
        luminosity_formula: (period) => Math.pow(10, 1.25 * Math.log10(period) + 2.3),
        possible_RLOF: false,
        frequency_percent: 0.1
    },
    "NEUTRON_STAR": {
        type: "NEUTRON_STAR",
        class: "Neutron-Degenerate Core",
        code: "N",
        mass_range: [1.1, 2.1],
        radius_range: [0.000014, 0.00002], // ~20km across
        luminosity_range: [1e-6, 1.0], // Initial heat is high, but surface area is tiny
        temp_range: [500000, 1000000],
        possible_RLOF: false,
        frequency_percent: 0.05
    },
    "PULSAR": {
        type: "PULSAR",
        class: "Rapidly Rotating Neutron Star",
        code: "P",
        mass_range: [1.1, 2.1],
        radius_range: [0.000014, 0.00002],
        luminosity_range: [0.01, 100], // High "apparent" luminosity due to beams
        temp_range: [500000, 1000000],
        possible_RLOF: false,
        frequency_percent: 0.01
    },
    "BLACK_HOLE": {
        type: "BLACK_HOLE",
        class: "Stellar-Mass Singularity",
        code: "S",
        mass_range: [3.0, 50.0],
        radius_range: [0.000006, 0.0001], // Schwarzschild radius (event horizon)
        luminosity_range: [0, 0], // Accretion disk not included
        temp_range: [0, 0], // Hawking radiation is negligible
        possible_RLOF: false,
        frequency_percent: 0.002
    }
};



// DISTRIBUTIONS OF BINARY SYSTEM
DISTRIBUTION_BINARY_TYPE = {
    SINGLE_STAR: 0.6,
    DETACHED_BINARY: 0.2,
    SEMI_DETACHED_BINARY: 0.1,
    CONTACT_BINARY: 0.1
}


// DISTRIBUTIONS OF DIFFERENT BODYS
// NOTE: for Contact Binaries this list needs to be filtered!
DISTRIBUTION_STAR_TYPE = {
    //special in summe 0.25
    BLACK_HOLE: 0.05,
    PULSAR: 0.05,
    NEUTRON_STAR: 0.10,
    CEPHEID_VARIABLE: 0.05,
    //dwarfs in summe 0.25
    WHITE_DWARF: 0.05,
    BROWN_DWARF: 0.05,
    M: 0.05,
    K: 0.10,
    //sun like in summe 0.25
    G: 0.05,
    F: 0.10,
    A: 0.05,
    B: 0.05,
    //giants in summe 0.25
    O: 0.10,
    M_III: 0.15
}

// DISTRIBUTION OF ORBITAL-TYPE
DISTRIBUTION_ORBIT_CONTENT = {
    PLANET: 0.8,
    //DOUBLE_PLANET: 0.1,
    ASTEROID_BELT: 0.1
}

// DISTRIBUTION OF ORBITAL-TYPE
DISTRIBUTION_PLANETS = {
    GAS_GIANT: 0.15,
    ICE_GIANT: 0.15,
    TERRESTIAL_PLANET: 0.3,
    DWARF_PLANET: 0.4
}


const PLANET_TYPES = {
    GAS_GIANT: {
        mass_range: [0.01 * CONSTANTS.MASS_JUPITER, 13 * CONSTANTS.MASS_JUPITER],
        density_range: [0.05, 0.5]   //g per cm`3  
    },
    ICE_GIANT: {
        mass_range: [10 * CONSTANTS.MASS_EARTH, 60 * CONSTANTS.MASS_EARTH],
        density_range: [1.2, 2.5]
    },
    TERRESTIAL_PLANET: {
        mass_range: [0.01 * CONSTANTS.MASS_EARTH, 10 * CONSTANTS.MASS_EARTH],
        density_range: [3.0, 10.0]
    },
    DWARF_PLANET: {
        mass_range: [0.001 * CONSTANTS.MASS_MOON, 0.25 * CONSTANTS.MASS_MOON],
        density_range: [1.5, 3.0],
    },



};

// DISTRIBUTION OF PLANET-TYPES
DISTRIBUTION_PLANET_TYPE = {
    DWARF: 0.5,
    TERRESTIAL: 0.2,
    SUPER_EARTH: 0.1,
    ICE_GIANT: 0.1,
    GAS_GIANT: 0.1
}

// example

/*

{
    "meta": {
        "designation":
        "seed":
        "number_of_planets":
        "star1":
        "star2":
    }
    "central_bodys": [ ],
    "_characteristics": {},
    "orbits": [
        { "number": 9,
          "designation": "IX"
          "distance": "",
          "eccentricity": "",
          "resonance": {
                  "with": 8,
                  "factor": "2:3"
              }
          "type" : PLANET ! BINARY_PLANET ! ASTEROID_BELT
          "binary_planet": {
             "plane":  "15 deg",
             "eccentricity"
             "planet1": { "designation": "a",
                          "tidalLock"  true,
                          "satellites : []"

                         },
             "planet2": { "designation": "b",

                         },
           }
        }
    ]
}

*/