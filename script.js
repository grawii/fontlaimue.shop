/* ==========================================
   1. GLOBAL VARIABLES & INITIALIZATION
   ========================================== */
let currentAdminPage = 1;
let adminFilterCat = "ทั้งหมด";
let cart = JSON.parse(localStorage.getItem('temp_cart')) || [];
let editingPresetIdx = null;
let originalThemeBeforePreset = null; // เก็บสีเดิมก่อนกดดูพรีเซ็ต

function init() {
    const cfg = db.getConfig();
    document.getElementById('shopName').innerText = cfg.shopName;
    document.getElementById('shopProfile').src = cfg.shopProfile;
    
    // ฟังก์ชันใหม่: แสดงข้อความเลื่อน
    const marqueeMsg = cfg.marqueeText || "";
    document.getElementById('marqueeDisplay').innerText = marqueeMsg;
    document.getElementById('marqueeDisplay2').innerText = marqueeMsg;

    applyTheme(); 
    renderCategoryFilter(); 
    renderStore('ทั้งหมด'); 
    updateCartCount();
}

/* --- ฟังก์ชันใหม่: Custom Confirm (ปุ่มยกเลิกซ้าย ตกลงขวา) --- */
function myConfirm(msg, onOk) {
    const modal = document.getElementById('customConfirm');
    document.getElementById('confirmMsg').innerText = msg;
    modal.classList.remove('hidden');

    document.getElementById('confirmOk').onclick = () => {
        modal.classList.add('hidden');
        onOk();
    };
    document.getElementById('confirmCancel').onclick = () => {
        modal.classList.add('hidden');
    };
}

function applyTheme() {
    const t = db.config.theme; 
    const root = document.documentElement;
    ['bg', 'card', 'btn', 'textMain', 'textSub', 'border'].forEach(k => {
        root.style.setProperty(`--${k}-color`, t[k]);
    });
}

/* ==========================================
   2. STOREFRONT & PRODUCT DETAIL
   ========================================== */
function renderStore(cat) {
    const cont = document.getElementById('productsContainer');
    if(!cont) return;
    const products = db.getProducts().filter(p => cat === 'ทั้งหมด' || p.category === cat);
    cont.innerHTML = products.map((p) => {
        const realIdx = db.products.findIndex(item => item.name === p.name);
        return `
        <div class="card-bg p-3 rounded-[20px] relative shadow-sm flex flex-col justify-between h-full overflow-hidden border-main">
            <div onclick="openProductDetail(${realIdx})" class="cursor-pointer">
                <img src="${p.img}" class="w-full aspect-square object-cover rounded-xl mb-2">
                <h4 class="text-[11px] font-bold text-main line-clamp-2 leading-tight">${p.name}</h4>
                <div class="text-[12px] font-black mt-1 text-main">฿${p.price - p.discount}</div>
            </div>
            <button onclick="addToCartDirect(${realIdx})" class="absolute bottom-2 right-2 btn-main w-8 h-8 rounded-full shadow-md flex items-center justify-center active:scale-90 transition-transform">
                <i class="fa-solid fa-plus text-xs text-white"></i>
            </button>
        </div>`;
    }).join('');
}

function addToCartDirect(idx) {
    const p = db.products[idx]; const exist = cart.find(i => i.name === p.name);
    if(exist) { if(p.limitOne) return alert("จำกัด 1 ชิ้น"); exist.qty++; } else { cart.push({...p, qty: 1}); }
    updateCartCount(); alert("เพิ่มลงตะกร้าแล้ว 🐰");
}

function updateCartCount() {
    const el = document.getElementById('cartCount'); const total = cart.reduce((s, i) => s + i.qty, 0);
    if(el) { el.innerText = total; el.classList.toggle('hidden', total === 0); }
    localStorage.setItem('temp_cart', JSON.stringify(cart));
}

