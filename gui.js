/**
 * Processes the system and updates the URL
 * Example Digest: NX25-E4A1
 */
function processSystem(s1, s2, count, seed) {
    const s1Char = ID_TO_STAR[s1];
    const s2Char = ID_TO_STAR[s2];
    
    // Construct the digest: StarChars + PlanetCount + Dash + Seed
    const digest = `${s1Char}${s2Char}${count}-${seed}`;
    
    // Update Address Bar
    const newUrl = `${window.location.origin}${window.location.pathname}?s=${digest}`;
    window.history.pushState({path: newUrl}, '', newUrl);
    
    document.getElementById('digestDisplay').innerText = "System Digest: " + digest;

    // Convert hex seed to integer for our seeded PRNG
    const seedInt = parseInt(seed, 16);
    
    // Proceed with generation...
    generateStellarData(s1, s2, count, seedInt);
}

/**
 * Parses the URL on load to recreate the system
 */
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    
    if (s && s.includes('-')) {
        const [identity, seed] = s.split('-');
        
        const s1Char = identity[0];
        const s2Char = identity[1];
        // Slice from index 2 to the end of the identity string to get the full planet count
        const pCount = parseInt(identity.substring(2));

        const s1Key = STAR_ID_MAP[s1Char];
        const s2Key = STAR_ID_MAP[s2Char];

        // Update HTML Inputs
        document.getElementById('star1').value = s1Key;
        document.getElementById('star2').value = s2Key;
        document.getElementById('pCount').value = pCount;

        // Trigger Generation
        processSystem(s1Key, s2Key, pCount, seed);
    }
};


function visualizeSystem() {
    const systemData = document.getElementById('jsonOutput').value;
    if (!systemData) return alert("Generate a system first!");

    const vizWindow = window.open("", "_blank");
    vizWindow.document.write(`
        <html>
        <head>
            <title>System Visualization</title>
            <style>
                body { background: #05070a; color: white; font-family: sans-serif; margin: 0; overflow: hidden; }
                #controls { position: absolute; top: 20px; left: 20px; background: rgba(20, 25, 30, 0.9); padding: 15px; border-radius: 8px; border: 1px solid #333; z-index: 10; }
                #hoverBox { position: absolute; display: none; background: rgba(0,0,0,0.8); padding: 10px; border: 1px solid #58a6ff; pointer-events: none; font-size: 12px; }
                svg { width: 100vw; height: 100vh; cursor: move; }
                .orbit { fill: none; stroke: #222; stroke-width: 1; }
                .hz { fill: rgba(0, 255, 100, 0.05); stroke: rgba(0, 255, 100, 0.2); stroke-dasharray: 5; }
                .frost { fill: rgba(0, 150, 255, 0.05); stroke: rgba(0, 150, 255, 0.2); stroke-dasharray: 5; }
                circle:hover { stroke: white; stroke-width: 2; }
            </style>
        </head>
        <body>
            <div id="controls">
                <label><input type="checkbox" id="showLabels" checked> Show Labels</label><br>
                <label><input type="checkbox" id="showZones" checked> Show HZ / Frost Line</label>
            </div>
            <div id="hoverBox"></div>
            <svg id="canvas" viewBox="0 0 1000 1000"></svg>

            <script>
                const data = ${systemData};
                const svg = document.getElementById('canvas');
                const hb = document.getElementById('hoverBox');
                const centerX = 500, centerY = 500;
                const scale = 150; // pixels per AU

                function draw() {
                    svg.innerHTML = '';
                    const showLabels = document.getElementById('showLabels').checked;
                    const showZones = document.getElementById('showZones').checked;

                    // 1. Draw Zones (Calculated from Star Temp)
                    if (showZones) {
                        const lum = Math.pow(data.star.temp / 5778, 4); // Relative Luminosity
                        const hzStart = Math.sqrt(lum / 1.1) * scale;
                        const hzEnd = Math.sqrt(lum / 0.53) * scale;
                        const frost = Math.sqrt(lum) * 4.85 * scale;

                        // Habitable Zone
                        svg.innerHTML += \`<circle cx="500" cy="500" r="\${hzEnd}" class="hz" />\`;
                        svg.innerHTML += \`<circle cx="500" cy="500" r="\${hzStart}" class="hz" style="fill:#05070a" />\`;
                        // Frost Line
                        svg.innerHTML += \`<circle cx="500" cy="500" r="\${frost}" class="frost" />\`;
                    }

                    // 2. Draw Star
                    const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    star.setAttribute("cx", centerX);
                    star.setAttribute("cy", centerY);
                    star.setAttribute("r", 15);
                    star.setAttribute("fill", data.star.color || "yellow");
                    svg.appendChild(star);

                    // 3. Draw Planets
                    data.planets.forEach(p => {
                        const radius = p.orbit_au * scale;
                        
                        // Orbit path
                        const orbit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        orbit.setAttribute("cx", centerX);
                        orbit.setAttribute("cy", centerY);
                        orbit.setAttribute("r", radius);
                        orbit.classList.add("orbit");
                        svg.appendChild(orbit);

                        // Planet body
                        const planet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        const angle = Math.random() * Math.PI * 2;
                        const px = centerX + Math.cos(angle) * radius;
                        const py = centerY + Math.sin(angle) * radius;

                        planet.setAttribute("cx", px);
                        planet.setAttribute("cy", py);
                        planet.setAttribute("r", 4 + (p.radius_earth_rel * 2));
                        planet.setAttribute("fill", "#58a6ff");
                        
                        // Hover interactions
                        planet.onmouseover = (e) => {
                            hb.style.display = "block";
                            hb.innerHTML = \`
                                <b>\${p.name || 'Planet ' + p.id}</b><br>
                                Temp: \${p.surface_temp_k}K<br>
                                Atmo: \${Object.keys(p.atmosphere || {}).join(', ') || 'None'}<br>
                                Liquids: \${p.liquids || 'None'}
                            \`;
                        };
                        planet.onmousemove = (e) => {
                            hb.style.left = (e.pageX + 15) + "px";
                            hb.style.top = (e.pageY + 15) + "px";
                        };
                        planet.onmouseout = () => hb.style.display = "none";

                        svg.appendChild(planet);

                        if (showLabels) {
                            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                            label.setAttribute("x", px + 10);
                            label.setAttribute("y", py + 5);
                            label.setAttribute("fill", "#8b949e");
                            label.setAttribute("font-size", "10");
                            label.textContent = p.name || "Planet " + p.id;
                            svg.appendChild(label);
                        }
                    });
                }

                document.getElementById('controls').onchange = draw;
                draw();
            <\/script>
        </body>
        </html>
    `);
}