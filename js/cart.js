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

        // Generar imagen de la pizza personalizada
        const pizzaImage = await this.generatePizzaImage(pizzaData.ingredients);

        const customPizza = {
            id: 'custom-' + Date.now(),
            name: 'Pizza Personalizada',
            description: this.getPizzaDescription(pizzaData.ingredients),
            price: pizzaData.totalPrice,
            ingredients: pizzaData.ingredients,
            quantity: 1,
            isCustom: true,
            image: pizzaImage // Agregar la imagen generada
        };

        return await this.addItem(customPizza);
    }

    // Función para generar imagen de pizza personalizada
    async generatePizzaImage(ingredients) {
        try {
            // Crear un canvas básico para la imagen de pizza personalizada
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 300;

            // Fondo
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Base de pizza
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 100;

            // Masa
            ctx.fillStyle = '#f0c090';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Salsa (si hay ingredientes base)
            const hasSauce = ingredients.some(ing => ing.id && ing.id.includes('salsa'));
            if (hasSauce) {
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 15, 0, Math.PI * 2);
                ctx.fill();
            }

            // Queso (si hay queso)
            const hasCheese = ingredients.some(ing => ing.id && ing.id.includes('queso'));
            if (hasCheese) {
                ctx.fillStyle = '#f8f9fa';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 20, 0, Math.PI * 2);
                ctx.fill();
            }

            // Toppings
            ingredients.forEach(ingredient => {
                if (ingredient.id && !ingredient.id.includes('salsa') && !ingredient.id.includes('queso')) {
                    this.drawTopping(ctx, centerX, centerY, radius - 25, ingredient);
                }
            });

            // Borde
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error generando imagen de pizza:', error);
            return this.generateFallbackImage();
        }
    }

    // Función para dibujar toppings
    drawTopping(ctx, centerX, centerY, radius, ingredient) {
        const colors = {
            'pepperoni': '#e74c3c',
            'jamon': '#f5b7b1', 
            'pollo': '#f9e79f',
            'champinones': '#a569bd',
            'pimiento': '#27ae60',
            'cebolla': '#d7dbdd',
            'aceitunas': '#34495e'
        };

        const color = colors[ingredient.id] || '#cccccc';
        ctx.fillStyle = color;

        // Dibujar múltiples piezas del topping
        const numPieces = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numPieces; i++) {
            const angle = (i / numPieces) * Math.PI * 2 + (Math.random() * 0.3);
            const distance = 20 + Math.random() * (radius - 30);
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const size = 5 + Math.random() * 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Imagen de fallback
    generateFallbackImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 300, 300);
        
        ctx.fillStyle = '#f0c090';
        ctx.beginPath();
        ctx.arc(150, 150, 100, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f8f9fa';
        ctx.beginPath();
        ctx.arc(150, 150, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fada08';
        ctx.font = 'bold 16px Montserrat';
        ctx.textAlign = 'center';
        ctx.fillText('PIZZA PERSONALIZADA', 150, 150);
        
        return canvas.toDataURL('image/png');
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