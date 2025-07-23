// Store properties from admin
let properties = [];
let currentModalProperty = null;
let currentModalIndex = 0;

// API Configuration - UPDATE THIS TO YOUR RENDER URL
const API_BASE_URL = 'https://hogar-homes-2.onrender.com';

// Fetch properties from API
async function fetchProperties() {
    try {
        showLoadingState();
        
        // UPDATED: Use Render backend URL instead of localhost
        const response = await fetch(`${API_BASE_URL}/api/properties`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        
        properties = await response.json();
        
        if (properties.length === 0) {
            showEmptyState();
        } else {
            displayProperties(properties);
        }
    } catch (error) {
        console.error("Error loading properties:", error);
        showErrorState();
    }
}

function showLoadingState() {
    document.getElementById('propertyGrid').innerHTML = `
        <div class="no-properties">
            <div class="icon">⏳</div>
            <h3>Loading Properties...</h3>
        </div>
    `;
}

function showEmptyState() {
    document.getElementById('propertyGrid').innerHTML = `
        <div class="no-properties">
            <div class="icon">🏘️</div>
            <h3>No Properties Available</h3>
            <p>Please check back later for our latest listings</p>
        </div>
    `;
}

function showErrorState() {
    document.getElementById('propertyGrid').innerHTML = `
        <div class="no-properties">
            <div class="icon">⚠️</div>
            <h3>Error Loading Properties</h3>
            <p>Please try refreshing the page or contact support</p>
            <button onclick="fetchProperties()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
        </div>
    `;
}

// Display all properties
function displayProperties() {
    const propertyGrid = document.getElementById('propertyGrid');
    
    if (properties.length === 0) {
        showEmptyState();
        return;
    }
    
    propertyGrid.innerHTML = '';
    
    properties.forEach(property => {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'property-card';
        
        // Ensure property has at least one image
        const mainImage = property.images && property.images.length > 0 ? property.images[0] : {
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGN0ZBIi8+CjxwYXRoIGQ9Ik0xMjUgNzVMMTUwIDEwMEwxNzUgNzVMMTg3LjUgODcuNUwxNzUgMTAwTDE1MCA3NUwxMjUgMTAwTDExMi41IDg3LjVMMTI1IDc1WiIgZmlsbD0iIzdGOEM4RCIvPgo8dGV4dCB4PSIxNTAiIHk9IjEzMCIgZmlsbD0iIzdGOEM4RCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4=',
            description: 'No image available'
        };
        
        propertyCard.innerHTML = `
            <div class="property-image-container" onclick="openModal('${property._id}', 0)">
                <img src="${mainImage.thumbnailUrl || mainImage.url}" alt="${mainImage.description}" 
                     class="property-image"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGN0ZBIi8+CjxwYXRoIGQ9Ik0xMjUgNzVMMTUwIDEwMEwxNzUgNzVMMTg3LjUgODcuNUwxNzUgMTAwTDE1MCA3NUwxMjUgMTAwTDExMi41IDg3LjVMMTI1IDc1WiIgZmlsbD0iIzdGOEM4RCIvPgo8dGV4dCB4PSIxNTAiIHk9IjEzMCIgZmlsbD0iIzdGOEM4RCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';">
                ${property.images && property.images.length > 1 ? `<div class="image-counter">1/${property.images.length}</div>` : ''}
            </div>
            <div class="property-info">
                <h3 class="property-title">${property.title || 'No title'}</h3>
                <div class="property-details">
                    <div class="property-price">${property.price || 'Price not available'}</div>
                    <div class="property-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${property.location || 'Location not specified'}
                    </div>
                </div>
                <p class="property-description">${property.description || 'No description available'}</p>
                <div class="property-meta">
                    <span>• ${property.bedrooms ?? 'N/A'} bed${property.bedrooms == 1 ? '' : 's'}</span>
                    <span> • ${property.bathrooms ?? 'N/A'} bath${property.bathrooms == 1 ? '' : 's'}</span>
                    <span>• ${property.squareFeet ?? 'N/A'} sq ft</span>
                </div>
                <a href="property-contact.html?id=${property._id}" class="contact-btn">Contact Agent</a>
            </div>
        `;
        propertyGrid.appendChild(propertyCard);
    });
}

// Modal functions - Updated to match property-contact.html style
function openModal(propertyId, imageIndex) {
    currentModalProperty = properties.find(p => p._id === propertyId);
    if (!currentModalProperty || !currentModalProperty.images || currentModalProperty.images.length === 0) return;
    
    currentModalIndex = imageIndex;
    
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalDescription = document.getElementById('modalDescription');
    const modalIndicators = document.getElementById('modalIndicators');
    
    // Update modal image and description
    modalImage.src = currentModalProperty.images[currentModalIndex].url;
    modalImage.alt = currentModalProperty.images[currentModalIndex].description || 'Property image';
    modalDescription.textContent = currentModalProperty.images[currentModalIndex].description || '';
    
    // Update indicators
    modalIndicators.innerHTML = '';
    if (currentModalProperty.images.length > 1) {
        currentModalProperty.images.forEach((img, index) => {
            const indicator = document.createElement('div');
            indicator.className = `modal-indicator ${index === currentModalIndex ? 'active' : ''}`;
            indicator.onclick = () => changeModalImage(index - currentModalIndex);
            modalIndicators.appendChild(indicator);
        });
    }
    
    // Show/hide navigation buttons based on image count
    const prevBtn = modal.querySelector('.modal-prev');
    const nextBtn = modal.querySelector('.modal-next');
    if (currentModalProperty.images.length > 1) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentModalProperty = null;
}

function changeModalImage(direction) {
    if (!currentModalProperty?.images) return;
    
    let newIndex = currentModalIndex + direction;
    const imagesLength = currentModalProperty.images.length;
    
    if (newIndex < 0) {
        newIndex = imagesLength - 1;
    } else if (newIndex >= imagesLength) {
        newIndex = 0;
    }
    
    currentModalIndex = newIndex;
    
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalDescription = document.getElementById('modalDescription');
    const modalIndicators = document.getElementById('modalIndicators');
    
    // Update image and description
    modalImage.src = currentModalProperty.images[currentModalIndex].url;
    modalImage.alt = currentModalProperty.images[currentModalIndex].description || 'Property image';
    modalDescription.textContent = currentModalProperty.images[currentModalIndex].description || '';
    
    // Update indicators
    modalIndicators.querySelectorAll('.modal-indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentModalIndex);
    });
}

// Keyboard navigation for modal
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('imageModal');
    if (modal.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowLeft') {
            changeModalImage(-1);
        } else if (e.key === 'ArrowRight') {
            changeModalImage(1);
        }
    }
});

// Global functions for onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.changeModalImage = changeModalImage;

// Initialize
document.addEventListener('DOMContentLoaded', fetchProperties);