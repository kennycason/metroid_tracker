let energyTanks = 0;
let missiles = 0;
let scale = 1;

// Initialize the tracker
$(document).ready(() => {
    updateCounters();
    // initializeMagnifier();  // Temporarily disabled in favor of zoom+drag
    checkItemSequence();
    updateItemList();
    initializeMapZoom();
    createItemOverlay(); // Initial creation of markers
});

function updateCounters() {
    $('#energy-count').text(energyTanks);
    $('#missile-count').text(missiles);
}

function initializeMagnifier() {
    const $map = $('#metroid-map');
    const $mapContainer = $('.map-container');
    
    // Create magnifier element
    const $magnifier = $('<div>', {
        class: 'magnifier'
    }).appendTo($mapContainer);

    $mapContainer.on('mousemove', (e) => {
        const rect = $map[0].getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Position the magnifier
        $magnifier.css({
            left: `${x}px`,
            top: `${y}px`,
            display: 'block'
        });

        const magnifierSize = 200; // Should match the CSS width/height

        // Calculate the background position to center the zoomed area
        const bgX = -x * scale + magnifierSize / 2;
        const bgY = -y * scale + magnifierSize / 2;

        $magnifier.css({
            backgroundImage: `url(${$map.attr('src')})`,
            backgroundSize: `${rect.width * scale}px ${rect.height * scale}px`,
            backgroundPosition: `${bgX}px ${bgY}px`
        });
    });

    $mapContainer.on('mouseleave', () => {
        $magnifier.css('display', 'none');
    });
}

function initializeMapZoom() {
    const $map = $('#metroid-map');
    const $mapContainer = $('.map-container');
    
    const minScale = 0.5;
    const maxScale = 4;
    const scaleStep = 0.1;
    let isHovering = false;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let lastX, lastY;

    // Temporarily hide magnifier
    $('.magnifier').hide();

    // Add hover detection
    $mapContainer.on('mouseenter', () => {
        isHovering = true;
    }).on('mouseleave', () => {
        isHovering = false;
    });

    // Add click handler for coordinate logging
    $mapContainer.on('click', (e) => {
        if (isDragging) return; // Don't log if we're dragging
        
        const rect = $mapContainer[0].getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate actual coordinates taking into account scale and offset
        const actualX = Math.round((mouseX - offsetX) / scale);
        const actualY = Math.round((mouseY - offsetY) / scale);
        
        console.log(`Clicked coordinates - x: ${actualX}, y: ${actualY}`);
    });

    // Add drag functionality
    $mapContainer.on('mousedown', (e) => {
        if (scale > 1) {  // Only allow dragging when zoomed in
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            $mapContainer.css('cursor', 'grabbing');
        }
    });

    $(window).on('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        offsetX += deltaX;
        offsetY += deltaY;

        applyTransformWithConstraints();
    }).on('mouseup', () => {
        isDragging = false;
        $mapContainer.css('cursor', 'zoom-in');
    });

    // Handle zoom
    $(window).on('wheel', (e) => {
        if (!isHovering) return;
        
        e.preventDefault();
        
        const rect = $mapContainer[0].getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const x = (mouseX - offsetX) / scale;
        const y = (mouseY - offsetY) / scale;
        
        const oldScale = scale;
        if (e.originalEvent.deltaY < 0) {
            scale = Math.min(scale * (1 + scaleStep), maxScale);
        } else {
            scale = Math.max(scale * (1 - scaleStep), minScale);
        }

        offsetX = mouseX - x * scale;
        offsetY = mouseY - y * scale;

        applyTransformWithConstraints();
    });

    function applyTransformWithConstraints() {
        const rect = $mapContainer[0].getBoundingClientRect();
        const mapRect = $map[0].getBoundingClientRect();

        // Calculate boundaries
        const minX = rect.width - mapRect.width * scale;
        const minY = rect.height - mapRect.height * scale;

        // Constrain offsets
        offsetX = Math.min(0, Math.max(minX, offsetX));
        offsetY = Math.min(0, Math.max(minY, offsetY));

        // If scale is 1 or less, reset position to top-left
        if (scale <= 1) {
            offsetX = 0;
            offsetY = 0;
        }

        $map.css({
            'transform-origin': '0 0',
            'transform': `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            'transition': 'transform 0.1s ease-out'
        });

        // Update overlay position to match map
        $('#item-overlay').css({
            'transform-origin': '0 0',
            'transform': `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
        });

        // Update individual markers to counter the map scale, but cap at 2x original size
        $('.item-marker').css({
            transform: `scale(${Math.min(2, 1/scale)})`
        });
    }
}

