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
let previousActiveCard = 0;
let cardTransitionProgress = 0;
let cardTransitionPhase = 0; // 0 = slide out, 1 = slide in
let virtualScrollY = 0; // Virtual scroll position
let canvasHeight = 0;

// Responsive scaling variables
let baseCardSize = 240;
let baseTargetSize = 480;
let scaleFactor = 1;
let sizeLimit = 1.2; // **SIZE LIMIT CONTROL** - Maximum scale factor (1.2 = 120% max size)

// Smooth easing functions (Stripe-style)
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function calculateScaleFactor() {
    // Scale based on window width, with reasonable min/max bounds
    const baseWidth = 1200; // Reference width
    const rawScale = windowWidth / baseWidth;
    
    // Apply size limit as maximum constraint
    scaleFactor = Math.max(0.6, Math.min(sizeLimit, rawScale));
    
    baseCardSize = 240 * scaleFactor;
    baseTargetSize = 480 * scaleFactor;
}

// Card class
class Card {
    constructor(x, y, img, index) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.img = img;
        this.index = index;
        this.size = baseCardSize;
        this.targetSize = baseTargetSize;
        this.currentSize = this.size;
        this.alpha = 255;
        this.rotation = 0;
        this.scale = 1.0;
        this.elevation = 0; // For shadow/depth effects
    }
    
    updateSizes() {
        // Update sizes when scale factor changes
        this.size = baseCardSize;
        this.targetSize = baseTargetSize;
        if (currentState === STACKED_STATE || currentState === ANIMATING_TO_STACK) {
            this.currentSize = this.targetSize;
        } else {
            this.currentSize = this.size;
        }
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
        // In stacked state, create a sophisticated card stack effect
        const baseX = width * 0.25;
        const baseY = canvasHeight * 0.5;
        
        this.currentSize = this.targetSize;
        
        if (this.index === currentActiveCard) {
            // Active card - front and center with subtle hover effect
            this.x = baseX;
            this.y = baseY;
            this.alpha = 255;
            this.rotation = 0;
            this.scale = 1.0 + Math.sin(millis() * 0.001) * 0.01; // Subtle breathing effect
            this.elevation = 8;
            
        } else if (this.index === previousActiveCard && cardTransitionProgress < 1.0) {
            // Previous card - sophisticated slide-out with rotation and scale
            const t = easeInOutCubic(cardTransitionProgress);
            const slideDistance = 150 * scaleFactor;
            
            // Multi-phase animation
            if (cardTransitionProgress < 0.3) {
                // Phase 1: Lift and rotate slightly
                const phase1 = cardTransitionProgress / 0.3;
                const liftT = easeOutCubic(phase1);
                this.x = baseX;
                this.y = baseY - (20 * liftT);
                this.rotation = -5 * liftT; // Slight rotation
                this.scale = 1.0 + (0.05 * liftT); // Slight scale up
                this.alpha = 255;
                this.elevation = 8 + (4 * liftT);
                
            } else if (cardTransitionProgress < 0.8) {
                // Phase 2: Slide and fade
                const phase2 = (cardTransitionProgress - 0.3) / 0.5;
                const slideT = easeInOutCubic(phase2);
                this.x = baseX + (slideDistance * slideT);
                this.y = baseY - 20 - (slideDistance * 0.2 * slideT);
                this.rotation = -5 - (10 * slideT); // More rotation
                this.scale = 1.05 - (0.3 * slideT); // Scale down
                this.alpha = 255 * (1 - slideT * 0.7);
                this.elevation = 12 - (8 * slideT);
                
            } else {
                // Phase 3: Final fade and settle
                const phase3 = (cardTransitionProgress - 0.8) / 0.2;
                const fadeT = easeOutCubic(phase3);
                this.x = baseX + slideDistance;
                this.y = baseY - 20 - (slideDistance * 0.2);
                this.rotation = -15;
                this.scale = 0.75;
                this.alpha = 255 * 0.3 * (1 - fadeT);
                this.elevation = 2;
            }
            
        } else if (this.index > currentActiveCard) {
            // Cards ahead in stack - layered with subtle perspective
            const offset = (this.index - currentActiveCard);
            const stackOffset = offset * 8 * scaleFactor;
            const depthOffset = offset * 3 * scaleFactor;
            
            this.x = baseX + stackOffset;
            this.y = baseY + depthOffset;
            this.rotation = offset * 1.5; // Slight rotation for depth
            this.scale = 1.0 - (offset * 0.03); // Subtle scale difference
            this.alpha = Math.max(60, 180 - (offset * 25));
            this.elevation = Math.max(1, 6 - offset);
            
        } else {
            // Cards already shown - settled stack with gentle placement
            const offset = (currentActiveCard - this.index);
            const stackOffset = offset * 5 * scaleFactor;
            const depthOffset = offset * 2 * scaleFactor;
            
            this.x = baseX - stackOffset;
            this.y = baseY + depthOffset;
            this.rotation = -offset * 1; // Opposite rotation
            this.scale = 1.0 - (offset * 0.02);
            this.alpha = Math.max(40, 120 - (offset * 15));
            this.elevation = Math.max(0, 4 - offset);
        }
    }
    
    draw() {
        push();
        
        // Apply sophisticated transforms
        translate(this.x, this.y);
        rotate(radians(this.rotation));
        scale(this.scale);
        
        // Enhanced shadow effect based on elevation
        if (currentState === STACKED_STATE && this.elevation > 0) {
            // Multiple shadow layers for depth
            for (let i = 0; i < 3; i++) {
                push();
                const shadowOffset = (this.elevation / 3) * (i + 1);
                const shadowAlpha = (30 - i * 8) * (this.elevation / 8);
                translate(shadowOffset * 0.7, shadowOffset);
                fill(0, 0, 0, shadowAlpha * (this.alpha / 255));
                noStroke();
                rect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 15);
                pop();
            }
        }
        
        // Card background with subtle gradient effect
        if (this.index === currentActiveCard && currentState === STACKED_STATE) {
            // Active card gets a subtle gradient
            drawingContext.save();
            const gradient = drawingContext.createLinearGradient(
                -this.currentSize/2, -this.currentSize/2,
                this.currentSize/2, this.currentSize/2
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha / 255})`);
            gradient.addColorStop(1, `rgba(248, 250, 252, ${this.alpha / 255})`);
            drawingContext.fillStyle = gradient;
            drawingContext.strokeStyle = `rgba(0, 0, 0, ${50 * (this.alpha / 255)})`;
            drawingContext.lineWidth = 2;
            drawingContext.beginPath();
            drawingContext.roundRect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 15);
            drawingContext.fill();
            drawingContext.stroke();
            drawingContext.restore();
        } else {
            // Standard card background
            fill(255, this.alpha);
            stroke(0, 0, 0, 50 * (this.alpha / 255));
            strokeWeight(2);
            rect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 15);
        }
        
        // Draw image with proper tinting
        if (this.img) {
            tint(255, this.alpha);
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
    
    // Calculate responsive scale factor
    calculateScaleFactor();
    
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
        calculateScaleFactor(); // Recalculate scale
        resizeCanvas(windowWidth, canvasHeight);
        setupCardGrid(); // Recalculate positions
        
        // Update existing card sizes
        for (let card of cards) {
            card.updateSizes();
        }
    });
    
    // Initialize service content
    updateServiceContent(0);
}

function setupCardGrid() {
    cards = [];
    const cardSpacing = 350 * scaleFactor; // Responsive spacing
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
    
    // Update card transition progress with sophisticated timing
    if (cardTransitionProgress < 1.0) {
        cardTransitionProgress += 0.012; // Much slower, more elegant transitions
        if (cardTransitionProgress >= 1.0) {
            cardTransitionProgress = 1.0;
        }
    }
    
    // Sort cards for proper drawing order in stack
    let sortedCards = [...cards];
    if (currentState === STACKED_STATE) {
        // Draw cards in reverse order so active card appears on top
        sortedCards.sort((a, b) => {
            if (a.index === currentActiveCard) return 1;
            if (b.index === currentActiveCard) return -1;
            return a.index - b.index;
        });
    }
    
    // Update and draw cards
    for (let card of sortedCards) {
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
            previousActiveCard = currentActiveCard;
            currentActiveCard = cardIndex;
            cardTransitionProgress = 0; // Reset transition
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
    previousActiveCard = 0;
    cardTransitionProgress = 1.0;
    
    // Reset all card animation properties
    for (let card of cards) {
        card.rotation = 0;
        card.scale = 1.0;
        card.elevation = 0;
    }
    
    updateServiceContent(0);
    console.log('Starting transform to grid');
}

function updateServiceContent(index) {
    const service = services[index];
    const contentDiv = document.getElementById('service-content');
    
    // Add fade out class
    contentDiv.classList.add('fade-out');
    
    // Wait for fade out, then update content and fade in
    setTimeout(() => {
        let featuresHTML = '';
        service.features.forEach(feature => {
            featuresHTML += `<li>${feature}</li>`;
        });
        
        contentDiv.innerHTML = `
            <h2>${service.title}</h2>
            <p>${service.description}</p>
            <ul>${featuresHTML}</ul>
        `;
        
        // Remove fade out class to fade in
        contentDiv.classList.remove('fade-out');
    }, 150); // Half of transition duration for smooth crossfade
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
    calculateScaleFactor(); // Recalculate responsive scaling
    resizeCanvas(windowWidth, canvasHeight);
    setupCardGrid();
    
    // Update existing card sizes
    for (let card of cards) {
        card.updateSizes();
    }
}