// PRODUCTOS DE EJEMPLO
const products = [
  {
    id: 1,
    name: "Alebrije zorro",
    description: "Figura artesanal llena de color y tradición.",
    price: 850,
    height: "25 cm",
    length: "30 cm",
    width: "15 cm",
    material: "Madera",
    images: [
      "imagenes/Zorro/ZORRO.jpeg",
      "imagenes/Zorro/Zorro5.jpeg",
      "imagenes/Zorro/Zorro6.jpeg",
      "imagenes/Zorro/Zorro7.jpeg"
    ]
  },
  {
    id: 2,
    name: "Alebrije Tapir",
    description: "Una pieza decorativa especial.",
    price: 1200,
    height: "25 cm",
    length: "30 cm",
    width: "15 cm",
    material: "Madera",
    images: [
      "imagenes/Tapir/Tapir.jpeg",
      "imagenes/Tapir/Tapir4.jpeg",
      "imagenes/Tapir/Tapir2.jpeg",
      "imagenes/Tapir/Tapir3.jpeg"
    ]
  },
  {
    id: 3,
    name: "Artesanía Gorila",
    description: "Elaborada con detalles únicos.",
    price: 20000,
    height: "25 cm",
    length: "30 cm",
    width: "15 cm",
    material: "Madera",
    images: [
       "imagenes/Gorila/Gorila.jpeg",
      "imagenes/Gorila/Gorila1.jpeg",
      "imagenes/Gorila/Gorila2.jpeg",
      "imagenes/Gorila/Gorila3.jpeg"
    ]
  },
  {
    id: 4,
    name: "Artesanía Jaguar",
    description: "Figura exotica.",
    price: 38000,
    height: "25 cm",
    length: "30 cm",
    width: "15 cm",
    material: "Madera",
    images: [
       "imagenes/Jaguar/Jaguar.jpeg",
      "imagenes/Jaguar/Jaguar2.jpeg"
    ]
  }
];

const formatPrice = value =>
  value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });

// CARRITO
let cart = JSON.parse(localStorage.getItem("alebrijesCart")) || [];

function saveCart() {
  localStorage.setItem("alebrijesCart", JSON.stringify(cart));
  renderCart();
}

// MOSTRAR CATÁLOGO
function renderProducts() {
  const container = document.getElementById("productList");

  container.innerHTML = products.map(product => `
    <article class="product">
      <img
        src="${product.images[0]}"
        alt="${product.name}"
        data-gallery="${product.id}"
      >

      <h3>${product.name}</h3>
      <p>${product.description}</p>

      <p class="product-measures">
  Alto: ${product.height || "Consultar"} ·
  Largo: ${product.length || "Consultar"} ·
  Ancho: ${product.width || "Consultar"}
</p>

<p><strong>Material:</strong> ${product.material || "Consultar"}</p>

      <strong>${formatPrice(product.price)}</strong>



      <a
        class="whatsapp-button"
     href="https://wa.me/529511234567?text=${encodeURIComponent(
          `Hola, me interesa ${product.name}.
¿Me pueden dar más información?`
        )}"
        target="_blank"
        rel="noopener noreferrer"
     >
        💬 Consultar por WhatsApp
      </a>
    </article>
  `).join("");
}
    







// AGREGAR PRODUCTO
document.getElementById("productList").addEventListener("click", event => {
  const addId = event.target.dataset.add;
  const galleryId = event.target.dataset.gallery;

  if (addId) {
    const product = products.find(p => p.id === Number(addId));
    const existing = cart.find(p => p.id === product.id);

    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    saveCart();
  }

  if (galleryId) {
    openGallery(Number(galleryId));
  }
});

