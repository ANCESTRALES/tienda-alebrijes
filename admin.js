// ==========================================
// CONEXIÓN CON SUPABASE
// ==========================================

const SUPABASE_URL = "https://fuwgvvflodjnpuxybhgs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vrc9e4bGxkafYmnMJZfznA_x1AxJdfV";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// VARIABLES GENERALES
// ==========================================

let products = [];

const $ = id => document.getElementById(id);

const formatPrice = value =>
  Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getImages(product) {
  return Array.isArray(product.images) ? product.images : [];
}


// ==========================================
// CARGAR PRODUCTOS, CATEGORÍAS Y MATERIALES
// ==========================================

async function loadStoreData() {
  const container = $("productList");

  if (container) {
    container.innerHTML = "<p>Cargando nuestros alebrijes...</p>";
  }

  const [productsResult, categoriesResult, materialsResult] =
    await Promise.all([
      db
        .from("products")
        .select("*")
        .neq("status", "hidden")
        .order("id", { ascending: false }),

      db
        .from("categories")
        .select("name")
        .order("name"),

      db
        .from("materials")
        .select("name")
        .order("name")
    ]);

  if (productsResult.error) {
    console.error("Error al cargar productos:", productsResult.error);

    if (container) {
      container.innerHTML = `
        <p class="no-products">
          No pudimos cargar los productos. Intenta actualizar la página.
        </p>
      `;
    }

    return;
  }

  products = productsResult.data || [];

  if (categoriesResult.error) {
    console.error("Error al cargar categorías:", categoriesResult.error);
  } else {
    fillFilter(
      $("categoryFilter"),
      categoriesResult.data || [],
      "Todas las categorías"
    );
  }

  if (materialsResult.error) {
    console.error("Error al cargar materiales:", materialsResult.error);
  } else {
    fillFilter(
      $("materialFilter"),
      materialsResult.data || [],
      "Todos los materiales"
    );
  }

  renderProducts();
}

function fillFilter(select, rows, placeholder) {
  if (!select) return;

  const previousValue = select.value;

  select.innerHTML = "";

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = placeholder;
  select.appendChild(firstOption);

  rows.forEach(row => {
    const option = document.createElement("option");
    option.value = row.name;
    option.textContent = row.name;
    select.appendChild(option);
  });

  // Conservar el filtro seleccionado si sigue existiendo.
  if ([...select.options].some(option => option.value === previousValue)) {
    select.value = previousValue;
  }
}


// ==========================================
// CARRITO
// ==========================================

let cart = JSON.parse(localStorage.getItem("alebrijesCart")) || [];

function saveCart() {
  localStorage.setItem("alebrijesCart", JSON.stringify(cart));
  renderCart();
}


// ==========================================
// MOSTRAR CATÁLOGO Y FILTRAR PRODUCTOS
// ==========================================

function renderProducts() {
  const container = $("productList");

  if (!container) return;

  const categoryFilter = $("categoryFilter");
  const materialFilter = $("materialFilter");

  const category = categoryFilter ? categoryFilter.value : "";
  const material = materialFilter ? materialFilter.value : "";

  const filteredProducts = products.filter(product => {
    const matchesCategory =
      !category || normalize(product.category) === normalize(category);

    const matchesMaterial =
      !material || normalize(product.material) === normalize(material);

    return matchesCategory && matchesMaterial;
  });

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <p class="no-products">
        No encontramos piezas con esos filtros.
      </p>
    `;
    return;
  }

  container.innerHTML = filteredProducts.map(product => {
    const images = getImages(product);
    const firstImage = images[0] || "";
    const unavailable = product.status === "unavailable";

    return `
      <article class="product">

        <img
          src="${escapeHTML(firstImage)}"
          alt="${escapeHTML(product.name)}"
          data-gallery="${escapeHTML(product.id)}"
          loading="lazy"
        >

        <h3>${escapeHTML(product.name)}</h3>

        <p>${escapeHTML(product.description || "")}</p>

        <p class="product-measures">
          Alto: ${escapeHTML(product.height || "Consultar")} ·
          Largo: ${escapeHTML(product.length || "Consultar")} ·
          Ancho: ${escapeHTML(product.width || "Consultar")}
        </p>

        <p>Material: ${escapeHTML(product.material || "Consultar")}</p>

        <strong>${formatPrice(product.price)}</strong>

        ${
          unavailable
            ? '<p class="product-unavailable">No disponible</p>'
            : ""
        }

        <a
          class="whatsapp-button"
          href="https://wa.me/529511234567?text=${encodeURIComponent(
            `Hola, me interesa ${product.name}. ¿Me pueden dar más información?`
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Consultar por WhatsApp
        </a>

      </article>
    `;
  }).join("");
}


// ==========================================
// ABRIR Y CERRAR FILTROS
// ==========================================

const filterPanel = $("filterPanel");
const filterOverlay = $("filterOverlay");

function openFilters() {
  filterPanel?.classList.add("open");
  filterOverlay?.classList.add("active");
  document.body.classList.add("filters-open");
}

function closeFilters() {
  filterPanel?.classList.remove("open");
  filterOverlay?.classList.remove("active");
  document.body.classList.remove("filters-open");
}

$("openFilters")?.addEventListener("click", openFilters);

$("closeFilters")?.addEventListener("click", closeFilters);

filterOverlay?.addEventListener("click", closeFilters);

$("applyFilters")?.addEventListener("click", () => {
  renderProducts();
  closeFilters();
});

$("clearFilters")?.addEventListener("click", () => {
  if ($("categoryFilter")) $("categoryFilter").value = "";
  if ($("materialFilter")) $("materialFilter").value = "";

  renderProducts();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeFilters();
    modal?.classList.remove("open");
  }
});


// ==========================================
// GALERÍA: ABRIR DESDE EL CATÁLOGO
// ==========================================

$("productList")?.addEventListener("click", event => {
  const image = event.target.closest("[data-gallery]");

  if (image) {
    openGallery(image.dataset.gallery);
  }
});


// ==========================================
// MOSTRAR CARRITO
// ==========================================

function renderCart() {
  const container = $("cartItems");

  if (!container) return;

  container.innerHTML = cart.length
    ? cart.map(product => `
      <div class="cart-item">

        <img
          src="${escapeHTML(getImages(product)[0] || "")}"
          alt="${escapeHTML(product.name)}"
        >

        <div class="cart-item-info">

          <b>${escapeHTML(product.name)}</b>

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
    : "<p>Tu carrito está vacío 🛒</p>";

  const subtotal = cart.reduce(
    (sum, product) => sum + Number(product.price) * product.quantity,
    0
  );

  const count = cart.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const shipping = 150;

  if ($("cartCount")) $("cartCount").textContent = count;

  if ($("subtotal")) $("subtotal").textContent = formatPrice(subtotal);

  if ($("shippingCost")) {
    $("shippingCost").textContent = formatPrice(shipping);
  }

  if ($("total")) {
    $("total").textContent =
      formatPrice(subtotal + (cart.length ? shipping : 0));
  }
}


