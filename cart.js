// Format price to Indian Rupees
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(price / 100);
};

// Fetch and display cart data
async function fetchCartData() {
    try {
        const response = await fetch('https://cdn.shopify.com/s/files/1/0883/2188/4479/files/apiCartData.json?v=1728384889');
        const data = await response.json();
        displayCartItems(data);
        updateCartTotals(data);
    } catch (error) {
        console.error('Error fetching cart data:', error);
    }
}

// Display cart items
function displayCartItems(data) {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartHeader = cartItemsContainer.querySelector('.cart-header');
    cartItemsContainer.innerHTML = '';
    cartItemsContainer.appendChild(cartHeader);

    data.items.forEach(item => {
        const cartItem = createCartItemElement(item);
        cartItemsContainer.appendChild(cartItem);
    });
}

// Create cart item element
function createCartItemElement(item) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.dataset.itemId = item.id;

    cartItem.innerHTML = `
        <div class="product-info">
            <img src="${item.featured_image.url}" alt="${item.title}" class="product-image">
            <span class="product-name">${item.title}</span>
        </div>
        <div class="product-price">${formatPrice(item.price)}</div>
        <div class="quantity-control">
            <input type="number" value="${item.quantity}" min="1" data-item-id="${item.id}">
        </div>
        <div class="subtotal">
            ${formatPrice(item.price * item.quantity)}
        </div>
        <div class="delete-btn">
            <img src="./assets/icons/trash.png" alt="Delete" data-item-id="${item.id}">
        </div>
    `;

    const quantityInput = cartItem.querySelector('input');
    quantityInput.addEventListener('change', handleQuantityChange);

    const deleteBtn = cartItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', handleDeleteItem);

    return cartItem;
}

// Handle quantity change
function handleQuantityChange(event) {
    const itemId = event.target.dataset.itemId;
    const newQuantity = parseInt(event.target.value);
    if (newQuantity < 1) {
        event.target.value = 1;
        return;
    }

    updateCartItem(itemId, newQuantity);
}

// Handle delete item
function handleDeleteItem(event) {
    const itemId = event.currentTarget.querySelector('img').dataset.itemId;
    const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    cartItem.remove();
    updateCartTotals();
}

// Update cart totals
function updateCartTotals() {
    const cartItems = document.querySelectorAll('.cart-item');
    let subtotal = 0;

    cartItems.forEach(item => {
        const price = parseFloat(item.querySelector('.product-price').textContent.replace(/[^0-9.-]+/g, ''));
        const quantity = parseInt(item.querySelector('.quantity-control input').value);
        subtotal += price * quantity;
    });

    document.querySelector('.totals-row .product-price').textContent = formatPrice(subtotal * 100);
    document.querySelector('.total .amount').textContent = formatPrice(subtotal * 100);
}

// Update individual cart item
function updateCartItem(itemId, quantity) {
    const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    const price = parseFloat(cartItem.querySelector('.product-price').textContent.replace(/[^0-9.-]+/g, ''));
    const subtotal = price * quantity;

    cartItem.querySelector('.subtotal').textContent = formatPrice(subtotal * 100);
    updateCartTotals();
}

// Initialize cart
document.addEventListener('DOMContentLoaded', () => {
    fetchCartData();

    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        alert('Proceeding to checkout!');
    });
}); 