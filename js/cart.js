// js/cart.js - Versión mejorada y unificada con generación de imágenes
class CartManager {
    constructor() {
        this.cartKey = 'cartItems'; // Mantenemos la misma key para compatibilidad
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartUI();
        
        // Configurar carrito overlay si existe
        this.setupCartOverlay();
    }

    setupEventListeners() {
        // Configurar botones "Add to Cart" de forma delegada
        document.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('.add-to-cart');
            if (addToCartBtn) {
                this.handleAddToCart(addToCartBtn);
            }
            
            // Manejar botones de cantidad en el carrito
            const quantityBtn = e.target.closest('.quantity-btn');
            if (quantityBtn) {
                this.handleQuantityChange(quantityBtn);
            }
            
            // Manejar botones de eliminar
            const removeBtn = e.target.closest('.remove-item');
            if (removeBtn) {
                this.handleRemoveItem(removeBtn);
            }
        });

        // Configurar checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }
    }

    setupCartOverlay() {
        const cartButton = document.getElementById('cart-button');
        const closeCart = document.getElementById('close-cart');
        const cartOverlay = document.getElementById('cart-overlay');

        if (cartButton) {
            cartButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCart();
            });
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => this.hideCart());
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', (e) => {
                if (e.target === cartOverlay) {
                    this.hideCart();
                }
            });
        }
    }

    async handleAddToCart(button) {
        // Verificar autenticación
        if (!this.checkAuth()) {
            this.showLoginModal();
            return;
        }

        const id = button.dataset.id;
        const name = button.dataset.name;
        const price = parseFloat(button.dataset.price);
        const description = button.dataset.description || '';

        try {
            await this.addItem({
                id,
                name,
                price,
                description,
                quantity: 1
            });

            this.showAddToCartEffect(button);
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showMessage('Error al agregar al carrito', 'error');
        }
    }

    // Para pizzas personalizadas desde crear-pizza.js
    async addCustomPizza(pizzaData) {
        if (!this.checkAuth()) {
            this.showLoginModal();
            return false;
        }

        try {
            console.log('🍕 Creando pizza personalizada:', pizzaData);
            
            // Generar imagen de la pizza personalizada
            const pizzaImage = await this.generatePizzaImage(pizzaData.ingredients);
            console.log('🖼️ Imagen generada para pizza personalizada');

            const customPizza = {
                id: 'custom-' + Date.now(),
                name: 'Pizza Personalizada',
                description: this.getPizzaDescription(pizzaData.ingredients),
                price: pizzaData.totalPrice,
                ingredients: pizzaData.ingredients,
                quantity: 1,
                isCustom: true,
                image: pizzaImage
            };

            console.log('✅ Pizza personalizada creada:', customPizza);
            return await this.addItem(customPizza);
            
        } catch (error) {
            console.error('❌ Error creando pizza personalizada:', error);
            this.showMessage('Error al crear la pizza personalizada', 'error');
            return false;
        }
    }

    // Función para generar imagen de pizza personalizada
    async generatePizzaImage(ingredients) {
        try {
            console.log('🎨 Generando imagen para pizza personalizada con ingredientes:', ingredients);
            
            // Crear un canvas para la imagen de pizza personalizada
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 300;

            // Fondo oscuro elegante
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Base de pizza (masa) - centro
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 120;

            // Masa de pizza (dorada con gradiente)
            const doughGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            doughGradient.addColorStop(0, '#f8d7a4');
            doughGradient.addColorStop(1, '#e0b080');
            
            ctx.fillStyle = doughGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Borde de la masa crujiente
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Salsa de tomate (si hay ingredientes base)
            const hasSauce = ingredients.some(ing => 
                ing.name && ing.name.toLowerCase().includes('salsa')
            );
            if (hasSauce || ingredients.length > 0) {
                const sauceGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius - 15);
                sauceGradient.addColorStop(0, '#e74c3c');
                sauceGradient.addColorStop(1, '#c0392b');
                
                ctx.fillStyle = sauceGradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 15, 0, Math.PI * 2);
                ctx.fill();
            }

            // Queso (si hay queso o siempre para que se vea bien)
            const hasCheese = ingredients.some(ing => 
                ing.name && ing.name.toLowerCase().includes('queso')
            );
            if (hasCheese || ingredients.length > 0) {
                ctx.fillStyle = 'rgba(255, 255, 240, 0.7)';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 20, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dibujar toppings basados en los ingredientes reales
            this.drawPizzaToppings(ctx, centerX, centerY, radius - 25, ingredients);

            // Texto "Personalizada"
            ctx.fillStyle = '#fada08';
            ctx.font = 'bold 18px "Montserrat", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Sombra para el texto
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText('PIZZA PERSONALIZADA', centerX, centerY + radius + 30);

            // Resetear sombra
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            console.log('✅ Imagen de pizza generada exitosamente');
            return canvas.toDataURL('image/png');
            
        } catch (error) {
            console.error('❌ Error generando imagen de pizza:', error);
            return this.generateFallbackImage();
        }
    }

    // Función mejorada para dibujar toppings realistas
    drawPizzaToppings(ctx, centerX, centerY, radius, ingredients) {
        const toppingConfigs = {
            'pepperoni': { 
                color: '#e74c3c', 
                highlight: '#ff6b6b',
                size: 12, 
                count: 10,
                shape: 'circle'
            },
            'jamon': { 
                color: '#f5b7b1', 
                highlight: '#fff',
                size: 14, 
                count: 8,
                shape: 'rectangle'
            },
            'pollo': { 
                color: '#f9e79f', 
                highlight: '#fffde7',
                size: 11, 
                count: 9,
                shape: 'circle'
            },
            'champinones': { 
                color: '#a569bd', 
                highlight: '#d7bde2',
                size: 9, 
                count: 12,
                shape: 'circle'
            },
            'pimiento': { 
                color: '#27ae60', 
                highlight: '#2ecc71',
                size: 8, 
                count: 15,
                shape: 'rectangle'
            },
            'cebolla': { 
                color: '#d7dbdd', 
                highlight: '#fff',
                size: 7, 
                count: 18,
                shape: 'circle'
            },
            'aceitunas': { 
                color: '#34495e', 
                highlight: '#5d6d7e',
                size: 6, 
                count: 20,
                shape: 'circle'
            },
            'salsa': { 
                color: '#c0392b', 
                highlight: '#e74c3c',
                size: 0, 
                count: 0,
                shape: 'base'
            },
            'queso': { 
                color: '#fffde7', 
                highlight: '#fff',
                size: 0, 
                count: 0,
                shape: 'base'
            }
        };

        // Dibujar cada tipo de ingrediente
        ingredients.forEach(ingredient => {
            const ingName = ingredient.name ? ingredient.name.toLowerCase().replace(/\s+/g, '') : '';
            const config = toppingConfigs[ingName];
            
            if (config && config.count > 0) {
                console.log(`🍕 Dibujando topping: ${ingName}`);
                
                // Dibujar múltiples piezas del topping
                for (let i = 0; i < config.count; i++) {
                    const angle = (i / config.count) * Math.PI * 2 + (Math.random() * 0.3);
                    const distance = 25 + Math.random() * (radius - 35);
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    
                    // Variar ligeramente el tamaño
                    const size = config.size * (0.8 + Math.random() * 0.4);
                    
                    if (config.shape === 'circle') {
                        // Topping circular (pepperoni, champiñones, etc.)
                        const toppingGradient = ctx.createRadialGradient(
                            x - size/3, y - size/3, 0, 
                            x, y, size
                        );
                        toppingGradient.addColorStop(0, config.highlight);
                        toppingGradient.addColorStop(1, config.color);
                        
                        ctx.fillStyle = toppingGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Detalles para pepperoni
                        if (ingName === 'pepperoni') {
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                            ctx.beginPath();
                            ctx.arc(x - size/3, y - size/3, size/4, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        
                    } else if (config.shape === 'rectangle') {
                        // Topping rectangular (jamón, pimiento, etc.)
                        const width = size * 1.5;
                        const height = size * 0.8;
                        const rotation = Math.random() * Math.PI;
                        
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(rotation);
                        
                        ctx.fillStyle = config.color;
                        ctx.fillRect(-width/2, -height/2, width, height);
                        
                        // Highlight
                        ctx.fillStyle = config.highlight;
                        ctx.fillRect(-width/2, -height/2, width, height/3);
                        
                        ctx.restore();
                    }
                }
            }
        });

        // Si no hay ingredientes específicos, agregar algunos genéricos
        if (ingredients.length === 0) {
            this.drawGenericToppings(ctx, centerX, centerY, radius);
        }
    }

    // Toppings genéricos para cuando no hay ingredientes específicos
    drawGenericToppings(ctx, centerX, centerY, radius) {
        const genericToppings = [
            { x: 120, y: 120, color: '#e74c3c', size: 12 }, // pepperoni
            { x: 180, y: 130, color: '#f5b7b1', size: 14 }, // jamón
            { x: 140, y: 180, color: '#f9e79f', size: 11 }, // pollo
            { x: 160, y: 110, color: '#a569bd', size: 9 },  // champiñones
            { x: 100, y: 160, color: '#27ae60', size: 8 },  // pimiento
            { x: 130, y: 140, color: '#d7dbdd', size: 7 },  // cebolla
            { x: 170, y: 160, color: '#34495e', size: 6 }   // aceitunas
        ];

        genericToppings.forEach(topping => {
            const gradient = ctx.createRadialGradient(
                topping.x - topping.size/3, topping.y - topping.size/3, 0,
                topping.x, topping.y, topping.size
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, topping.color);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(topping.x, topping.y, topping.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Imagen de fallback mejorada
    generateFallbackImage() {
        console.log('🔄 Usando imagen de fallback para pizza personalizada');
        return 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#1a1a1a"/>
                        <stop offset="100%" stop-color="#2a2a2a"/>
                    </linearGradient>
                    <radialGradient id="doughGradient" cx="30%" cy="30%">
                        <stop offset="0%" stop-color="#f8d7a4"/>
                        <stop offset="100%" stop-color="#e0b080"/>
                    </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bgGradient)"/>
                <circle cx="150" cy="150" r="120" fill="url(#doughGradient)" stroke="#d4a574" stroke-width="8"/>
                <circle cx="150" cy="150" r="105" fill="#c0392b" opacity="0.9"/>
                <circle cx="150" cy="150" r="95" fill="#fffde7" opacity="0.8"/>
                <!-- Toppings variados -->
                <circle cx="120" cy="120" r="12" fill="#e74c3c"/>
                <circle cx="180" cy="130" r="10" fill="#f5b7b1"/>
                <circle cx="140" cy="180" r="11" fill="#f9e79f"/>
                <circle cx="160" cy="110" r="8" fill="#a569bd"/>
                <circle cx="100" cy="160" r="9" fill="#27ae60"/>
                <circle cx="130" cy="140" r="7" fill="#d7dbdd"/>
                <circle cx="170" cy="160" r="6" fill="#34495e"/>
                <!-- Texto destacado -->
                <text x="150" y="280" text-anchor="middle" font-family="Montserrat" font-size="16" font-weight="bold" fill="#fada08">
                    PIZZA PERSONALIZADA
                </text>
            </svg>
        `);
    }

    getPizzaDescription(ingredients) {
        if (!ingredients || ingredients.length === 0) {
            return 'Pizza personalizada';
        }
        
        const ingredientNames = ingredients.map(ing => {
            if (typeof ing === 'string') return ing;
            return ing.displayName || ing.name || ing.id || 'Ingrediente';
        });
        
        return 'Ingredientes: ' + ingredientNames.join(', ');
    }

    async addItem(product) {
        let cart = this.getCart();
        
        // Verificar si el producto ya está en el carrito
        const existingIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingIndex >= 0) {
            // Incrementar cantidad si ya existe
            cart[existingIndex].quantity += product.quantity || 1;
        } else {
            // Agregar nuevo item al carrito
            cart.push({
                ...product,
                quantity: product.quantity || 1
            });
        }
        
        // Guardar en localStorage
        this.saveCart(cart);
        
        // Actualizar UI
        this.updateCartUI();
        
        return true;
    }

    handleQuantityChange(button) {
        const index = parseInt(button.dataset.index);
        const action = button.dataset.action;
        
        let cart = this.getCart();
        
        if (action === 'increase') {
            cart[index].quantity += 1;
        } else if (action === 'decrease' && cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        }
        
        this.saveCart(cart);
        this.updateCartUI();
    }

    handleRemoveItem(button) {
        const index = parseInt(button.dataset.index);
        let cart = this.getCart();
        
        cart.splice(index, 1);
        this.saveCart(cart);
        this.updateCartUI();
    }

    removeItem(itemId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== itemId);
        this.saveCart(cart);
        this.updateCartUI();
    }

    updateQuantity(itemId, change) {
        let cart = this.getCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
            const newQuantity = cart[itemIndex].quantity + change;
            
            if (newQuantity <= 0) {
                this.removeItem(itemId);
            } else {
                cart[itemIndex].quantity = newQuantity;
                this.saveCart(cart);
            }
            
            this.updateCartUI();
        }
    }

    getCart() {
        return JSON.parse(localStorage.getItem(this.cartKey)) || [];
    }

    saveCart(cart) {
        localStorage.setItem(this.cartKey, JSON.stringify(cart));
    }

    clearCart() {
        localStorage.removeItem(this.cartKey);
        this.updateCartUI();
    }

    getCartTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartCount() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartUI() {
        this.updateCartCount();
        this.renderCartItems();
    }

    updateCartCount() {
        const count = this.getCartCount();
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            element.textContent = count;
        });

        // Mostrar/ocultar el ícono del carrito en nav
        const cartNavItem = document.getElementById('cart-nav-item');
        if (cartNavItem) {
            cartNavItem.style.display = count > 0 ? 'block' : 'none';
        }
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;

        const cart = this.getCart();

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
            
            // Actualizar total a 0
            const cartTotalElement = document.getElementById('cart-total-price');
            if (cartTotalElement) {
                cartTotalElement.textContent = '$0';
            }
            
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = '';
        
        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            
            // Determinar si es pizza personalizada
            const isCustomPizza = item.isCustom || item.id.includes('custom');
            
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>
                        ${item.name}
                        ${isCustomPizza ? '<span style="color: #ff6b6b; font-size: 0.8em; margin-left: 0.5em;">(Personalizada)</span>' : ''}
                    </h4>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                    ${isCustomPizza && item.ingredients ? `
                        <div style="margin-top: 0.5rem;">
                            <small style="color: #fada08;">Ingredientes: ${this.formatIngredients(item.ingredients)}</small>
                        </div>
                    ` : ''}
                    <p class="item-price">$${item.price.toLocaleString()} c/u</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
                    <button class="remove-item" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItemElement);
        });

        // Actualizar total
        const cartTotalElement = document.getElementById('cart-total-price');
        if (cartTotalElement) {
            cartTotalElement.textContent = `$${total.toLocaleString()}`;
        }
    }

    // Función auxiliar para formatear ingredientes
    formatIngredients(ingredients) {
        if (!ingredients || !Array.isArray(ingredients)) {
            return '';
        }
        
        const ingredientNames = ingredients.slice(0, 3).map(ing => {
            if (typeof ing === 'string') return ing;
            return ing.displayName || ing.name || ing.id || 'Ingrediente';
        });
        
        let result = ingredientNames.join(', ');
        
        if (ingredients.length > 3) {
            result += ` y ${ingredients.length - 3} más`;
        }
        
        return result;
    }

    showCart() {
        const cartOverlay = document.getElementById('cart-overlay');
        if (cartOverlay) {
            this.renderCartItems();
            cartOverlay.style.display = 'flex';
            document.body.classList.add('modal-hidden');
        }
    }

    hideCart() {
        const cartOverlay = document.getElementById('cart-overlay');
        if (cartOverlay) {
            cartOverlay.style.display = 'none';
            document.body.classList.remove('modal-hidden');
        }
    }

    async handleCheckout() {
        const cart = this.getCart();
        
        if (cart.length === 0) {
            this.showMessage('Tu carrito está vacío', 'info');
            return;
        }

        // Redirigir a la página del carrito para completar el pedido
        window.location.href = 'carrito.html';
    }

    showAddToCartEffect(button) {
        const originalText = button.textContent;
        button.textContent = '¡Agregado! ✓';
        button.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
    }

    checkAuth() {
        const user = localStorage.getItem('pizzeriaUser');
        return user !== null;
    }

    showLoginModal() {
        // Usar tu modal existente o crear uno básico
        if (typeof showModal === 'function') {
            showModal(
                'Iniciar Sesión Requerido', 
                'Por favor inicia sesión para agregar productos al carrito', 
                'info'
            );
            
            // Redirigir después de un tiempo
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            // Fallback básico
            if (confirm('Debes iniciar sesión para agregar productos al carrito. ¿Quieres ir a la página de login?')) {
                window.location.href = 'login.html';
            }
        }
    }

    showMessage(message, type = 'info') {
        // Usar tu función showModal existente
        if (typeof showModal === 'function') {
            showModal(
                type === 'error' ? 'Error' : 
                type === 'success' ? 'Éxito' : 'Información', 
                message, 
                type
            );
        } else {
            // Fallback básico
            alert(message);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.cartManager = new CartManager();
    
    // Para compatibilidad con código existente
    window.addToCart = (product) => cartManager.addItem(product);
    window.removeFromCart = (id) => cartManager.removeItem(id);
    window.updateCartCount = () => cartManager.updateCartCount();
    window.addCustomPizza = (pizzaData) => cartManager.addCustomPizza(pizzaData);
    
    console.log('🛒 Cart Manager inicializado con generación de imágenes');
});

// Función global para ser llamada desde crear-pizza.js
window.addCustomPizzaToCart = async function(pizzaData) {
    if (window.cartManager) {
        return await window.cartManager.addCustomPizza(pizzaData);
    } else {
        console.error('cartManager no está disponible');
        return false;
    }
};