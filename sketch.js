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
let animationSpeed = 0.015;
let canvasHeight = 0;

// Continuous scrolling system
let scrollPosition = 0; // Continuous: 0 = grid, 1-8 = service cards
let targetScrollPosition = 0;
let scrollVelocity = 0;
let lastScrollTime = 0;
let scrollSensitivity = 0.003; // Slightly increased for better control through all 8 services

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
        const baseDelay = this.index * 0.08;
        const adjustedProgress = Math.max(0, Math.min(1, (animationProgress - baseDelay) / (1 - baseDelay)));
        
        if (adjustedProgress <= 0) {
            this.glowIntensity = 0;
            return;
        }
        
        const baseX = width * 0.25;
        const baseY = canvasHeight * 0.5;
        
        // All cards aim for the center initially
        const targetX = baseX;
        const targetY = baseY;
        
        const t = easeInOutCubic(adjustedProgress);
        const midPointX = (this.startX + targetX) / 2 + Math.sin(adjustedProgress * Math.PI) * 40;
        const midPointY = (this.startY + targetY) / 2 - Math.abs(Math.sin(adjustedProgress * Math.PI)) * 60;
        
        this.x = lerp(lerp(this.startX, midPointX, t), lerp(midPointX, targetX, t), t);
        this.y = lerp(lerp(this.startY, midPointY, t), lerp(midPointY, targetY, t), t);
        
        if (adjustedProgress < 0.4) {
            this.currentSize = this.size;
        } else {
            const sizeProgress = (adjustedProgress - 0.4) / 0.6;
            const seamlessEasing = easeInOutQuart(sizeProgress * sizeProgress);
            this.currentSize = lerp(this.size, this.targetSize, seamlessEasing);
        }
        
        this.alpha = lerp(255, 240, t * 0.5);
        this.rotation = Math.sin(adjustedProgress * Math.PI) * 2;
        this.scale = 1.0 + Math.sin(adjustedProgress * Math.PI) * 0.01;
        this.elevation = adjustedProgress * 6;
        this.glowIntensity = Math.sin(adjustedProgress * Math.PI) * 30;
        
        if (this.trailPositions.length > 5) this.trailPositions.shift();
        this.trailPositions.push({x: this.x, y: this.y, alpha: this.glowIntensity});
    }
    
    animateToGrid() {
        const baseDelay = (7 - this.index) * 0.05;
        const adjustedProgress = Math.max(0, Math.min(1, (animationProgress - baseDelay) / (1 - baseDelay)));
        
        if (adjustedProgress <= 0) {
            this.glowIntensity = 0;
            return;
        }
        
        const startStackX = width * 0.25;
        const startStackY = canvasHeight * 0.5;
        
        const t = easeInOutCubic(adjustedProgress);
        const curveT = easeOutCubic(adjustedProgress);
        
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
        
        if (this.trailPositions.length > 5) this.trailPositions.shift();
        this.trailPositions.push({x: this.x, y: this.y, alpha: this.glowIntensity});
    }
    
    updateInStack() {
        const baseX = width * 0.25;
        const baseY = canvasHeight * 0.5;
        
        this.currentSize = this.targetSize;
        
        // Calculate current active card and transition progress from continuous scroll
        let currentCard, nextCard, transitionProgress;
        
        if (scrollPosition <= 1) {
            // First card (index 0)
            currentCard = 0;
            nextCard = 1;
            transitionProgress = Math.max(0, scrollPosition - 1);
        } else if (scrollPosition >= 8) {
            // Last card (index 7)
            currentCard = 7;
            nextCard = 7;
            transitionProgress = 0;
        } else {
            // Between cards
            currentCard = Math.floor(scrollPosition - 1);
            nextCard = Math.min(7, currentCard + 1);
            transitionProgress = (scrollPosition - 1) - currentCard;
        }
        
        // Clamp values to valid ranges
        currentCard = Math.max(0, Math.min(7, currentCard));
        nextCard = Math.max(0, Math.min(7, nextCard));
        transitionProgress = Math.max(0, Math.min(1, transitionProgress));
        
        if (this.index === currentCard) {
            // Current active card
            if (transitionProgress < 0.3) {
                // Stable in center
                this.x = baseX;
                this.y = baseY;
                this.alpha = 255;
                this.rotation = 0;
                this.scale = 1.0 + Math.sin(millis() * 0.001) * 0.01;
                this.elevation = 8;
            } else {
                // Transitioning out faster
                const exitProgress = (transitionProgress - 0.3) / 0.7;
                const slideDistance = 150 * scaleFactor;
                
                this.x = baseX + (slideDistance * exitProgress);
                this.y = baseY - (20 * exitProgress);
                this.rotation = -15 * exitProgress;
                this.scale = 1.0 - (0.25 * exitProgress);
                this.alpha = 255 * (1 - exitProgress * 0.7);
                this.elevation = 8 - (6 * exitProgress);
            }
            
        } else if (this.index === nextCard && transitionProgress > 0.3) {
            // Next card coming in faster
            const enterProgress = (transitionProgress - 0.3) / 0.7;
            const slideDistance = 150 * scaleFactor;
            
            this.x = baseX - slideDistance + (slideDistance * enterProgress);
            this.y = baseY + 30 - (30 * enterProgress);
            this.rotation = 15 - (15 * enterProgress);
            this.scale = 0.8 + (0.2 * enterProgress);
            this.alpha = 255 * (0.3 + 0.7 * enterProgress);
            this.elevation = 2 + (6 * enterProgress);
            
        } else if (this.index > currentCard) {
            // Cards ahead in stack
            const offset = (this.index - currentCard);
            const stackOffset = offset * 8 * scaleFactor;
            const depthOffset = offset * 3 * scaleFactor;
            
            this.x = baseX + stackOffset;
            this.y = baseY + depthOffset;
            this.rotation = offset * 1.5;
            this.scale = 1.0 - (offset * 0.03);
            this.alpha = Math.max(60, 180 - (offset * 25));
            this.elevation = Math.max(1, 6 - offset);
            
        } else {
            // Cards behind in stack
            const offset = (currentCard - this.index);
            const stackOffset = offset * 5 * scaleFactor;
            const depthOffset = offset * 2 * scaleFactor;
            
            this.x = baseX - stackOffset;
            this.y = baseY + depthOffset;
            this.rotation = -offset * 1;
            this.scale = 1.0 - (offset * 0.02);
            this.alpha = Math.max(40, 120 - (offset * 15));
            this.elevation = Math.max(0, 4 - offset);
        }
    }
    
    draw() {
        push();
        
        // Draw motion trails during transitions
        if (this.trailPositions.length > 1 && this.glowIntensity > 10) {
            for (let i = 0; i < this.trailPositions.length - 1; i++) {
                const trail = this.trailPositions[i];
                const trailAlpha = (trail.alpha * (i / this.trailPositions.length)) * 0.3;
                
                push();
                translate(trail.x, trail.y);
                
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
        
        translate(this.x, this.y);
        rotate(radians(this.rotation));
        scale(this.scale);
        
        // Premium shadows
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
        
        // Glow effect
        if (this.glowIntensity > 5) {
            push();
            drawingContext.save();
            drawingContext.shadowColor = `rgba(102, 126, 234, ${this.glowIntensity / 200})`;
            drawingContext.shadowBlur = this.glowIntensity / 2;
            
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
        
        // Card background with current card highlighting
        const currentServiceIndex = Math.max(0, Math.min(7, Math.round(scrollPosition - 1)));
        const isCurrentCard = scrollPosition >= 1 && scrollPosition <= 8 && 
                              this.index === currentServiceIndex;
        
        if (isCurrentCard && currentState === STACKED_STATE) {
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
            const borderGlow = this.glowIntensity > 5 ? this.glowIntensity / 4 : 0;
            fill(255, this.alpha);
            stroke(102, 126, 234, Math.min(100, 50 + borderGlow) * (this.alpha / 255));
            strokeWeight(1 + (this.glowIntensity / 40));
            rect(-this.currentSize/2, -this.currentSize/2, this.currentSize, this.currentSize, 15);
        }
        
        // Card image
        if (this.img) {
            const brightnessBoost = this.glowIntensity > 5 ? 1.1 : 1.0;
            tint(255 * brightnessBoost, this.alpha);
            
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
    
    // Sort cards for proper drawing order
    let sortedCards = [...cards];
    if (currentState === STACKED_STATE) {
        const currentCard = Math.floor(Math.max(0, scrollPosition - 1));
        sortedCards.sort((a, b) => {
            if (a.index === currentCard) return 1;
            if (b.index === currentCard) return -1;
            return a.index - b.index;
        });
    } else if (currentState === ANIMATING_TO_STACK || currentState === ANIMATING_TO_GRID) {
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
    // Smooth interpolation to target
    const lerpSpeed = 0.15;
    scrollPosition = lerp(scrollPosition, targetScrollPosition, lerpSpeed);
    
    // Apply velocity damping
    scrollVelocity *= 0.95;
}

function updateTextPosition() {
    if (currentState === STACKED_STATE || currentState === ANIMATING_TO_STACK) {
        const servicesContainer = document.getElementById('services-container');
        
        // Calculate text scroll position
        // When scrollPosition = 1, show service 0 (0% scroll)
        // When scrollPosition = 2, show service 1 (-12.5% scroll)
        // When scrollPosition = 8, show service 7 (-87.5% scroll)
        if (scrollPosition >= 1) {
            const serviceProgress = Math.min(7, scrollPosition - 1); // 0-7 continuously
            const scrollPercent = -(serviceProgress * 12.5); // Each service is 12.5% apart
            servicesContainer.style.transform = `translateY(calc(${scrollPercent}% + 2850px))`;
        } else {
            servicesContainer.style.transform = `translateY(0%)`;
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
    scrollVelocity += scrollDelta * 0.5;
    
    lastScrollTime = millis();
    
    // Debug: Show which service should be active
    if (scrollPosition >= 1 && scrollPosition <= 8) {
        const serviceIndex = Math.round(scrollPosition - 1);
        const serviceName = services[serviceIndex]?.title || 'Unknown';
        console.log(`Scroll: ${scrollPosition.toFixed(2)} -> Service ${serviceIndex}: ${serviceName}`);
    } else {
        console.log(`Scroll position: ${scrollPosition.toFixed(2)} (Grid view)`);
    }
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
    radialGradient.addColorStop(0, `rgba(102, 126, 234, ${0.05 * gradientIntensity})`);
    radialGradient.addColorStop(1, `rgba(102, 126, 234, 0)`);
    
    drawingContext.fillStyle = radialGradient;
    drawingContext.fillRect(0, 0, width, canvasHeight);
    drawingContext.restore();
}

function drawAmbientParticles() {
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

function startTransformToStack() {
    if (currentState !== GRID_STATE) return;
    
    currentState = ANIMATING_TO_STACK;
    animationProgress = 0;
    
    for (let card of cards) {
        card.glowIntensity = 0;
        card.trailPositions = [];
    }
    
    console.log('Starting transform to stack');
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
    
    console.log('Starting transform to grid');
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