// ==========================================
// MODIFICAR Y ELIMINAR PRODUCTOS DEL CARRITO
// ==========================================

$("cartItems")?.addEventListener("click", event => {
  const plus = event.target.dataset.plus;
  const minus = event.target.dataset.minus;
  const remove = event.target.dataset.remove;

  if (plus) {
    const product = cart.find(p => String(p.id) === String(plus));
    if (product) product.quantity++;
  }

  if (minus) {
    const product = cart.find(p => String(p.id) === String(minus));

    if (product) {
      product.quantity--;

      if (product.quantity <= 0) {
        cart = cart.filter(p => String(p.id) !== String(minus));
      }
    }
  }

  if (remove) {
    cart = cart.filter(p => String(p.id) !== String(remove));
  }

  saveCart();
});


// ==========================================
// ABRIR Y CERRAR CARRITO
// ==========================================

const cartPanel = $("cartPanel");

$("cartButton")?.addEventListener("click", () => {
  cartPanel?.classList.add("open");
});

$("closeCart")?.addEventListener("click", () => {
  cartPanel?.classList.remove("open");
});


// ==========================================
// PRESENTACIÓN AUTOMÁTICA DEL INICIO
// ==========================================

const slides = [
  "imagenes/LOGO.jpeg",
  "imagenes/Zorro/ZORRO.jpeg",
  "imagenes/Tapir/Tapir.jpeg",
  "imagenes/Gorila/Gorila.jpeg",
  "imagenes/Jaguar/Jaguar.jpeg"
];

let currentSlide = 0;

if ($("heroImage")) {
  setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    $("heroImage").src = slides[currentSlide];
  }, 4000);
}


// ==========================================
// GALERÍA DE FOTOGRAFÍAS
// ==========================================

const modal = $("galleryModal");
const galleryImage = $("galleryImage");

let currentProduct = null;
let currentImage = 0;

function openGallery(productId) {
  currentProduct = products.find(
    p => String(p.id) === String(productId)
  );

  if (!currentProduct) return;

  if (getImages(currentProduct).length === 0) return;

  currentImage = 0;
  showGalleryImage();

  modal?.classList.add("open");
}

function showGalleryImage() {
  if (!currentProduct) return;

  const images = getImages(currentProduct);

  if (!images.length) return;

  galleryImage.src = images[currentImage];
  galleryImage.alt = currentProduct.name || "Fotografía del alebrije";
}

$("closeGallery")?.addEventListener("click", () => {
  modal?.classList.remove("open");
});

$("previousImage")?.addEventListener("click", () => {
  if (!currentProduct) return;

  const images = getImages(currentProduct);

  currentImage =
    (currentImage - 1 + images.length) % images.length;

  showGalleryImage();
});

$("nextImage")?.addEventListener("click", () => {
  if (!currentProduct) return;

  const images = getImages(currentProduct);

  currentImage = (currentImage + 1) % images.length;

  showGalleryImage();
});


// ==========================================
// ENVÍO DE DEMOSTRACIÓN
// ==========================================

$("destination")?.addEventListener("input", event => {
  const message = $("shippingMessage");

  if (!message) return;

  message.textContent = /^\d{5}$/.test(event.target.value)
    ? "Costo de envío estimado: $150 MXN (demostración)"
    : "Ingresa un código postal de 5 dígitos.";
});


// ==========================================
// FINALIZAR COMPRA
// ==========================================

$("checkoutButton")?.addEventListener("click", () => {
  const postalCode = $("destination")?.value || "";

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
});


// ==========================================
// INICIAR TIENDA
// ==========================================

renderCart();
loadStoreData();