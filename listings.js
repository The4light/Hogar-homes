// Load properties from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const properties = JSON.parse(localStorage.getItem('properties')) || [];
    const propertyGrid = document.getElementById('propertyGrid');

    if (properties.length === 0) {
        propertyGrid.innerHTML = `
            <div class="no-properties">
                <div class="icon">🏘️</div>
                <h3>No Properties Available</h3>
                <p>Please check back later</p>
            </div>
        `;
        return;
    }

    propertyGrid.innerHTML = '';
    properties.forEach(property => {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'property-card';
        propertyCard.innerHTML = `
            <div class="property-image-container">
                <img src="${property.images[0].url}" alt="${property.images[0].description}" 
                     class="property-image" onerror="handleImageError(this)">
                <div class="image-counter">${property.images.length} photos</div>
            </div>
            <div class="property-info">
                <div class="property-title">${property.title}</div>
                <div class="property-details">
                    <div class="property-price">${property.price}</div>
                    <div class="property-location">📍 ${property.location}</div>
                </div>
                <div class="property-actions">
                    <a href="property-details.html?id=${property.id}" class="btn-small btn-view">👀 View Details</a>
                </div>
            </div>
        `;
        propertyGrid.appendChild(propertyCard);
    });
});

function handleImageError(img, property) {
    // Fallback to original URL if thumbnail fails
    if (img.src.includes('thumbnail') && property.url) {
        img.src = property.url;
    } else {
        // Show placeholder if all fails
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGN0ZBIi8+CjxwYXRoIGQ9Ik0xMjUgNzVMMTUwIDEwMEwxNzUgNzVMMTg3LjUgODcuNUwxNzUgMTAwTDE1MCA3NUwxMjUgMTAwTDExMi41IDg3LjVMMTI1IDc1WiIgZmlsbD0iIzdGOEM4RCIvPgo8dGV4dCB4PSIxNTAiIHk9IjEzMCIgZmlsbD0iIzdGOEM4RCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
    }
}