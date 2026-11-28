// REEMPLAZA ESTOS DOS VALORES CON LOS DE TU PROYECTO SUPABASE
const SUPABASE_URL = "https://fuwgvvflodjnpuxybhgs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vrc9e4bGxkafYmnMJZfznA_x1AxJdfV";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

const loginSection = $("loginSection");
const adminSection = $("adminSection");
const loginForm = $("loginForm");
const productForm = $("productForm");
const productsList = $("productsList");

let currentUser = null;

function showMessage(element, message) {
  element.textContent = message;
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

function formatPrice(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}


// Cargar categorías y materiales desde Supabase
async function loadOptions() {
  const categorySelect = $("category");
  const materialSelect = $("material");

  const [categoriesResult, materialsResult] = await Promise.all([
    db.from("categories").select("name").order("name"),
    db.from("materials").select("name").order("name")
  ]);

  if (categoriesResult.error || materialsResult.error) {
    console.error(
      categoriesResult.error || materialsResult.error
    );
    showMessage(
      $("formMessage"),
      "No se pudieron cargar las categorías o materiales."
    );
    return;
  }

  function fillSelect(select, rows, placeholder, currentValue = "") {
    const names = rows.map(row => row.name);

    // Conservar una opción antigua si algún producto ya la utiliza.
    if (currentValue && !names.includes(currentValue)) {
      names.push(currentValue);
    }

    select.innerHTML = "";

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = placeholder;
    select.appendChild(firstOption);

    names.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    if (currentValue) {
      select.value = currentValue;
    }
  }

  fillSelect(categorySelect, categoriesResult.data, "Selecciona una categoría");
  fillSelect(materialSelect, materialsResult.data, "Selecciona un material");
}

// Agregar una categoría nueva
async function addCategory() {
  const name = prompt("Escribe el nombre de la nueva categoría:");

  if (!name || !name.trim()) return;

  const cleanName = name.trim();

  const { error } = await db
    .from("categories")
    .insert({ name: cleanName });

  if (error) {
    alert(
      error.code === "23505"
        ? "Esa categoría ya existe."
        : "No se pudo agregar la categoría: " + error.message
    );
    return;
  }

  await loadOptions();
  $("category").value = cleanName;
}

// Agregar un material nuevo
async function addMaterial() {
  const name = prompt("Escribe el nombre del nuevo material:");

  if (!name || !name.trim()) return;

  const cleanName = name.trim();

  const { error } = await db
    .from("materials")
    .insert({ name: cleanName });

  if (error) {
    alert(
      error.code === "23505"
        ? "Ese material ya existe."
        : "No se pudo agregar el material: " + error.message
    );
    return;
  }

  await loadOptions();
  $("material").value = cleanName;
}


// Comprobar sesión al abrir el panel
async function checkSession() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    showMessage($("loginMessage"), error.message);
    return;
  }

  if (data.session) {
    currentUser = data.session.user;
    showAdmin();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
  $("logoutButton").classList.add("hidden");
}

async function showAdmin() {
  loginSection.classList.add("hidden");
  adminSection.classList.remove("hidden");
  $("logoutButton").classList.remove("hidden");

  await loadOptions();
  await loadProducts();
}

// Iniciar sesión
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  showMessage($("loginMessage"), "Iniciando sesión...");

  const { data, error } = await db.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });

  button.disabled = false;

  if (error) {
    showMessage($("loginMessage"), "No se pudo iniciar sesión. Revisa tus datos.");
    return;
  }

  currentUser = data.user;
  loginForm.reset();
  showMessage($("loginMessage"), "");
  showAdmin();
});

// Cerrar sesión
$("logoutButton").addEventListener("click", async () => {
  await db.auth.signOut();
  currentUser = null;
  showLogin();
});

