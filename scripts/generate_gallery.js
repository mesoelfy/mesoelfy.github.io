const fs = require('fs');
const path = require('path');

const THUMBS_DIR = path.join(__dirname, '../public/assets/art/thumbs');
const SPECS_DIR = path.join(__dirname, '../public/assets/art/specs');
const OUTPUT_FILE = path.join(__dirname, '../src/engine/config/static/gallery.json');

const DEFAULT_URL = "https://www.deviantart.com/mesoelfy/art/Esper-Elfy-Title-Card-Logo-1290500894";

if (!fs.existsSync(THUMBS_DIR)) {
    console.error(`// ERROR: Thumbs directory not found at ${THUMBS_DIR}`);
    process.exit(1);
}

const files = fs.readdirSync(THUMBS_DIR).filter(f => f.toLowerCase().endsWith('.png'));

console.log(`// SCANNING: Found ${files.length} artifacts...`);

const gallery = files.map(filename => {
    // Filename acts as the unique key
    const uniqueId = filename;
    
    // Parse Logic
    const namePart = filename.replace(/\.png$/i, '');
    const parts = namePart.split('_');
    
    // Display ID (just the number)
    const id = parts[0];
    
    // Category (2nd part)
    const category = parts.length > 1 ? parts[1].toUpperCase() : 'MISC';
    
    // Title
    const title = parts.length > 1 
        ? parts.slice(1).map(p => p.toUpperCase()).join(' ') 
        : `ARTIFACT ${id}`;

    // Spec Sheet Check
    const specName = namePart + '.jpg';
    const hasSpec = fs.existsSync(path.join(SPECS_DIR, specName));

    // Color Logic
    let color = "#78F654"; 
    if (['KAMIKAZE', 'RED', 'DEMON', 'CRONEN', 'MARROW'].includes(category)) color = "#FF003C"; 
    else if (['HUNTER', 'YELLOW', 'VANTA', 'UMBRA', 'WENDIGO'].includes(category)) color = "#F7D277"; 
    else if (['DRILLER', 'PURPLE', 'FAE', 'WROUGHT', 'AKUMA', 'ZYRAEN'].includes(category)) color = "#9E4EA5"; 
    else if (['BLUE', 'CYAN', 'AQUATIC', 'AMPHIBIAN'].includes(category)) color = "#00F0FF"; 
    else if (['ORANGE', 'INSECTOID', 'CANINE', 'GREMLIN'].includes(category)) color = "#CF7233"; 

    return {
        uniqueId: uniqueId, // <--- CRITICAL FIX FOR REACT KEYS
        id: id,
        title: title,
        category: category,
        thumb: `/assets/art/thumbs/${filename}`,
        src: hasSpec ? `/assets/art/specs/${specName}` : null,
        url: DEFAULT_URL,
        color: color
    };
});

// Sort by ID descending
gallery.sort((a, b) => parseInt(b.id) - parseInt(a.id));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gallery, null, 2));

console.log(`// SUCCESS: Database generated with ${gallery.length} entries.`);
