
function roundTo(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}


/**
  recursevely traverses an JSON document and checks every string for occurences of any of the keys in tokenObjects.
  if the value contains a number we will multiply it with the value in tokenObject
function parseJSONdoc( jsonDoc, ...tokenObjects) {
}
**/

function generateRandomComposition(elements, threshold = null) {
    if (!elements || elements.length === 0) {
        return {};
    }

    // 1. Copy the array to avoid mutating the original, then shuffle it (Fisher-Yates shuffle)
    let elementsPool = [...elements];
    for (let i = elementsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elementsPool[i], elementsPool[j]] = [elementsPool[j], elementsPool[i]];
    }

    let composition = {};
    let remainingTo100 = 100.0;

    while (elementsPool.length > 0 && remainingTo100 > 0) {
        // 2. Threshold Check: If leftover amount is less than or equal to the threshold, 
        // group the rest into @remaining@ and stop.
        if (threshold !== null && remainingTo100 <= threshold) {
            composition["@remaining@"] = Number(remainingTo100.toFixed(2));
            break;
        }

        // 3. Pick a random element from our shuffled pool
        const item = elementsPool.pop();

        let contribution;

        // 4. Determine the element's random contribution
        if (elementsPool.length === 0) {
            // If this is the last available item, it MUST take whatever is left.
            contribution = remainingTo100;
        } else {
            // Pick a random percentage between 1.0% and the current remaining total.
            // Safeguard: If remaining is less than 1.0, just take the remaining.
            const min = remainingTo100 > 1.0 ? 1.0 : remainingTo100;
            contribution = Math.random() * (remainingTo100 - min) + min;

            // Round to 2 decimal places to keep the output clean
            contribution = roundTo(contribution);
        }

        // 5. Record the contribution and deduct it from the total
        composition[item] = contribution;

        // Deduct and fix floating-point math issues
        remainingTo100 = Number((remainingTo100 - contribution).toFixed(2));
    }

    return composition;
}


/**
 *
 */
function getUniformRandomBetween(min, max) {
    return Math.random() * (max - min) + min;
}


/**
 * Selects a random object from a list of pairs based on their relative percentages.
 * Automatically normalizes the percentages to a 100% scale.
 * * @param {Array} pairs - Array of objects like { object: "Item", percentage: 10 }
 * @returns {*} The selected object
 */
function getNormalizedWeightedRandom(pairs, key = "frequency") {
    if (!pairs || pairs.length === 0) return null;

    // 1. Calculate the actual sum of all provided percentages
    const totalWeight = pairs.reduce((sum, pair) => sum + pair[key], 0);

    // 2. Generate a random "dart" between 0 and the total weight
    // This effectively scales the 0-100 logic to 0-totalWeight
    const roll = Math.random() * totalWeight;

    let cumulativeWeight = 0;

    // 3. Iterate and find where the roll lands
    for (const pair of pairs) {
        cumulativeWeight += pair[key];

        if (roll <= cumulativeWeight) {
            return pair.object;
        }
    }

    // Fallback for the last item (safeguard against floating point math)
    return pairs[pairs.length - 1].object;
}


/**
 * Selects a random key from a  dict based on their relative percentages.
 * Automatically normalizes the percentages to a 100% scale.
 * * @param {Object} probDict - Object with keys and probability values
 * @returns {*} The selected key
 */
function getWeightedRandomFromObject(probDict) {
    if (!probDict || Object.keys(probDict).length === 0) return null;

    const entries = Object.entries(probDict);

    // 1. Calculate total weight from values
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);

    if (totalWeight === 0) return null;

    // 2. Generate the "dart"
    let roll = Math.random() * totalWeight;

    // 3. Iterate through entries and subtract weight
    for (const [key, weight] of entries) {
        if (roll < weight) {
            return key;
        }
        roll -= weight;
    }

    // Fallback for floating point precision
    return entries[entries.length - 1][0];
}



/**
 * Processes a string by looking for a dictionary TOKEN and multiplying 
 * the numeric prefix by the token's value.
 * * @param {any} input - The variable to check
 * @param {Object} dictionary - Key-value pairs (e.g., { "SOL_MASS": 1.98e30 })
 * @returns {number|any} The calculated value, or the original input if not a valid string/token
 */
