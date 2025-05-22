class AnimatedCardsController {
    constructor() {
        this.mainSection = document.getElementById('mainSection');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.twoColumnLayout = document.getElementById('twoColumnLayout');
        this.cards = document.querySelectorAll('.card');
        this.stackedCards = document.querySelectorAll('.stacked-card');
        this.serviceContents = document.querySelectorAll('.service-content');
        
        this.currentActiveCard = 0;
        this.isTransformed = false;
        this.isAnimating = false;
        this.lastScrollY = 0;
        
        this.init();
    }
    
    init() {
        this.setupScrollListener();
        this.calculateTriggerPoints();
        this.setupIntersectionObserver();
        
        // Add resize listener to recalculate trigger points
        window.addEventListener('resize', () => {
            this.calculateTriggerPoints();
        });
    }
    
    calculateTriggerPoints() {
        const headerHeight = document.querySelector('header').offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Transform triggers when user scrolls 30% into the main section
        this.transformTrigger = headerHeight + (viewportHeight * 0.3);
        
        // Calculate the scroll range for the main section
        this.mainSectionStart = headerHeight;
        this.mainSectionHeight = this.mainSection.offsetHeight;
        this.cardSwitchStart = headerHeight + (viewportHeight * 0.6);
        this.cardSwitchRange = this.mainSectionHeight - (viewportHeight * 1.5);
    }
    
    setupScrollListener() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        this.lastScrollY = scrollY;
        
        // Prevent multiple animations
        if (this.isAnimating) return;
        
        // Handle transformation between grid and two-column layout
        if (scrollY >= this.transformTrigger && !this.isTransformed) {
            this.transformToTwoColumn();
        } else if (scrollY < this.transformTrigger && this.isTransformed) {
            this.transformToGrid();
        }
        
        // Handle card switching in two-column layout
        if (this.isTransformed && scrollY >= this.cardSwitchStart) {
            this.handleCardSwitching(scrollY);
        }
    }
    
    async transformToTwoColumn() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.isTransformed = true;
        
        // Step 1: Capture each card's current position BEFORE changing anything
        const cardPositions = [];
        this.cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            cardPositions[index] = {
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
            };
            console.log(`Card ${index} original center: X=${cardPositions[index].centerX}, Y=${cardPositions[index].centerY}`);
        });
        
        // Step 2: Calculate target position - center of screen for now to debug
        const targetX = window.innerWidth * 0.5; // 50% from left edge (screen center)
        const targetY = window.innerHeight * 0.5; // 50% from top edge (screen center)  
        console.log(`Target coordinates: X=${targetX}, Y=${targetY}`);
        
        // Step 3: Add animating class and set initial positions using transform only
        this.cardsGrid.classList.add('animating');
        this.cards.forEach((card, index) => {
            card.classList.add('animating');
            card.style.zIndex = 1000 + index;
            
            // Use transform to position the card at its original location
            const pos = cardPositions[index];
            const initialDeltaX = pos.centerX - (card.offsetLeft + card.offsetWidth / 2);
            const initialDeltaY = pos.centerY - (card.offsetTop + card.offsetHeight / 2);
            
            card.style.transform = `translate(${initialDeltaX}px, ${initialDeltaY}px) scale(1)`;
        });
        
        // Step 4: Wait a frame so the positioning takes effect
        await this.waitForNextFrame();
        
        // Step 5: Now animate to target positions
        this.cards.forEach((card, index) => {
            const pos = cardPositions[index];
            
            // Add slight offset so we can see all cards during animation
            const offsetX = (index % 4 - 1.5) * 15;
            const offsetY = (Math.floor(index / 4) - 0.5) * 15;
            
            // Calculate delta from original position to target
            const deltaX = (targetX + offsetX) - pos.centerX;
            const deltaY = (targetY + offsetY) - pos.centerY;
            
            console.log(`Card ${index} animation delta: X=${deltaX}, Y=${deltaY}`);
            
            // Calculate correct scale
            const targetScale = 430 / 200; // 2.15x scale
            
            // Apply the transformation - animate from original position to target
            card.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${targetScale})`;
            card.style.opacity = '0.8';
        });
        
        // Step 6: Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 7: Set up the two-column layout (use 25% for final positioning)
        this.setupTwoColumnLayout(window.innerWidth * 0.25, window.innerHeight * 0.5);
        
        // Step 8: Hide animated cards and show two-column layout
        this.cardsGrid.classList.add('hidden');
        this.twoColumnLayout.classList.add('active');
        
        // Step 9: Reset
        this.resetCardPositions();
        this.isAnimating = false;
    }
    
    setupTwoColumnLayout(targetX, targetY) {
        const leftColumn = this.twoColumnLayout.querySelector('.left-column');
        const rightColumn = this.twoColumnLayout.querySelector('.right-column');
        
        // Position left column so its center aligns with where cards ended up
        const columnTop = targetY - 215; // Center the 430px height on target Y
        leftColumn.style.top = `${columnTop}px`;
        rightColumn.style.top = `${columnTop}px`;
        
        // Make sure columns are positioned correctly
        leftColumn.style.left = '0';
        leftColumn.style.width = '50%';
        rightColumn.style.left = '50%';
        rightColumn.style.width = '50%';
    }
    
    async transformToGrid() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.isTransformed = false;
        
        // Step 1: Hide two-column layout immediately
        this.twoColumnLayout.classList.remove('active');
        
        // Step 2: Show grid and animate cards back
        this.cardsGrid.classList.remove('hidden');
        await this.waitForNextFrame();
        
        // Step 3: Reset all cards to original positions
        this.cards.forEach((card, index) => {
            card.classList.add('animating');
            card.style.transform = 'translate(0, 0) scale(1)';
            card.style.opacity = '1';
            card.style.zIndex = '1';
        });
        
        // Step 4: Wait for animation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 5: Clean up
        this.cardsGrid.classList.remove('animating');
        this.resetCardPositions();
        
        // Reset to first card
        this.switchToCard(0);
        this.isAnimating = false;
    }
    
    resetCardPositions() {
        this.cards.forEach(card => {
            card.classList.remove('animating');
            card.style.transform = '';
            card.style.opacity = '';
            card.style.zIndex = '';
        });
    }
    
    waitForNextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    handleCardSwitching(scrollY) {
        const relativeScroll = scrollY - this.cardSwitchStart;
        const progress = Math.min(Math.max(relativeScroll / this.cardSwitchRange, 0), 1);
        
        // Calculate which card should be active (0-7)
        const cardIndex = Math.min(Math.floor(progress * 8), 7);
        
        if (cardIndex !== this.currentActiveCard) {
            this.switchToCard(cardIndex);
        }
    }
    
    switchToCard(index) {
        this.currentActiveCard = index;
        
        // Remove active class from all cards and content
        this.stackedCards.forEach(card => card.classList.remove('active'));
        this.serviceContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to current card and content
        this.stackedCards[index].classList.add('active');
        this.serviceContents[index].classList.add('active');
        
        // Add subtle animation effect
        this.addCardSwitchEffect(index);
    }
    
    addCardSwitchEffect(index) {
        const activeCard = this.stackedCards[index];
        
        // Add a subtle scale animation
        activeCard.style.transform = 'scale(1.05) translateY(0)';
        
        setTimeout(() => {
            activeCard.style.transform = 'scale(1) translateY(0)';
        }, 200);
    }
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, options);
        
        // Observe cards for entrance animations
        this.cards.forEach(card => {
            observer.observe(card);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnimatedCardsController();
});

// Add smooth scrolling enhancement
document.documentElement.style.scrollBehavior = 'smooth';

// Optional: Add keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const scrollAmount = window.innerHeight * 0.1;
        const currentScroll = window.scrollY;
        const targetScroll = e.key === 'ArrowDown' 
            ? currentScroll + scrollAmount 
            : currentScroll - scrollAmount;
        
        window.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
    }
});