function openProductDetail(idx) {
    const p = db.products[idx]; const detail = document.getElementById('productDetailPage');
    detail.classList.remove('hidden');
    detail.innerHTML = `
        <div class="sticky top-0 bg-white/90 px-4 py-4 flex items-center justify-between border-b z-50">
            <button onclick="closeProductDetail()"><i class="fa-solid fa-chevron-left"></i> ย้อนกลับ</button>
            <span class="font-bold text-main">รายละเอียด</span><div class="w-8"></div>
        </div>
        <img src="${p.img}" class="w-full aspect-square object-cover">
        <div class="p-6 pb-32">
            <h1 class="text-xl font-bold text-main">${p.name}</h1>
            <div class="text-2xl font-black text-main mt-2">฿${p.price-p.discount}</div>
            <p class="text-sm text-gray-500 mt-4 leading-relaxed">${p.desc || 'ไม่มีรายละเอียดสินค้า'}</p>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-3 max-w-[480px] mx-auto z-50">
            <button onclick="addToCartDirect(${idx}); closeProductDetail();" class="flex-1 py-4 btn-main rounded-xl font-bold">เพิ่มลงตะกร้า</button>
        </div>`;
}

function closeProductDetail() { document.getElementById('productDetailPage').classList.add('hidden'); }

/* ==========================================
   3. THEME & PRESET MANAGEMENT
   ========================================== */
function updateColor(k, v) { db.config.theme[k] = v; applyTheme(); }

function savePreset() { 
    const currentTheme = JSON.parse(JSON.stringify(db.config.theme));
    if (editingPresetIdx !== null) {
        const target = db.config.presets[editingPresetIdx];
        myConfirm(`บันทึกสีทับพรีเซ็ต "${target.name}" ใช่หรือไม่?`, () => {
            db.config.presets[editingPresetIdx] = { name: target.name, ...currentTheme };
            db.saveConfig(db.config); editingPresetIdx = null; originalThemeBeforePreset = null; renderAdminDashboard();
            alert("อัปเดตพรีเซ็ตแล้ว ✨");
        });
    } else {
        const n = prompt("ตั้งชื่อพรีเซ็ตสี:"); 
        if(n) { 
            if(!db.config.presets) db.config.presets=[]; 
            db.config.presets.push({name:n, ...currentTheme}); 
            db.saveConfig(db.config); renderAdminDashboard(); 
        }
    }
}

function renderPresets() {
    const list = document.getElementById('presetList'); if(!list) return;
    const presetsHtml = (db.config.presets || []).map((p, i) => `
        <div class="flex items-center bg-white border border-main rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <button onclick="applyPreset(${i})" class="px-3 py-2 text-[10px] font-bold flex items-center gap-1">
                <span class="w-2 h-2 rounded-full" style="background:${p.btn}"></span> ${p.name}
            </button>
            <button onclick="prepareEditPreset(${i})" class="bg-blue-50 text-blue-500 px-2 py-2 border-l border-main text-[10px]"><i class="fa-solid fa-pen"></i></button>
            <button onclick="removePreset(${i})" class="bg-red-50 text-red-500 px-2 py-2 border-l border-main text-[10px] font-bold">×</button>
        </div>`).join('');

    // ฟังก์ชันใหม่: ปุ่มย้อนกลับสีเดิม
    const backBtn = originalThemeBeforePreset ? `
        <button onclick="revertTheme()" class="flex-shrink-0 bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-[10px] font-bold">
            <i class="fa-solid fa-rotate-left"></i> ย้อนกลับสีเดิม
        </button>
    ` : '';

    list.innerHTML = backBtn + presetsHtml;
}

function applyPreset(i) { 
    if (!originalThemeBeforePreset) {
        originalThemeBeforePreset = JSON.parse(JSON.stringify(db.config.theme));
    }
    const p = db.config.presets[i]; 
    Object.keys(db.config.theme).forEach(k => db.config.theme[k] = p[k]); 
    applyTheme(); 
    db.saveConfig(db.config); 
    renderAdminDashboard(); 
}

function revertTheme() {
    if (originalThemeBeforePreset) {
        db.config.theme = JSON.parse(JSON.stringify(originalThemeBeforePreset));
        originalThemeBeforePreset = null;
        applyTheme();
        db.saveConfig(db.config);
        renderAdminDashboard();
    }
}