// Group types for section ordering
const sectionOrder = ["bosses", "items", "energy", "missile"];
const itemTypes = {
    "bosses": ["kraid", "ridley"],
    "items": [
        "morph_ball", 
        "bombs", 
        "hi_jump", 
        "varia_suit", 
        "screw_attack", 
        "long_beam", 
        "ice_beam", 
        "wave_beam"
    ],
    "energy": ["energy"],
    "missile": ["missile"]
};

const items = {
    1: {type: "kraid", x: 376, y: 1387, area: "kraids_lair", name: "Kraid", order100Percent: 34},
    2: {type: "ridley", x: 861, y: 1386, area: "ridleys_lair", name: "Ridley", order100Percent: 41},
    // Items
    100: {type: "morph_ball", x: 75, y: 660, area: "brinstar", name: "Morph Ball", order100Percent: 2},
    101: {type: "bombs", x: 1275, y: 208, area: "brinstar", name: "Bombs", order100Percent: 6},
    102: {type: "hi_jump", x: 1382, y: 796, area: "norfair", name: "Hi Jump", order100Percent: 10},
    103: {type: "varia_suit", x: 760, y: 66, area: "brinstar", name: "Varia Suit", order100Percent: 25},
    104: {type: "screw_attack", x: 759, y: 746, area: "norfair", name: "Screw Attack", order100Percent: 19},
    105: {type: "long_beam", x: 347, y: 211, area: "brinstar", name: "Long Beam", order100Percent: 4},
    106: {type: "ice_beam", x: 969, y: 401, area: "brinstar", name: "Ice Beam Br", order100Percent: 43},
    107: {type: "ice_beam", x: 1327, y: 556, area: "norfair", name: "Ice Beam No", order100Percent: 16},
    108: {type: "wave_beam", x: 915, y: 990, area: "norfair", name: "Wave Beam", order100Percent: 23},  

    201: {type: "energy", x: 1275, y: 324, area: "brinstar", name: "Energy Tank", order100Percent: 5},
    202: {type: "energy", x: 1316, y: 897, area: "norfair", name: "Energy Tank", order100Percent: 20},     
    203: {type: "energy", x: 1222, y: 116, area: "brinstar", name: "Energy Tank", order100Percent: 27}, 
    204: {type: "energy", x: 491, y: 1049, area: "kraids_lair", name: "Energy Tank", order100Percent: 32},
    205: {type: "energy", x: 406, y: 1405, area: "norfair", name: "Energy Tank", order100Percent: 35},
    206: {type: "energy", x: 848, y: 1190, area: "ridleys_lair", name: "Energy Tank", order100Percent: 38},
    207: {type: "energy", x: 756, y: 1388, area: "ridleys_lair", name: "Energy Tank", order100Percent: 42},
    208: {type: "energy", x: 419, y: 642, area: "brinstar", name: "Energy Tank", order100Percent: 44},

    // Missiles
    301: {type: "missile", x: 910, y: 507, area: "brinstar", name: "Missile", order100Percent: 3},
    302: {type: "missile", x: 902, y: 648, area: "norfair", name: "Missile", order100Percent: 8},
    303: {type: "missile", x: 849, y: 697, area: "norfair", name: "Missile", order100Percent: 9},
    304: {type: "missile", x: 1421, y: 509, area: "norfair", name: "Missile", order100Percent: 11},
    305: {type: "missile", x: 1369, y: 505, area: "norfair", name: "Missile", order100Percent: 12},
    306: {type: "missile", x: 1316, y: 502, area: "norfair", name: "Missile", order100Percent: 13},
    307: {type: "missile", x: 1421, y: 457, area: "norfair", name: "Missile", order100Percent: 14},
    308: {type: "missile", x: 1369, y: 460, area: "norfair", name: "Missile", order100Percent: 15},
    309: {type: "missile", x: 1005, y: 701, area: "norfair", name: "Missile", order100Percent: 17},
    310: {type: "missile", x: 950, y: 699, area: "norfair", name: "Missile", order100Percent: 18},
    311: {type: "missile", x: 950, y: 1046, area: "norfair", name: "Missile", order100Percent: 21},
    312: {type: "missile", x: 1010, y: 1045, area: "norfair", name: "Missile", order100Percent: 22},
    313: {type: "missile", x: 1428, y: 945, area: "norfair", name: "Missile", order100Percent: 24},
    314: {type: "missile", x: 1222, y: 116, area: "brinstar", name: "Missile", order100Percent: 26},
    315: {type: "missile", x: 441, y: 994, area: "kraids_lair", name: "Missile", order100Percent: 29},
    316: {type: "missile", x: 182, y: 997, area: "kraids_lair", name: "Missile", order100Percent: 30},
    317: {type: "missile", x: 234, y: 1285, area: "kraids_lair", name: "Missile", order100Percent: 31},
    318: {type: "missile", x: 491, y: 1185, area: "kraids_lair", name: "Missile", order100Percent: 33},
    320: {type: "missile", x: 922, y: 1142, area: "ridleys_lair", name: "Missile", order100Percent: 37},
    321: {type: "missile", x: 1029, y: 1436, area: "ridleys_lair", name: "Missile", order100Percent: 39},
    322: {type: "missile", x: 1237, y: 1289, area: "ridleys_lair", name: "Missile", order100Percent: 40},
};

