class PizzaCreator {
    constructor() {
        this.basePrice = 15000;
        this.selectedIngredients = [];
        this.totalPrice = this.basePrice;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Ingredientes
        document.querySelectorAll('.ingredient-item').forEach(item => {
            item.addEventListener('click', (e) => this.addIngredient(e));
        });
        
        // Botones de control
        document.getElementById('reset-pizza').addEventListener('click', () => this.resetPizza());
        document.getElementById('add-to-cart').addEventListener('click', () => this.addToCart());
        
        // Verificar autenticación
        this.checkAuth();
    }
    
    addIngredient(event) {
        const ingredientItem = event.currentTarget;
        const ingredient = ingredientItem.dataset.ingredient;
        const price = parseInt(ingredientItem.dataset.price);
        
        // Verificar si el ingrediente ya fue añadido
        if (this.selectedIngredients.find(item => item.name === ingredient)) {
            this.showMessage('Este ingrediente ya fue añadido', 'info');
            return;
        }
        
        // Añadir ingrediente
        this.selectedIngredients.push({
            name: ingredient,
            price: price,
            displayName: ingredientItem.querySelector('span:first-of-type').textContent
        });
        
        // Actualizar precio
        this.totalPrice += price;
        
        // Actualizar UI
        this.updateUI();
        
        // Efecto visual
        ingredientItem.style.animation = 'pulse 0.5s';
        setTimeout(() => {
            ingredientItem.style.animation = '';
        }, 500);
    }
    
    removeIngredient(ingredientName) {
        const ingredientIndex = this.selectedIngredients.findIndex(item => item.name === ingredientName);
        
        if (ingredientIndex !== -1) {
            // Restar precio
            this.totalPrice -= this.selectedIngredients[ingredientIndex].price;
            
            // Remover ingrediente
            this.selectedIngredients.splice(ingredientIndex, 1);
            
            // Actualizar UI
            this.updateUI();
        }
    }
    
    resetPizza() {
        this.selectedIngredients = [];
        this.totalPrice = this.basePrice;
        this.updateUI();
        this.showMessage('Pizza reiniciada', 'success');
    }
    
    updateUI() {
        // Actualizar precio total
        document.getElementById('pizza-total').textContent = `$${this.totalPrice.toLocaleString()}`;
        
        // Actualizar botón de carrito
        const addButton = document.getElementById('add-to-cart');
        addButton.textContent = `Añadir al Carrito - $${this.totalPrice.toLocaleString()}`;
        addButton.disabled = this.selectedIngredients.length === 0;
        
        // Actualizar lista de ingredientes seleccionados
        this.updateSelectedList();
        
        // Actualizar visualización de la pizza
        this.updatePizzaVisual();
    }
    
    updateSelectedList() {
        const selectedList = document.getElementById('selected-list');
        
        if (this.selectedIngredients.length === 0) {
            selectedList.innerHTML = '<p class="empty-selection">Aún no has seleccionado ingredientes</p>';
            return;
        }
        
        selectedList.innerHTML = this.selectedIngredients.map(ingredient => `
            <div class="selected-ingredient">
                <span>${ingredient.displayName}</span>
                <span class="ingredient-price">+$${ingredient.price.toLocaleString()}</span>
            </div>
        `).join('');
    }
    
    updatePizzaVisual() {
        const pizzaBase = document.getElementById('pizza-base');
        
        // Limpiar ingredientes anteriores
        const existingLayers = pizzaBase.querySelectorAll('.ingredient-layer');
        existingLayers.forEach(layer => layer.remove());
        
        // Añadir capas de ingredientes
        // Añadir capas de ingredientes con clasificación por tipo
    this.selectedIngredients.forEach(ingredient => {
        const layer = document.createElement('div');
        layer.className = 'ingredient-layer';
        
        // Determinar el tipo de ingrediente para ajustes específicos
        let ingredientType = 'vegetal';
        if (ingredient.name.includes('salsa')) ingredientType = 'salsa';
        if (ingredient.name.includes('queso')) ingredientType = 'queso';
        if (['pepperoni', 'jamon', 'pollo'].includes(ingredient.name)) ingredientType = 'proteina';
        
        layer.setAttribute('data-type', ingredientType);
        layer.setAttribute('data-ingredient', ingredient.name);
        
        layer.innerHTML = `<img src="img/ingredientes/${ingredient.name}.png" alt="${ingredient.displayName}">`;
        pizzaBase.appendChild(layer);
    });
    }
    
    async addToCart() {
        // Verificar autenticación
        const user = localStorage.getItem('pizzeriaUser');
        if (!user) {
            this.showLoginModal();
            return;
        }
        
        try {
            // Crear objeto de pizza personalizada
            const customPizza = {
                id: 'custom-' + Date.now(),
                name: 'Pizza Personalizada',
                price: this.totalPrice,
                ingredients: this.selectedIngredients,
                image: 'custom-pizza', // Imagen genérica para pizzas personalizadas
                quantity: 1,
                isCustom: true
            };
            
            // Obtener carrito actual
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            
            // Añadir pizza al carrito
            cartItems.push(customPizza);
            
            // Guardar en localStorage
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            
            // Actualizar contador de carrito
            if (typeof updateCartCount === 'function') {
                updateCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
            }
            
            // Mostrar mensaje de éxito
            this.showMessage('¡Pizza añadida al carrito!', 'success');
            
            // Redirigir después de un momento
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            this.showMessage('Error al añadir al carrito', 'error');
            console.error('Error:', error);
        }
    }
    
    showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        if (type === 'success') {
            messageEl.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
        } else if (type === 'error') {
            messageEl.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
        } else {
            messageEl.style.background = 'linear-gradient(135deg, #2196f3, #1976d2)';
        }
        
        document.body.appendChild(messageEl);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
    
    showLoginModal() {
        // Usar el modal de login existente o crear uno
        if (typeof showLoginModal === 'function') {
            showLoginModal();
        } else {
            alert('Por favor inicia sesión para añadir pizzas personalizadas al carrito');
            window.location.href = 'login.html';
        }
    }
    
    checkAuth() {
        // Verificar si el usuario está autenticado
        const user = localStorage.getItem('pizzeriaUser');
        if (!user) {
            this.showMessage('Inicia sesión para guardar tus creaciones', 'info');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    new PizzaCreator();
    
    // Verificar estado de autenticación para la navegación
    if (typeof checkAuthStatus === 'function') {
        checkAuthStatus();
    }
});

// Añadir animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .message {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
`;
document.head.appendChild(style);