function processTokenString(input, dictionary) {
    // 1. Check if the variable is a string
    if (typeof input !== 'string') {
        return input;
    }

    // 2. Use Regex to find the numeric part and the token part
    // Matches: (Optional -)(Digits)(Optional .digits) (Zero or more spaces) (Token)
    const match = input.trim().match(/^([-+]?\d*\.?\d+)\s*(\w+)$/);

    if (match) {
        const numericValue = parseFloat(match[1]);
        const token = match[2];

        // 3. Check if the TOKEN exists in our dictionary
        if (dictionary.hasOwnProperty(token)) {
            // Return the calculated factor
            return numericValue * dictionary[token];
        }
    }

    // Return original string if it doesn't match the pattern or token is missing
    return input;
}


function convertUnitStrings( unconverted, dictionary ) {
    let converted = unconverted
    for (const entry of Object.entries( unconverted )) {
        key = entry[0]
        value = entry[1]
        if( typeof( value ) === 'string') {
            converted[key] = processTokenString(value, dictionary)
        }
        else if( typeof( value ) === 'array') {
            converted[key] = map( (v) => { return convertUnitStrings(v, dictionary) } );
        }
        else if( typeof( value ) === 'object') {
           converted[key] =  convertUnitStrings( value, dictionary )
        }

    };
    return converted
}


function createNames(type = 'any', numerical_suffix = false) {
    const real_map = {
        "Andromeda": "Andromedae", "Antlia": "Antliae", "Apus": "Apodis", "Aquarius": "Aquarii", "Aquila": "Aquilae", "Ara": "Arae", "Aries": "Arietis", "Auriga": "Aurigae", "Bootes": "Bootis", "Caelum": "Caeli", "Camelopardalis": "Camelopardalis", "Cancer": "Cancri", "Canes Venatici": "Canum Venaticorum", "Canis Major": "Canis Majoris", "Canis Minor": "Canis Minoris", "Capricornus": "Capricorni", "Carina": "Carinae", "Cassiopeia": "Cassiopeiae", "Centaurus": "Centauri", "Cepheus": "Cephei", "Cetus": "Ceti", "Chamaeleon": "Chamaeleontis", "Circinus": "Circini", "Columba": "Columbae", "Coma Berenices": "Comae Berenices", "Corona Australis": "Coronae Australis", "Corona Borealis": "Coronae Borealis", "Corvus": "Corvi", "Crater": "Crateris", "Crux": "Crucis", "Cygnus": "Cygni", "Delphinus": "Delphini", "Dorado": "Doradus", "Draco": "Draconis", "Equuleus": "Equulei", "Eridanus": "Eridani", "Fornax": "Fornacis", "Gemini": "Geminorum", "Grus": "Gruis", "Hercules": "Herculis", "Horologium": "Horologii", "Hydra": "Hydrae", "Hydrus": "Hydri", "Indus": "Indi", "Lacerta": "Lacertae", "Leo": "Leonis", "Leo Minor": "Leonis Minoris", "Lepus": "Leporis", "Libra": "Librae", "Lupus": "Lupi", "Lynx": "Lyncis", "Lyra": "Lyrae", "Mensa": "Mensae", "Microscopium": "Microscopii", "Monoceros": "Monocerotis", "Musca": "Muscae", "Norma": "Normae", "Octans": "Octantis", "Ophiuchus": "Ophiuchi", "Orion": "Orionis", "Pavo": "Pavonis", "Pegasus": "Pegasi", "Perseus": "Persei", "Phoenix": "Phoenicis", "Pictor": "Pictoris", "Pisces": "Piscium", "Piscis Austrinus": "Piscis Austrini", "Puppis": "Puppis", "Pyxis": "Pyxidis", "Reticulum": "Reticuli", "Sagitta": "Sagittae", "Sagittarius": "Sagittarii", "Scorpius": "Scorpii", "Sculptor": "Sculptoris", "Scutum": "Scuti", "Serpens": "Serpentis", "Sextans": "Sextantis", "Taurus": "Tauri", "Telescopium": "Telescopii", "Triangulum": "Trianguli", "Tucana": "Tucanae", "Ursa Major": "Ursae Majoris", "Ursa Minor": "Ursae Minoris", "Vela": "Velorum", "Virgo": "Virginis", "Volans": "Volantis", "Vulpecula": "Vulpeculae"
    };
    const fake_map = {
        "Eptesicus Minor": "Eptesici Minoris", "Achatina": "Achatinae", "Esox": "Esocis",
        "Acidalia": "Acidaliae", "Chilopoda Major": "Chilopodae Majoris", "Chlorocebus": "Chlorocebi",
        "Trochilidae": "Trochilidarum", "Ajaja": "Ajajae", "Tyto": "Tytonis", "Locodonta": "Locodontae",
        "Myotis": "Myotis", "Ailurus": "Ailuri", "Apis Major": "Apis Majoris", "Moloch": "Molochis",
        "Syncerus": "Synceri", "Viverra Australis": "Viverrae Australis", "Vespa": "Vespae",
        "Tamias Occidentalis": "Tamiae Occidentalis", "Hester": "Hesteris", "Felis": "Felis", "Cichlidae": "Cichlidarum"
    };
    const greek_letters = [
        ["α", "alpha"], ["β", "beta"], ["γ", "gamma"], ["δ", "delta"], ["ε", "epsilon"], ["ζ", "zeta"], ["η", "eta"], ["θ", "theta"], ["ι", "iota"], ["κ", "kappa"], ["λ", "lambda"],
        ["μ", "mu"], ["ν", "nu"], ["ξ", "xi"], ["ο", "omicron"], ["π", "pi"], ["ρ", "rho"], ["σ", "sigma"], ["τ", "tau"], ["υ", "upsilon"], ["φ", "phi"], ["χ", "chi"], ["ψ", "psi"], ["ω", "omega"]
    ];
    const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
    // 1. Pick Greek Letter (70% weight for early letters)
    let letter = Math.random() < 0.7 ? choice(greek_letters.slice(0, 11)) : choice(greek_letters);
    // 2. Select Genitive Name
    let selectedMap = type === 'real' ? real_map : (type === 'fake' ? fake_map : (Math.random() < 0.5 ? real_map : fake_map));
    let genitiveName = selectedMap[choice(Object.keys(selectedMap))];
    // 3. Optional Suffix (e.g., "A" or "1")
    let suffix = "";
    if (numerical_suffix) {
        const rand = Math.random();
        if (rand < 0.15) {
            suffix = ` ${Math.floor(Math.random() * 9) + 1}`; // e.g., " 1" to " 9"
        }
    }
    return `[${letter[1]}] ${letter[0]} - ${genitiveName}${suffix}`;
}



