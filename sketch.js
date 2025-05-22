// Service data
const services = [
    {
        title: "Web Development",
        description: "We create stunning, responsive websites that engage your audience and drive results. Our team specializes in modern web technologies and best practices to deliver exceptional user experiences.",
        features: [
            "Custom website design and development",
            "Responsive and mobile-optimized layouts", 
            "E-commerce solutions",
            "Content management systems"
        ]
    },
    {
        title: "Mobile Development",
        description: "Transform your ideas into powerful mobile applications. We develop native and cross-platform apps that provide seamless user experiences across all devices and operating systems.",
        features: [
            "iOS and Android native apps",
            "Cross-platform development",
            "App store optimization",
            "Mobile app maintenance and updates"
        ]
    },
    {
        title: "UI/UX Design",
        description: "Create intuitive and visually appealing user interfaces that delight your customers. Our design team focuses on user research, wireframing, and prototyping to ensure optimal user experiences.",
        features: [
            "User research and persona development",
            "Wireframing and prototyping",
            "Visual design and branding",
            "Usability testing and optimization"
        ]
    },
    {
        title: "Cloud Solutions",
        description: "Leverage the power of cloud computing to scale your business efficiently. We provide comprehensive cloud migration, infrastructure setup, and ongoing management services.",
        features: [
            "Cloud migration strategies",
            "Infrastructure as Code",
            "Auto-scaling and load balancing",
            "Cloud security and compliance"
        ]
    },
    {
        title: "Data Analytics",
        description: "Turn your data into actionable insights. Our analytics team helps you collect, process, and analyze data to make informed business decisions and drive growth.",
        features: [
            "Data collection and integration",
            "Business intelligence dashboards",
            "Predictive analytics and machine learning",
            "Real-time reporting and monitoring"
        ]
    },
    {
        title: "Digital Marketing",
        description: "Boost your online presence and reach your target audience effectively. Our digital marketing strategies combine creativity with data-driven approaches to maximize your ROI.",
        features: [
            "Search engine optimization (SEO)",
            "Pay-per-click advertising (PPC)",
            "Social media marketing",
            "Content marketing and strategy"
        ]
    },
    {
        title: "Consulting",
        description: "Get expert guidance on your technology strategy and business transformation. Our consultants work closely with you to identify opportunities and implement solutions that drive success.",
        features: [
            "Technology strategy and roadmapping",
            "Digital transformation consulting",
            "Process optimization",
            "Change management and training"
        ]
    },
    {
        title: "Support & Maintenance",
        description: "Keep your systems running smoothly with our comprehensive support and maintenance services. We provide ongoing monitoring, updates, and technical support to ensure optimal performance.",
        features: [
            "24/7 system monitoring",
            "Regular updates and patches",
            "Performance optimization",
            "Technical support and troubleshooting"
        ]
    }
];

// Animation states
const GRID_STATE = 0;
const ANIMATING_TO_STACK = 1;
const STACKED_STATE = 2;
const ANIMATING_TO_GRID = 3;

// Global variables
let cardImages = [];
let cards = [];
let currentState = GRID_STATE;
let animationProgress = 0;
let animationSpeed = 0.02; // Very slow for debugging
let currentActiveCard = 0;
let virtualScrollY = 0; // Virtual scroll position
let canvasHeight = 0;

// Card class
class Card {
    constructor(x, y, img, index) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.img = img;
        this.index = index;
        this.size = 240; // Original size
        this.targetSize = 480; // Target size when stacked
        this.currentSize = this.size;
        this.alpha = 255;
    }
    
    update() {
        // Update based on current state
        if (currentState === ANIMATING_TO_STACK) {
            this.animateToStack();
        } else if (currentState === ANIMATING_TO_GRID) {
            this.animateToGrid();
        } else if (currentState === STACKED_STATE) {
            this.updateInStack();
        }
    }
    
    animateToStack() {
        // Target position: 25% width, 50% height with slight offsets
        const targetX = width * 0.25 + (this.index % 4 - 1.5) * 15;
        const targetY = canvasHeight * 0.5 + (Math.floor(this.index / 4) - 0.5) * 15;
        
        // Lerp to target position and size
        this.x = lerp(this.startX, targetX, animationProgress);
        this.y = lerp(this.startY, targetY, animationProgress);
        this.currentSize = lerp(this.size, this.targetSize, animationProgress);
        this.alpha = lerp(255, 200, animationProgress);
    }
    
    animateToGrid() {
        // Animate back to original position
        const targetX = width * 0.25 + (this.index % 4 - 1.5) * 15;
        const targetY = canvasHeight * 0.5 + (Math.floor(this.index / 4) - 0.5) * 15;
        
        this.x = lerp(targetX, this.startX, animationProgress);
        this.y = lerp(targetY, this.startY, animationProgress);
        this.currentSize = lerp(this.targetSize, this.size, animationProgress);
        this.alpha = lerp(200, 255, animationProgress);
    }
    
    updateInStack() {
        // In stacked state, maintain target position with active card highlighted
        const targetX = width * 0.25;
        const targetY = canvasHeight * 0.5;
        
        this.x = targetX;
        this.y = targetY;
        this.currentSize = this.targetSize;
        
        // Active card is fully opaque, others are faded
        if (this.index === currentActiveCard) {
            this.alpha = 255;
        } else {
            this.alpha = 100;
        }
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        
        // Draw white background
        fill(255, this.alpha);
        stroke(0, 0, 0, 50);
        strokeWeight(2);
        // rect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 15);
        
        // Draw image
        if (this.img) {
            tint(255, 255);
            image(this.img, -this.currentSize/2, -this.currentSize/2, 
                  this.currentSize, this.currentSize);
            noTint();
        }
        
        pop();
    }
}