// Collection state array
const collectedItems = new Array(Object.keys(items).length).fill(false);

// Update HTML to show items in left panel
function updateItemList() {
    const $itemsList = $('.items-list');
    $itemsList.empty(); // Clear existing content
    
    // Group items by type
    const itemsByType = {};
    Object.entries(items).forEach(([id, item]) => {
        if (!itemsByType[item.type]) {
            itemsByType[item.type] = [];
        }
        itemsByType[item.type].push({id, ...item});
    });

    // Update counters
    const energyCount = collectedItems.filter((collected, index) => 
        collected && items[index + 1]?.type === 'energy'
    ).length;
    
    const missileContainers = collectedItems.filter((collected, index) => 
        collected && items[index + 1]?.type === 'missile'
    ).length;
    const missileCount = missileContainers * 5; // Each container gives 5 missiles

    $('#energy-count').text(energyCount);
    $('#missile-count').text(missileCount);

    // Create sections in the specified order
    sectionOrder.forEach((section) => {
        const $section = $('<div>', {
            class: 'item-section'
        });
        
        $section.append($('<h3>', {
            text: section.charAt(0).toUpperCase() + section.slice(1)
        }));

        // Get all items that belong to this section's types
        const sectionItems = [];
        itemTypes[section].forEach(type => {
            if (itemsByType[type]) {
                sectionItems.push(...itemsByType[type]);
            }
        });

        // Sort items by ID within each section
        sectionItems.sort((a, b) => a.id - b.id);

        sectionItems.forEach((item) => {
            const isCollected = collectedItems[item.id-1];
            const $item = $('<div>', {
                class: `item-entry${isCollected ? ' collected' : ''}`,
                'data-id': item.id
            });

            // Create sprite container and sprite
            const $spriteContainer = $('<div>', {
                class: 'sprite-container'
            });

            const $sprite = $('<div>', {
                class: `sprite sprite-${item.type}`
            });

            const $label = $('<span>', {
                text: item.name
            });

            $spriteContainer.append($sprite);
            $item.append($spriteContainer, $label);
            $section.append($item);

            // Click handler for collecting items
            $item.on('click', () => {
                collectedItems[item.id-1] = !collectedItems[item.id-1];
                $item.toggleClass('collected');
                console.log(`Item ${item.id} (${item.type}) collected:`, collectedItems[item.id-1]);
                updateItemList();
                createItemOverlay(); // Update markers
            });
        });

        if (sectionItems.length > 0) {
            $itemsList.append($section);
        }
    });
}

function createItemOverlay() {
    const $overlay = $('#item-overlay');
    console.log('Creating overlay, found overlay element:', $overlay.length > 0);
    $overlay.empty();

    const markerSize = 32; // Full size now (was 16)

    Object.entries(items).forEach(([id, item]) => {
        if (collectedItems[id-1]) {
            console.log(`Creating marker for ${item.type} #${id} at ${item.x},${item.y}`);
            const $marker = $('<div>', {
                class: `item-marker ${item.type}-marker`,
                'data-id': id
            }).css({
                position: 'absolute',
                left: `${item.x - markerSize/2}px`,  // Center horizontally
                top: `${item.y - markerSize/2}px`,   // Center vertically
                transform: scale !== 1 ? `scale(${Math.min(2, 1/scale)})` : 'none'  // Cap at 2x original size
            });

            const $sprite = $('<div>', {
                class: `sprite sprite-${item.type}`
            });

            $marker.append($sprite);
            $overlay.append($marker);
        }
    });
    
    console.log('Total markers created:', $overlay.children().length);
}

// Sort and check items
function checkItemSequence() {
    const numbers = Object.keys(items).map(Number).sort((a, b) => a - b);
    console.log('Sorted numbers:', numbers);
    
    // Check for missing numbers
    let missing = [];
    for(let i = 1; i <= Math.max(...numbers); i++) {
        if(!numbers.includes(i)) {
            missing.push(i);
        }
    }
    
    if(missing.length > 0) {
        console.log('Missing numbers:', missing);
    } else {
        console.log('No missing numbers! Sequence is complete from 1 to', Math.max(...numbers));
    }
    
    // Print sorted coordinates
    console.log('\nSorted coordinates:');
    numbers.forEach(num => {
        console.log(`${num}: {x: ${items[num].x}, y: ${items[num].y}}`);
    });
} 