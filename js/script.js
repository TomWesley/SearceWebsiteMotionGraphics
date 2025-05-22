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
    
    transformToTwoColumn() {
        this.isTransformed = true;
        
        // Completely hide grid
        this.cardsGrid.classList.add('hidden');
        
        // Show two-column layout
        this.twoColumnLayout.classList.add('active');
    }
    
    transformToGrid() {
        this.isTransformed = false;
        
        // Hide two-column layout
        this.twoColumnLayout.classList.remove('active');
        
        // Show grid
        this.cardsGrid.classList.remove('hidden');
        
        // Reset to first card when returning to grid
        this.switchToCard(0);
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

// Debug helper (remove in production)
if (false) { // Set to true for debugging
    window.addEventListener('scroll', () => {
        console.log('Scroll Y:', window.scrollY);
        console.log('Transform Trigger:', window.animatedCards?.transformTrigger);
        console.log('Is Transformed:', window.animatedCards?.isTransformed);
    });
}