function prepareEditPreset(i) {
    editingPresetIdx = i; 
    const p = db.config.presets[i];
    alert(`โหมดแก้ไข: ${p.name} เลือกสีใหม่แล้วกดปุ่มบันทึกพรีเซ็ต`);
    renderAdminDashboard();
}

function removePreset(i) { 
    myConfirm("ลบพรีเซ็ตสีนี้?", () => {
        db.config.presets.splice(i, 1); 
        db.saveConfig(db.config); 
        renderPresets(); 
    });
}

/* ==========================================
   4. ADMIN DASHBOARD
   ========================================== */
function toggleAdminModal(s) { document.getElementById('loginModal').classList.toggle('hidden', !s); }
function checkAdminPassword() { if(document.getElementById('adminPasswordInput').value === db.config.adminPass) { toggleAdminModal(false); renderAdminDashboard(); } else alert("รหัสผ่านไม่ถูกต้อง!"); }

function renderAdminDashboard() {
    const dash = document.getElementById('adminDashboard'); dash.classList.remove('hidden');
    const cfg = db.config; const t = cfg.theme; const tax = db.getTaxonomy();

    dash.innerHTML = `
        <div class="flex justify-between items-center mb-6"><h2 class="font-bold text-main text-lg">Admin Management</h2><button onclick="location.reload()" class="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Log out</button></div>
        
        <div class="bg-gray-50 p-4 rounded-3xl mb-6 border border-gray-200 text-xs">
            <h3 class="font-bold mb-3 uppercase text-main">1. ข้อมูลร้านค้า & ข้อความเลื่อน</h3>
            <input type="text" id="cfgShopName" value="${cfg.shopName}" class="w-full p-3 border rounded-xl mb-2" placeholder="ชื่อร้าน">
            <input type="text" id="cfgShopProfile" value="${cfg.shopProfile}" class="w-full p-3 border rounded-xl mb-2" placeholder="URL รูปโปรไฟล์">
            
            <label class="block mb-1 text-[9px] font-bold text-gray-400">ข้อความเลื่อนหน้าเว็บ</label>
            <textarea id="cfgMarqueeText" class="w-full p-3 border rounded-xl mb-2 h-16">${cfg.marqueeText || ""}</textarea>
            
            <input type="password" id="cfgAdminPass" value="${cfg.adminPass}" class="w-full p-3 border rounded-xl mb-3" placeholder="รหัสผ่าน Admin">
            <button onclick="saveShopInfo()" class="w-full py-3 btn-main rounded-xl font-bold shadow-sm">บันทึกข้อมูลส่วนตัว</button>
        </div>

        <div class="bg-gray-50 p-4 rounded-3xl mb-6 border border-gray-200">
            <h3 class="font-bold text-xs mb-3 uppercase text-main">2. ปรับแต่งโทนสี & พรีเซ็ต</h3>
            <div class="grid grid-cols-2 gap-2 text-[10px] mb-4">
                ${Object.keys(t).map(k => `<div>${k}: <div class="flex gap-1"><input type="color" oninput="updateColor('${k}', this.value); this.nextElementSibling.value=this.value" value="${t[k]}" class="w-8 h-8 rounded border-0"><input type="text" value="${t[k]}" class="w-full border rounded px-1 text-[8px]"></div></div>`).join('')}
            </div>
            <button id="savePresetBtn" onclick="savePreset()" class="w-full py-3 btn-main rounded-xl text-xs font-bold mb-3 shadow-sm">
                ${editingPresetIdx !== null ? '<i class="fa-solid fa-check"></i> บันทึกการแก้ไขพรีเซ็ต' : 'บันทึกพรีเซ็ตสีใหม่'}
            </button>
            <div id="presetList" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
        </div>

        <div id="productFormPart" class="bg-white border p-4 rounded-3xl mb-6 shadow-sm border-main text-xs">
            <h3 class="font-bold mb-3 uppercase text-main">3. เพิ่ม / แก้ไขสินค้า</h3>
            <input type="text" id="admName" placeholder="ชื่อสินค้า *" class="w-full p-3 border rounded-xl mb-2">
            <div class="flex gap-2 mb-2"><input type="number" id="admPrice" placeholder="ราคาเต็ม" class="w-full p-3 border rounded-xl"><input type="number" id="admDisc" placeholder="ส่วนลด (บาท)" class="w-full p-3 border rounded-xl"></div>
            <select id="admCat" class="w-full p-3 border rounded-xl mb-2">${tax.categories.map(c=>`<option>${c}</option>`).join('')}</select>
            <select id="admSub" class="w-full p-3 border rounded-xl mb-2">${tax.subCategories.map(c=>`<option>${c}</option>`).join('')}</select>
            <select id="admBrand" class="w-full p-3 border rounded-xl mb-2">${tax.brands.map(c=>`<option>${c}</option>`).join('')}</select>
            <input type="text" id="admImg" placeholder="URL รูป" class="w-full p-3 border rounded-xl mb-2"><textarea id="admDesc" placeholder="รายละเอียด" class="w-full p-3 border rounded-xl h-16 mb-2"></textarea>
            <div class="flex gap-4 p-2 bg-gray-50 rounded-xl mb-3"><label><input type="checkbox" id="admFeat"> แนะนำ</label><label><input type="checkbox" id="admLimit"> จำกัด 1 ชิ้น</label></div>
            <button onclick="saveProductAdmin()" class="w-full py-3 btn-main rounded-xl font-bold shadow-lg">บันทึกสินค้าลงคลัง</button>
        </div>

        <div class="bg-gray-50 p-4 rounded-3xl mb-6 border border-gray-200">
            <h3 class="font-bold text-xs mb-3 uppercase text-main">4. หมวดหมู่ / แบรนด์</h3>
            ${['Categories', 'SubCategories', 'Brands'].map(k => `<div class="mb-3"><label class="text-[9px] font-bold text-gray-400">${k}</label><div class="flex flex-wrap gap-1 mt-1">${tax[k.charAt(0).toLowerCase() + k.slice(1)].map((v, i) => `<span class="bg-white px-2 py-1.5 rounded-lg border border-main text-[9px]">${v} <button onclick="removeTax('${k}', ${i})" class="text-red-400">×</button></span>`).join('')}<button onclick="addTax('${k}')" class="bg-white w-6 h-6 rounded-full border border-dashed font-bold text-gray-400">+</button></div></div>`).join('')}
        </div>

        <div class="bg-white border border-main rounded-3xl p-4 shadow-sm">
            <div class="flex justify-between items-center mb-4"><h3 class="font-bold text-xs uppercase text-main">5. คลังสินค้าทั้งหมด</h3></div>
            <div id="adminProductList" class="space-y-2"></div><div id="pagination" class="flex justify-center gap-1.5 mt-6"></div>
        </div>`;
    renderAdminProductList(); renderPresets();
}

