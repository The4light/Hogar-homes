// Store properties and state
let properties = [];
let currentModalProperty = null;
let currentModalIndex = 0;
let selectedFiles = [];
let imageDescriptions = {};

// API Configuration - UPDATE THIS TO YOUR RENDER URL
const API_BASE_URL = 'https://hogar-homes-2.onrender.com';

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const selectedImages = document.getElementById('selectedImages');
const propertyForm = document.getElementById('propertyForm');
const status = document.getElementById('status');
const propertyGrid = document.getElementById('propertyGrid');
const submitBtn = document.getElementById('submitBtn');

// File selection handlers
fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFileSelect({ target: { files: e.dataTransfer.files } });
});

// Form submission
propertyForm.addEventListener('submit', handlePropertySubmit);

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    
    // Limit to 10 images
    if (selectedFiles.length + files.length > 10) {
        showStatus('❌ Maximum 10 images allowed', 'error');
        return;
    }

    files.forEach((file) => {
        if (file.type.startsWith('image/')) {
            const fileIndex = selectedFiles.length;
            selectedFiles.push(file);
            imageDescriptions[fileIndex] = '';
            displaySelectedImage(file, fileIndex);
        }
    });

    fileInput.value = '';
}

function displaySelectedImage(file, index) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'selected-image';
        imageDiv.innerHTML = `
            <img src="${e.target.result}" alt="${file.name}">
            <div class="info">
                <div class="name">${file.name}</div>
                <div class="size">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <input type="text" class="image-description" 
                       placeholder="Image description (e.g., Living Room)"
                       data-index="${index}"
                       value="${imageDescriptions[index] || ''}"
                       onchange="updateDescription(${index}, this.value)">
            </div>
            <button type="button" class="remove-btn" onclick="removeSelectedImage(${index})">×</button>
        `;
        selectedImages.appendChild(imageDiv);
    };
    reader.readAsDataURL(file);
}

function updateDescription(index, description) {
    imageDescriptions[index] = description;
}

function removeSelectedImage(index) {
    selectedFiles.splice(index, 1);
    delete imageDescriptions[index];
    
    // Reindex descriptions
    const newDescriptions = {};
    selectedFiles.forEach((file, i) => {
        newDescriptions[i] = imageDescriptions[i + (i >= index ? 1 : 0)] || '';
    });
    imageDescriptions = newDescriptions;
    
    refreshSelectedImages();
}

function refreshSelectedImages() {
    selectedImages.innerHTML = '';
    selectedFiles.forEach((file, i) => displaySelectedImage(file, i));
}

