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
let scrollSensitivity = 0.005; // Slightly increased for better control with smooth fades

// Responsive scaling variables
let baseCardSize = 240;
let baseTargetSize = 480;
let scaleFactor = 1;
let sizeLimit = 1.2;

function calculateScaleFactor() {
    const baseWidth = 1200;
    const rawScale = windowWidth / baseWidth;
    scaleFactor = Math.max(0.6, Math.min(sizeLimit, rawScale));
    baseCardSize = 240 * scaleFactor;
    baseTargetSize = 480 * scaleFactor;
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
        } else if (currentState === STACKED_STATE) {
            this.updateInStack();
        }
    }
    
    animateToStack() {
        const baseDelay = this.index * 0.06; // Faster staggering
        const adjustedProgress = Math.max(0, Math.min(1, (animationProgress - baseDelay) / (1 - baseDelay)));
        
        if (adjustedProgress <= 0) {
            this.glowIntensity = 0;
            return;
        }
        
        const baseX = width * 0.25;
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
        
        const startStackX = width * 0.25;
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
    
    updateInStack() {
        const baseX = width * 0.25;
        const baseY = canvasHeight * 0.5;
        
        // Calculate current and next card indices with smooth transitions
        let currentCardIndex, nextCardIndex;
        let transitionProgress = 0;
        
        if (scrollPosition <= 1) {
            currentCardIndex = 0;
            nextCardIndex = 0;
            transitionProgress = 0;
        } else if (scrollPosition >= 8) {
            currentCardIndex = 7;
            nextCardIndex = 7;
            transitionProgress = 0;
        } else {
            const scrollProgress = scrollPosition - 1; // 0-7 range
            currentCardIndex = Math.floor(scrollProgress);
            nextCardIndex = Math.min(7, currentCardIndex + 1);
            transitionProgress = scrollProgress - currentCardIndex; // 0-1 transition between cards
        }
        
        // Smooth fade transition between current and next card
        if (this.index === currentCardIndex) {
            // Current active card - fades out as we transition to next
            this.x = baseX;
            this.y = baseY;
            this.currentSize = this.targetSize;
            this.rotation = 0;
            this.scale = 1.0 + Math.sin(millis() * 0.0008) * 0.005; // Subtle breathing
            this.elevation = 12;
            
            // Smooth fade out during transition
            if (transitionProgress > 0 && currentCardIndex < 7) {
                const fadeOutProgress = Math.min(1, transitionProgress * 2); // Fade faster
                this.alpha = 255 * (1 - fadeOutProgress * 0.8); // Fade to 20% opacity
                this.elevation = 12 - (fadeOutProgress * 3);
                this.scale = (1.0 + Math.sin(millis() * 0.0008) * 0.005) * (1 - fadeOutProgress * 0.1);
            } else {
                this.alpha = 255;
            }
            
        } else if (this.index === nextCardIndex && transitionProgress > 0 && currentCardIndex < 7) {
            // Next card - fades in as we transition
            this.x = baseX;
            this.y = baseY;
            this.currentSize = this.targetSize;
            this.rotation = 0;
            this.scale = 1.0 + Math.sin(millis() * 0.0008) * 0.005;
            this.elevation = 12;
            
            // Smooth fade in during transition
            const fadeInProgress = Math.min(1, transitionProgress * 2); // Fade faster
            this.alpha = 255 * fadeInProgress * 0.8 + 51; // Fade from 20% to 100% opacity
            this.elevation = 3 + (fadeInProgress * 9);
            this.scale = (1.0 + Math.sin(millis() * 0.0008) * 0.005) * (0.9 + fadeInProgress * 0.1);
            
        } else {
            // Cards in the stack behind the active cards
            const activeCard = transitionProgress > 0.5 ? nextCardIndex : currentCardIndex;
            const stackPosition = this.index - activeCard;
            
            if (stackPosition > 0) {
                // Cards ahead in the stack (not yet shown)
                const depthFactor = Math.min(stackPosition, 6); // Limit depth effect
                const scaleReduction = 1 - (depthFactor * 0.15); // Each card 15% smaller
                
                this.x = baseX;
                this.currentSize = this.targetSize * scaleReduction;
                this.alpha = Math.max(25, 180 - (depthFactor * 35));
                this.rotation = 0;
                this.scale = 1.0;
                this.elevation = Math.max(1, 8 - depthFactor);
                
                // Minimize visible protrusion - cards barely peek out
                const protrusionAmount = Math.max(3, 8 - depthFactor * 2); // Much smaller protrusion
                this.y = baseY - (this.targetSize * 0.48) + (depthFactor * protrusionAmount);
                
            } else {
                // Cards behind the active card (already shown)
                const behindDepth = Math.abs(stackPosition);
                const scaleReduction = 1 - (behindDepth * 0.1);
                
                this.x = baseX;
                this.currentSize = this.targetSize * scaleReduction;
                this.alpha = Math.max(15, 120 - (behindDepth * 30));
                this.rotation = 0;
                this.scale = 1.0;
                this.elevation = Math.max(0, 6 - behindDepth);
                
                // Position behind cards with minimal protrusion
                const protrusionAmount = Math.max(2, 6 - behindDepth);
                this.y = baseY - (this.targetSize * 0.48) + (behindDepth * protrusionAmount);
            }
        }
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
            drawingContext.strokeStyle = `rgba(102, 126, 234, ${Math.min(120, 60 + this.glowIntensity/3) * (this.alpha / 255)})`;
            drawingContext.lineWidth = 2.5;
            drawingContext.shadowColor = 'rgba(102, 126, 234, 0.25)';
            drawingContext.shadowBlur = 10;
            drawingContext.beginPath();
            drawingContext.roundRect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 12);
            drawingContext.fill();
            drawingContext.stroke();
            drawingContext.restore();
        } else {
            const borderGlow = this.glowIntensity > 3 ? this.glowIntensity / 5 : 0;
            const baseOpacity = isCurrentlyDisplayed ? 80 : 30; // Slightly brighter for transitioning cards
            fill(255, this.alpha);
            stroke(102, 126, 234, Math.min(80, baseOpacity + borderGlow) * (this.alpha / 255));
            strokeWeight(1 + (this.glowIntensity / 50));
            rect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 12);
        }
        
        // Card image
        if (this.img) {
            const brightnessBoost = this.glowIntensity > 5 ? 1.05 : 1.0;
            tint(255 * brightnessBoost, this.alpha);
            
            if (this.glowIntensity > 8) {
                drawingContext.save();
                drawingContext.shadowColor = 'rgba(102, 126, 234, 0.2)';
                drawingContext.shadowBlur = this.glowIntensity / 10;
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
    canvasHeight = window.innerHeight - 120;
    calculateScaleFactor();
    
    const canvas = createCanvas(windowWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    setupCardGrid();
    initializeServiceContent();
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    window.addEventListener('resize', () => {
        canvasHeight = window.innerHeight - 120;
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
            }
        }
    }
    
    // Sort cards for proper drawing order (back to front)
    let sortedCards = [...cards];
    if (currentState === STACKED_STATE) {
        // During stacked state, handle both current and transitioning cards
        const scrollProgress = Math.max(0, scrollPosition - 1);
        const currentCard = Math.floor(scrollProgress);
        const nextCard = Math.min(7, currentCard + 1);
        const transitionProgress = scrollProgress - currentCard;
        
        sortedCards.sort((a, b) => {
            // Both current and next card (during transition) should be drawn on top
            const aIsActive = (a.index === currentCard) || (a.index === nextCard && transitionProgress > 0);
            const bIsActive = (b.index === currentCard) || (b.index === nextCard && transitionProgress > 0);
            
            if (aIsActive && !bIsActive) return 1;
            if (bIsActive && !aIsActive) return -1;
            if (aIsActive && bIsActive) {
                // During transition, next card should be drawn on top of current card
                if (transitionProgress > 0.5) {
                    return a.index === nextCard ? 1 : -1;
                } else {
                    return a.index === currentCard ? 1 : -1;
                }
            }
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

function updateTextPosition() {
    if (currentState === STACKED_STATE || currentState === ANIMATING_TO_STACK) {
        const servicesContainer = document.getElementById('services-container');
        
        // Improved text synchronization with smooth card transitions
        if (scrollPosition >= 1) {
            // Calculate text position with smooth interpolation
            const scrollProgress = scrollPosition - 1; // 0-7 range
            const currentServiceIndex = Math.floor(scrollProgress);
            const nextServiceIndex = Math.min(7, currentServiceIndex + 1);
            const transitionProgress = scrollProgress - currentServiceIndex;
            
            // Smooth text transition that matches card fade timing
            let textPosition;
            if (transitionProgress > 0 && currentServiceIndex < 7) {
                // During transition, move text smoothly between services
                const textTransitionSpeed = 2; // Matches card fade speed
                const textProgress = Math.min(1, transitionProgress * textTransitionSpeed);
                
                const currentPercent = -(currentServiceIndex * 12.5);
                const nextPercent = -(nextServiceIndex * 12.5);
                textPosition = currentPercent + (nextPercent - currentPercent) * textProgress;
            } else {
                // Static position when not transitioning
                textPosition = -(currentServiceIndex * 12.5);
            }
            
            servicesContainer.style.transform = `translateY(calc(${textPosition}% + 2850px))`;
        } else {
            servicesContainer.style.transform = `translateY(2850px)`;
        }
    }
}

function handleWheel(event) {
    event.preventDefault();
    
    const scrollDelta = event.deltaY * scrollSensitivity;
    
    // Update target position
    targetScrollPosition += scrollDelta;
    targetScrollPosition = Math.max(0, Math.min(8, targetScrollPosition));
    
    // Add some velocity for more natural feel
    scrollVelocity += scrollDelta * 0.3;
    
    lastScrollTime = millis();
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
        const x = width * 0.25 + Math.sin(time * 0.7) * 80;
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
    scrollPosition = 0;
    targetScrollPosition = 0;
    
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
    canvasHeight = window.innerHeight - 120;
    calculateScaleFactor();
    resizeCanvas(windowWidth, canvasHeight);
    setupCardGrid();
    
    for (let card of cards) {
        card.updateSizes();
    }
}