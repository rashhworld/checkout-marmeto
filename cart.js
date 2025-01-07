// Show/hide loader
const toggleLoader = (show) => {
    document.getElementById('loader').classList.toggle('active', show);
};

// Save cart to local storage
const saveCartToLocalStorage = (cartData) => {
    localStorage.setItem('cartData', JSON.stringify(cartData));
};

// Get cart from local storage
const getCartFromLocalStorage = () => {
    const cartData = localStorage.getItem('cartData');
    return cartData ? JSON.parse(cartData) : null;
};

// Format price to Indian Rupees
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(price / 100);
};

// Show confirm delete modal
const showModal = (itemId, confirmCallback) => {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('active');

    const confirmBtn = modal.querySelector('.btn-confirm');
    const cancelBtn = modal.querySelector('.btn-cancel');

    const handleConfirm = () => {
        confirmCallback();
        closeModal();
    };

    const handleCancel = () => {
        closeModal();
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    modal.addEventListener('close', () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    });
};

const closeModal = () => {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
    modal.dispatchEvent(new Event('close'));
};

// Fetch and display cart data
async function fetchCartData() {
    toggleLoader(true);
    try {
        const localCartData = getCartFromLocalStorage();

        const response = await fetch('https://cdn.shopify.com/s/files/1/0883/2188/4479/files/apiCartData.json?v=1728384889');
        const data = await response.json();

        // await new Promise(resolve => setTimeout(resolve, 3000));

        if (localCartData) {
            data.items = data.items.map(item => {
                const storedItem = localCartData.items.find(i => i.id === item.id);
                if (storedItem) {
                    return { ...item, quantity: storedItem.quantity };
                }
                return item;
            });
        }

        displayCartItems(data);
        updateCartTotals(data);
        saveCartToLocalStorage(data);
    } catch (error) {
        console.error('Error fetching cart data:', error);
    } finally {
        toggleLoader(false);
    }
}

// Display cart items
function displayCartItems(data) {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartHeader = cartItemsContainer.querySelector('.cart-header');
    cartItemsContainer.innerHTML = '';
    cartItemsContainer.appendChild(cartHeader);

    if (!data.items || data.items.length === 0) {
        const noItemsMessage = document.createElement('div');
        noItemsMessage.className = 'no-items-message';
        noItemsMessage.textContent = 'No items in the cart found.';
        cartItemsContainer.appendChild(noItemsMessage);
        return;
    }

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

    const localCartData = getCartFromLocalStorage();
    const storedItem = localCartData?.items.find(i => i.id === item.id);
    const quantity = storedItem ? storedItem.quantity : item.quantity;

    cartItem.innerHTML = `
        <div class="product-info">
            <img src="${item.featured_image.url}" alt="${item.title}" class="product-image">
            <span class="product-name">${item.title}</span>
        </div>
        <div class="product-price">${formatPrice(item.price)}</div>
        <div class="quantity-control">
            <input type="number" value="${quantity}" min="1" data-item-id="${item.id}">
        </div>
        <div class="subtotal">
            ${formatPrice(item.price * quantity)}
        </div>
        <div class="delete-btn">
            <img src="./assets/icons/trash.png" alt="Delete" data-item-id="${item.id}">
        </div>
    `;

    const quantityInput = cartItem.querySelector('input');
    quantityInput.addEventListener('change', handleQuantityChange);

    const deleteBtn = cartItem.querySelector('.delete-btn img');
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

    const cartData = getCartFromLocalStorage();
    if (cartData) {
        const item = cartData.items.find(item => item.id === parseInt(itemId));
        if (item) {
            item.quantity = newQuantity;
            saveCartToLocalStorage(cartData);
        }
    }
}

// Handle delete item
function handleDeleteItem(event) {
    const itemId = event.target.dataset.itemId;

    showModal(itemId, () => {
        const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
        cartItem.remove();

        updateCartTotals();

        const cartData = getCartFromLocalStorage();
        if (cartData) {
            cartData.items = cartData.items.filter(item => item.id !== parseInt(itemId));
            saveCartToLocalStorage(cartData);
            displayCartItems(cartData);
        }
    });
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

    if (subtotal === 0) {
        document.querySelector('.checkout-btn').style.display = 'none';
    } else {
        document.querySelector('.checkout-btn').style.display = 'block';
    }
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