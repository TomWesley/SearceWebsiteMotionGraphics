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
let animationSpeed = 0.015; // Slower for more premium feel
let currentActiveCard = 0;
let previousActiveCard = 0;
let cardTransitionProgress = 0;
let cardTransitionPhase = 0;
let canvasHeight = 0;

// Discrete scroll system
let currentScrollPosition = 0; // 0 = grid, 1-8 = individual cards
let lastScrollTime = 0;
let scrollDebounceDelay = 400; // Longer delay to prevent multiple inputs
let scrollBlocked = false; // Flag to completely block input during cooldown
const totalPositions = 9; // Grid + 8 cards

// Responsive scaling variables
let baseCardSize = 240;
let baseTargetSize = 480;
let scaleFactor = 1;
let sizeLimit = 1.2; // **SIZE LIMIT CONTROL** - Maximum scale factor (1.2 = 120% max size)

function calculateScaleFactor() {
    // Scale based on window width, with reasonable min/max bounds
    const baseWidth = 1200; // Reference width
    const rawScale = windowWidth / baseWidth;
    
    // Apply size limit as maximum constraint
    scaleFactor = Math.max(0.6, Math.min(sizeLimit, rawScale));
    
    baseCardSize = 240 * scaleFactor;
    baseTargetSize = 480 * scaleFactor;
}

