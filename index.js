// API Configuration - UPDATE THIS TO YOUR RENDER URL
const API_BASE_URL = 'https://hogar-homes-2.onrender.com';

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(35, 37, 38, 0.98)';
    } else {
        header.style.background = 'rgba(35, 37, 38, 0.95)';
    }
});

// Dark mode toggle
let isDarkMode = false;
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    const toggle = document.querySelector('.dark-mode-toggle');
    
    if (isDarkMode) {
        document.body.style.filter = 'invert(1) hue-rotate(180deg)';
        document.querySelectorAll('img, video, svg').forEach(el => {
            el.style.filter = 'invert(1) hue-rotate(180deg)';
        });
        toggle.textContent = '🌞';
    } else {
        document.body.style.filter = 'none';
        document.querySelectorAll('img, video, svg').forEach(el => {
            el.style.filter = 'none';
        });
        toggle.textContent = '🌙';
    }
}

// Add some interactive hover effects
document.querySelectorAll('.feature-card, .type-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Fetch and display 3 featured properties
async function loadFeaturedProperties() {
    try {
        // UPDATED: Use Render backend URL
        const res = await fetch(`${API_BASE_URL}/api/properties`);
        
        if (!res.ok) {
            throw new Error('Failed to fetch properties');
        }
        
        const properties = await res.json();
        const featured = properties.slice(0, 3); // Take first 3

        const grid = document.getElementById('featuredPropertyGrid');
        grid.innerHTML = '';

        if (featured.length === 0) {
            grid.innerHTML = '<p style="color:#7f8c8d;">No properties available yet.</p>';
            return;
        }

        featured.forEach(property => {
            const mainImage = property.images && property.images.length > 0
                ? (property.images[0].thumbnailUrl || property.images[0].url)
                : 'https://via.placeholder.com/400x220?text=No+Image';

            const card = document.createElement('div');
            card.className = 'property-card';
            card.innerHTML = `
                <div class="property-image-container">
                    <img src="${mainImage}" 
                         alt="${property.title}" 
                         class="property-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x220?text=No+Image'">
                </div>
                <div class="property-info">
                    <div class="property-title">${property.title || 'No title'}</div>
                    <div class="property-price">${property.price || 'Price not available'}</div>
                    <div class="property-details">${property.location || 'Location not specified'}</div>
                    <div class="property-meta">
                        <span>${property.bedrooms ?? 'N/A'} bed${property.bedrooms == 1 ? '' : 's'}</span>
                        <span> ${property.bathrooms ?? 'N/A'} bath${property.bathrooms == 1 ? '' : 's'}</span>
                        <span>${property.squareFeet ?? 'N/A'} sq ft</span>
                    </div>
                    <a href="property-contact.html?id=${property._id}" class="view-details-btn">View Details</a>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading featured properties:', err);
        const grid = document.getElementById('featuredPropertyGrid');
        grid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <p>Failed to load featured properties.</p>
                <p style="font-size: 0.9em; color: #7f8c8d;">Please check your internet connection and try again.</p>
            </div>
        `;
    }
}

// Initialize featured properties when DOM is loaded
document.addEventListener('DOMContentLoaded', loadFeaturedProperties);

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});