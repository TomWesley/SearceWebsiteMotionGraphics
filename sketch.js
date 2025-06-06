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
let animationSpeed = 0.02; // Faster animation
let canvasHeight = 0;

// Continuous scrolling system
let scrollPosition = 0; // Continuous: 0 = grid, 1-8 = service cards
let targetScrollPosition = 0;
let scrollVelocity = 0;
let lastScrollTime = 0;
let scrollSensitivity = 0.004; // Reduced for better mobile control
let isMobile = false;

// Responsive scaling variables - REDUCED SIZES FOR BETTER RESOLUTION
let baseCardSize = 180; // Reduced from 240 for better resolution
let baseTargetSize = 320; // Reduced from 480 for better resolution
let scaleFactor = 1;
let sizeLimit = 1.2;

function calculateScaleFactor() {
    const baseWidth = 1200;
    const rawScale = windowWidth / baseWidth;
    scaleFactor = Math.max(0.5, Math.min(sizeLimit, rawScale));
    baseCardSize = 180 * scaleFactor;
    baseTargetSize = 320 * scaleFactor;
}

// Smooth easing functions
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuart(t) {
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
        this.elevation = 0;
        this.glowIntensity = 0;
        this.trailPositions = [];
    }
    
    updateSizes() {
        this.size = baseCardSize;
        this.targetSize = baseTargetSize;
    }
    
    update() {
        if (currentState === ANIMATING_TO_STACK) {
            this.animateToStack();
        } else if (currentState === ANIMATING_TO_GRID) {
            this.animateToGrid();
        }
    }
    
    animateToStack() {
        const baseDelay = this.index * 0.06; // Faster staggering
        const adjustedProgress = Math.max(0, Math.min(1, (animationProgress - baseDelay) / (1 - baseDelay)));
        
        if (adjustedProgress <= 0) {
            this.glowIntensity = 0;
            return;
        }
        
        const baseX = isMobile ? width * 0.5 : width * 0.25;
        const baseY = canvasHeight * 0.5;
        
        // ALL cards aim for the EXACT SAME position - perfect stack
        const targetX = baseX;
        const targetY = baseY;
        
        const t = easeInOutCubic(adjustedProgress);
        const midPointX = (this.startX + targetX) / 2 + Math.sin(adjustedProgress * Math.PI) * 30;
        const midPointY = (this.startY + targetY) / 2 - Math.abs(Math.sin(adjustedProgress * Math.PI)) * 50;
        
        // Perfect convergence - all cards end up at the exact same position
        this.x = lerp(lerp(this.startX, midPointX, t), lerp(midPointX, targetX, t), t);
        this.y = lerp(lerp(this.startY, midPointY, t), lerp(midPointY, targetY, t), t);
        
        if (adjustedProgress < 0.3) {
            this.currentSize = this.size;
        } else {
            const sizeProgress = (adjustedProgress - 0.3) / 0.7;
            const seamlessEasing = easeInOutQuart(sizeProgress * sizeProgress);
            this.currentSize = lerp(this.size, this.targetSize, seamlessEasing);
        }
        
        this.alpha = lerp(255, 240, t * 0.5);
        this.rotation = Math.sin(adjustedProgress * Math.PI) * 1;
        this.scale = 1.0 + Math.sin(adjustedProgress * Math.PI) * 0.005;
        this.elevation = adjustedProgress * 4;
        this.glowIntensity = Math.sin(adjustedProgress * Math.PI) * 25;
        
        if (this.trailPositions.length > 3) this.trailPositions.shift();
        this.trailPositions.push({x: this.x, y: this.y, alpha: this.glowIntensity});
    }
    
    animateToGrid() {
        const baseDelay = (7 - this.index) * 0.04; // Faster reverse animation
        const adjustedProgress = Math.max(0, Math.min(1, (animationProgress - baseDelay) / (1 - baseDelay)));
        
        if (adjustedProgress <= 0) {
            this.glowIntensity = 0;
            return;
        }
        
        const startStackX = isMobile ? width * 0.5 : width * 0.25;
        const startStackY = canvasHeight * 0.5;
        
        const t = easeInOutCubic(adjustedProgress);
        const curveT = easeOutCubic(adjustedProgress);
        
        const midPointX = (startStackX + this.startX) / 2 - Math.sin(adjustedProgress * Math.PI) * 40;
        const midPointY = (startStackY + this.startY) / 2 - Math.abs(Math.sin(adjustedProgress * Math.PI)) * 60;
        
        this.x = lerp(lerp(startStackX, midPointX, t), lerp(midPointX, this.startX, t), t);
        this.y = lerp(lerp(startStackY, midPointY, t), lerp(midPointY, this.startY, t), t);
        
        this.currentSize = lerp(this.targetSize, this.size, curveT);
        this.alpha = lerp(220, 255, t);
        this.rotation = -Math.sin(adjustedProgress * Math.PI) * 4;
        this.scale = 1.0 + Math.sin(adjustedProgress * Math.PI) * 0.02;
        this.elevation = (1 - adjustedProgress) * 8;
        this.glowIntensity = Math.sin(adjustedProgress * Math.PI) * 40;
        
        if (this.trailPositions.length > 3) this.trailPositions.shift();
        this.trailPositions.push({x: this.x, y: this.y, alpha: this.glowIntensity});
    }
    
    draw() {
        push();
        
        // Draw motion trails during transitions
        if (this.trailPositions.length > 1 && this.glowIntensity > 8) {
            for (let i = 0; i < this.trailPositions.length - 1; i++) {
                const trail = this.trailPositions[i];
                const trailAlpha = (trail.alpha * (i / this.trailPositions.length)) * 0.25;
                
                push();
                translate(trail.x, trail.y);
                
                drawingContext.save();
                drawingContext.shadowColor = 'rgba(102, 126, 234, 0.3)';
                drawingContext.shadowBlur = 12;
                fill(102, 126, 234, trailAlpha);
                noStroke();
                const trailSize = this.currentSize * (0.85 + i * 0.03);
                rect(-trailSize/2, -trailSize/2, trailSize, trailSize, 10);
                drawingContext.restore();
                
                pop();
            }
        }
        
        translate(this.x, this.y);
        rotate(radians(this.rotation));
        scale(this.scale);
        
        // Enhanced shadows for depth
        if (this.elevation > 0) {
            const shadowLayers = Math.min(3, Math.ceil(this.elevation / 4));
            for (let i = 0; i < shadowLayers; i++) {
                push();
                const shadowOffset = (this.elevation / shadowLayers) * (i + 1) * 0.7;
                const shadowSize = this.currentSize + (i * 1.5);
                const shadowAlpha = (50 - i * 12) * (this.alpha / 255) * (this.elevation / 15);
                
                translate(shadowOffset * 0.5, shadowOffset);
                fill(0, 0, 0, shadowAlpha);
                noStroke();
                rect(-shadowSize/2, -shadowSize/2, shadowSize, shadowSize, 12);
                pop();
            }
        }
        
        // Glow effect
        if (this.glowIntensity > 3) {
            push();
            drawingContext.save();
            drawingContext.shadowColor = `rgba(102, 126, 234, ${this.glowIntensity / 150})`;
            drawingContext.shadowBlur = this.glowIntensity / 3;
            
            for (let i = 0; i < 2; i++) {
                const glowSize = this.currentSize + (i * 6);
                const glowAlpha = (this.glowIntensity / 2) * (2 - i);
                fill(102, 126, 234, glowAlpha * 0.08);
                noStroke();
                rect(-glowSize/2, -glowSize/2, glowSize, glowSize, 15);
            }
            drawingContext.restore();
            pop();
        }
        
        // Card background with enhanced active card highlighting
        const scrollProgress = Math.max(0, scrollPosition - 1);
        const currentCardIndex = Math.floor(scrollProgress);
        const nextCardIndex = Math.min(7, currentCardIndex + 1);
        const transitionProgress = scrollProgress - currentCardIndex;
        
        const isActiveCard = (this.index === currentCardIndex) || 
                            (this.index === nextCardIndex && transitionProgress > 0 && currentCardIndex < 7);
        const isCurrentlyDisplayed = currentState === STACKED_STATE && isActiveCard;
        
        if (isCurrentlyDisplayed) {
            drawingContext.save();
            const gradient = drawingContext.createLinearGradient(
                -this.currentSize/2, -this.currentSize/2,
                this.currentSize/2, this.currentSize/2
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha / 255})`);
            gradient.addColorStop(0.5, `rgba(252, 254, 255, ${this.alpha / 255})`);
            gradient.addColorStop(1, `rgba(248, 250, 252, ${this.alpha / 255})`);
            
            drawingContext.fillStyle = gradient;
            drawingContext.shadowColor = 'rgba(102, 126, 234, 0.25)';
            drawingContext.shadowBlur = 10;
            drawingContext.beginPath();
            drawingContext.roundRect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 12);
            drawingContext.fill();
            drawingContext.restore();
        } else {
            fill(255, this.alpha);
            noStroke();
            rect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 12);
        }
        
        // Card image with enhanced drop shadows
        if (this.img) {
            const brightnessBoost = this.glowIntensity > 5 ? 1.05 : 1.0;
            tint(255 * brightnessBoost, this.alpha);
            
            drawingContext.save();
            
            // Base drop shadow - always present
            const shadowOpacity = (this.alpha / 255) * 0.25;
            const shadowOffset = Math.max(2, this.currentSize * 0.015);
            const shadowBlur = Math.max(4, this.currentSize * 0.025);
            
            drawingContext.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
            drawingContext.shadowOffsetX = shadowOffset * 0.7;
            drawingContext.shadowOffsetY = shadowOffset;
            drawingContext.shadowBlur = shadowBlur;
            
            // Enhanced glow shadow when glowing
            if (this.glowIntensity > 8) {
                const glowShadowOpacity = Math.min(0.4, this.glowIntensity / 100);
                drawingContext.shadowColor = `rgba(102, 126, 234, ${glowShadowOpacity})`;
                drawingContext.shadowBlur = Math.max(shadowBlur, this.glowIntensity / 8);
            }
            
            image(this.img, -this.currentSize/2, -this.currentSize/2, 
                  this.currentSize, this.currentSize);
            
            drawingContext.restore();
            noTint();
        }
        
        pop();
    }
}

// IMPROVED: Central function to handle all 8 cards with 3-card stack limit and fading
function updateAllCardsInStack() {
    const baseX = isMobile ? width * 0.5 : width * 0.25; // Center on mobile
    const baseY = canvasHeight * 0.5;
    
    // Calculate which card should be active
    let activeCardIndex;
    if (scrollPosition <= 1) {
        activeCardIndex = 0;
    } else if (scrollPosition >= 8) {
        activeCardIndex = 7;
    } else {
        activeCardIndex = Math.floor(scrollPosition - 1);
    }
    
    // Process all 8 cards explicitly - only show 3 cards max with fading
    for (let i = 0; i < 8; i++) {
        const card = cards[i];
        
        if (i === activeCardIndex) {
            // THIS IS THE ACTIVE CARD - always at front center
            card.x = baseX;
            card.y = baseY;
            card.currentSize = card.targetSize;
            card.rotation = 0;
            card.scale = 1.0 + Math.sin(millis() * 0.0008) * 0.005;
            card.elevation = 12;
            card.alpha = 255;
            
        } else if (i < activeCardIndex && scrollPosition > 1.1) {
            // THIS CARD HAS BEEN PASSED - show only top 3 with fading
            const stackDepth = activeCardIndex - i;
            
            if (stackDepth <= 3) {
                // Show this card as part of the visible stack
                const scaleReduction = Math.pow(0.94, stackDepth);
                card.currentSize = card.targetSize * scaleReduction;
                
                // IMPROVED: Fade opacity based on stack depth - only show 3 cards
                let alphaMultiplier;
                if (stackDepth === 1) alphaMultiplier = 0.8;
                else if (stackDepth === 2) alphaMultiplier = 0.5;
                else if (stackDepth === 3) alphaMultiplier = 0.25;
                else alphaMultiplier = 0; // Hide cards beyond 3rd position
                
                card.alpha = 255 * alphaMultiplier;
                card.rotation = 0;
                card.scale = 1.0;
                card.elevation = Math.max(1, 12 - stackDepth * 2);
                
                card.x = baseX;
                const pushBackDistance = stackDepth * (card.targetSize * 0.035);
                const verticalOffset = card.targetSize * 0.008;
                card.y = baseY - verticalOffset - pushBackDistance;
            } else {
                // Hide cards beyond the 3rd position completely
                card.alpha = 0;
                card.x = baseX;
                card.y = baseY;
                card.elevation = 0;
            }
            
        } else {
            // THIS CARD HASN'T BEEN REACHED YET - hide it
            card.alpha = 0;
            card.x = baseX;
            card.y = baseY;
            card.currentSize = card.targetSize;
            card.elevation = 0;
        }
    }
}

function preload() {
    // Load card images
    for (let i = 1; i <= 8; i++) {
        cardImages.push(loadImage(`images/card${i}.svg`));
    }
}

function setup() {
    // Detect mobile devices
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || windowWidth < 768;
    
    canvasHeight = window.innerHeight - (isMobile ? (windowWidth < 480 ? 80 : 100) : 120);
    calculateScaleFactor();
    
    const canvas = createCanvas(windowWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    setupCardGrid();
    initializeServiceContent();
    
    // Add both wheel and touch event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // Mobile touch support
    if (isMobile) {
        let touchStartY = 0;
        let touchStartTime = 0;
        
        canvas.canvas.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartTime = millis();
        }, { passive: true });
        
        canvas.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            const deltaTime = millis() - touchStartTime;
            
            if (deltaTime > 50) { // Throttle touch events
                const scrollDelta = deltaY * 0.002; // Reduced sensitivity for touch
                handleScrollDelta(scrollDelta);
                touchStartY = touchY;
                touchStartTime = millis();
            }
        }, { passive: false });
    }
    
    window.addEventListener('resize', () => {
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || windowWidth < 768;
        canvasHeight = window.innerHeight - (isMobile ? (windowWidth < 480 ? 80 : 100) : 120);
        calculateScaleFactor();
        resizeCanvas(windowWidth, canvasHeight);
        setupCardGrid();
        
        for (let card of cards) {
            card.updateSizes();
        }
    });
}

function setupCardGrid() {
    cards = [];
    
    if (isMobile) {
        // Mobile layout: 2x4 grid with tighter spacing
        const cardSpacing = Math.min(280, windowWidth * 0.4) * scaleFactor;
        const gridWidth = 2 * cardSpacing;
        const gridHeight = 4 * cardSpacing;
        const startX = width / 2 - gridWidth / 2 + cardSpacing / 2;
        const startY = canvasHeight / 2 - gridHeight / 2 + cardSpacing / 2;
        
        for (let i = 0; i < 8; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const x = startX + col * cardSpacing;
            const y = startY + row * cardSpacing;
            
            cards.push(new Card(x, y, cardImages[i], i));
        }
    } else {
        // Desktop layout: 4x2 grid
        const cardSpacing = 350 * scaleFactor;
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
}

function initializeServiceContent() {
    const servicesContainer = document.getElementById('services-container');
    
    // Create all service content divs
    services.forEach((service, index) => {
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'service-content';
        
        let featuresHTML = '';
        service.features.forEach(feature => {
            featuresHTML += `<li>${feature}</li>`;
        });
        
        serviceDiv.innerHTML = `
            <h2>${service.title}</h2>
            <p>${service.description}</p>
            <ul>${featuresHTML}</ul>
        `;
        
        servicesContainer.appendChild(serviceDiv);
    });
}

function draw() {
    if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        drawPremiumBackground();
    } else {
        background(0, 22, 48);
    }
    
    // Update continuous scrolling
    updateContinuousScrolling();
    
    // Handle state transitions
    if (scrollPosition <= 0.1) {
        if (currentState === STACKED_STATE) {
            startTransformToGrid();
        }
    } else if (scrollPosition >= 0.9) {
        if (currentState === GRID_STATE) {
            startTransformToStack();
        }
    }
    
    // Update animation progress
    if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        animationProgress += animationSpeed;
        
        if (animationProgress >= 1.0) {
            animationProgress = 1.0;
            
            if (currentState === ANIMATING_TO_STACK) {
                currentState = STACKED_STATE;
                document.getElementById('service-overlay').classList.add('active');
            } else if (currentState === ANIMATING_TO_GRID) {
                currentState = GRID_STATE;
                document.getElementById('service-overlay').classList.remove('active');
                // Reset scroll position when back in grid state
                scrollPosition = 0;
                targetScrollPosition = 0;
            }
        }
    }
    
    // Sort cards for proper drawing order (back to front)
    let sortedCards = [...cards];
    if (currentState === STACKED_STATE) {
        // Draw cards in order: furthest behind first, active card last
        const activeIndex = Math.floor(Math.max(0, scrollPosition - 1));
        sortedCards.sort((a, b) => {
            // Active card should be drawn last (on top)
            if (a.index === activeIndex) return 1;
            if (b.index === activeIndex) return -1;
            // For all other cards, draw in normal order (lower index first)
            return a.index - b.index;
        });
    } else if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        // Draw first card last during animation
        sortedCards.sort((a, b) => {
            if (a.index === 0) return 1;
            if (b.index === 0) return -1;
            return a.index - b.index;
        });
    }
    
    // Update and draw cards
    if (currentState === STACKED_STATE) {
        // Handle all 8 cards centrally for stack mode
        updateAllCardsInStack();
    }
    
    for (let card of sortedCards) {
        card.update();
        card.draw();
    }
    
    // Draw ambient particles during transitions
    if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        drawAmbientParticles();
    }
    
    // Update scroll indicator and text position
    updateScrollIndicator();
    updateTextPosition();
}

function updateContinuousScrolling() {
    // Smooth interpolation to target with optimized response for fade transitions
    const lerpSpeed = 0.2; // Slightly faster for smoother fades
    scrollPosition = lerp(scrollPosition, targetScrollPosition, lerpSpeed);
    
    // Apply velocity damping
    scrollVelocity *= 0.9;
}

// IMPROVED: Completely smooth text scrolling without discrete steps
function updateTextPosition() {
    const servicesContainer = document.getElementById('services-container');
    
    // Only allow text scrolling when fully in STACKED_STATE
    if (currentState === STACKED_STATE) {
        if (scrollPosition >= 1) {
            // IMPROVED: Smooth, continuous text scrolling based on exact scroll position
            const scrollProgress = scrollPosition - 1; // 0-7 range
            
            // Calculate the vertical center of the canvas
            const canvasVerticalCenter = canvasHeight * 0.5;
            
            // IMPROVED: Use continuous positioning - no discrete steps
            const serviceSpacing = canvasHeight * 0.6;
            
            // IMPROVED: Continuous text movement - directly proportional to scroll
            // Text moves UP as scrollProgress increases (inverse relationship)
            const targetTextPosition = canvasVerticalCenter - (scrollProgress * serviceSpacing);
            
            servicesContainer.style.transform = `translateY(${targetTextPosition}px)`;
        } else {
            // Show first service when just entering stacked state
            const canvasVerticalCenter = canvasHeight * 0.5;
            servicesContainer.style.transform = `translateY(${canvasVerticalCenter}px)`;
        }
    } else {
        // In all other states, hide text off-screen
        servicesContainer.style.transform = `translateY(${canvasHeight + 100}px)`;
    }
}

function handleScrollDelta(scrollDelta) {
    // Handle scrolling based on current state
    if (currentState === STACKED_STATE) {
        // Allow full service navigation in stacked state
        targetScrollPosition += scrollDelta;
        targetScrollPosition = Math.max(0, Math.min(8, targetScrollPosition));
        scrollVelocity += scrollDelta * 0.3;
    } else if (currentState === GRID_STATE && scrollDelta > 0) {
        // Only allow forward scrolling to enter stack mode from grid
        targetScrollPosition += scrollDelta;
        targetScrollPosition = Math.max(0, Math.min(1, targetScrollPosition));
        scrollVelocity += scrollDelta * 0.3;
    } else if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
        // Don't allow scrolling during animations
        return;
    }
    
    lastScrollTime = millis();
}

function handleWheel(event) {
    event.preventDefault();
    
    const scrollDelta = event.deltaY * scrollSensitivity;
    handleScrollDelta(scrollDelta);
}

function drawPremiumBackground() {
    const gradientIntensity = Math.sin(animationProgress * Math.PI);
    
    drawingContext.save();
    const gradient = drawingContext.createLinearGradient(0, 0, width, canvasHeight);
    gradient.addColorStop(0, `rgba(0, 22, 48, 1)`);
    gradient.addColorStop(0.5, `rgba(0, 28, 56, 1)`);
    gradient.addColorStop(1, `rgba(0, 18, 42, 1)`);
    
    drawingContext.fillStyle = gradient;
    drawingContext.fillRect(0, 0, width, canvasHeight);
    
    const centerX = width * 0.5;
    const centerY = canvasHeight * 0.5;
    const radialGradient = drawingContext.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, canvasHeight) * 0.6
    );
    radialGradient.addColorStop(0, `rgba(102, 126, 234, ${0.04 * gradientIntensity})`);
    radialGradient.addColorStop(1, `rgba(102, 126, 234, 0)`);
    
    drawingContext.fillStyle = radialGradient;
    drawingContext.fillRect(0, 0, width, canvasHeight);
    drawingContext.restore();
}

function drawAmbientParticles() {
    const particleCount = 6;
    const particleAlpha = Math.sin(animationProgress * Math.PI) * 25;
    
    fill(102, 126, 234, particleAlpha);
    noStroke();
    
    for (let i = 0; i < particleCount; i++) {
        const time = millis() * 0.0008 + i * 0.4;
        const x = (isMobile ? width * 0.5 : width * 0.25) + Math.sin(time * 0.7) * 80;
        const y = canvasHeight * 0.5 + Math.cos(time * 0.5) * 60;
        const size = 2 + Math.sin(time * 1.5) * 0.8;
        
        push();
        translate(x, y);
        circle(0, 0, size);
        pop();
    }
}

function startTransformToStack() {
    if (currentState !== GRID_STATE) return;
    
    currentState = ANIMATING_TO_STACK;
    animationProgress = 0;
    
    for (let card of cards) {
        card.glowIntensity = 0;
        card.trailPositions = [];
    }
}

function startTransformToGrid() {
    if (currentState !== STACKED_STATE) return;
    
    currentState = ANIMATING_TO_GRID;
    animationProgress = 0;
    
    for (let card of cards) {
        card.rotation = 0;
        card.scale = 1.0;
        card.elevation = 0;
        card.glowIntensity = 0;
        card.trailPositions = [];
    }
}

function updateScrollIndicator() {
    const progressElement = document.getElementById('scroll-progress');
    const progress = (scrollPosition / 8) * 100;
    progressElement.style.height = `${progress}%`;
}

function windowResized() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || windowWidth < 768;
    canvasHeight = window.innerHeight - (isMobile ? (windowWidth < 480 ? 80 : 100) : 120);
    calculateScaleFactor();
    resizeCanvas(windowWidth, canvasHeight);
    setupCardGrid();
    
    for (let card of cards) {
        card.updateSizes();
    }
}