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
        
        // Step 1: Prepare the two-column layout
        this.twoColumnLayout.classList.add('preparing');
        await this.waitForNextFrame();
        
        const leftColumn = this.twoColumnLayout.querySelector('.left-column');
        const rightColumn = this.twoColumnLayout.querySelector('.right-column');
        
        // Position columns at screen center
        const columnTop = (window.innerHeight / 2) - 215;
        leftColumn.style.top = `${columnTop}px`;
        rightColumn.style.top = `${columnTop}px`;
        
        // Step 2: Start animating cards
        this.cardsGrid.classList.add('animating');
        
        // Step 3: Move each card from its current position to target with slight offsets
        this.cards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const startX = cardRect.left + cardRect.width / 2;
            const startY = cardRect.top + cardRect.height / 2;
            
            // Target: exactly 25% width, 50% height of screen
            const targetX = window.innerWidth * 0.25;
            const targetY = window.innerHeight * 0.5;
            
            // Add slight offset so we can see all cards during animation
            const offsetX = (index % 4 - 1.5) * 5; // Small horizontal spread
            const offsetY = (Math.floor(index / 4) - 0.5) * 5; // Small vertical spread
            
            const deltaX = targetX + offsetX - startX;
            const deltaY = targetY + offsetY - startY;
            
            // Calculate correct scale: final card stack is 430px, original cards are 200px
            const targetScale = 430 / 200; // 2.15x scale
            
            // Apply the transformation immediately
            card.classList.add('animating');
            card.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${targetScale})`;
            card.style.opacity = '0.8'; // Make slightly transparent so we can see overlap
            card.style.zIndex = 1000 + index; // Different z-index for each card
        });
        
        // Step 4: Wait for animation to complete (much slower)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 5: Show two-column layout
        this.cardsGrid.classList.add('hidden');
        await this.waitForNextFrame();
        this.twoColumnLayout.classList.remove('preparing');
        this.twoColumnLayout.classList.add('active');
        
        // Step 6: Reset
        this.resetCardPositions();
        this.isAnimating = false;
    }
    
    async transformToGrid() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.isTransformed = false;
        
        // Step 1: Hide two-column layout
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
        
        // Step 4: Wait for animation (same slow speed)
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