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

        // Update individual markers to counter the map scale
        $('.item-marker').css({
            transform: `scale(${1/scale})`
        });
    }
}

const items = {
    // Energy Tanks
    1: {x: 600, y: 950, type: "energy"},
    2: {x: 650, y: 950, type: "energy"},
    3: {x: 700, y: 950, type: "energy"},
    4: {x: 750, y: 950, type: "energy"},
    5: {x: 800, y: 950, type: "energy"},
    6: {x: 850, y: 950, type: "energy"},

    // Missiles
    7: {x: 900, y: 950, type: "missile"},
    8: {x: 950, y: 950, type: "missile"},
    9: {x: 1000, y: 400, type: "missile"},
    10: {x: 950, y: 400, type: "missile"},
    11: {x: 1000, y: 320, type: "missile"},
    12: {x: 950, y: 320, type: "missile"},
    13: {x: 1000, y: 280, type: "missile"},
    14: {x: 950, y: 280, type: "missile"},
    15: {x: 900, y: 280, type: "missile"},
    16: {x: 920, y: 350, type: "missile"},
    17: {x: 800, y: 480, type: "missile"},
    18: {x: 700, y: 450, type: "missile"},
    19: {x: 650, y: 500, type: "missile"},
    20: {x: 900, y: 600, type: "missile"},
    21: {x: 700, y: 700, type: "missile"},
    22: {x: 750, y: 700, type: "missile"},
    23: {x: 800, y: 700, type: "missile"},
    24: {x: 900, y: 750, type: "missile"},
    25: {x: 520, y: 50, type: "missile"},
    26: {x: 850, y: 50, type: "missile"},
    27: {x: 950, y: 50, type: "missile"},
    28: {x: 200, y: 600, type: "missile"},
    29: {x: 250, y: 600, type: "missile"},
    30: {x: 200, y: 700, type: "missile"},
    31: {x: 250, y: 700, type: "missile"},
    32: {x: 300, y: 700, type: "missile"},
    33: {x: 350, y: 750, type: "missile"},
    34: {x: 150, y: 800, type: "missile"},
    35: {x: 200, y: 800, type: "missile"},
    36: {x: 250, y: 800, type: "missile"},
    37: {x: 600, y: 800, type: "missile"},
    38: {x: 900, y: 800, type: "missile"},
    39: {x: 700, y: 900, type: "missile"},
    40: {x: 800, y: 850, type: "missile"},
    41: {x: 500, y: 900, type: "missile"},
    42: {x: 400, y: 900, type: "missile"},
    43: {x: 600, y: 250, type: "missile"},
    44: {x: 180, y: 480, type: "missile"},
    45: {x: 150, y: 50, type: "missile"},
    46: {x: 120, y: 350, type: "missile"}
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
        collected && items[index + 1].type === 'energy'
    ).length;
    
    const missileCount = collectedItems.filter((collected, index) => 
        collected && items[index + 1].type === 'missile'
    ).length;

    $('#energy-count').text(energyCount);
    $('#missile-count').text(missileCount);

    // Create sections for each type
    Object.entries(itemsByType).forEach(([type, typeItems]) => {
        const $section = $('<div>', {
            class: 'item-section'
        });
        
        $section.append($('<h3>', {
            text: type.charAt(0).toUpperCase() + type.slice(1)
        }));

        typeItems.forEach((item) => {
            const $item = $('<div>', {
                class: 'item-entry',
                'data-id': item.id
            });

            const $circle = $('<div>', {
                class: 'item-circle' + (collectedItems[item.id-1] ? ' collected' : '')
            });

            const $label = $('<span>', {
                text: `${type} #${item.id} (${item.x},${item.y})`
            });

            $item.append($circle, $label);
            $section.append($item);

            // Click handler for collecting items
            $item.on('click', () => {
                collectedItems[item.id-1] = !collectedItems[item.id-1];
                $circle.toggleClass('collected');
                console.log(`Item ${item.id} (${item.type}) collected:`, collectedItems[item.id-1]);
                updateItemList();
                createItemOverlay(); // Update markers
            });
        });

        $itemsList.append($section);
    });
}

function createItemOverlay() {
    const $overlay = $('#item-overlay');
    console.log('Creating overlay, found overlay element:', $overlay.length > 0);
    $overlay.empty();

    // Add a test marker to verify positioning
    $overlay.append($('<div>', {
        style: 'position: absolute; top: 0; left: 0; width: 20px; height: 20px; background: yellow; z-index: 100;'
    }));

    Object.entries(items).forEach(([id, item]) => {
        if (collectedItems[id-1]) {
            console.log(`Creating marker for ${item.type} #${id} at ${item.x},${item.y}`);
            const $marker = $('<div>', {
                class: `item-marker ${item.type}-marker`,
                'data-id': id
            }).css({
                position: 'absolute',
                left: `${item.x}px`,
                top: `${item.y}px`,
                transform: scale !== 1 ? `scale(${1/scale})` : 'none'
            });

            // Add text label for testing
            const $label = $('<div>', {
                text: `${item.type} #${id}`,
                style: 'color: white; font-size: 12px; text-shadow: 1px 1px 1px black;'
            });

            const $sprite = $('<div>', {
                class: `sprite sprite-${item.type}`
            });

            $marker.append($sprite, $label);
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