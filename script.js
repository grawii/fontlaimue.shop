/* ==========================================
   1. GLOBAL VARIABLES & INITIALIZATION
   ========================================== */
let currentAdminPage = 1;
let adminFilterCat = "ทั้งหมด";
let storeFilterCat = "ทั้งหมด";
let storeFilterStyle = "ทั้งหมด";
let cart = JSON.parse(localStorage.getItem('temp_cart')) || [];
let currentHistoryTab = "order";
let currentAuthTab = "user"; 
let isRegisterMode = false;
let currentReviewStarFilter = "all";
let currentInputStarValue = 5;

// 📝 ระบบรองรับการจำกัดจำนวนโควตาแก้อีมูเลเตอร์รีวิวของลูกค้าไม่เกิน 2 ครั้ง
let reviewsData = JSON.parse(localStorage.getItem('web_reviews')) || [
    { id: "rev_1", name: "คุณเอิร์น", score: 5, date: "14 พ.ค. 2567", text: "ฟอนต์สวยงาม ใช้งานง่าย ทางร้านบริการดีมากครับ", editCount: 0 },
    { id: "rev_2", name: "คุณนัท", score: 4, date: "15 พ.ค. 2567", text: "น่ารักมากค่ะ จัดส่งไวมาก", editCount: 0 },
    { id: "rev_3", name: "คุณมิว", score: 5, date: "20 พ.ค. 2567", text: "ชอบฟอนต์ DekDec มากกกก เส้นมินิมอลถูกใจสายตกแต่ง", editCount: 0 }
];

window.onload = function() {
    if (!window.db) return;
    init();
};

function init() {
    const cfg = window.db.getConfig();
    if(document.getElementById('shopName')) document.getElementById('shopName').innerText = cfg.shopName;
    if(document.getElementById('shopProfile')) document.getElementById('shopProfile').src = cfg.shopProfile;
    
    const marqueeMsg = cfg.marqueeText || "";
    if(document.getElementById('marqueeDisplay')) document.getElementById('marqueeDisplay').innerText = marqueeMsg;
    if(document.getElementById('marqueeDisplay2')) document.getElementById('marqueeDisplay2').innerText = marqueeMsg;

    if(document.getElementById('bankNoDisplay')) document.getElementById('bankNoDisplay').innerText = `เลขบัญชีร้าน: ${cfg.paymentNo}`;
    if(document.getElementById('bankQRDisplay')) document.getElementById('bankQRDisplay').src = cfg.paymentQR;

    const promoCount = cfg.promotions ? cfg.promotions.length : 0;
    if(document.getElementById('promoBadgeCount')) document.getElementById('promoBadgeCount').innerText = promoCount;

    applyTheme(); 
    renderCategoryFilter(); 
    renderStore(); 
    updateCartCount();
    updateCreditDisplay();
}

function updateCreditDisplay() {
    const userArea = document.getElementById('userStatusArea');
    const arrow = document.getElementById('dropdownArrowIcon');
    const u = window.db.getCurrentUser();
    if (!userArea) return;
    
    if (u) {
        userArea.innerHTML = `
            <div class="text-[11px] font-bold select-none text-right">
                <span class="text-main block max-w-[110px] truncate">👤 ${u.username}</span>
                <span class="text-green-600 block mt-0.5">฿${u.credit}</span>
            </div>
        `;
        if (arrow) arrow.classList.remove('hidden');
    } else {
        userArea.innerHTML = `
            <button onclick="openUnifiedAuthModal()" class="theme-bg-btn text-btn-link px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95">
                ลงชื่อเข้าใช้
            </button>
        `;
        if (arrow) arrow.classList.add('hidden');
    }
}

function backToStoreHome() {
    storeFilterCat = 'ทั้งหมด'; storeFilterStyle = 'ทั้งหมด';
    renderCategoryFilter(); renderStore(); hideAllPages(); showMainLayout();
}

function myConfirm(msg, onOk) {
    const modal = document.getElementById('customConfirm'); if(!modal) return;
    document.getElementById('confirmMsg').innerText = msg; modal.classList.remove('hidden');
    document.getElementById('confirmOk').onclick = () => { modal.classList.add('hidden'); onOk(); };
    document.getElementById('confirmCancel').onclick = () => { modal.classList.add('hidden'); };
}

/* ==========================================
   ⚙️ ระบบควบคุมสลับโทนผ่าน CSS Variables 8 แกนหลัก
   ========================================== */
function applyTheme() {
    const cfg = window.db.getConfig(); const t = cfg.theme; const root = document.documentElement; if(!t) return;
    root.style.setProperty(`--th-bg`, t.bg || "#202430");
    root.style.setProperty(`--th-card`, t.card || "#282d3c");
    root.style.setProperty(`--th-border`, t.border || "#3a4358");
    root.style.setProperty(`--th-text`, t.text || "#ffffff");
    root.style.setProperty(`--th-muted`, t.muted || "#9ea8be");
    root.style.setProperty(`--th-primary`, t.primary || "#7082a6");
    root.style.setProperty(`--th-secondary`, t.secondary || t.primary);
    root.style.setProperty(`--th-accent`, t.accent || t.primary);
    
    // คำนวณความสว่างสีหลักเพื่อปรับสีตัวอักษรบนปุ่ม (ป้องกันปุ่มกลืนใน Light Mode)
    const isLight = isHexColorLight(t.primary || "#7082a6");
    root.style.setProperty(`--th-btn-text-color`, isLight ? "#111111" : "#ffffff");

    renderCategoryFilter(); 
    if(document.getElementById('adminDashboard') && !document.getElementById('adminDashboard').classList.contains('hidden')) {
        renderPresets();
    }
}

function isHexColorLight(color) {
    const hex = color.replace('#', '');
    const cr = parseInt(hex.substr(0, 2), 16);
    const cg = parseInt(hex.substr(2, 2), 16);
    const cb = parseInt(hex.substr(4, 2), 16);
    const brightness = (cr * 299 + cg * 587 + cb * 114) / 1000;
    return brightness > 155;
}