/* ==========================================
   5. UTILS & ACTIONS
   ========================================== */
function saveShopInfo() {
    db.config.shopName = document.getElementById('cfgShopName').value;
    db.config.shopProfile = document.getElementById('cfgShopProfile').value;
    db.config.adminPass = document.getElementById('cfgAdminPass').value;
    // ใหม่: ข้อความเลื่อน
    db.config.marqueeText = document.getElementById('cfgMarqueeText').value;
    db.saveConfig(db.config); 
    alert("บันทึกการตั้งค่าแล้ว! ✨"); 
    init();
}

function renderAdminProductList() {
    const cont = document.getElementById('adminProductList'); const pAll = db.products.filter(p => adminFilterCat === 'ทั้งหมด' || p.category === adminFilterCat);
    const perPage = 10; const total = Math.ceil(pAll.length / perPage);
    const items = pAll.slice((currentAdminPage-1)*perPage, currentAdminPage*perPage);
    cont.innerHTML = items.map((p) => {
        const idx = db.products.indexOf(p);
        return `<div class="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100 text-[10px]">
            <img src="${p.img}" class="w-9 h-9 rounded object-cover border"><div class="flex-1 font-bold truncate text-main">${p.name}</div>
            <button onclick="editProduct(${idx})" class="text-blue-500 font-bold">แก้ไข</button><button onclick="deleteProduct(${idx})" class="text-red-400 font-bold">ลบ</button></div>`;
    }).join('');
    const pag = document.getElementById('pagination'); pag.innerHTML = "";
    for(let i=1; i<=total; i++) pag.innerHTML += `<button onclick="currentAdminPage=${i}; renderAdminProductList()" class="page-btn ${i===currentAdminPage?'active':''}">${i}</button>`;
}