function preload() {
    // Load card images
    for (let i = 1; i <= 8; i++) {
        cardImages.push(loadImage(`images/card${i}.svg`));
    }
}

function setup() {
    // Calculate canvas height (viewport minus header)
    canvasHeight = window.innerHeight - 120; // 120px header height
    
    // Create canvas that fills width and calculated height
    const canvas = createCanvas(windowWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    // Initialize cards in grid formation
    setupCardGrid();
    
    // Setup wheel listener for scroll input (prevents actual scrolling)
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // Setup resize listener
    window.addEventListener('resize', () => {
        canvasHeight = window.innerHeight - 120;
        resizeCanvas(windowWidth, canvasHeight);
        setupCardGrid(); // Recalculate positions
    });
    
    // Initialize service content
    updateServiceContent(0);
}

function setupCardGrid() {
    cards = [];
    const cardSpacing = 350;
    const gridWidth = 4 * cardSpacing;
    const gridHeight = 2 * cardSpacing;
    const startX = width / 2 - gridWidth / 2 + cardSpacing / 2;
    const startY = canvasHeight / 2 - gridHeight / 2 + cardSpacing / 2;
    
    for (let i = 0; i < 8; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const x = startX + col * cardSpacing;
        const y = startY + row * cardSpacing;
        
        cards.push(new Card(x, y, cardImages[i], i));
    }
}

function draw() {
    background(248, 249, 250);
    
    // Update animation progress
    if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        animationProgress += animationSpeed;
        
        if (animationProgress >= 1.0) {
            animationProgress = 1.0;
            
            // Transition to next state
            if (currentState === ANIMATING_TO_STACK) {
                currentState = STACKED_STATE;
                document.getElementById('service-overlay').classList.add('active');
            } else if (currentState === ANIMATING_TO_GRID) {
                currentState = GRID_STATE;
                document.getElementById('service-overlay').classList.remove('active');
            }
        }
    }
    
    // Update and draw cards
    for (let card of cards) {
        card.update();
        card.draw();
    }
    
    // Update scroll progress indicator
    updateScrollIndicator();
    
    // Debug info
    // drawDebugInfo();
}

function handleWheel(event) {
    // Prevent actual page scrolling
    event.preventDefault();
    
    // Update virtual scroll position
    virtualScrollY += event.deltaY * 0.5; // Slower scroll sensitivity
    virtualScrollY = Math.max(0, Math.min(virtualScrollY, 2000)); // Limit scroll range
    
    const triggerPoint = 300; // Trigger 300px into virtual scroll
    const cardSwitchStart = 600; // Start switching cards at 600px
    
    // Transform animation
    if (virtualScrollY >= triggerPoint && currentState === GRID_STATE) {
        startTransformToStack();
    } else if (virtualScrollY < triggerPoint && currentState === STACKED_STATE) {
        startTransformToGrid();
    }
    
    // Card switching in stacked state
    if (currentState === STACKED_STATE && virtualScrollY >= cardSwitchStart) {
        const progress = (virtualScrollY - cardSwitchStart) / 1000; // 1000px range for switching
        const cardIndex = Math.min(Math.floor(progress * 8), 7);
        
        if (cardIndex !== currentActiveCard) {
            currentActiveCard = cardIndex;
            updateServiceContent(cardIndex);
        }
    }
}

function startTransformToStack() {
    if (currentState !== GRID_STATE) return;
    
    currentState = ANIMATING_TO_STACK;
    animationProgress = 0;
    console.log('Starting transform to stack');
}

function startTransformToGrid() {
    if (currentState !== STACKED_STATE) return;
    
    currentState = ANIMATING_TO_GRID;
    animationProgress = 0;
    currentActiveCard = 0;
    updateServiceContent(0);
    console.log('Starting transform to grid');
}

function updateServiceContent(index) {
    const service = services[index];
    const contentDiv = document.getElementById('service-content');
    
    let featuresHTML = '';
    service.features.forEach(feature => {
        featuresHTML += `<li>${feature}</li>`;
    });
    
    contentDiv.innerHTML = `
        <h2>${service.title}</h2>
        <p>${service.description}</p>
        <ul>${featuresHTML}</ul>
    `;
}

function updateScrollIndicator() {
    const progressElement = document.getElementById('scroll-progress');
    const progress = (virtualScrollY / 2000) * 100; // 2000 is max scroll
    progressElement.style.height = `${progress}%`;
}

function drawDebugInfo() {
    // Debug info
    fill(0);
    textSize(14);
    text(`State: ${getStateName()}`, 10, 20);
    text(`Animation Progress: ${animationProgress.toFixed(3)}`, 10, 40);
    text(`Active Card: ${currentActiveCard}`, 10, 60);
    text(`Virtual Scroll Y: ${virtualScrollY.toFixed(0)}`, 10, 80);
    text(`Canvas: ${width}x${canvasHeight}`, 10, 100);
}

function getStateName() {
    switch(currentState) {
        case GRID_STATE: return 'GRID';
        case ANIMATING_TO_STACK: return 'ANIMATING_TO_STACK';
        case STACKED_STATE: return 'STACKED';
        case ANIMATING_TO_GRID: return 'ANIMATING_TO_GRID';
        default: return 'UNKNOWN';
    }
}

function windowResized() {
    canvasHeight = window.innerHeight - 120;
    resizeCanvas(windowWidth, canvasHeight);
    setupCardGrid();
}