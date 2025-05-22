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
        
        // Step 1: Calculate the vertical center position based on the original grid
        const gridRect = this.cardsGrid.getBoundingClientRect();
        const verticalCenter = gridRect.top + (gridRect.height / 2);
        
        // Step 2: Prepare and position the two-column layout with 50% widths
        this.twoColumnLayout.classList.add('preparing');
        await this.waitForNextFrame();
        
        const leftColumn = this.twoColumnLayout.querySelector('.left-column');
        const rightColumn = this.twoColumnLayout.querySelector('.right-column');
        
        // Position columns: left takes 0-50%, right takes 50%-100%
        const columnTop = verticalCenter - 215; // Center the 430px height
        leftColumn.style.top = `${columnTop}px`;
        rightColumn.style.top = `${columnTop}px`;
        
        // Step 3: Calculate target position (center of left 50% column)
        const targetX = window.innerWidth * 0.25; // Center of left 50%
        const targetY = verticalCenter;
        
        // Step 4: Animate each card to the target position
        this.cardsGrid.classList.add('animating');
        
        const cardAnimations = Array.from(this.cards).map((card, index) => {
            return this.animateCardToTarget(card, targetX, targetY, index);
        });
        
        // Step 5: Wait for all animations to complete
        await Promise.all(cardAnimations);
        
        // Step 6: Hide grid cards and show the two-column layout
        this.cardsGrid.classList.add('hidden');
        this.twoColumnLayout.classList.remove('preparing');
        this.twoColumnLayout.classList.add('active');
        
        // Step 7: Reset card positions for potential reverse animation
        this.resetCardPositions();
        
        this.isAnimating = false;
    }
    
    calculateSquarePosition(cardIndices) {
        // Get the bounding box of the specified cards to form a square
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        cardIndices.forEach(index => {
            const card = this.cards[index];
            const rect = card.getBoundingClientRect();
            minX = Math.min(minX, rect.left);
            maxX = Math.max(maxX, rect.right);
            minY = Math.min(minY, rect.top);
            maxY = Math.max(maxY, rect.bottom);
        });
        
        return {
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }
    
    async transformToGrid() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.isTransformed = false;
        
        // Step 1: Hide two-column layout
        this.twoColumnLayout.classList.remove('active');
        
        // Step 2: Show grid and animate cards back to original positions
        this.cardsGrid.classList.remove('hidden');
        await this.waitForNextFrame();
        
        // Step 3: Animate cards from center back to grid positions
        await this.animateCardsToGrid();
        
        // Step 4: Clean up
        this.cardsGrid.classList.remove('animating');
        this.resetCardPositions();
        
        // Reset to first card
        this.switchToCard(0);
        this.isAnimating = false;
    }
    
    async animateCardToTarget(card, targetX, targetY, index) {
        const cardRect = card.getBoundingClientRect();
        const startX = cardRect.left + cardRect.width / 2;
        const startY = cardRect.top + cardRect.height / 2;
        
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        
        // Add staggered delay for more natural movement
        const delay = index * 50;
        
        return new Promise(resolve => {
            setTimeout(() => {
                card.classList.add('animating');
                
                // Calculate scale - cards should grow to fill the larger space
                const scaleX = 400 / 200; // Target width / current width
                const scaleY = 400 / 200; // Target height / current height
                
                // Apply the transformation
                card.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX * 0.8})`;
                card.style.opacity = index === this.currentActiveCard ? '1' : '0.3';
                card.style.zIndex = index === this.currentActiveCard ? '1002' : '1001';
                
                // Resolve after animation duration
                setTimeout(resolve, 1200);
            }, delay);
        });
    }
    
    async animateCardsToGrid() {
        const cardAnimations = Array.from(this.cards).map((card, index) => {
            return new Promise(resolve => {
                const delay = index * 30;
                setTimeout(() => {
                    card.classList.add('animating');
                    card.style.transform = 'translate(0, 0) scale(1)';
                    card.style.opacity = '1';
                    card.style.zIndex = '1';
                    setTimeout(resolve, 800);
                }, delay);
            });
        });
        
        await Promise.all(cardAnimations);
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