// Smooth easing functions (Apple-style)
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutElastic(t) {
    // More subtle elastic for Apple-like premium feel
    const c4 = (2 * Math.PI) / 4.5; // Less bouncy
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -8 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function easeInOutQuart(t) {
    // Apple's signature easing curve
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
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
        this.glowIntensity = 0; // For transition glow effects
        this.trailPositions = []; // For motion trails
        this.animationDelay = 0; // Staggered animation timing
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
        // Calculate staggered animation delay (Apple-style cascading)
        const baseDelay = this.index * 0.08; // 80ms stagger between cards
        const adjustedProgress = Math.max(0, Math.min(1, (animationProgress - baseDelay) / (1 - baseDelay)));
        
        if (adjustedProgress <= 0) {
            // Card hasn't started animating yet
            this.glowIntensity = 0;
            return;
        }
        
        // Target position - match exactly what the stack state will use
        const baseX = width * 0.25;
        const baseY = canvasHeight * 0.5;
        let targetX, targetY;
        
        // Calculate target position based on what this card's final stack position will be
        if (this.index === currentActiveCard) {
            // Active card goes to exact center
            targetX = baseX;
            targetY = baseY;
        } else if (this.index > currentActiveCard) {
            // Cards ahead in stack - positioned behind and to the right
            const offset = (this.index - currentActiveCard);
            const stackOffset = offset * 8 * scaleFactor;
            const depthOffset = offset * 3 * scaleFactor;
            targetX = baseX + stackOffset;
            targetY = baseY + depthOffset;
        } else {
            // Cards already shown - positioned behind and to the left
            const offset = (currentActiveCard - this.index);
            const stackOffset = offset * 5 * scaleFactor;
            const depthOffset = offset * 2 * scaleFactor;
            targetX = baseX - stackOffset;
            targetY = baseY + depthOffset;
        }
        
        // Apple-style curved path animation using bezier-like easing
        const t = easeInOutCubic(adjustedProgress);
        
        // Create curved trajectory (not straight line)
        const midPointX = (this.startX + targetX) / 2 + Math.sin(adjustedProgress * Math.PI) * 40;
        const midPointY = (this.startY + targetY) / 2 - Math.abs(Math.sin(adjustedProgress * Math.PI)) * 60;
        
        // Bezier curve animation
        this.x = lerp(lerp(this.startX, midPointX, t), lerp(midPointX, targetX, t), t);
        this.y = lerp(lerp(this.startY, midPointY, t), lerp(midPointY, targetY, t), t);
        
        // Seamless size animation that reaches full target size
        if (adjustedProgress < 0.4) {
            // Keep original size for first 40% of animation
            this.currentSize = this.size;
        } else {
            // Gradual size increase over remaining 60% to reach FULL target size
            const sizeProgress = (adjustedProgress - 0.4) / 0.6; // 0 to 1 over final 60%
            const seamlessEasing = easeInOutQuart(sizeProgress * sizeProgress); // Smooth curve
            this.currentSize = lerp(this.size, this.targetSize, seamlessEasing); // Full scaling to target
        }
        
        // Smoother visual effects
        this.alpha = lerp(255, 240, t * 0.5); // Very subtle alpha change
        this.rotation = Math.sin(adjustedProgress * Math.PI) * 2; // Minimal rotation
        this.scale = 1.0 + Math.sin(adjustedProgress * Math.PI) * 0.01; // Barely noticeable breathing
        this.elevation = adjustedProgress * 6; // Minimal elevation
        
        // Very gentle glowing effect
        this.glowIntensity = Math.sin(adjustedProgress * Math.PI) * 30; // Subtle glow
        
        // Store trail positions for motion blur effect
        if (this.trailPositions.length > 5) this.trailPositions.shift();
        this.trailPositions.push({x: this.x, y: this.y, alpha: this.glowIntensity});
    }
    
    animateToGrid() {
        // Reverse animation with similar sophistication
        const baseDelay = (7 - this.index) * 0.05; // Reverse stagger
        const adjustedProgress = Math.max(0, Math.min(1, (animationProgress - baseDelay) / (1 - baseDelay)));
        
        if (adjustedProgress <= 0) {
            this.glowIntensity = 0;
            return;
        }
        
        const magneticOffset = (this.index % 4 - 1.5) * 8;
        const verticalOffset = (Math.floor(this.index / 4) - 0.5) * 6;
        const startStackX = width * 0.25 + magneticOffset;
        const startStackY = canvasHeight * 0.5 + verticalOffset;
        
        const t = easeInOutCubic(adjustedProgress);
        const curveT = easeOutCubic(adjustedProgress);
        
        // Curved return path
        const midPointX = (startStackX + this.startX) / 2 - Math.sin(adjustedProgress * Math.PI) * 50;
        const midPointY = (startStackY + this.startY) / 2 - Math.abs(Math.sin(adjustedProgress * Math.PI)) * 80;
        
        this.x = lerp(lerp(startStackX, midPointX, t), lerp(midPointX, this.startX, t), t);
        this.y = lerp(lerp(startStackY, midPointY, t), lerp(midPointY, this.startY, t), t);
        
        this.currentSize = lerp(this.targetSize, this.size, curveT);
        this.alpha = lerp(220, 255, t);
        this.rotation = -Math.sin(adjustedProgress * Math.PI) * 6;
        this.scale = 1.0 + Math.sin(adjustedProgress * Math.PI) * 0.03;
        this.elevation = (1 - adjustedProgress) * 10;
        
        this.glowIntensity = Math.sin(adjustedProgress * Math.PI) * 60;
        
        // Trail effect
        if (this.trailPositions.length > 5) this.trailPositions.shift();
        this.trailPositions.push({x: this.x, y: this.y, alpha: this.glowIntensity});
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
        
        // Draw motion trails during transitions (Apple-style motion blur)
        if (this.trailPositions.length > 1 && this.glowIntensity > 10) {
            for (let i = 0; i < this.trailPositions.length - 1; i++) {
                const trail = this.trailPositions[i];
                const trailAlpha = (trail.alpha * (i / this.trailPositions.length)) * 0.3;
                
                push();
                translate(trail.x, trail.y);
                
                // Glowing trail effect
                drawingContext.save();
                drawingContext.shadowColor = 'rgba(102, 126, 234, 0.4)';
                drawingContext.shadowBlur = 15;
                fill(102, 126, 234, trailAlpha);
                noStroke();
                const trailSize = this.currentSize * (0.8 + i * 0.05);
                rect(-trailSize/2, -trailSize/2, trailSize, trailSize, 12);
                drawingContext.restore();
                
                pop();
            }
        }
        
        // Main card transforms
        translate(this.x, this.y);
        rotate(radians(this.rotation));
        scale(this.scale);
        
        // Premium multi-layered shadows with elevation
        if (this.elevation > 0) {
            const shadowLayers = Math.min(4, Math.ceil(this.elevation / 3));
            for (let i = 0; i < shadowLayers; i++) {
                push();
                const shadowOffset = (this.elevation / shadowLayers) * (i + 1) * 0.8;
                const shadowSize = this.currentSize + (i * 2);
                const shadowAlpha = (40 - i * 8) * (this.alpha / 255) * (this.elevation / 12);
                
                translate(shadowOffset * 0.6, shadowOffset);
                fill(0, 0, 0, shadowAlpha);
                noStroke();
                rect(-shadowSize/2, -shadowSize/2, shadowSize, shadowSize, 15);
                pop();
            }
        }
        
        // Outer glow effect during transitions
        if (this.glowIntensity > 5) {
            push();
            drawingContext.save();
            drawingContext.shadowColor = `rgba(102, 126, 234, ${this.glowIntensity / 200})`;
            drawingContext.shadowBlur = this.glowIntensity / 2;
            
            // Multiple glow layers for depth
            for (let i = 0; i < 3; i++) {
                const glowSize = this.currentSize + (i * 8);
                const glowAlpha = (this.glowIntensity / 3) * (3 - i);
                fill(102, 126, 234, glowAlpha * 0.1);
                noStroke();
                rect(-glowSize/2, -glowSize/2, glowSize, glowSize, 18);
            }
            drawingContext.restore();
            pop();
        }
        
        // Premium card background with subtle gradient
        if (this.index === currentActiveCard && currentState === STACKED_STATE) {
            // Active card gets premium treatment
            drawingContext.save();
            const gradient = drawingContext.createLinearGradient(
                -this.currentSize/2, -this.currentSize/2,
                this.currentSize/2, this.currentSize/2
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha / 255})`);
            gradient.addColorStop(0.5, `rgba(250, 252, 255, ${this.alpha / 255})`);
            gradient.addColorStop(1, `rgba(248, 250, 252, ${this.alpha / 255})`);
            
            drawingContext.fillStyle = gradient;
            drawingContext.strokeStyle = `rgba(102, 126, 234, ${Math.min(100, 50 + this.glowIntensity/4) * (this.alpha / 255)})`;
            drawingContext.lineWidth = 2;
            drawingContext.shadowColor = 'rgba(102, 126, 234, 0.2)';
            drawingContext.shadowBlur = 8;
            drawingContext.beginPath();
            drawingContext.roundRect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 15);
            drawingContext.fill();
            drawingContext.stroke();
            drawingContext.restore();
        } else {
            // Standard cards with subtle enhancement during transitions
            const borderGlow = this.glowIntensity > 5 ? this.glowIntensity / 4 : 0;
            fill(255, this.alpha);
            stroke(102, 126, 234, Math.min(100, 50 + borderGlow) * (this.alpha / 255));
            strokeWeight(1 + (this.glowIntensity / 40));
            rect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 15);
        }
        
        // Card image with subtle effects
        if (this.img) {
            // Add subtle brightness increase during transitions
            const brightnessBoost = this.glowIntensity > 5 ? 1.1 : 1.0;
            tint(255 * brightnessBoost, this.alpha);
            
            // Subtle image glow during transitions
            if (this.glowIntensity > 10) {
                drawingContext.save();
                drawingContext.shadowColor = 'rgba(102, 126, 234, 0.3)';
                drawingContext.shadowBlur = this.glowIntensity / 8;
                image(this.img, -this.currentSize/2, -this.currentSize/2, 
                      this.currentSize, this.currentSize);
                drawingContext.restore();
            } else {
                image(this.img, -this.currentSize/2, -this.currentSize/2, 
                      this.currentSize, this.currentSize);
            }
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
    // Dark theme background
    if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        drawPremiumBackground();
    } else {
        background(0, 22, 48); // #001630
    }
    
    // Handle scroll input unblocking
    if (scrollBlocked && millis() - lastScrollTime > scrollDebounceDelay) {
        scrollBlocked = false;
    }
    
    // Handle discrete scroll position changes
    updateDiscreteScrolling();
    
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
    
    // Draw connecting lines during major transitions (Apple-style)
  
    
    // Sort cards for proper drawing order
    let sortedCards = [...cards];
    if (currentState === STACKED_STATE) {
        // Draw cards in reverse order so active card appears on top
        sortedCards.sort((a, b) => {
            if (a.index === currentActiveCard) return 1;
            if (b.index === currentActiveCard) return -1;
            return a.index - b.index;
        });
    } else if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        // During transitions, draw card 0 (top-left) last so it appears on top
        sortedCards.sort((a, b) => {
            if (a.index === 0) return 1; // Card 0 drawn last (on top)
            if (b.index === 0) return -1;
            return a.index - b.index; // Others in normal order
        });
    }
    
    // Update and draw cards
    for (let card of sortedCards) {
        card.update();
        card.draw();
    }
    
    // Draw ambient particles during transitions
    if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        drawAmbientParticles();
    }
    
    // Update scroll progress indicator
    updateScrollIndicator();
    
    // Debug info
    // drawDebugInfo();
}

function drawPremiumBackground() {
    // Dark theme animated gradient background during transitions
    const gradientIntensity = Math.sin(animationProgress * Math.PI);
    
    drawingContext.save();
    const gradient = drawingContext.createLinearGradient(0, 0, width, canvasHeight);
    gradient.addColorStop(0, `rgba(0, 22, 48, 1)`);
    gradient.addColorStop(0.5, `rgba(0, 28, 56, 1)`);
    gradient.addColorStop(1, `rgba(0, 18, 42, 1)`);
    
    drawingContext.fillStyle = gradient;
    drawingContext.fillRect(0, 0, width, canvasHeight);
    
    // Subtle radial glow from center during animation
    const centerX = width * 0.5;
    const centerY = canvasHeight * 0.5;
    const radialGradient = drawingContext.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, canvasHeight) * 0.6
    );
    radialGradient.addColorStop(0, `rgba(102, 126, 234, ${0.05 * gradientIntensity})`);
    radialGradient.addColorStop(1, `rgba(102, 126, 234, 0)`);
    
    drawingContext.fillStyle = radialGradient;
    drawingContext.fillRect(0, 0, width, canvasHeight);
    drawingContext.restore();
}

function drawConnectionLines() {
    // Apple-style connecting lines between cards during transition
    const lineAlpha = Math.sin(animationProgress * Math.PI) * 40;
    const targetX = width * 0.25;
    const targetY = canvasHeight * 0.5;
    
    stroke(102, 126, 234, lineAlpha);
    strokeWeight(1);
    
    // Draw elegant curved lines from each card to the center
    for (let card of cards) {
        if (card.glowIntensity > 5) {
            push();
            
            // Curved line using bezier-like approach
            const midX = (card.x + targetX) / 2;
            const midY = (card.y + targetY) / 2 - 30;
            
            drawingContext.save();
            drawingContext.strokeStyle = `rgba(102, 126, 234, ${lineAlpha / 255})`;
            drawingContext.lineWidth = 1;
            drawingContext.beginPath();
            drawingContext.moveTo(card.x, card.y);
            drawingContext.quadraticCurveTo(midX, midY, targetX, targetY);
            drawingContext.stroke();
            drawingContext.restore();
            
            pop();
        }
    }
}

function drawAmbientParticles() {
    // Subtle floating particles during transitions (Apple-style ambient effect)
    const particleCount = 8;
    const particleAlpha = Math.sin(animationProgress * Math.PI) * 30;
    
    fill(102, 126, 234, particleAlpha);
    noStroke();
    
    for (let i = 0; i < particleCount; i++) {
        const time = millis() * 0.001 + i * 0.5;
        const x = width * 0.25 + Math.sin(time * 0.8) * 100;
        const y = canvasHeight * 0.5 + Math.cos(time * 0.6) * 80;
        const size = 2 + Math.sin(time * 2) * 1;
        
        push();
        translate(x, y);
        circle(0, 0, size);
        pop();
    }
}

function updateDiscreteScrolling() {
    // Handle state transitions based on discrete position
    if (currentScrollPosition === 0) {
        // Position 0: Grid view
        if (currentState === STACKED_STATE) {
            startTransformToGrid();
        }
    } else {
        // Positions 1-8: Stacked view with specific card active
        if (currentState === GRID_STATE) {
            startTransformToStack();
        }
        
        // Update active card based on position
        const targetCard = currentScrollPosition - 1; // Convert to 0-7 index
        if (targetCard !== currentActiveCard && cardTransitionProgress >= 1.0) {
            previousActiveCard = currentActiveCard;
            currentActiveCard = targetCard;
            cardTransitionProgress = 0;
            updateServiceContent(currentActiveCard);
        }
    }
}

function handleWheel(event) {
    // Prevent actual page scrolling
    event.preventDefault();
    
    // STRICT INPUT BLOCKING - ignore ALL input if we're in cooldown
    if (scrollBlocked) {
        return; // Completely ignore this scroll event
    }
    
    // Determine scroll direction (ignore magnitude completely)
    const scrollDirection = event.deltaY > 0 ? 1 : -1;
    
    // Update position by exactly one step
    const newPosition = currentScrollPosition + scrollDirection;
    
    // Clamp to valid range (0-8)
    currentScrollPosition = Math.max(0, Math.min(totalPositions - 1, newPosition));
    
    // BLOCK ALL FURTHER INPUT for the debounce period
    scrollBlocked = true;
    lastScrollTime = millis();
    
    console.log(`Scroll position: ${currentScrollPosition} (${getPositionName()}) - Input blocked for ${scrollDebounceDelay}ms`);
}

function getPositionName() {
    if (currentScrollPosition === 0) {
        return "Grid View";
    } else {
        return `Card ${currentScrollPosition}: ${services[currentScrollPosition - 1].title}`;
    }
}

function startTransformToStack() {
    if (currentState !== GRID_STATE) return;
    
    currentState = ANIMATING_TO_STACK;
    animationProgress = 0;
    
    // Initialize premium animation properties
    for (let card of cards) {
        card.glowIntensity = 0;
        card.trailPositions = [];
        card.animationDelay = card.index * 0.08;
    }
    
    console.log('Starting premium transform to stack');
}

function startTransformToGrid() {
    if (currentState !== STACKED_STATE) return;
    
    currentState = ANIMATING_TO_GRID;
    animationProgress = 0;
    currentActiveCard = 0;
    previousActiveCard = 0;
    cardTransitionProgress = 1.0;
    
    // Reset all premium card animation properties
    for (let card of cards) {
        card.rotation = 0;
        card.scale = 1.0;
        card.elevation = 0;
        card.glowIntensity = 0;
        card.trailPositions = [];
    }
    
    updateServiceContent(0);
    console.log('Starting premium transform to grid');
}

function updateServiceContent(index) {
    const service = services[index];
    const contentDiv = document.getElementById('service-content');
    
    // Phase 1: Dramatic fade out with staggered timing
    contentDiv.classList.add('fade-out');
    
    // Phase 2: Prepare new content with entering position
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
        
        // Set up for dramatic entrance
        contentDiv.classList.remove('fade-out');
        contentDiv.classList.add('fade-in-prepare');
        
        // Phase 3: Dramatic fade in with slight delay
        setTimeout(() => {
            contentDiv.classList.remove('fade-in-prepare');
        }, 50); // Brief pause before entrance
        
    }, 300); // Wait for fade out to mostly complete
}

function updateScrollIndicator() {
    const progressElement = document.getElementById('scroll-progress');
    const progress = (currentScrollPosition / (totalPositions - 1)) * 100; // 0-8 mapped to 0-100%
    progressElement.style.height = `${progress}%`;
}

function drawDebugInfo() {
    // Debug info
    fill(0);
    textSize(14);
    text(`State: ${getStateName()}`, 10, 20);
    text(`Animation Progress: ${animationProgress.toFixed(3)}`, 10, 40);
    text(`Scroll Position: ${currentScrollPosition} (${getPositionName()})`, 10, 60);
    text(`Active Card: ${currentActiveCard}`, 10, 80);
    text(`Card Transition: ${cardTransitionProgress.toFixed(3)}`, 10, 100);
    text(`Scroll Blocked: ${scrollBlocked}`, 10, 120);
    text(`Time until unblock: ${scrollBlocked ? Math.max(0, scrollDebounceDelay - (millis() - lastScrollTime)) : 0}ms`, 10, 140);
    text(`Canvas: ${width}x${canvasHeight}`, 10, 160);
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