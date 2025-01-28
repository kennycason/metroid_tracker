// Global state variables
let energyTanks = 0;
let missiles = 0;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let currentView = 'type';
let currentNextItem = null;
let isGesturing = false;
let lastTouchDistance = 0;
let showAllItems = false;
let currentLanguage = 'en';

// Audio state
let currentTrack = 0;
let audio = null;
let isPlaying = false;
let isLooping = false;
let isMuted = true;

// Add PDF viewer state variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;

// Item type mappings
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

// Audio tracks configuration
const tracks = [
    { title: "Title", jpTitle: "タイトル", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/1%20-%20Intro.mp3" },
    { title: "Brinstar", jpTitle: "ブリンスタ", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/3%20-%20Brinstar.mp3" },
    { title: "Norfair", jpTitle: "ノルフェア ", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/4%20-%20Norfair.mp3" },
    { title: "Kraid", jpTitle: "クレイド", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/5%20-%20Kraid%27s%20Lair.mp3" },
    { title: "Ridley", jpTitle: "リドリー", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/6%20-%20Ridley%27s%20Lair.mp3" },
    { title: "Item Room", jpTitle: "アイテムルーム", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/7%20-%20Chozos.mp3" },
    { title: "Tourian", jpTitle: "ツーリアン", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/9%20-%20Tourian.mp3" },
    { title: "Zebetite", jpTitle: "ゼベタイト", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/10%20-%20Mother%20Brain.mp3" },
    { title: "Escape", jpTitle: "脱出", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/11%20-%20Quick%20Escape.mp3" },
    { title: "Ending", jpTitle: "エンディング", url: "https://fi.zophar.net/soundfiles/nintendo-nes-nsf/metroid/12%20-%20Mission%20Completed%20Successfully.mp3" }
];

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
    1: {type: "kraid", x: 1885, y: 6882, area: "kraids_lair", name: "Kraid", jpName: "クレイド", order100Percent: 34},
    2: {type: "ridley", x: 4201, y: 6805, area: "ridleys_lair", name: "Ridley", jpName: "リドリー", order100Percent: 41},
    // Items
    100: {type: "maru_mari", x: 360, y: 3270, area: "brinstar", name: "Maru Mari", jpName: "まるまり", order100Percent: 2},
    101: {type: "bombs", x: 6264, y: 1016, area: "brinstar", name: "Bombs", jpName: "ボム", order100Percent: 6},
    102: {type: "hi_jump", x: 6777, y: 3896, area: "norfair", name: "Hi Jump", jpName: "ハイジャンプ", order100Percent: 10},
    103: {type: "varia_suit", x: 3705, y: 296, area: "brinstar", name: "Varia Suit", jpName: "バリアスーツ", order100Percent: 25},
    104: {type: "screw_attack", x: 3702, y: 3656, area: "norfair", name: "Screw Attack", jpName: "スクリューアタック", order100Percent: 19},
    105: {type: "long_beam", x: 1656, y: 1017, area: "brinstar", name: "Long Beam", jpName: "ロングビーム", order100Percent: 4},
    106: {type: "ice_beam", x: 4729, y: 1974, area: "brinstar", name: "Ice Beam Br", jpName: "アイスビーム Br", order100Percent: 43},
    107: {type: "ice_beam", x: 6523, y: 2696, area: "norfair", name: "Ice Beam No", jpName: "アイスビーム No", order100Percent: 16},
    108: {type: "wave_beam", x: 4470, y: 4856, area: "norfair", name: "Wave Beam", jpName: "ウェーブビーム", order100Percent: 23},

    // Energy Tanks
    201: {type: "energy", x: 6264, y: 1574, area: "brinstar", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 5},
    202: {type: "energy", x: 6440, y: 4390, area: "norfair", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 20},
    203: {type: "energy", x: 6776, y: 614, area: "brinstar", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 27},
    204: {type: "energy", x: 2408, y: 5140, area: "kraids_lair", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 32},
    205: {type: "energy", x: 2024, y: 6900, area: "norfair", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 35},
    206: {type: "energy", x: 4168, y: 5879, area: "ridleys_lair", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 38},
    207: {type: "energy", x: 3686, y: 6821, area: "ridleys_lair", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 42},
    208: {type: "energy", x: 2088, y: 3142, area: "brinstar", name: "Energy Tank", jpName: "エネルギータンク", order100Percent: 44},

    // Missiles
    301: {type: "missile", x: 4471, y: 2505, area: "brinstar", name: "Missile", jpName: "ミサイル", order100Percent: 3},
    302: {type: "missile", x: 4425, y: 3175, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 8},
    303: {type: "missile", x: 4168, y: 3416, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 9},
    304: {type: "missile", x: 6982, y: 2458, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 11},
    305: {type: "missile", x: 6728, y: 2458, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 12},
    306: {type: "missile", x: 6468, y: 2458, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 13},
    307: {type: "missile", x: 6986, y: 2214, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 14},
    308: {type: "missile", x: 6732, y: 2214, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 15},
    309: {type: "missile", x: 4936, y: 3418, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 17},
    310: {type: "missile", x: 4680, y: 3418, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 18},
    311: {type: "missile", x: 4678, y: 5096, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 21},
    312: {type: "missile", x: 4934, y: 5096, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 22},
    313: {type: "missile", x: 6984, y: 4616, area: "norfair", name: "Missile", jpName: "ミサイル", order100Percent: 24},
    314: {type: "missile", x: 6008, y: 584, area: "brinstar", name: "Missile", jpName: "ミサイル", order100Percent: 26},
    315: {type: "missile", x: 2167, y: 4873, area: "kraids_lair", name: "Missile", jpName: "ミサイル", order100Percent: 29},
    316: {type: "missile", x: 888, y: 4873, area: "kraids_lair", name: "Missile", jpName: "ミサイル", order100Percent: 30},
    317: {type: "missile", x: 1144, y: 6313, area: "kraids_lair", name: "Missile", jpName: "ミサイル", order100Percent: 31},
    318: {type: "missile", x: 2424, y: 5830, area: "kraids_lair", name: "Missile", jpName: "ミサイル", order100Percent: 33},
    320: {type: "missile", x: 4567, y: 5624, area: "ridleys_lair", name: "Missile", jpName: "ミサイル", order100Percent: 37},
    321: {type: "missile", x: 5080, y: 7065, area: "ridleys_lair", name: "Missile", jpName: "ミサイル", order100Percent: 39},
    322: {type: "missile", x: 6104, y: 6344, area: "ridleys_lair", name: "Missile", jpName: "ミサイル", order100Percent: 40}
};

// Collection state array
const collectedItems = new Array(Object.keys(items).length).fill(false);

// Initialize the tracker
$(document).ready(() => {
    // Initialize audio with error handling
    audio = new Audio();
    audio.volume = 0;  // Start muted
    
    // Set initial track
    audio.src = tracks[currentTrack].url;
    updateTrackDisplay();

    // Add click handlers for audio controls
    $('.volume-btn').on('click', toggleVolume);
    $('#prevTrack').on('click', prevTrack);
    $('#playPause').on('click', togglePlay);
    $('#nextTrack').on('click', nextTrack);
    $('#loopTrack').on('click', toggleLoop);
    
    // Add manual button handler
    $('.manual-btn').on('click', () => {
        const pdfPath = currentLanguage === 'en' ? 'manual-en.pdf' : 'manual-jp.pdf';
        $('.manual-modal iframe').attr('src', pdfPath);
        $('.manual-modal').addClass('visible');
    });

    // Add close modal handler
    $('.close-modal').on('click', () => {
        $('.manual-modal').removeClass('visible');
    });

    // Close modal on escape key
    $(document).on('keydown', (e) => {
        if (e.key === 'Escape') {
            $('.manual-modal').removeClass('visible');
        }
    });

    // Close modal on click outside content
    $('.manual-modal').on('click', (e) => {
        if (e.target === e.currentTarget) {
            $('.manual-modal').removeClass('visible');
        }
    });
    
    // Add click handler for share button
    $('.share-btn').on('click', () => {
        const url = generateShareUrl();
        navigator.clipboard.writeText(url).then(() => {
            // Show notification
            const $notification = $('<div class="notification">Share URL copied to clipboard!</div>');
            $('body').append($notification);
            setTimeout(() => $notification.addClass('show'), 10);
            setTimeout(() => {
                $notification.removeClass('show');
                setTimeout(() => $notification.remove(), 300);
            }, 2000);
        });
    });

    // Add click handler for language toggle
    $('.lang-btn').on('click', toggleLanguage);

    // Add click handler for visibility toggle
    $('.visibility-btn').on('click', () => {
        showAllItems = !showAllItems;
        $('.visibility-btn').toggleClass('active', showAllItems);
        createItemOverlay();
    });

    updateCounters();
    checkItemSequence();
    updateItemList();
    initializeMapZoom();
    createItemOverlay();
    initializeTouchGestures();

    // Update during resize with debouncing
    let resizeTimeout;
    $(window).on('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            createItemOverlay();
        }, 100);
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
        if (view === '100') {
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

    // Initialize audio with error handling
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', {
            error: audio.error,
            code: audio.error ? audio.error.code : null,
            message: audio.error ? audio.error.message : null,
            currentSrc: audio.currentSrc,
            readyState: audio.readyState,
            networkState: audio.networkState
        });
    });

    // Add load start handler
    audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
    });

    // Add can play handler
    audio.addEventListener('canplay', () => {
        console.log('Audio can play');
    });

    // Add play handler
    audio.addEventListener('play', () => {
        console.log('Audio play event fired');
    });

    // Add PDF control handlers
    $('#prev-page').on('click', onPrevPage);
    $('#next-page').on('click', onNextPage);
    $('#zoom-in').on('click', () => {
        scale *= 1.2;
        renderPage(pageNum);
    });
    $('#zoom-out').on('click', () => {
        scale *= 0.8;
        renderPage(pageNum);
    });

    // Add credits modal handlers
    $('.placeholder-btn').on('click', () => {
        $('.credits-modal').addClass('visible');
        updateCreditsLanguage();
    });

    $('.credits-modal .close-modal').on('click', () => {
        $('.credits-modal').removeClass('visible');
    });

    // Close modal on escape key
    $(document).on('keydown', (e) => {
        if (e.key === 'Escape') {
            $('.credits-modal').removeClass('visible');
        }
    });

    // Close modal on click outside content
    $('.credits-modal').on('click', (e) => {
        if (e.target === e.currentTarget) {
            $('.credits-modal').removeClass('visible');
        }
    });
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
    const maxScale = 8;
    let isHovering = false;
    let isDragging = false;
    let lastX, lastY;
    let touchpadPressed = false;

    // Add hover detection
    $mapContainer.on('mouseenter', () => {
        isHovering = true;
        if (scale > 1) {
            $mapContainer.css('cursor', 'grab');
        } else {
            $mapContainer.css('cursor', 'zoom-in');
        }
    }).on('mouseleave', () => {
        isHovering = false;
        isDragging = false;
        touchpadPressed = false;
        $mapContainer.css('cursor', 'zoom-in');
    });

    // Add click handler for coordinate logging
    $mapContainer.on('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            return;
        }
        
        const rect = $mapContainer[0].getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const actualX = Math.round((mouseX - offsetX) / scale);
        const actualY = Math.round((mouseY - offsetY) / scale);
        
        console.log(`Clicked coordinates - x: ${actualX}, y: ${actualY}`);
    });

    // Add drag functionality
    $mapContainer.on('mousedown', (e) => {
        // Handle both left click and middle click
        if (e.button === 1) {
            e.preventDefault(); // Prevent default middle-click scroll
        }
        
        if ((e.button === 0 || e.button === 1) && !e.ctrlKey && scale > 1) {
            isDragging = true;
            touchpadPressed = true;
            lastX = e.clientX;
            lastY = e.clientY;
            $mapContainer.css('cursor', 'grabbing');
            
            // Prevent text selection during drag
            e.preventDefault();
        }
    });

    // Handle drag on window to catch fast movements
    $(window).on('mousemove', (e) => {
        if (!isDragging && !touchpadPressed) return;
        
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        offsetX += deltaX;
        offsetY += deltaY;

        applyTransformWithConstraints();
    });

    // Handle mouseup on window to catch releases outside container
    $(window).on('mouseup', (e) => {
        if ((e.button === 0 || e.button === 1)) {
            isDragging = false;
            touchpadPressed = false;
            if (isHovering) {
                $mapContainer.css('cursor', scale > 1 ? 'grab' : 'zoom-in');
            } else {
                $mapContainer.css('cursor', 'zoom-in');
            }
        }
    });

    // Add touchpad gesture support
    $mapContainer[0].addEventListener('gesturestart', (e) => {
        e.preventDefault();
        isGesturing = true;
    }, { passive: false });

    // Add touchpad two-finger drag support
    $mapContainer[0].addEventListener('wheel', (e) => {
        if (e.ctrlKey) return; // Let the zoom handler deal with pinch-zoom
        if (scale <= 1) return; // Only allow dragging when zoomed in
        
        e.preventDefault();
        offsetX -= e.deltaX;
        offsetY -= e.deltaY;
        applyTransformWithConstraints();
    }, { passive: false });
}

// Update applyTransformWithConstraints to better handle window resizing
function applyTransformWithConstraints() {
    const $map = $('#metroid-map');
    const $mapContainer = $('.map-container');
    const containerRect = $mapContainer[0].getBoundingClientRect();
    const mapRect = $map[0].getBoundingClientRect();

    // Calculate boundaries with some buffer
    const scaledMapWidth = mapRect.width * scale;
    const scaledMapHeight = mapRect.height * scale;
    
    // Allow dragging slightly beyond edges for smoother experience
    const buffer = 100; // pixels of extra dragging space
    
    // Adjust constraints based on container and scaled map size
    const minX = Math.min(0, containerRect.width - scaledMapWidth) - buffer;
    const maxX = buffer;
    const minY = Math.min(0, containerRect.height - scaledMapHeight) - buffer;
    const maxY = buffer;

    // If map is smaller than container, center it
    if (scaledMapWidth < containerRect.width) {
        offsetX = (containerRect.width - scaledMapWidth) / 2;
    } else {
        // Constrain offsets
        offsetX = Math.max(minX, Math.min(maxX, offsetX));
    }

    if (scaledMapHeight < containerRect.height) {
        offsetY = (containerRect.height - scaledMapHeight) / 2;
    } else {
        // Constrain offsets
        offsetY = Math.max(minY, Math.min(maxY, offsetY));
    }

    // If scale is 1 or less, reset position to top-left
    if (scale <= 1) {
        offsetX = 0;
        offsetY = 0;
    }

    // Apply transform without transition for smoother dragging
    const transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    $map.css({
        'transform-origin': '0 0',
        'transform': transform,
        'transition': 'none'
    });

    // Update overlay position to match map
    $('#item-overlay').css({
        'transform-origin': '0 0',
        'transform': transform
    });

    // Update individual markers with better scaling
    const baseSize = 32; // Original marker size
    const minSize = 8; // Minimum marker size
    const maxSize = baseSize; // Maximum marker size
    const scaleFactor = Math.max(minSize/baseSize, Math.min(1, 1/scale));
    
    $('.item-marker').each(function() {
        const $marker = $(this);
        const markerX = parseFloat($marker.css('left'));
        const markerY = parseFloat($marker.css('top'));
        
        // Calculate the offset needed to keep the marker centered
        const offsetAdjustX = (baseSize * (1 - scaleFactor)) / 2;
        const offsetAdjustY = (baseSize * (1 - scaleFactor)) / 2;
        
        $marker.css({
            transform: `translate(${offsetAdjustX}px, ${offsetAdjustY}px) scale(${scaleFactor})`
        });
    });
}

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
                text: section.toUpperCase()
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

        const $name = $('<span>', {
            text: currentLanguage === 'en' ? item.name : item.jpName
        });

        $spriteContainer.append($sprite);
        $item.append($spriteContainer, $name);
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
        const isNextItem = currentView === '100' && currentNextItem && parseInt(id) === currentNextItem.id;
        
        // Show marker if item is collected OR if it's the next item in 100% view OR if showAllItems is true
        if (isCollected || isNextItem || showAllItems) {
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

            if (isCollected) {
                $marker.addClass('collected');
            }

            $marker.append($sprite);
            $overlay.append($marker);

            // Add click handler
            $marker.on('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleItem(id-1);
                updateItemList();
                // Update marker's collected state immediately
                $marker.toggleClass('collected', collectedItems[id-1]);
            });
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
    const maxScale = 8;
    
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
    const title = currentLanguage === 'en' ? tracks[currentTrack].title : tracks[currentTrack].jpTitle;
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
    console.log('togglePlay called, current isPlaying:', isPlaying);
    console.log('Current audio source:', audio.src);
    
    if (!audio.src) {
        console.log('Setting initial audio source to track:', tracks[currentTrack].title);
        audio.src = tracks[currentTrack].url;
        updateTrackDisplay();
    }

    if (isPlaying) {
        console.log('Pausing audio');
        audio.pause();
        isPlaying = false;
        $('#playPause').removeClass('active');
        $('#playPause').find('svg path').attr('d', 'M8 5v14l11-7z');
        $('#trackTitle').css('animation-play-state', 'paused');
    } else {
        console.log('Playing audio');
        audio.play().catch(err => {
            console.error('Failed to play audio:', err);
            // Add more detailed error information
            console.error('Audio state:', {
                currentTime: audio.currentTime,
                readyState: audio.readyState,
                networkState: audio.networkState,
                error: audio.error
            });
        });
        isPlaying = true;
        $('#playPause').addClass('active');
        $('#playPause').find('svg path').attr('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
        $('#trackTitle').css('animation-play-state', 'running');
    }
    
    console.log('Play button state:', $('#playPause').hasClass('active'));
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
    console.log('toggleVolume called, current isMuted:', isMuted);
    isMuted = !isMuted;
    const $volumeBtn = $('.volume-btn.standalone');
    
    if (isMuted) {
        console.log('Muting audio');
        audio.volume = 0;
        $('.retro-player').removeClass('visible');
        $volumeBtn.removeClass('active');
    } else {
        console.log('Unmuting audio');
        audio.volume = 1;
        $('.retro-player').addClass('visible');
        $volumeBtn.addClass('active');
    }
    
    updateVolumeIcon(isMuted);
    console.log('Volume button state:', $volumeBtn.hasClass('active'));
    console.log('Retro player visibility:', $('.retro-player').hasClass('visible'));
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

// Update initializeTouchGestures for better pinch-zoom
function initializeTouchGestures() {
    const $mapContainer = $('.map-container');
    let lastSingleTouchX, lastSingleTouchY;
    let isSingleTouch = false;
    let lastPinchCenter = null;
    
    $mapContainer[0].addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Pinch-zoom gesture
            isGesturing = true;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            // Store initial pinch center
            lastPinchCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            
            lastTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        } else if (e.touches.length === 1 && scale > 1) {
            // Single touch drag
            isSingleTouch = true;
            lastSingleTouchX = e.touches[0].clientX;
            lastSingleTouchY = e.touches[0].clientY;
        }
    }, { passive: true });

    $mapContainer[0].addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && isGesturing) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            // Calculate current pinch center
            const currentCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };

            // Convert pinch center to map coordinates
            const rect = $mapContainer[0].getBoundingClientRect();
            const pointX = (currentCenter.x - rect.left - offsetX) / scale;
            const pointY = (currentCenter.y - rect.top - offsetY) / scale;

            // Calculate scale change with reduced sensitivity
            const scaleChange = 1 + (currentDistance - lastTouchDistance) / (lastTouchDistance * 4);
            const newScale = Math.min(Math.max(scale * scaleChange, 0.5), 8);
            
            if (newScale !== scale) {
                // Calculate the movement of the pinch center
                const centerDeltaX = currentCenter.x - lastPinchCenter.x;
                const centerDeltaY = currentCenter.y - lastPinchCenter.y;
                
                scale = newScale;
                
                // Adjust offsets to keep the pinch center fixed
                offsetX = currentCenter.x - (pointX * scale);
                offsetY = currentCenter.y - (pointY * scale);
                
                // Add the pinch center movement
                offsetX += centerDeltaX;
                offsetY += centerDeltaY;
                
                applyTransformWithConstraints();
            }
            
            lastTouchDistance = currentDistance;
            lastPinchCenter = currentCenter;
        } else if (e.touches.length === 1 && isSingleTouch && scale > 1) {
            // Handle single touch drag
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = touch.clientX - lastSingleTouchX;
            const deltaY = touch.clientY - lastSingleTouchY;
            
            offsetX += deltaX;
            offsetY += deltaY;
            
            lastSingleTouchX = touch.clientX;
            lastSingleTouchY = touch.clientY;
            
            applyTransformWithConstraints();
        }
    }, { passive: false });

    $mapContainer[0].addEventListener('touchend', () => {
        isGesturing = false;
        isSingleTouch = false;
        lastPinchCenter = null;
    }, { passive: true });
}

// Add after other global variables
function toggleItem(index) {
    collectedItems[index] = !collectedItems[index];
    updateItemList();
    createItemOverlay();
}

// Add language toggle function
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'jp' : 'en';
    $('.lang-btn').text(currentLanguage === 'en' ? 'JP' : 'EN');
    $('.lang-btn').attr('title', `Switch to ${currentLanguage === 'en' ? 'Japanese' : 'English'}`);
    $('.stats-panel').toggleClass('jp', currentLanguage === 'jp');
    updateItemList();
    updateTrackDisplay();
    updateCreditsLanguage();
}

function renderPage(num) {
    pageRendering = true;
    console.log('Rendering page:', num);
    
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({scale: scale});
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Clear previous content
        const container = document.getElementById('pdf-container');
        container.innerHTML = '';
        container.appendChild(canvas);

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        page.render(renderContext).promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        document.getElementById('page-num').textContent = num;
    });
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

// Add new function for credits language
function updateCreditsLanguage() {
    $('.credits-section').removeClass('active');
    $(`.credits-section.${currentLanguage}`).addClass('active');
} 