function editProduct(idx) {
    const p = db.products[idx];
    document.getElementById('admName').value = p.name;
    document.getElementById('admPrice').value = p.price;
    document.getElementById('admDisc').value = p.discount;
    document.getElementById('admCat').value = p.category;
    document.getElementById('admSub').value = p.subCategory;
    document.getElementById('admBrand').value = p.brand;
    document.getElementById('admImg').value = p.img;
    document.getElementById('admDesc').value = p.desc || "";
    document.getElementById('admFeat').checked = p.featured;
    document.getElementById('admLimit').checked = p.limitOne;
    db.products.splice(idx,1);
    document.getElementById('productFormPart').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function finalizeOrder() {
    const hasFontOrDeco = cart.some(i => i.category === "ฟอนต์" || i.category === "ของตกแต่ง");
    const hasGroup = cart.some(i => i.category === "รวมกลุ่ม");
    document.getElementById('cartPage').classList.add('hidden'); const rec = document.getElementById('receiptPage'); rec.classList.remove('hidden');
    let total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    rec.innerHTML = `<div class="p-6">
        <div class="receipt-card p-6 shadow-sm mb-6 border-main text-main"><h2 class="text-center font-bold mb-4 text-lg">ใบเสร็จสั่งซื้อ</h2><div class="space-y-2 text-[11px] border-b border-dashed border-gray-200 pb-4 mb-4">
        ${cart.map(i => `<div class="flex justify-between"><span>${i.name} x${i.qty}</span><span class="font-bold">฿${(i.price-i.discount)*i.qty}</span></div>`).join('')}</div>
        <div class="flex justify-between font-black text-lg text-main"><span>รวมทั้งสิ้น</span><span>฿${total}</span></div></div>
        <div class="bg-white p-6 rounded-3xl shadow-sm mb-6 space-y-4 border border-gray-100">
            <h3 class="font-bold text-sm text-main">ข้อมูลติดต่อ</h3>
            ${hasFontOrDeco ? `<input type="email" id="cusEmail" placeholder="ระบุอีเมลรับไฟล์ (หมวดฟอนต์)" class="w-full p-4 border rounded-2xl text-sm outline-none">` : ''}
            ${hasGroup ? `<input type="text" id="cusLine" placeholder="ระบุ LINE ID (หมวดรวมกลุ่ม)" class="w-full p-4 border rounded-2xl text-sm outline-none">` : ''}
        </div>
        <div class="bg-white p-6 rounded-3xl shadow-sm text-center mb-6 border border-main text-xs">
            <p class="font-bold text-gray-400 mb-2 uppercase">ชำระเงินที่</p><p class="font-black text-xl mb-4 text-main">${db.config.paymentNo}</p>
            <div class="p-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50"><img src="${db.config.paymentQR}" class="w-32 mx-auto"></div>
        </div>
        <button onclick="sendToLine()" class="w-full bg-[#06C755] text-white py-5 rounded-2xl font-bold shadow-lg">แจ้งโอนเงินผ่าน LINE</button>
        <button onclick="location.reload()" class="w-full text-gray-400 text-xs mt-6 font-bold">กลับหน้าหลัก</button></div>`;
}

function sendToLine() {
    let m = `🛒 ออเดอร์ใหม่จากแอป:\n` + cart.map(i => `- ${i.name} x${i.qty}`).join('\n');
    if(document.getElementById('cusEmail')) m += `\n📧 Email: ${document.getElementById('cusEmail').value}`;
    if(document.getElementById('cusLine')) m += `\n🆔 LineID: ${document.getElementById('cusLine').value}`;
    m += `\n💰 ยอดรวม: ${cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0)}.-`;
    navigator.clipboard.writeText(m); alert("คัดลอกข้อความสรุปยอดแล้ว ✨"); 
    window.location.href = "https://line.me/ti/p/~@309ranuu";
}

function saveProductAdmin() {
    const p = { 
        name: document.getElementById('admName').value, price: Number(document.getElementById('admPrice').value), discount: Number(document.getElementById('admDisc').value), 
        category: document.getElementById('admCat').value, subCategory: document.getElementById('admSub').value, brand: document.getElementById('admBrand').value, 
        img: document.getElementById('admImg').value || "https://picsum.photos/400/400", desc: document.getElementById('admDesc').value, 
        featured: document.getElementById('admFeat').checked, limitOne: document.getElementById('admLimit').checked 
    };
    if(!p.name || !p.price) return alert("กรุณาระบุชื่อและราคา");
    db.products.unshift(p); db.saveProducts(db.products); renderAdminDashboard();
}

function deleteProduct(idx) { myConfirm("ต้องการลบสินค้านี้ใช่ไหม?", () => { db.products.splice(idx,1); db.saveProducts(db.products); renderAdminDashboard(); }); }
function addTax(k) { const v = prompt(`เพิ่มรายการใน ${k}:`); if(v) { db.taxonomy[k.charAt(0).toLowerCase()+k.slice(1)].push(v); db.saveTaxonomy(db.taxonomy); renderAdminDashboard(); } }
function removeTax(k, i) { myConfirm(`ลบรายการนี้ใน ${k}?`, () => { db.taxonomy[k.charAt(0).toLowerCase()+k.slice(1)].splice(i, 1); db.saveTaxonomy(db.taxonomy); renderAdminDashboard(); }); }

function renderCategoryFilter() {
    const cont = document.getElementById('categoriesContainer'); const tax = db.getTaxonomy();
    cont.innerHTML = `<button onclick="renderStore('ทั้งหมด')" class="bg-white px-4 py-2 rounded-full text-xs font-bold border border-gray-100 shadow-sm">ทั้งหมด</button>` +
        tax.categories.map(c => `<button onclick="renderStore('${c}')" class="bg-white px-4 py-2 rounded-full text-xs font-bold border border-gray-100 whitespace-nowrap shadow-sm">${c}</button>`).join('');
}

function scrollToProducts() { document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' }); }
function openCartPage() { document.getElementById('mainPage').classList.add('hidden'); document.getElementById('cartPage').classList.remove('hidden'); renderCart(); }
function closeCartPage() { document.getElementById('cartPage').classList.add('hidden'); document.getElementById('mainPage').classList.remove('hidden'); }
function updateQty(idx, d) { cart[idx].qty += d; if(cart[idx].qty <= 0) cart.splice(idx,1); updateCartCount(); renderCart(); }

function renderCart() {
    const cont = document.getElementById('cartItemsContainer'); const summary = document.getElementById('receiptSummary');
    if(cart.length === 0) { cont.innerHTML = `<p class="text-center py-20 text-gray-400">ยังไม่มีสินค้าในตะกร้า</p>`; summary.innerHTML = ""; return; }
    cont.innerHTML = cart.map((i, idx) => `
        <div class="card-bg p-3 rounded-2xl flex gap-3 items-center border-gray-50 shadow-sm">
            <img src="${i.img}" class="w-12 h-12 rounded-lg object-cover">
            <div class="flex-1 font-bold text-xs text-main">${i.name}</div>
            <div class="flex items-center gap-2"><button onclick="updateQty(${idx},-1)" class="w-7 h-7 border rounded shadow-sm">-</button><span class="w-4 text-center">${i.qty}</span><button onclick="updateQty(${idx},1)" class="w-7 h-7 border rounded shadow-sm">+</button></div>
            <button onclick="removeCartItem(${idx})" class="text-red-400 px-2 font-bold text-lg">×</button>
        </div>`).join('');
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    summary.innerHTML = `<button onclick="finalizeOrder()" class="w-full btn-main py-4 rounded-[20px] font-bold shadow-lg active:scale-95 transition-transform">สรุปยอดสั่งซื้อ ฿${total}</button>`;
}

function removeCartItem(idx) { myConfirm("ต้องการลบสินค้าชิ้นนี้ออกจากตะกร้า?", () => { cart.splice(idx,1); updateCartCount(); renderCart(); }); }

window.onload = init;