// MOSTRAR CARRITO
function renderCart() {
  const container = document.getElementById("cartItems");

  container.innerHTML = cart.length
    ? cart.map(product => `
      <div class="cart-item">
        <img src="${product.images[0]}" alt="${product.name}">
        <div class="cart-item-info">
          <b>${product.name}</b>
          <p>${formatPrice(product.price)}</p>
          <button class="quantity-button" data-minus="${product.id}">−</button>
          ${product.quantity}
          <button class="quantity-button" data-plus="${product.id}">+</button>
          <br>
          <button class="remove-button" data-remove="${product.id}">
            Eliminar
          </button>
        </div>
      </div>
    `).join("")
    : "<p>Tu carrito está vacío :carrito_de_compras:</p>";

  const subtotal = cart.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  const count = cart.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const shipping = 150;

  document.getElementById("cartCount").textContent = count;
  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("shippingCost").textContent =
    formatPrice(shipping);
  document.getElementById("total").textContent =
    formatPrice(subtotal + (cart.length ? shipping : 0));
}

// MODIFICAR Y ELIMINAR PRODUCTOS
document.getElementById("cartItems").addEventListener("click", event => {
  const plus = event.target.dataset.plus;
  const minus = event.target.dataset.minus;
  const remove = event.target.dataset.remove;

  if (plus) {
    const product = cart.find(p => p.id === Number(plus));
    product.quantity++;
  }

  if (minus) {
    const product = cart.find(p => p.id === Number(minus));
    product.quantity--;

    if (product.quantity <= 0) {
      cart = cart.filter(p => p.id !== Number(minus));
    }
  }

  if (remove) {
    cart = cart.filter(p => p.id !== Number(remove));
  }

  saveCart();
});

// ABRIR Y CERRAR CARRITO
const cartPanel = document.getElementById("cartPanel");

document.getElementById("cartButton").onclick = () => {
  cartPanel.classList.add("open");
};

document.getElementById("closeCart").onclick = () => {
  cartPanel.classList.remove("open");
};

// PRESENTACIÓN AUTOMÁTICA
const slides = [
    "imagenes/LOGO.jpeg",
  "imagenes/Zorro/ZORRO.jpeg",
  "imagenes/Tapir/Tapir.jpeg",
  "imagenes/Gorila/Gorila.jpeg",
  "imagenes/Jaguar/Jaguar.jpeg",
];

let currentSlide = 0;

setInterval(() => {
  currentSlide = (currentSlide + 1) % slides.length;

  document.getElementById("heroImage").src =
    slides[currentSlide];
}, 4000);

// GALERÍA DE FOTOGRAFÍAS
const modal = document.getElementById("galleryModal");
const galleryImage = document.getElementById("galleryImage");

let currentProduct = null;
let currentImage = 0;

function openGallery(productId) {
  currentProduct = products.find(p => p.id === productId);
  currentImage = 0;
  showGalleryImage();
  modal.classList.add("open");
}

function showGalleryImage() {
  galleryImage.src = currentProduct.images[currentImage];
}

document.getElementById("closeGallery").onclick = () => {
  modal.classList.remove("open");
};

document.getElementById("previousImage").onclick = () => {
  currentImage =
    (currentImage - 1 + currentProduct.images.length) %
    currentProduct.images.length;

  showGalleryImage();
};

document.getElementById("nextImage").onclick = () => {
  currentImage =
    (currentImage + 1) % currentProduct.images.length;

  showGalleryImage();
};

// ENVÍO DE DEMOSTRACIÓN
document.getElementById("destination").addEventListener("input", event => {
  const message = document.getElementById("shippingMessage");

  message.textContent = /^\d{5}$/.test(event.target.value)
    ? "Costo de envío estimado: $150 MXN (demostración)"
    : "Ingresa un código postal de 5 dígitos.";
});

// FINALIZAR COMPRA
document.getElementById("checkoutButton").onclick = () => {
  const postalCode = document.getElementById("destination").value;

  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  if (!/^\d{5}$/.test(postalCode)) {
    alert("Ingresa un código postal válido.");
    return;
  }

  alert(
    "¡Excelente! Tu pedido está listo para el siguiente paso. " +
    "Todavía falta conectar el sistema de pagos y los envíos."
  );
};

// INICIAR TIENDA
renderProducts();
renderCart();
