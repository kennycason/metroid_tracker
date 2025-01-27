let energyTanks = 0;
let missiles = 0;
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// Add view state variable
let currentView = 'type';

// Add at the top with other global variables
let currentNextItem = null;

// Add at the top with other global variables
const itemShortCodes = {
    'maru_mari': 'mm',
    'varia_suit': 'vs',
    'hi_jump': 'hj',
    'wave_beam': 'wb',
    'screw_attack': 'sa',
    'long_beam': 'lb',
    'bombs': 'b',
    'kraid': 'k',
    'ridley': 'r'
};

// Add at the top with other global variables
const tracks = [
    { title: "Intro", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/1%20-%20Intro.mp3" },
    { title: "Enter: Samus", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/2%20-%20Enter%20%20Samus.mp3" },
    { title: "Brinstar", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/3%20-%20Brinstar.mp3" },
    { title: "Norfair", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/4%20-%20Norfair.mp3" },
    { title: "Kraid's Lair", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/5%20-%20Kraid%27s%20Lair.mp3" },
    { title: "Ridley's Lair", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/6%20-%20Ridley%27s%20Lair.mp3" },
    { title: "Chozos", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/7%20-%20Chozos.mp3" },
    // { title: "Power Up", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/8%20-%20Power%20Up.mp3" },
    { title: "Tourian", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/9%20-%20Tourian.mp3" },
    { title: "Mother Brain", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/10%20-%20Mother%20Brain.mp3" },
    { title: "Quick Escape", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/11%20-%20Quick%20Escape.mp3" },
    { title: "Mission Completed Successfully", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/12%20-%20Mission%20Completed%20Successfully.mp3" }
];

let currentTrack = 0;
let audio = null;
let isPlaying = false;
let isLooping = false;
let isMuted = true;

// Initialize the tracker
$(document).ready(() => {
    updateCounters();
    // initializeMagnifier();  // Temporarily disabled in favor of zoom+drag
    checkItemSequence();
    updateItemList();
    initializeMapZoom();
    createItemOverlay(); // Initial creation of markers

    // Update during resize, not just after
    $(window).on('resize', () => {
        createItemOverlay();
        applyTransformWithConstraints();
    });

    // Add non-passive wheel event listener
    const mapContainer = document.querySelector('.map-container');
    mapContainer.addEventListener('wheel', handleWheel, { passive: false });

    // Add view toggle handler
    $('.toggle-btn').on('click', function() {
        const view = $(this).data('view');
        $('.toggle-btn').removeClass('active');
        $(this).addClass('active');
        currentView = view;
        
        // When switching to 100% view, find the next uncollected item after the last collected one
        if (view == '100') {
            const sortedItems = Object.entries(items)
                .map(([id, item]) => ({id: parseInt(id), ...item}))
                .sort((a, b) => a.order100Percent - b.order100Percent);
            
            // Find the last collected item's order
            const lastCollectedOrder = Math.max(...sortedItems
                .filter(item => collectedItems[item.id-1])
                .map(item => item.order100Percent), 0);
            
            // Find the next uncollected item after the last collected one
            currentNextItem = sortedItems.find(item => 
                !collectedItems[item.id-1] && item.order100Percent > lastCollectedOrder
            );
            
            if (currentNextItem) {
                console.log('Next item to collect:', currentNextItem.name);
            } else {
                console.log('No more items to collect in 100% view');
                currentNextItem = null;
            }
        } else {
            currentNextItem = null;
        }
        
        updateItemList();
        createItemOverlay();
    });

    // Add share button handler
    $('.share-btn').on('click', () => {
        const shareUrl = generateShareUrl();
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share URL copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy URL:', err);
            prompt('Copy this share URL:', shareUrl);
        });
    });

    // Load state from URL if parameters exist
    if (window.location.search) {
        loadStateFromUrl();
    }

    // Initialize audio
    audio = new Audio();
    audio.src = tracks[0].url; // Set initial track
    updateTrackDisplay(); // Show initial track title
    
    audio.addEventListener('ended', () => {
        if (isLooping) {
            audio.currentTime = 0;
            audio.play().catch(err => {
                console.error('Failed to play audio:', err);
            });
        } else {
            nextTrack();
        }
    });

    // Add audio control handlers
    $('.audio-btn#playPause').on('click', togglePlay);
    $('.audio-btn#prevTrack').on('click', prevTrack);
    $('.audio-btn#nextTrack').on('click', nextTrack);
    $('.audio-btn#loopTrack').on('click', toggleLoop);
    $('.volume-btn').on('click', toggleVolume);

    // Initialize volume state
    $('.retro-player').removeClass('visible');
    updateVolumeIcon(true); // Start muted
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
    const $overlay = $('#item-overlay');
    
    const minScale = 0.5;
    const maxScale = 4;
    let isHovering = false;
    let isDragging = false;
    let lastX, lastY;
    let isGesturing = false; // Track if we're in a gesture

    // Add hover detection
    $mapContainer.on('mouseenter', () => {
        isHovering = true;
    }).on('mouseleave', () => {
        isHovering = false;
    });

    // Add click handler for coordinate logging
    $mapContainer.on('click', (e) => {
        if (isDragging) return;
        
        const rect = $mapContainer[0].getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const actualX = Math.round((mouseX - offsetX) / scale);
        const actualY = Math.round((mouseY - offsetY) / scale);
        
        console.log(`Clicked coordinates - x: ${actualX}, y: ${actualY}`);
    });

    // Add drag functionality
    $mapContainer.on('mousedown', (e) => {
        if (scale > 1) {
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

    // Add touchpad gesture support
    $mapContainer[0].addEventListener('gesturestart', (e) => {
        e.preventDefault();
        isGesturing = true;
    }, { passive: false });

    $mapContainer[0].addEventListener('gesturechange', (e) => {
        e.preventDefault();
        if (!isGesturing) return;

        const rect = $mapContainer[0].getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate new scale
        const oldScale = scale;
        scale = Math.min(Math.max(scale * e.scale, minScale), maxScale);

        // Adjust offsets to zoom towards center
        if (scale !== oldScale) {
            const scaleChange = scale / oldScale;
            offsetX = centerX - (centerX - offsetX) * scaleChange;
            offsetY = centerY - (centerY - offsetY) * scaleChange;
            applyTransformWithConstraints();
        }
    }, { passive: false });

    $mapContainer[0].addEventListener('gestureend', (e) => {
        e.preventDefault();
        isGesturing = false;
    }, { passive: false });
}

// Move applyTransformWithConstraints to global scope
function applyTransformWithConstraints() {
    const $map = $('#metroid-map');
    const $mapContainer = $('.map-container');
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

// Group types for section ordering
const sectionOrder = ["bosses", "items", "energy", "missile"];
const itemTypes = {
    "bosses": ["kraid", "ridley"],
    "items": [
        "maru_mari", 
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
    1: {type: "kraid", x: 1805, y: 6865, area: "kraids_lair", name: "Kraid", order100Percent: 34},
    2: {type: "ridley", x: 4133, y: 6860, area: "ridleys_lair", name: "Ridley", order100Percent: 41},
    // Items
    100: {type: "maru_mari", x: 360, y: 3270, area: "brinstar", name: "Maru Mari", order100Percent: 2},
    101: {type: "bombs", x: 6120, y: 1030, area: "brinstar", name: "Bombs", order100Percent: 6},
    102: {type: "hi_jump", x: 6634, y: 3940, area: "norfair", name: "Hi Jump", order100Percent: 10},
    103: {type: "varia_suit", x: 3648, y: 327, area: "brinstar", name: "Varia Suit", order100Percent: 25},
    104: {type: "screw_attack", x: 3643, y: 3693, area: "norfair", name: "Screw Attack", order100Percent: 19},
    105: {type: "long_beam", x: 1666, y: 1044, area: "brinstar", name: "Long Beam", order100Percent: 4},
    106: {type: "ice_beam", x: 4651, y: 1985, area: "brinstar", name: "Ice Beam Br", order100Percent: 43},
    107: {type: "ice_beam", x: 6370, y: 2752, area: "norfair", name: "Ice Beam No", order100Percent: 16},
    108: {type: "wave_beam", x: 4392, y: 4901, area: "norfair", name: "Wave Beam", order100Percent: 23},

    // Energy Tanks
    201: {type: "energy", x: 6264, y: 1574, area: "brinstar", name: "Energy Tank", order100Percent: 5},
    202: {type: "energy", x: 6317, y: 4440, area: "norfair", name: "Energy Tank", order100Percent: 20},
    203: {type: "energy", x: 5866, y: 574, area: "brinstar", name: "Energy Tank", order100Percent: 27},
    204: {type: "energy", x: 2357, y: 5193, area: "kraids_lair", name: "Energy Tank", order100Percent: 32},
    205: {type: "energy", x: 1949, y: 6955, area: "norfair", name: "Energy Tank", order100Percent: 35},
    206: {type: "energy", x: 4070, y: 5891, area: "ridleys_lair", name: "Energy Tank", order100Percent: 38},
    207: {type: "energy", x: 3629, y: 6871, area: "ridleys_lair", name: "Energy Tank", order100Percent: 42},
    208: {type: "energy", x: 2011, y: 3178, area: "brinstar", name: "Energy Tank", order100Percent: 44},

    // Missiles
    301: {type: "missile", x: 4368, y: 2510, area: "brinstar", name: "Missile", order100Percent: 3},
    302: {type: "missile", x: 4330, y: 3208, area: "norfair", name: "Missile", order100Percent: 8},
    303: {type: "missile", x: 4075, y: 3450, area: "norfair", name: "Missile", order100Percent: 9},
    304: {type: "missile", x: 6821, y: 2520, area: "norfair", name: "Missile", order100Percent: 11},
    305: {type: "missile", x: 6571, y: 2500, area: "norfair", name: "Missile", order100Percent: 12},
    306: {type: "missile", x: 6317, y: 2485, area: "norfair", name: "Missile", order100Percent: 13},
    307: {type: "missile", x: 6821, y: 2262, area: "norfair", name: "Missile", order100Percent: 14},
    308: {type: "missile", x: 6571, y: 2277, area: "norfair", name: "Missile", order100Percent: 15},
    309: {type: "missile", x: 4824, y: 3470, area: "norfair", name: "Missile", order100Percent: 17},
    310: {type: "missile", x: 4560, y: 3460, area: "norfair", name: "Missile", order100Percent: 18},
    311: {type: "missile", x: 4560, y: 5178, area: "norfair", name: "Missile", order100Percent: 21},
    312: {type: "missile", x: 4848, y: 5173, area: "norfair", name: "Missile", order100Percent: 22},
    313: {type: "missile", x: 6854, y: 4678, area: "norfair", name: "Missile", order100Percent: 24},
    314: {type: "missile", x: 5866, y: 574, area: "brinstar", name: "Missile", order100Percent: 26},
    315: {type: "missile", x: 2117, y: 4920, area: "kraids_lair", name: "Missile", order100Percent: 29},
    316: {type: "missile", x: 874, y: 4935, area: "kraids_lair", name: "Missile", order100Percent: 30},
    317: {type: "missile", x: 1123, y: 6361, area: "kraids_lair", name: "Missile", order100Percent: 31},
    318: {type: "missile", x: 2357, y: 5866, area: "kraids_lair", name: "Missile", order100Percent: 33},
    320: {type: "missile", x: 4426, y: 5653, area: "ridleys_lair", name: "Missile", order100Percent: 37},
    321: {type: "missile", x: 4939, y: 7108, area: "ridleys_lair", name: "Missile", order100Percent: 39},
    322: {type: "missile", x: 5938, y: 6381, area: "ridleys_lair", name: "Missile", order100Percent: 40}
};

// Collection state array
const collectedItems = new Array(Object.keys(items).length).fill(false);

// Update HTML to show items in left panel
function updateItemList() {
    const $itemsList = $('.items-list');
    $itemsList.empty();
    
    if (currentView === 'type') {
        // Original type-based view
        const itemsByType = {};
        Object.entries(items).forEach(([id, item]) => {
            if (!itemsByType[item.type]) {
                itemsByType[item.type] = [];
            }
            itemsByType[item.type].push({id, ...item});
        });

        // Create sections in the specified order
        sectionOrder.forEach((section) => {
            const $section = $('<div>', {
                class: 'item-section'
            });
            
            $section.append($('<h3>', {
                text: section.charAt(0).toUpperCase() + section.slice(1)
            }));

            const sectionItems = [];
            itemTypes[section].forEach(type => {
                if (itemsByType[type]) {
                    sectionItems.push(...itemsByType[type]);
                }
            });

            sectionItems.sort((a, b) => a.id - b.id);
            appendItems($section, sectionItems);

            if (sectionItems.length > 0) {
                $itemsList.append($section);
            }
        });
    } else {
        // 100% completion order view
        const allItems = Object.entries(items)
            .map(([id, item]) => ({id, ...item}))
            .sort((a, b) => a.order100Percent - b.order100Percent);

        appendItems($itemsList, allItems);
    }

    // Update counters
    const energyCount = collectedItems.filter((collected, index) => 
        collected && items[index + 1]?.type === 'energy'
    ).length;
    
    const missileContainers = collectedItems.filter((collected, index) => 
        collected && items[index + 1]?.type === 'missile'
    ).length;
    const missileCount = missileContainers * 5;

    $('#energy-count').text(energyCount);
    $('#missile-count').text(missileCount);
}

function appendItems($container, items) {
    items.forEach((item) => {
        const isCollected = collectedItems[item.id-1];
        const $item = $('<div>', {
            class: `item-entry${isCollected ? ' collected' : ''}`,
            'data-id': item.id
        });

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
        $container.append($item);

        $item.on('click', () => {
            collectedItems[item.id-1] = !collectedItems[item.id-1];
            $item.toggleClass('collected');
            console.log(`Item ${item.id} (${item.type}) collected:`, collectedItems[item.id-1]);
            
            // Find next uncollected item in the current view's order
            if (currentView == '100') {
                console.log('Current view is 100%');
                const sortedItems = Object.entries(items)
                    .map(([id, item]) => ({id: parseInt(id), ...item}))
                    .sort((a, b) => a.order100Percent - b.order100Percent);

                // Find the last collected item's order
                const lastCollectedOrder = Math.max(...sortedItems
                    .filter(item => collectedItems[item.id-1])
                    .map(item => item.order100Percent), 0);
                
                // Find the next uncollected item after the last collected one
                currentNextItem = sortedItems.find(item => 
                    !collectedItems[item.id-1] && item.order100Percent > lastCollectedOrder
                );

                if (currentNextItem) {
                    console.log('Next item to collect:', currentNextItem.name);
                } else {
                    console.log('No more items to collect in 100% view');
                    currentNextItem = null;
                }
            } else {
                console.log('Current view is type');
                currentNextItem = null;
            }
            
            updateItemList();
            createItemOverlay();
        });
    });
}

function createItemOverlay() {
    const $overlay = $('#item-overlay');
    const $map = $('#metroid-map');
    const $container = $('.map-container');
    
    $overlay.empty();
    console.log('Current view:', currentView);

    // Get all relevant dimensions
    const mapNaturalWidth = $map[0].naturalWidth;
    const mapNaturalHeight = $map[0].naturalHeight;
    const containerRect = $container[0].getBoundingClientRect();

    // Calculate the displayed dimensions while maintaining aspect ratio
    const containerAspect = containerRect.width / containerRect.height;
    const mapAspect = mapNaturalWidth / mapNaturalHeight;

    let displayWidth, displayHeight;
    if (containerAspect > mapAspect) {
        // Height is the limiting factor
        displayHeight = containerRect.height;
        displayWidth = displayHeight * mapAspect;
    } else {
        // Width is the limiting factor
        displayWidth = containerRect.width;
        displayHeight = displayWidth / mapAspect;
    }

    // Calculate scaling based on the displayed dimensions
    const scaleX = displayWidth / mapNaturalWidth;
    const scaleY = displayHeight / mapNaturalHeight;

    // Create markers for collected items and next item
    Object.entries(items).forEach(([id, item]) => {
        const isCollected = collectedItems[id-1];
        const isNextItem = currentView == '100' && currentNextItem && id == currentNextItem.id;

        // Show marker if item is collected OR if it's the next item in 100% view
        if (isCollected || isNextItem) {
            const $marker = $('<div>', {
                class: `item-marker ${item.type}-marker`,
                'data-id': id
            }).css({
                position: 'absolute',
                left: `${item.x * scaleX}px`,
                top: `${item.y * scaleY}px`,
                transform: `scale(${Math.min(2, 1/scale)})`,
                'transform-origin': '0 0'
            });

            const $sprite = $('<div>', {
                class: `sprite sprite-${item.type}${isNextItem ? ' next-item' : ''}`
            });

            if (isNextItem) {
                console.log('Creating highlighted marker for next item:', item.name);
            }

            $marker.append($sprite);
            $overlay.append($marker);
        }
    });

    // Apply map transform
    $overlay.css('transform', $map.css('transform'));
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

// Update handleWheel to not interfere with gestures
function handleWheel(e) {
    const $mapContainer = $('.map-container');
    if (!$mapContainer.is(':hover') || isGesturing) return;
    
    e.preventDefault();
    
    const rect = $mapContainer[0].getBoundingClientRect();
    const $map = $('#metroid-map');
    const mapRect = $map[0].getBoundingClientRect();

    // Calculate mouse position relative to the map's visible area
    const mouseX = e.clientX - mapRect.left;
    const mouseY = e.clientY - mapRect.top;

    // Calculate the point on the map in its natural coordinates
    const pointX = mouseX / scale;
    const pointY = mouseY / scale;
    
    // Update scale
    const scaleStep = 0.1;
    const minScale = 0.5;
    const maxScale = 4;
    
    const oldScale = scale;
    if (e.deltaY < 0) {
        scale = Math.min(scale * (1 + scaleStep), maxScale);
    } else {
        scale = Math.max(scale * (1 - scaleStep), minScale);
    }

    // Calculate new offsets to keep the mouse point fixed
    offsetX += mouseX - (pointX * scale);
    offsetY += mouseY - (pointY * scale);

    applyTransformWithConstraints();
}

// Add after document ready
function generateShareUrl() {
    const collectedState = {
        items: {},
        missiles: [],
        energy: []
    };

    // Collect state
    Object.entries(items).forEach(([id, item]) => {
        if (collectedItems[id-1]) {
            if (item.type === 'missile') {
                collectedState.missiles.push(parseInt(id) - 300);
            } else if (item.type === 'energy') {
                collectedState.energy.push(parseInt(id) - 200);
            } else if (item.type === 'ice_beam') {
                // Handle ice beams separately based on their IDs
                if (id === '106') { // Ice Beam Br
                    collectedState.items['ib'] = 1;
                } else if (id === '107') { // Ice Beam No
                    collectedState.items['ib2'] = 1;
                }
            } else if (itemShortCodes[item.type]) {
                collectedState.items[itemShortCodes[item.type]] = 1;
            }
        }
    });

    // Build URL parts manually to avoid escaping
    let urlParts = [];
    
    // Add items
    Object.entries(collectedState.items).forEach(([code, value]) => {
        urlParts.push(`${code}=${value}`);
    });

    // Add missiles and energy if any collected
    if (collectedState.missiles.length > 0) {
        urlParts.push(`m=${collectedState.missiles.join(',')}`);
    }
    if (collectedState.energy.length > 0) {
        urlParts.push(`e=${collectedState.energy.join(',')}`);
    }

    return `${window.location.origin}${window.location.pathname}?${urlParts.join('&')}`;
}

function loadStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    
    // Reset collection state
    collectedItems.fill(false);

    // Load regular items
    Object.entries(itemShortCodes).forEach(([type, code]) => {
        if (params.has(code)) {
            // Find and collect the item
            Object.entries(items).forEach(([id, item]) => {
                if (item.type === type) {
                    collectedItems[id-1] = true;
                }
            });
        }
    });

    // Handle ice beams separately
    if (params.has('ib')) {
        // Collect Ice Beam Br
        collectedItems[106-1] = true;
    }
    if (params.has('ib2')) {
        // Collect Ice Beam No
        collectedItems[107-1] = true;
    }

    // Load missiles
    if (params.has('m')) {
        params.get('m').split(',').forEach(num => {
            const id = 300 + parseInt(num);
            if (items[id]) {
                collectedItems[id-1] = true;
            }
        });
    }

    // Load energy tanks
    if (params.has('e')) {
        params.get('e').split(',').forEach(num => {
            const id = 200 + parseInt(num);
            if (items[id]) {
                collectedItems[id-1] = true;
            }
        });
    }

    // Update display
    updateItemList();
    createItemOverlay();
}

function updateTrackDisplay() {
    const $title = $('#trackTitle');
    const title = tracks[currentTrack].title;
    $title.text(title);
    
    // Remove any existing animation
    $title.css('animation', 'none');
    
    // Force reflow
    void $title[0].offsetWidth;
    
    // Calculate animation duration based on text length
    const duration = Math.max(5, title.length * 0.3);
    
    // Add animation if text is too long
    if ($title.width() > $('.track-display').width()) {
        $title.css('animation', `scroll ${duration}s linear infinite`);
    }
}

function togglePlay() {
    if (!audio.src) {
        audio.src = tracks[currentTrack].url;
        updateTrackDisplay();
    }

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        $('#playPause').removeClass('active');
        $('#playPause').find('svg path').attr('d', 'M8 5v14l11-7z');
        // Pause the scrolling
        $('#trackTitle').css('animation-play-state', 'paused');
    } else {
        audio.play().catch(err => {
            console.error('Failed to play audio:', err);
        });
        isPlaying = true;
        $('#playPause').addClass('active');
        $('#playPause').find('svg path').attr('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
        // Resume the scrolling
        $('#trackTitle').css('animation-play-state', 'running');
    }
}

function prevTrack() {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    if (isPlaying) {
        audio.src = tracks[currentTrack].url;
        audio.play().catch(err => {
            console.error('Failed to play audio:', err);
        });
    } else {
        audio.src = tracks[currentTrack].url;
    }
    updateTrackDisplay();
}

function nextTrack() {
    currentTrack = (currentTrack + 1) % tracks.length;
    if (isPlaying) {
        audio.src = tracks[currentTrack].url;
        audio.play().catch(err => {
            console.error('Failed to play audio:', err);
        });
    } else {
        audio.src = tracks[currentTrack].url;
    }
    updateTrackDisplay();
}

function toggleLoop() {
    isLooping = !isLooping;
    const $loopBtn = $('#loopTrack');
    if (isLooping) {
        $loopBtn.addClass('active');
    } else {
        $loopBtn.removeClass('active');
    }
}

function toggleVolume() {
    isMuted = !isMuted;
    
    if (isMuted) {
        audio.volume = 0;
        $('.retro-player').removeClass('visible');
    } else {
        audio.volume = 1;
        $('.retro-player').addClass('visible');
    }
    
    updateVolumeIcon(isMuted);
}

function updateVolumeIcon(muted) {
    const $volumeBtn = $('.volume-btn');
    if (muted) {
        $volumeBtn.find('svg path').attr('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z');
    } else {
        $volumeBtn.find('svg path').attr('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
    }
    $volumeBtn.toggleClass('active', !muted);
} 