/* ==========================================
   2. PROMOTION SYSTEM
   ========================================== */
function openPromotionModal() {
    const cfg = window.db.getConfig(); const container = document.getElementById('promoCarouselContainer'); if(!container) return;
    if(!cfg.promotions || cfg.promotions.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-sub w-full text-xs">ขณะนี้ยังไม่มีโปรโมชั่นจัดขึ้นค่ะ</div>`;
    } else {
        container.innerHTML = cfg.promotions.map(p => `
            <div class="promo-slide-card text-center space-y-3">
                <h4 class="text-xs font-bold text-main line-clamp-1 px-2">${p.title}</h4>
                <img src="${p.img}" class="w-full rounded-2xl aspect-[4/3] object-cover border border-main shadow-inner">
                <button onclick="linkToPromoProducts('${p.brandLink}')" class="w-[90%] mx-auto py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[10px] shadow-sm flex items-center justify-center gap-1">
                    <i class="fa-solid fa-basket-shopping"></i> ดูสินค้าโปรโมชั่นเครือ ${p.brandLink}
                </button>
            </div>
        `).join('');
    }
    document.getElementById('promotionModal').classList.remove('hidden');
}
function closePromotionModal() { if(document.getElementById('promotionModal')) document.getElementById('promotionModal').classList.add('hidden'); }
function linkToPromoProducts(brandName) {
    closePromotionModal(); hideAllPages(); showMainLayout();
    let list = window.db.getProducts().filter(p => p.brand === brandName);
    storeFilterCat = "ทั้งหมด"; renderCategoryFilter(); renderStoreCards(list);
    if(document.getElementById('productsSection')) document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==========================================
   3. UNIFIED LOGIN CONTROLLER
   ========================================== */
function openUnifiedAuthModal() {
    if(document.getElementById('unifiedAuthModal')) document.getElementById('unifiedAuthModal').classList.remove('hidden');
    switchUnifiedTab('user');
}
function switchUnifiedTab(type) {
    currentAuthTab = type; isRegisterMode = false;
    const userBtn = document.getElementById('tabAuthUserBtn'); const adminBtn = document.getElementById('tabAuthAdminBtn');
    const userForm = document.getElementById('formAuthUser'); const adminForm = document.getElementById('formAuthAdmin');
    if(userBtn && adminBtn) {
        if(type === 'user') {
            userBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
            adminBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
            if(userForm) userForm.classList.remove('hidden'); if(adminForm) adminForm.classList.add('hidden');
            if(document.getElementById('mainUserAuthBtn')) {
                document.getElementById('mainUserAuthBtn').innerText = "ลงชื่อเข้าใช้งาน";
                document.getElementById('mainUserAuthBtn').className = "w-full theme-bg-btn text-btn-link py-3 rounded-xl font-bold transition-all active:scale-95";
            }
            if(document.getElementById('toggleRegBtn')) document.getElementById('toggleRegBtn').classList.remove('hidden');
        } else {
            adminBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
            userBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
            if(adminForm) adminForm.classList.remove('hidden'); if(userForm) userForm.classList.add('hidden');
        }
    }
}
function toggleRegisterMode() {
    isRegisterMode = !isRegisterMode;
    if(document.getElementById('mainUserAuthBtn')) document.getElementById('mainUserAuthBtn').innerText = isRegisterMode ? "ยืนยันการสมัครสมาชิก" : "ลงชื่อเข้าใช้งาน";
    if(document.getElementById('toggleRegBtn')) document.getElementById('toggleRegBtn').innerText = isRegisterMode ? "มีบัญชีอยู่แล้ว? สลับกลับไปเข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิกใหม่ที่นี่";
}
function processUserAuth() {
    const uInput = document.getElementById('authUsername'); const pInput = document.getElementById('authPassword'); if(!uInput || !pInput) return;
    const user = uInput.value.trim(); const pass = pInput.value.trim(); if(user === "" || pass === "") return alert("กรุณากรอกชื่อและรหัสผ่าน");
    let members = window.db.getMembers();
    if(isRegisterMode) {
        if(members.some(m => m.username === user)) return alert("ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว");
        const newMem = { username: user, password: pass, credit: 0, email: "", orderHistory: [], topupHistory: [] };
        members.push(newMem); window.db.saveMembers(members); window.db.saveCurrentUser(newMem); alert("สมัครสมาชิกเรียบร้อยค่ะ");
    } else {
        const mem = members.find(m => m.username === user && m.password === pass); if(!mem) return alert("ข้อมูลไม่ถูกต้อง");
        window.db.saveCurrentUser(mem); alert(`ยินดีต้อนรับคุณ ${user} ค่ะ`);
    }
    uInput.value = ""; pInput.value = "";
    if(document.getElementById('unifiedAuthModal')) document.getElementById('unifiedAuthModal').classList.add('hidden'); 
    updateCreditDisplay();
}
function logoutUser() { 
    window.db.saveCurrentUser(null); closeSubPage('userMenuPage'); closeSubPage('topupPage');
    const dropdown = document.getElementById('userDropdownMenu'); if (dropdown) { dropdown.style.maxHeight = "0px"; dropdown.style.opacity = "0"; }
    updateCreditDisplay(); alert("ออกจากระบบแล้ว"); 
}
function handleGearIconClick() {
    const u = window.db.getCurrentUser(); if (u) goToUserSubPage('editProfile'); else openUnifiedAuthModal();
}

/* ==========================================
   4. STOREFRONT RENDER & FILTER
   ========================================== */
function openAllCategoriesPage() {
    hideAllPages(); if(document.getElementById('allCategoriesPage')) document.getElementById('allCategoriesPage').classList.remove('hidden');
    const tax = window.db.getTaxonomy(); const grid = document.getElementById('allCategoriesGrid');
    if(grid) {
        grid.innerHTML = tax.categories.map(c => `
            <div onclick="selectCategoryFromGrid('${c}')" class="category-select-card shadow-sm theme-bg-card border-main">
                <div class="text-main text-lg mb-2"><i class="fa-solid fa-folder text-amber-400"></i></div>
                <div class="font-bold text-main text-xs">${c}</div>
            </div>`).join('');
    }
}
function selectCategoryFromGrid(catName) { storeFilterCat = catName; renderCategoryFilter(); renderStore(); closeSubPage('allCategoriesPage'); }
function searchProducts(keyword) { const filtered = window.db.getProducts().filter(p => p.name.toLowerCase().includes(keyword.toLowerCase())); renderStoreCards(filtered); }

function renderCategoryFilter() {
    const cont = document.getElementById('categoriesContainer'); const tax = window.db.getTaxonomy(); if(!cont) return;
    let allStyle = storeFilterCat === 'ทั้งหมด' 
        ? 'style="background-color: var(--th-primary); color: var(--th-btn-text-color); border-color: var(--th-border); font-weight: bold;"' 
        : 'style="background-color: var(--th-card); color: var(--th-muted); border-color: var(--th-border);"';
    let html = `<button onclick="storeFilterCat='ทั้งหมด'; renderCategoryFilter(); renderStore();" ${allStyle} class="px-4 py-1.5 rounded-full text-[11px] border whitespace-nowrap shadow-sm transition-all">คลังทั้งหมด</button>`;
    tax.categories.forEach(c => {
        let currentStyle = storeFilterCat === c 
            ? 'style="background-color: var(--th-primary); color: var(--th-btn-text-color); border-color: var(--th-border); font-weight: bold;"' 
            : 'style="background-color: var(--th-card); color: var(--th-muted); border-color: var(--th-border);"';
        html += `<button onclick="storeFilterCat='${c}'; renderCategoryFilter(); renderStore();" ${currentStyle} class="px-4 py-1.5 rounded-full text-[11px] border whitespace-nowrap shadow-sm transition-all">${c}</button>`;
    });
    cont.innerHTML = html;
}
function renderStore() {
    let list = window.db.getProducts(); if(storeFilterCat !== "ทั้งหมด") list = list.filter(p => p.category === storeFilterCat);
    renderStoreCards(list);
}
function renderStoreCards(products) {
    const cont = document.getElementById('productsContainer'); if(!cont) return;
    if(products.length === 0) { cont.innerHTML = `<p class="col-span-2 text-center py-10 text-sub text-xs">ไม่พบรายการสินค้า</p>`; return; }
    cont.innerHTML = products.map((p) => {
        const realIdx = window.db.products.findIndex(item => item.name === p.name);
        return `
        <div class="product-card flex flex-col justify-between h-full theme-bg-card border-main">
            <div onclick="openProductDetail(${realIdx})" class="cursor-pointer">
                <img src="${p.img}" class="w-full aspect-square object-cover rounded-xl mb-2.5 border-main">
                <span class="text-[9px] text-sub font-medium block mb-0.5"><i class="fa-solid fa-folder-open mr-1"></i>${p.category}</span>
                <h4 class="text-[11px] font-bold text-main line-clamp-2 leading-tight h-8">${p.name}</h4>
                <div class="text-[12px] font-black mt-1 text-main">฿${p.price - p.discount}</div>
            </div>
            <button onclick="addToCartDirect(${realIdx})" class="w-full mt-3 theme-bg-btn text-btn-link py-1.5 text-[10px] font-bold rounded-lg shadow-sm active:scale-95 transition-all">➕ ใส่ตะกร้า</button>
        </div>`;
    }).join('');
}

/* ==========================================
   5. REVIEWS SYSTEM (จำกัดโควตาแก้รีวิว 2 ครั้ง / แอดมินลบรีวิว)
   ========================================== */
function openReviewPage() { 
    hideAllPages(); if(document.getElementById('reviewPage')) document.getElementById('reviewPage').classList.remove('hidden'); 
    currentReviewStarFilter = "all"; calculateStarCounters(); renderReviewsList(); 
}
function calculateStarCounters() {
    if(document.getElementById('count-all')) document.getElementById('count-all').innerText = reviewsData.length;
    for(let step=1; step<=5; step++) {
        let totalStar = reviewsData.filter(r => Number(r.score) === step).length;
        if(document.getElementById(`count-${step}`)) document.getElementById(`count-${step}`).innerText = totalStar;
    }
}
function renderReviewsList() {
    let outputList = reviewsData;
    if(currentReviewStarFilter !== "all") {
        outputList = reviewsData.filter(r => Number(r.score) === Number(currentReviewStarFilter));
    }
    const container = document.getElementById('reviewsContainer'); if(!container) return;
    if(outputList.length === 0) {
        container.innerHTML = `<p class="text-center py-10 text-sub text-xs">ยังไม่มีรายการรีวิวในหมวดหมู่นี้</p>`; return;
    }
    const currentUser = window.db.getCurrentUser();
    container.innerHTML = outputList.map(r => {
        // เงื่อนไขเปิดแสดงผลปุ่มแก้สำหรับเจ้าของบัญชี โดยต้องแก้ไม่เกิน 2 ครั้ง
        const isOwner = currentUser && currentUser.username === r.name;
        const remainingEdits = 2 - (r.editCount || 0);
        let editBtnHtml = "";
        if(isOwner) {
            if(remainingEdits > 0) {
                editBtnHtml = `<button onclick="openEditReviewModal('${r.id}')" class="text-blue-400 font-bold ml-2 text-[10px] underline">📝 แก้ไข (${remainingEdits} ครั้ง)</button>`;
            } else {
                editBtnHtml = `<span class="text-gray-500 font-medium ml-2 text-[9px]">(หมดโควตาแก้ไขแล้ว)</span>`;
            }
        }
        return `
        <div class="theme-bg-card border-main border-l-4 border-l-amber-400 p-4 rounded-xl text-xs space-y-1.5 shadow-sm">
            <div class="flex justify-between items-center">
                <span class="font-bold text-main text-[11px]">👤 ${r.name} <span class="text-[9px] font-normal text-sub ml-1">${r.date || 'เมื่อสักครู่'}</span></span>
                <span class="text-yellow-400 font-bold text-[10px]">${'★'.repeat(r.score)}${'☆'.repeat(5-r.score)}</span>
            </div>
            <p class="text-sub leading-relaxed font-medium">${r.text}</p>
            <div class="text-right">${editBtnHtml}</div>
        </div>`;
    }).join('');
}

// เปิดโมดอลแก้ไขรีวิว
function openEditReviewModal(reviewId) {
    const rev = reviewsData.find(r => r.id === reviewId); if(!rev) return;
    const newText = prompt("แก้ไขข้อความรีวิวของคุณที่นี่ค่ะ ✨:", rev.text);
    if(newText === null) return;
    if(!newText.trim()) return alert("กรุณาระบุข้อความรีวิวด้วยค่ะ");
    
    if((rev.editCount || 0) >= 2) return alert("ขออภัยค่ะ คุณสิทธิ์แก้ไขรีวิวนี้ครบพิกัด 2 ครั้งแล้วค่ะ");
    
    rev.text = newText.trim(); rev.editCount = (rev.editCount || 0) + 1; rev.date = "แก้ไขแล้ว";
    localStorage.setItem('web_reviews', JSON.stringify(reviewsData));
    renderReviewsList(); alert("บันทึกการแก้ไขรีวิวของคุณเรียบร้อยแล้วค่ะ! 🐰");
}

function openNewReviewModal() {
    const u = window.db.getCurrentUser(); if(!u) { alert("กรุณาเข้าสู่ระบบก่อนรีวิวค่ะ"); openUnifiedAuthModal(); return; }
    if(document.getElementById('newReviewModal')) document.getElementById('newReviewModal').classList.remove('hidden');
    if(document.getElementById('revInputName')) document.getElementById('revInputName').value = u.username || "";
    if(document.getElementById('revInputText')) document.getElementById('revInputText').value = "";
}
function closeNewReviewModal() { if(document.getElementById('newReviewModal')) document.getElementById('newReviewModal').classList.add('hidden'); }
function submitNewReviewData() {
    const nameInput = document.getElementById('revInputName'); const textInput = document.getElementById('revInputText'); if(!nameInput || !textInput) return;
    const name = nameInput.value.trim(); const text = textInput.value.trim(); if(!name || !text) return alert("กรุณากรอกข้อมูลให้ครบถ้วนค่ะ");
    reviewsData.unshift({ id: "rev_" + Date.now(), name: name, score: currentInputStarValue, date: "วันนี้", text: text, editCount: 0 });
    localStorage.setItem('web_reviews', JSON.stringify(reviewsData));
    closeNewReviewModal(); calculateStarCounters(); renderReviewsList(); alert("บันทึกรีวิวสำเร็จ ขอบคุณค่ะ ✨");
}

/* ==========================================
   6. ADMIN DASHBOARD & ADVANCED CONTROLS
   ========================================== */
function renderAdminDashboard() {
    const dash = document.getElementById('adminDashboard'); if(!dash) return;
    hideAllPages(); dash.classList.remove('hidden');
    const cfg = window.db.config; const t = cfg.theme; const tax = window.db.getTaxonomy();

    const paletteLabels = {
        bg: "🎨 สีพื้นหลังเว็บไซต์หลัก (bg)", card: "📦 สีพื้นหลังกล่องการ์ด & ป็อปอัพ (card)",
        border: "🧼 สีเส้นขอบกรอบโครงสร้าง (border)", text: "✏️ สีข้อความหัวข้อหลัก (text)",
        muted: "✏️ สีข้อความรายละเอียดรอง (muted)", primary: "🛒 สีปุ่มกดทั่วไป 1 (primary)",
        secondary: "📁 สีปุ่มกดทั่วไป 2 (secondary)", accent: "🎀 สีปุ่มกดทั่วไป 3 (accent)"
    };

    dash.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto animate-pop";
    dash.innerHTML = `
        <div class="flex justify-between items-center mb-6 theme-bg-card p-4 rounded-2xl border-main">
            <h2 class="font-bold text-main text-base uppercase">Admin Controls</h2>
            <button onclick="location.reload()" class="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Log out</button>
        </div>
        
        <div class="space-y-6 pb-24 text-xs">
            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold mb-3 text-main">1. ข้อมูลร้านค้า & ลิงก์ระบบไดร์ฟ</h3>
                <input type="text" id="cfgShopName" value="${cfg.shopName}" class="w-full p-3 border border-main rounded-xl mb-2 text-main bg-transparent">
                <input type="text" id="cfgShopProfile" value="${cfg.shopProfile}" class="w-full p-3 border border-main rounded-xl mb-2 text-main bg-transparent">
                <textarea id="cfgMarqueeText" class="w-full p-3 border border-main rounded-xl mb-2 h-16 text-main bg-transparent">${cfg.marqueeText || ""}</textarea>
                <input type="text" id="cfgGasUrl" value="${cfg.googleAppsScriptUrl || ''}" class="w-full p-3 border border-main rounded-xl mb-3 text-main bg-transparent" placeholder="URL ระบบแชร์ไฟล์ในกูเกิลไดร์ฟ">
                <input type="password" id="cfgAdminPass" value="${cfg.adminPass}" class="w-full p-3 border border-main rounded-xl mb-3 text-main bg-transparent">
                <button onclick="saveShopInfo()" class="w-full py-3 theme-bg-btn text-btn-link rounded-xl font-bold shadow-sm">บันทึกข้อมูลหลัก</button>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-1">2. ศูนย์ปรับแต่งโทนสีแกนหลัก (8 แกนควบคุมเสถียรทุกหน้าเว็บ)</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] mb-4">
                    ${Object.keys(paletteLabels).map(k => `
                        <div class="bg-black/10 p-2 rounded-xl border border-main shadow-inner">
                            <span class="font-bold block mb-1 text-main">${paletteLabels[k]}</span>
                            <div class="flex gap-1.5 items-center">
                                <input type="color" oninput="updateColor('${k}', this.value); this.nextElementSibling.value=this.value" value="${t[k] || '#ffffff'}" class="w-8 h-8 rounded border-0 cursor-pointer bg-transparent">
                                <input type="text" value="${t[k] || '#ffffff'}" onchange="updateColor('${k}', this.value); this.previousElementSibling.value=this.value" class="w-full border border-main rounded px-2 py-1 text-[9px] uppercase font-mono theme-bg-card text-main">
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="flex gap-2 mb-3">
                    <button onclick="saveAsPresetAdmin()" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md">✨ บันทึกเป็นพรีเซ็ตใหม่</button>
                    <button onclick="location.reload()" class="flex-1 py-3 bg-gray-500 text-white rounded-xl font-bold shadow-md">❌ ยกเลิกการแก้ไข</button>
                </div>
                <div id="presetList" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-2">3. ระบบตรวจสอบคัดกรองรีวิวร้านค้า (แอดมินลบรีวิวได้)</h3>
                <div id="adminReviewManagementZone" class="space-y-2 max-h-52 overflow-y-auto no-scrollbar"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-2">4. ระบบจัดการโปรโมชั่นสไลด์เดอร์</h3>
                <div class="space-y-2 mb-3" id="adminPromoListZone"></div>
                <div class="p-3 bg-white/5 border border-main rounded-xl space-y-2">
                    <p class="font-bold text-main text-[11px]">➕ เพิ่มโปรโมชั่นใหม่</p>
                    <input type="text" id="addPromoTitle" placeholder="ข้อความหัวข้อโปรโมชั่น" class="w-full p-2 border border-main rounded-lg text-main bg-transparent">
                    <input type="text" id="addPromoImg" placeholder="URL รูปภาพโปรโมชั่น" class="w-full p-2 border border-main rounded-lg text-main bg-transparent">
                    <input type="text" id="addPromoLink" placeholder="ชื่อแบรนด์สินค้าที่เชื่อมโยง" class="w-full p-2 border border-main rounded-lg text-main bg-transparent">
                    <button onclick="addNewPromoData()" class="w-full py-2 bg-amber-500 text-white font-bold rounded-xl text-[10px]">เพิ่มสไลด์โปรโมชั่น</button>
                </div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-2">5. จัดการโครงสร้างแท็ก & หมวดหมู่</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-2 border border-main rounded-xl">
                        <p class="font-bold text-main mb-1">หมวดหลัก</p>
                        <div class="max-h-24 overflow-y-auto space-y-1 mb-2 text-[11px]" id="admTaxCatZone"></div>
                        <div class="flex gap-1"><input type="text" id="newTaxCatInput" class="w-full p-1 border border-main text-main bg-transparent rounded"><button onclick="addTaxonomyItem('categories','newTaxCatInput')" class="px-2 bg-slate-700 text-white rounded">+</button></div>
                    </div>
                    <div class="p-2 border border-main rounded-xl">
                        <p class="font-bold text-main mb-1">สไตล์/หมวดย่อย</p>
                        <div class="max-h-24 overflow-y-auto space-y-1 mb-2 text-[11px]" id="admTaxSubZone"></div>
                        <div class="flex gap-1"><input type="text" id="newTaxSubInput" class="w-full p-1 border border-main text-main bg-transparent rounded"><button onclick="addTaxonomyItem('subCategories','newTaxSubInput')" class="px-2 bg-slate-700 text-white rounded">+</button></div>
                    </div>
                    <div class="p-2 border border-main rounded-xl">
                        <p class="font-bold text-main mb-1">แบรนด์/ผู้สร้าง</p>
                        <div class="max-h-24 overflow-y-auto space-y-1 mb-2 text-[11px]" id="admTaxBrandZone"></div>
                        <div class="flex gap-1"><input type="text" id="newTaxBrandInput" class="w-full p-1 border border-main text-main bg-transparent rounded"><button onclick="addTaxonomyItem('brands','newTaxBrandInput')" class="px-2 bg-slate-700 text-white rounded">+</button></div>
                    </div>
                </div>
            </div>

            <div id="productFormPart" class="theme-bg-card border p-4 rounded-3xl border-main">
                <h3 class="font-bold mb-3 text-main">6. เพิ่ม / แก้ไขสินค้า & สิทธิ์ใน Drive</h3>
                <input type="text" id="admName" placeholder="ชื่อสินค้า *" class="w-full p-3 border border-main rounded-xl mb-2 text-main bg-transparent">
                <div class="flex gap-2 mb-2"><input type="number" id="admPrice" placeholder="ราคาเต็ม" class="w-full p-3 border border-main rounded-xl bg-transparent text-main"><input type="number" id="admDisc" placeholder="ส่วนลด" class="w-full p-3 border border-main rounded-xl bg-transparent text-main"></div>
                <select id="admCat" class="w-full p-3 border border-main rounded-xl mb-2 bg-transparent text-main">${tax.categories.map(c=>`<option value="${c}" style="background:var(--th-card); color:var(--th-text);">${c}</option>`).join('')}</select>
                <select id="admSub" class="w-full p-3 border border-main rounded-xl mb-2 bg-transparent text-main">${tax.subCategories.map(c=>`<option value="${c}" style="background:var(--th-card); color:var(--th-text);">${c}</option>`).join('')}</select>
                <select id="admBrand" class="w-full p-3 border border-main rounded-xl mb-2 bg-transparent text-main">${tax.brands.map(c=>`<option value="${c}" style="background:var(--th-card); color:var(--th-text);">${c}</option>`).join('')}</select>
                <input type="text" id="admImg" placeholder="URL รูป" class="w-full p-3 border border-main rounded-xl mb-2 bg-transparent text-main"><textarea id="admDesc" placeholder="รายละเอียด" class="w-full p-3 border border-main rounded-xl h-16 mb-2 bg-transparent text-main"></textarea>
                <div class="p-3 bg-blue-50/10 border border-main border-dashed rounded-xl mb-3 space-y-2">
                    <label class="flex items-center gap-1 font-bold text-main"><input type="checkbox" id="admDriveShare"> ดึงเมลร่วมสิทธิ์ใน Google Drive อัตโนมัติ</label>
                    <input type="text" id="admDriveFolderId" placeholder="Google Drive Folder ID" class="w-full p-2.5 border border-main rounded-lg bg-transparent text-main">
                </div>
                <div class="flex gap-4 p-2 bg-black/20 rounded-xl mb-3 text-main"><label><input type="checkbox" id="admFeat"> แนะนำ</label><label><input type="checkbox" id="admLimit"> จำกัด 1 ชิ้น</label></div>
                <button onclick="saveProductAdmin()" class="w-full py-3 theme-bg-btn text-btn-link rounded-xl font-bold">บันทึกสินค้าลงคลัง</button>
            </div>
            
            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-3">7. รายการสินค้าปัจจุบันในระบบแอป</h3>
                <div id="adminProductList" class="space-y-2"></div>
                <div id="pagination" class="flex gap-1 justify-center mt-4"></div>
            </div>
        </div>`;
    renderAdminProductList(); renderPresets(); renderAdminPromoList(); renderAdminTaxonomyLists(); renderAdminReviewManagerList();
}

function updateColor(k, v) { window.db.config.theme[k] = v; applyTheme(); }
function saveAsPresetAdmin() {
    const name = prompt("ตั้งชื่อให้พรีเซ็ตสีใหม่ชิ้นนี้ด้วยนะคะ 🎨:"); if (!name || !name.trim()) return;
    if (!window.db.config.themePresets) window.db.config.themePresets = [];
    const colorsCopy = JSON.parse(JSON.stringify(window.db.config.theme));
    window.db.config.themePresets.push({ id: 'custom_' + Date.now(), name: "🎨 " + name.trim(), colors: colorsCopy });
    window.db.saveConfig(window.db.config); renderAdminDashboard(); alert("บันทึกพรีเซ็ตใหม่เรียบร้อยแล้วค่ะ! ✨");
}

// 🪐 คลังเรนเดอร์พรีเซ็ตพร้อมฟังก์ชันเปลี่ยนชื่อแบรนด์และระบบปุ่มลบ
function renderPresets() {
    const list = document.getElementById('presetList'); if(!list) return;
    list.innerHTML = (window.db.config.themePresets || []).map((p) => `
        <div class="flex items-center bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <button onclick="applyPresetAdmin('${p.id}')" class="px-3 py-2 text-[10px] font-bold flex items-center gap-1 text-slate-800 bg-white">
                <span class="w-2 h-2 rounded-full" style="background:${p.colors.primary || '#7082a6'}"></span> ${p.name}
            </button>
            <button onclick="renamePresetAdmin('${p.id}')" class="bg-gray-100 text-gray-600 px-2 py-2 border-l border-gray-200 text-[9px]">ชื่อ</button>
            ${p.id.toString().startsWith('custom_') || p.id.toString().startsWith('p') ? `<button onclick="removePresetAdmin('${p.id}')" class="bg-red-50 text-red-500 px-2 py-2 border-l border-gray-200 text-[10px] font-bold">×</button>` : ''}
        </div>`).join('');
}
function renamePresetAdmin(presetId) {
    const target = window.db.config.themePresets.find(p => p.id === presetId); if(!target) return;
    const newName = prompt("เปลี่ยนชื่อพรีเซ็ตสีนี้เป็น:", target.name);
    if(newName && newName.trim()) {
        target.name = newName.trim(); window.db.saveConfig(window.db.config); renderAdminDashboard();
    }
}
function applyPresetAdmin(presetId) {
    const target = window.db.config.themePresets.find(p => p.id === presetId);
    if (target) {
        window.db.config.theme = JSON.parse(JSON.stringify(target.colors));
        applyTheme(); window.db.saveConfig(window.db.config); renderAdminDashboard();
    }
}
function removePresetAdmin(presetId) {
    myConfirm("ต้องการลบพรีเซ็ตสีนี้ใช่ไหมคะ?", () => {
        window.db.config.themePresets = window.db.config.themePresets.filter(p => p.id !== presetId);
        window.db.saveConfig(window.db.config); renderAdminDashboard();
    });
}
function saveShopInfo() {
    if(document.getElementById('cfgShopName')) window.db.config.shopName = document.getElementById('cfgShopName').value; 
    if(document.getElementById('cfgShopProfile')) window.db.config.shopProfile = document.getElementById('cfgShopProfile').value;
    if(document.getElementById('cfgAdminPass')) window.db.config.adminPass = document.getElementById('cfgAdminPass').value; 
    if(document.getElementById('cfgMarqueeText')) window.db.config.marqueeText = document.getElementById('cfgMarqueeText').value;
    if(document.getElementById('cfgGasUrl')) window.db.config.googleAppsScriptUrl = document.getElementById('cfgGasUrl').value; 
    window.db.saveConfig(window.db.config); alert("บันทึกเรียบร้อย! ✨"); init();
}

/* ==========================================
   🔧 ส่วนแอดมินลบรีวิวร้านค้าขยะ
   ========================================== */
function renderAdminReviewManagerList() {
    const zone = document.getElementById('adminReviewManagementZone'); if(!zone) return;
    if(reviewsData.length === 0) { zone.innerHTML = `<p class="text-sub text-[11px]">ไม่มีประวัติรีวิวร้านค้า</p>`; return; }
    zone.innerHTML = reviewsData.map(r => `
        <div class="flex justify-between items-center p-2.5 border border-main rounded-xl bg-black/25 text-[11px]">
            <div class="truncate max-w-[80%]">
                <span class="font-bold text-main">👤 ${r.name} (${r.score} ดาว)</span>
                <p class="text-sub truncate mt-0.5">${r.text}</p>
            </div>
            <button onclick="deleteReviewByAdmin('${r.id}')" class="text-red-400 font-bold px-2 hover:underline">ลบรีวิว</button>
        </div>`).join('');
}
function deleteReviewByAdmin(reviewId) {
    myConfirm("คุณแน่ใจนะว่าต้องการลบรีวิวชิ้นนี้ของลูกค้าออกจากระบบ?", () => {
        reviewsData = reviewsData.filter(r => r.id !== reviewId);
        localStorage.setItem('web_reviews', JSON.stringify(reviewsData));
        renderAdminReviewManagerList(); calculateStarCounters();
        alert("ลบรีวิวชิ้นดังกล่าวออกจากคลังเรียบร้อยค่ะ");
    });
}

function renderAdminPromoList() {
    const zone = document.getElementById('adminPromoListZone'); if(!zone) return;
    const promos = window.db.config.promotions || [];
    zone.innerHTML = promos.map((p, idx) => `
        <div class="flex justify-between items-center p-2 border border-main rounded-xl bg-black/10">
            <div class="truncate max-w-[80%]"><p class="font-bold text-main line-clamp-1">${p.title}</p></div>
            <button onclick="deletePromoData(${idx})" class="text-red-400 font-bold px-1">ลบ</button>
        </div>`).join('');
}
function addNewPromoData() {
    const tEl = document.getElementById('addPromoTitle'); const iEl = document.getElementById('addPromoImg'); const lEl = document.getElementById('addPromoLink'); if(!tEl || !iEl) return;
    const t = tEl.value.trim(); const i = iEl.value.trim(); const l = lEl.value.trim(); if(!t || !i) return alert("กรุณากรอกข้อมูลโปรโมชั่นให้ครบ");
    if(!window.db.config.promotions) window.db.config.promotions = [];
    window.db.config.promotions.push({ title: t, img: i, brandLink: l || "DekDec Studio" });
    window.db.saveConfig(window.db.config); renderAdminPromoList(); init(); tEl.value = ""; iEl.value = ""; if(lEl) lEl.value = "";
}
function deletePromoData(idx) {
    if(!window.db.config.promotions) return; window.db.config.promotions.splice(idx,1); window.db.saveConfig(window.db.config); renderAdminPromoList(); init();
}
function renderAdminTaxonomyLists() {
    const tax = window.db.getTaxonomy();
    if(document.getElementById('admTaxCatZone')) {
        document.getElementById('admTaxCatZone').innerHTML = tax.categories.map((c, i) => `<div class="flex justify-between text-main"><span>• ${c}</span><span onclick="removeTaxonomyItem('categories',${i})" class="text-red-400 cursor-pointer">🗑️</span></div>`).join('');
    }
    if(document.getElementById('admTaxSubZone')) {
        document.getElementById('admTaxSubZone').innerHTML = tax.subCategories.map((s, i) => `<div class="flex justify-between text-main"><span>• ${s}</span><span onclick="removeTaxonomyItem('subCategories',${i})" class="text-red-400 cursor-pointer">🗑️</span></div>`).join('');
    }
    if(document.getElementById('admTaxBrandZone')) {
        document.getElementById('admTaxBrandZone').innerHTML = tax.brands.map((b, i) => `<div class="flex justify-between text-main"><span>• ${b}</span><span onclick="removeTaxonomyItem('brands',${i})" class="text-red-400 cursor-pointer">🗑️</span></div>`).join('');
    }
}
function addTaxonomyItem(field, inputId) {
    const input = document.getElementById(inputId); if(!input) return; const val = input.value.trim(); if(!val) return;
    const tax = window.db.getTaxonomy(); tax[field].push(val); window.db.saveTaxonomy(tax); input.value = ""; renderAdminDashboard();
}
function removeTaxonomyItem(field, idx) {
    const tax = window.db.getTaxonomy(); tax[field].splice(idx,1); window.db.saveTaxonomy(tax); renderAdminDashboard();
}
function moveProduct(idx, d) { const p = window.db.products; const t = idx + d; if(t >= 0 && t < p.length) { [p[idx], p[t]] = [p[t], p[idx]]; window.db.saveProducts(p); renderAdminProductList(); renderStore(); } }
function renderAdminProductList() {
    const cont = document.getElementById('adminProductList'); if(!cont) return;
    const pAll = window.db.products; const perPage = 10; const total = Math.ceil(pAll.length / perPage);
    const items = pAll.slice((currentAdminPage-1)*perPage, currentAdminPage*perPage);
    cont.innerHTML = items.map((p) => {
        const idx = window.db.products.indexOf(p);
        return `<div class="flex items-center gap-3 p-2 border border-main rounded-2xl text-[10px] text-main bg-black/10">
            <div class="flex flex-col"><button onclick="moveProduct(${idx},-1)" class="text-main font-bold">▲</button><button onclick="moveProduct(${idx},1)" class="text-main font-bold">▼</button></div>
            <img src="${p.img}" class="w-9 h-9 rounded object-cover border border-main"><div class="flex-1 font-bold truncate">${p.name}</div>
            <button onclick="editProduct(${idx})" class="text-blue-400 font-bold">แก้ไข</button><button onclick="deleteProduct(${idx})" class="text-red-400 font-bold">ลบ</button></div>`;
    }).join('');
    const pag = document.getElementById('pagination'); if(!pag) return; pag.innerHTML = "";
    for(let i=1; i<=total; i++) pag.innerHTML += `<button onclick="currentAdminPage=${i}; renderAdminProductList()" class="page-btn ${i===currentAdminPage?'active':''}">${i}</button>`;
}
function editProduct(idx) {
    const p = window.db.products[idx];
    if(document.getElementById('admName')) document.getElementById('admName').value = p.name; if(document.getElementById('admPrice')) document.getElementById('admPrice').value = p.price; if(document.getElementById('admDisc')) document.getElementById('admDisc').value = p.discount;
    if(document.getElementById('admCat')) document.getElementById('admCat').value = p.category; if(document.getElementById('admSub')) document.getElementById('admSub').value = p.subCategory; if(document.getElementById('admBrand')) document.getElementById('admBrand').value = p.brand; if(document.getElementById('admImg')) document.getElementById('admImg').value = p.img; if(document.getElementById('admDesc')) document.getElementById('admDesc').value = p.desc || "";
    if(document.getElementById('admDriveShare')) document.getElementById('admDriveShare').checked = p.autoDriveShare || false; if(document.getElementById('admDriveFolderId')) document.getElementById('admDriveFolderId').value = p.googleDriveFolderId || "";
    window.db.products.splice(idx,1); if(document.getElementById('productFormPart')) document.getElementById('productFormPart').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function deleteProduct(idx) { myConfirm("ต้องการลบสินค้าชิ้นนี้ใช่ไหม?", () => { window.db.products.splice(idx,1); window.db.saveProducts(window.db.products); renderAdminDashboard(); renderStore(); }); }
function saveProductAdmin() {
    const nameEl = document.getElementById('admName'); const priceEl = document.getElementById('admPrice'); if(!nameEl || !priceEl) return;
    const p = { 
        name: nameEl.value, price: Number(priceEl.value), discount: Number(document.getElementById('admDisc') ? document.getElementById('admDisc').value : 0), 
        category: document.getElementById('admCat') ? document.getElementById('admCat').value : "ฟอนต์", subCategory: document.getElementById('admSub') ? document.getElementById('admSub').value : "ลายมือ", brand: document.getElementById('admBrand') ? document.getElementById('admBrand').value : "DekDec Studio", 
        img: (document.getElementById('admImg') && document.getElementById('admImg').value) || "https://picsum.photos/400/400", desc: document.getElementById('admDesc') ? document.getElementById('admDesc').value : "", featured: document.getElementById('admFeat') ? document.getElementById('admFeat').checked : false, limitOne: document.getElementById('admLimit') ? document.getElementById('admLimit').checked : false, autoDriveShare: document.getElementById('admDriveShare') ? document.getElementById('admDriveShare').checked : false, googleDriveFolderId: document.getElementById('admDriveFolderId') ? document.getElementById('admDriveFolderId').value : "" 
    };
    if(!p.name || !p.price) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    window.db.products.unshift(p); window.db.saveProducts(window.db.products); renderAdminDashboard(); renderStore();
}

/* ==========================================
   7. CART & LAYOUT MANAGER
   ========================================== */
function openCartPage() { hideAllPages(); if(document.getElementById('cartPage')) document.getElementById('cartPage').classList.remove('hidden'); renderCart(); }
function renderCart() {
    const cont = document.getElementById('cartItemsContainer'); const summary = document.getElementById('receiptSummary'); if(!cont) return;
    if(cart.length === 0) { cont.innerHTML = `<div class="text-center py-24 text-sub text-xs"><i class="fa-solid fa-basket-shopping text-3xl mb-3 block"></i>ไม่มีสินค้าในตะกร้าของคุณ</div>`; if(summary) summary.innerHTML = ""; return; }
    cont.innerHTML = cart.map((i, idx) => `
        <div class="card-bg p-3 rounded-2xl flex gap-3 items-center border border-main shadow-sm text-xs theme-bg-card">
            <img src="${i.img}" class="w-12 h-12 rounded-xl object-cover border border-main"><div class="flex-1 font-bold text-main truncate">${i.name}</div>
            <div class="flex items-center gap-1.5"><button onclick="updateQty(${idx},-1)" class="w-7 h-7 border border-main rounded-lg theme-bg-card text-main">-</button><span class="w-4 text-center font-bold text-main">${i.qty}</span><button onclick="updateQty(${idx},1)" class="w-7 h-7 border border-main rounded-lg theme-bg-card text-main">+</button></div>
            <button onclick="removeCartItem(${idx})" class="text-red-400 px-1 font-bold text-base">×</button>
        </div>`).join('');
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    if(summary) summary.innerHTML = `<button onclick="finalizeOrder()" class="w-full theme-bg-btn text-btn-link py-4 rounded-2xl font-bold text-xs shadow-xl">สรุปยอดสั่งซื้อทั้งหมด ฿${total}</button>`;
}
function updateQty(idx, d) { cart[idx].qty += d; if(cart[idx].qty <= 0) cart.splice(idx,1); updateCartCount(); renderCart(); }
function removeCartItem(idx) { myConfirm("ลบสินค้าชิ้นนี้ออกจากตะกร้า?", () => { cart.splice(idx,1); updateCartCount(); renderCart(); }); }

function hideAllPages() {
    ['mainPage', 'productDetailPage', 'cartPage', 'receiptPage', 'userMenuPage', 'topupPage', 'reviewPage', 'allCategoriesPage', 'adminDashboard'].forEach(id => {
        const el = document.getElementById(id); if(el) el.classList.add('hidden');
    });
    if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.add('hidden');
    if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.add('hidden');
    if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.add('hidden');
}
function showMainLayout() {
    if(document.getElementById('mainPage')) document.getElementById('mainPage').classList.remove('hidden');
    if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.remove('hidden');
    if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.remove('hidden');
    if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.remove('hidden');
}
function closeSubPage(pageId) { if(document.getElementById(pageId)) document.getElementById(pageId).classList.add('hidden'); showMainLayout(); }