/**
 * Generates a planet count based on a Poisson Distribution.
 * @param {number} lambda - The average/most likely number of planets (e.g., 10).
 * @param {number} min - Minimum allowed planets (default 0).
 * @param {number} max - Maximum allowed planets (default 99).
 * @returns {number} The generated number of planets.
 */
function getPoissonCount(lambda, min = 0, max = 99) {
    // Knuth's algorithm for Poisson random variables
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;

    do {
        k++;
        p *= Math.random();
    } while (p > L);

    result = k - 1;

    // Clamp the result between your defined constraints
    return Math.max(min, Math.min(max, result));
}



/**
 * Converts an integer to a Roman Numeral string.
 * Useful for naming star systems and planetary bodies.
 * @param {number} num - Integer between 1 and 3999
 * @returns {string} Roman Numeral representation
 */
function toRoman(num) {
    if (isNaN(num)) return "";
    const lookup = {
        M: 1000, CM: 900, D: 500, CD: 400,
        C: 100, XC: 90, L: 50, XL: 40,
        X: 10, IX: 9, V: 5, IV: 4, I: 1
    };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}




function km_to_AU(km) {
    return roundTo(km / CONSTANTS.KM_PER_AU)
}


function km_to(km, factor) {
    return roundTo(km / factor)
}


function mass_to(mass, factor) {
    return roundTo(mass / factor)
}

/**
 * Lineare Interpolation zwischen zwei Werten.
 * @param {number} start - Der Anfangswert (wenn t = 0)
 * @param {number} end - Der Endwert (wenn t = 1)
 * @param {number} t - Der Interpolationsfaktor (0 bis 1)
 * @returns {number} Der berechnete Wert
 */
function lerp(start, end, t) {
    return start + t * (end - start);
}