// Obtener productos
async function loadProducts() {
  productsList.innerHTML = "<p>Cargando productos...</p>";

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    productsList.innerHTML = "<p>No se pudieron cargar los productos.</p>";
    console.error(error);
    return;
  }

  if (!data.length) {
    productsList.innerHTML = "<p>Aún no hay productos registrados.</p>";
    return;
  }

  productsList.innerHTML = data.map(product => `
    <article class="product-row">
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.category || "Sin categoría")} · ${formatPrice(product.price)}</p>
        <p>Estado: ${escapeHTML(product.status)}</p>
        <p>${(product.images || []).length} fotografía(s)</p>
      </div>
      <div class="product-actions">
        <button type="button" data-edit="${product.id}">Editar</button>
        <button type="button" class="danger" data-delete="${product.id}">Eliminar</button>
      </div>
    </article>
  `).join("");

  productsList.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      const product = data.find(item => String(item.id) === button.dataset.edit);
      editProduct(product);
    });
  });

  productsList.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      deleteProduct(button.dataset.delete);
    });
  });
}

// Limpiar formulario
function resetForm() {
  productForm.reset();
  $("productId").value = "";
  $("imageUrls").value = "";
  $("formTitle").textContent = "Agregar alebrije";
  $("saveButton").textContent = "Guardar producto";
  showMessage($("formMessage"), "");
}

// Editar producto
function editProduct(product) {
  $("productId").value = product.id;
  $("name").value = product.name || "";
  $("description").value = product.description || "";
  $("price").value = product.price ?? 0;
  $("height").value = product.height || "";
  $("length").value = product.length || "";
  $("width").value = product.width || "";
  $("material").value = product.material || "";
  $("category").value = product.category || "";
  $("status").value = product.status || "available";
  $("imageUrls").value = (product.images || []).join("\n");

  $("formTitle").textContent = "Editar alebrije";
  $("saveButton").textContent = "Guardar cambios";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Subir fotografías a Supabase Storage
async function uploadPhotos(files) {
  const uploadedUrls = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Solo puedes subir archivos de imagen.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Cada imagen debe pesar menos de 10 MB.");
    }

    const extension = file.name.split(".").pop().replace(/[^a-zA-Z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${extension || "jpg"}`;

    const { error } = await db.storage
      .from("product-images")
      .upload(path, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    const { data } = db.storage
      .from("product-images")
      .getPublicUrl(path);

    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

// Guardar producto nuevo o editado
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("saveButton");
  button.disabled = true;
  showMessage($("formMessage"), "Guardando producto...");

  try {
    const existingImages = $("imageUrls").value
      .split("\n")
      .map(url => url.trim())
      .filter(Boolean);

    const files = Array.from($("photos").files || []);
    const newImages = await uploadPhotos(files);

    const product = {
      name: $("name").value.trim(),
      description: $("description").value.trim(),
      price: Number($("price").value),
      height: $("height").value.trim(),
      length: $("length").value.trim(),
      width: $("width").value.trim(),
      material: $("material").value.trim(),
      category: $("category").value.trim(),
      status: $("status").value,
      images: [...existingImages, ...newImages]
    };

    const id = $("productId").value;

    let result;

    if (id) {
      result = await db
        .from("products")
        .update(product)
        .eq("id", id);
    } else {
      result = await db
        .from("products")
        .insert(product);
    }

    if (result.error) throw result.error;

    showMessage($("formMessage"), "¡Producto guardado correctamente!");
    resetForm();
    await loadProducts();

  } catch (error) {
    console.error(error);
    showMessage($("formMessage"), "Error al guardar: " + error.message);
  } finally {
    button.disabled = false;
  }
});

// Eliminar producto
async function deleteProduct(id) {
  const confirmed = confirm(
    "¿Seguro que deseas eliminar este producto?"
  );

  if (!confirmed) return;

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("No se pudo eliminar el producto.");
    console.error(error);
    return;
  }

  await loadProducts();
}

// Botones auxiliares
$("newProductButton").addEventListener("click", resetForm);
$("cancelButton").addEventListener("click", resetForm);
$("refreshButton").addEventListener("click", loadProducts);
$("addCategoryButton").addEventListener("click", addCategory);
$("addMaterialButton").addEventListener("click", addMaterial);



// Escuchar cambios de sesión
db.auth.onAuthStateChange((_event, session) => {
  if (session) {
    currentUser = session.user;
    showAdmin();
  } else {
    currentUser = null;
    showLogin();
  }
});

// Arrancar el panel
checkSession();