async function handlePropertySubmit(e) {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        showStatus('❌ Please select at least one image', 'error');
        return;
    }

    submitBtn.disabled = true;
    showStatus('📤 Uploading images...', 'loading');

    try {
        // Upload all images first
        const uploadedImages = await uploadImages();
        
        if (uploadedImages.length === 0) {
            throw new Error('No images were uploaded successfully');
        }

        showStatus('💾 Saving property...', 'loading');

        // Create property object with uploaded image URLs
        const property = {
            title: document.getElementById('propertyTitle').value,
            price: document.getElementById('propertyPrice').value,
            location: document.getElementById('propertyLocation').value,
            type: document.getElementById('propertyType').value,
            description: document.getElementById('propertyDescription').value,
            bedrooms: document.getElementById('propertyBedrooms').value,
            bathrooms: document.getElementById('propertyBathrooms').value,
            squareFeet: document.getElementById('propertySquareFeet').value,
            // UPDATED: Handle Cloudinary response structure
            images: uploadedImages.map((img, index) => ({
                url: img.url,                    // Cloudinary URL
                publicId: img.publicId,          // For deletion later
                thumbnailUrl: img.thumbnailUrl,  // Auto-generated thumbnail
                description: imageDescriptions[index] || `Image ${index + 1}`
            }))
        };

        // UPDATED: Use Render backend URL
        const response = await fetch(`${API_BASE_URL}/api/properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(property)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save property');
        }

        // Clear form (no change)
        propertyForm.reset();
        selectedFiles = [];
        imageDescriptions = {};
        selectedImages.innerHTML = '';
        
        showStatus('✅ Property uploaded successfully!', 'success');
        fetchProperties();
        
    } catch (error) {
        console.error('Upload failed:', error);
        showStatus(`❌ Upload failed: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

async function uploadImages() {
    const formData = new FormData();
    
    // Add all files to FormData
    selectedFiles.forEach((file) => {
        formData.append('files', file);
    });

    try {
        // UPDATED: Use Render backend URL
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success || !result.files) {
            throw new Error('Invalid response from server');
        }

        return result.files;
        
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
}

function displayProperty(property) {
    const propertyCard = document.createElement('div');
    propertyCard.className = 'property-card';
    propertyCard.setAttribute('data-property-id', property._id);
    
    const mainImage = property.images && property.images.length > 0 ? property.images[0] : null;
    
    propertyCard.innerHTML = `
        <div class="property-image-container" ${mainImage ? `onclick="openModal('${property._id}', 0)"` : ''}>
            ${mainImage ? `
                <img src="${mainImage.thumbnailUrl || mainImage.url}" 
                     alt="${mainImage.description}" 
                     class="property-image"
                     loading="lazy"
                     onerror="this.src='${mainImage.url}'; this.onerror=null;">
                ${property.images.length > 1 ? `<div class="image-counter">1/${property.images.length}</div>` : ''}
            ` : `
                <div class="no-image-placeholder">
                    <span>No Image Available</span>
                </div>
            `}
        </div>
        <div class="property-info">
            <div class="property-title">${property.title}</div>
            <div class="property-details">
                <div class="property-price">${property.price}</div>
                <div class="property-location">📍 ${property.location}</div>
            </div>
            <div class="property-description">${property.description}</div>
            <div class="property-meta">
                <span>🛏️ ${property.bedrooms || 'N/A'} bed${property.bedrooms != 1 ? 's' : ''}</span>
                <span>🚿 ${property.bathrooms || 'N/A'} bath${property.bathrooms != 1 ? 's' : ''}</span>
                <span>📐 ${property.squareFeet || 'N/A'} sq ft</span>
            </div>
            <div class="property-actions">
                <button class="btn-small btn-edit" onclick="editProperty('${property._id}')">✏️ Edit</button>
                <button class="btn-small btn-delete" onclick="deleteProperty('${property._id}')">🗑️ Delete</button>
            </div>
        </div>
    `;

    propertyGrid.appendChild(propertyCard);
}

function editProperty(id) {
    const property = properties.find(p => p._id === id);
    if (!property) return;

    document.getElementById('propertyTitle').value = property.title;
    document.getElementById('propertyPrice').value = property.price;
    document.getElementById('propertyLocation').value = property.location;
    document.getElementById('propertyType').value = property.type;
    document.getElementById('propertyDescription').value = property.description;
    document.getElementById('propertyBedrooms').value = property.bedrooms || '';
    document.getElementById('propertyBathrooms').value = property.bathrooms || '';
    document.getElementById('propertySquareFeet').value = property.squareFeet || '';

    selectedFiles = [];
    imageDescriptions = {};
    selectedImages.innerHTML = '';

    showStatus('✏️ Edit mode - images need to be re-uploaded', 'loading');
    document.querySelector('.sidebar').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProperty(id) {
    if (confirm('Are you sure you want to delete this property?')) {
        try {
            // UPDATED: Use Render backend URL
            const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete property');
            }
            
            showStatus('🗑️ Property deleted successfully', 'success');
            fetchProperties();
        } catch (error) {
            console.error('Delete failed:', error);
            showStatus(`❌ Failed to delete property: ${error.message}`, 'error');
        }
    }
}

function refreshPropertyGrid() {
    propertyGrid.innerHTML = '';
    if (properties.length === 0) {
        propertyGrid.innerHTML = `
            <div class="no-properties">
                <div class="icon">🏘️</div>
                <h3>No Properties Yet</h3>
                <p>Upload your first property using the form on the left</p>
            </div>
        `;
    } else {
        properties.forEach(property => displayProperty(property));
    }
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

// Modal functions
function openModal(propertyId, imageIndex) {
    currentModalProperty = properties.find(p => p._id === propertyId);
    if (!currentModalProperty || !currentModalProperty.images || currentModalProperty.images.length === 0) return;
    
    currentModalIndex = imageIndex;
    
    const modal = document.createElement('div');
    modal.className = 'property-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <div class="modal-image-container">
                <img src="${currentModalProperty.images[currentModalIndex].url}" 
                     alt="${currentModalProperty.images[currentModalIndex].description}">
                <div class="modal-image-info">
                    <span class="image-counter">${currentModalIndex + 1}/${currentModalProperty.images.length}</span>
                    <p>${currentModalProperty.images[currentModalIndex].description}</p>
                </div>
            </div>
            ${currentModalProperty.images.length > 1 ? `
                <button class="modal-nav prev" onclick="navigateModal(-1)">❮</button>
                <button class="modal-nav next" onclick="navigateModal(1)">❯</button>
                <div class="modal-thumbnails">
                    ${currentModalProperty.images.map((img, idx) => `
                        <img src="${img.url}" 
                             class="${idx === currentModalIndex ? 'active' : ''}"
                             onclick="jumpToModalImage(${idx})">
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.querySelector('.property-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    }
    currentModalProperty = null;
}

function navigateModal(direction) {
    if (!currentModalProperty) return;
    
    currentModalIndex += direction;
    
    if (currentModalIndex < 0) {
        currentModalIndex = currentModalProperty.images.length - 1;
    } else if (currentModalIndex >= currentModalProperty.images.length) {
        currentModalIndex = 0;
    }
    
    const modal = document.querySelector('.property-modal');
    if (modal) {
        const currentImage = currentModalProperty.images[currentModalIndex];
        modal.querySelector('.modal-image-container img').src = currentImage.url;
        modal.querySelector('.modal-image-container img').alt = currentImage.description;
        modal.querySelector('.image-counter').textContent = 
            `${currentModalIndex + 1}/${currentModalProperty.images.length}`;
        modal.querySelector('.modal-image-info p').textContent = currentImage.description;
            
        modal.querySelectorAll('.modal-thumbnails img').forEach((img, idx) => {
            img.classList.toggle('active', idx === currentModalIndex);
        });
    }
}

function preloadImages(property) {
    // Preload next few images for better user experience
    if (property.images && property.images.length > 1) {
        property.images.slice(0, 3).forEach(img => {
            const image = new Image();
            image.src = img.thumbnailUrl || img.url;
        });
    }
}

function jumpToModalImage(index) {
    if (!currentModalProperty || index < 0 || index >= currentModalProperty.images.length) return;
    
    currentModalIndex = index;
    navigateModal(0);
}

async function fetchProperties() {
    try {
        showLoadingState();
        
        // UPDATED: Use Render backend URL
        const response = await fetch(`${API_BASE_URL}/api/properties`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        
        properties = await response.json();
        refreshPropertyGrid();
        
    } catch (error) {
        console.error("Error loading properties:", error);
        showErrorState();
    }
}

function showLoadingState() {
    propertyGrid.innerHTML = `
        <div class="no-properties">
            <div class="icon">⏳</div>
            <h3>Loading Properties...</h3>
        </div>
    `;
}

function showErrorState() {
    propertyGrid.innerHTML = `
        <div class="no-properties">
            <div class="icon">⚠️</div>
            <h3>Error Loading Properties</h3>
            <p>Please try refreshing the page</p>
        </div>
    `;
}

// Keyboard navigation for modal
document.addEventListener('keydown', (e) => {
    if (currentModalProperty) {
        if (e.key === 'Escape') {   
            closeModal();
        } else if (e.key === 'ArrowLeft') {
            navigateModal(-1);
        } else if (e.key === 'ArrowRight') {
            navigateModal(1);
        }
    }
});

//darkmode
const toggleBtn = document.getElementById('darkModeToggle');
const body = document.body;

toggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    toggleBtn.textContent = body.classList.contains('light-mode') ? '🌞' : '🌙';
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchProperties();
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

// Global functions
window.updateDescription = updateDescription;
window.removeSelectedImage = removeSelectedImage;
window.editProperty = editProperty;
window.deleteProperty = deleteProperty;
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateModal = navigateModal;
window.jumpToModalImage = jumpToModalImage;