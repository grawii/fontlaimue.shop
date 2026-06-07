/* ==========================================
   1. GLOBAL VARIABLES & INITIALIZATION
   ========================================== */
let currentAdminPage = 1;
let adminFilterCat = "ทั้งหมด";
let storeFilterCat = "ทั้งหมด";
let storeFilterStyle = "ทั้งหมด";
let cart = JSON.parse(localStorage.getItem('temp_cart')) || [];
let editingPresetIdx = null;
let originalThemeBeforePreset = null;
let currentHistoryTab = "order";
let currentAuthTab = "user"; 
let isRegisterMode = false;

let reviewsData = JSON.parse(localStorage.getItem('web_reviews')) || [
    { name: "คุณเอิร์น", score: 5, date: "14 พ.ค. 2567", text: "ฟอนต์สวยงาม ใช้งานง่าย ทางร้านบริการดีมากครับ" }
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

    // แสดงจำนวนแจ้งเตือนโปรโมชั่นที่ปุ่มกระดิ่ง
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
    const u = window.db.getCurrentUser();
    if(!userArea) return;
    
    if(u) {
        userArea.innerHTML = `
            <div onclick="openUserMenuPage()" class="cursor-pointer text-sub hover:underline">
                👤 สวัสดี, <span class="text-main font-bold">${u.username}</span> | เครดิต: <span class="text-green-600 font-bold">฿${u.credit}</span>
            </div>`;
        if(document.getElementById('userCreditDetail')) document.getElementById('userCreditDetail').innerText = u.credit;
    } else {
        userArea.innerHTML = `<button onclick="openUnifiedAuthModal()" class="text-blue-500 hover:underline"><i class="fa-solid fa-right-to-bracket mr-1"></i>ลงชื่อเข้าใช้ระบบสมาชิก</button>`;
    }
}

function backToStoreHome() {
    storeFilterCat = 'ทั้งหมด';
    storeFilterStyle = 'ทั้งหมด';
    renderStore();
    hideAllPages();
    showMainLayout();
}

function myConfirm(msg, onOk) {
    const modal = document.getElementById('customConfirm'); if(!modal) return;
    document.getElementById('confirmMsg').innerText = msg; modal.classList.remove('hidden');
    document.getElementById('confirmOk').onclick = () => { modal.classList.add('hidden'); onOk(); };
    document.getElementById('confirmCancel').onclick = () => { modal.classList.add('hidden'); };
}

function applyTheme() {
    const t = window.db.config.theme; const root = document.documentElement; if(!t) return;
    ['bg', 'card', 'btn', 'textMain', 'textSub', 'border'].forEach(k => { if(t[k]) root.style.setProperty(`--${k}-color`, t[t[k] ? k : k]); });
}

/* ==========================================
   2. PROMOTION MULTI CARDS SLIDE SYSTEM
   ========================================== */
function openPromotionModal() {
    const cfg = window.db.getConfig();
    const container = document.getElementById('promoCarouselContainer');
    if(!container) return;
    
    if(!cfg.promotions || cfg.promotions.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-gray-400 w-full text-xs">ขณะนี้ยังไม่มีโปรโมชั่นจัดขึ้นค่ะ</div>`;
    } else {
        container.innerHTML = cfg.promotions.map(p => `
            <div class="promo-slide-card text-center space-y-3">
                <h4 class="text-xs font-bold text-main line-clamp-1 px-2">${p.title}</h4>
                <img src="${p.img}" class="w-full rounded-2xl aspect-[4/3] object-cover border shadow-inner">
                <button onclick="linkToPromoProducts('${p.brandLink}')" class="w-[90%] mx-auto py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[10px] shadow-sm flex items-center justify-center gap-1">
                    <i class="fa-solid fa-basket-shopping"></i> 🛒 ดูสินค้าโปรโมชั่นเครือ ${p.brandLink}
                </button>
            </div>
        `).join('');
    }
    document.getElementById('promotionModal').classList.remove('hidden');
}

function closePromotionModal() {
    document.getElementById('promotionModal').classList.add('hidden');
}

function linkToPromoProducts(brandName) {
    closePromotionModal();
    hideAllPages();
    showMainLayout();
    
    let list = window.db.getProducts().filter(p => p.brand === brandName);
    storeFilterCat = "ทั้งหมด"; 
    renderStoreCards(list);
    
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==========================================
   3. UNIFIED LOGIN CONTROLLER
   ========================================== */
function openUnifiedAuthModal() {
    document.getElementById('unifiedAuthModal').classList.remove('hidden');
    switchUnifiedTab('user');
}
function closeUnifiedAuthModal() { document.getElementById('unifiedAuthModal').classList.add('hidden'); }

function switchUnifiedTab(type) {
    currentAuthTab = type; isRegisterMode = false;
    const userBtn = document.getElementById('tabAuthUserBtn'); const adminBtn = document.getElementById('tabAuthAdminBtn');
    const userForm = document.getElementById('formAuthUser'); const adminForm = document.getElementById('formAuthAdmin');
    if(type === 'user') {
        userBtn.className = "flex-1 pb-3 text-main border-b-2 border-main"; adminBtn.className = "flex-1 pb-3 text-gray-400 border-b-2 border-transparent";
        userForm.classList.remove('hidden'); adminForm.classList.add('hidden');
        document.getElementById('authModalTitle').innerText = "เข้าสู่ระบบสมาชิก 🐰"; 
        if(document.getElementById('mainUserAuthBtn')) document.getElementById('mainUserAuthBtn').innerText = "ลงชื่อเข้าใช้งาน";
        if(document.getElementById('toggleRegBtn')) document.getElementById('toggleRegBtn').classList.remove('hidden');
    } else {
        adminBtn.className = "flex-1 pb-3 text-main border-b-2 border-main"; userBtn.className = "flex-1 pb-3 text-gray-400 border-b-2 border-transparent";
        adminForm.classList.remove('hidden'); userForm.classList.add('hidden');
    }
}

function toggleRegisterMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('authModalTitle').innerText = isRegisterMode ? "สมัครสมาชิกใหม่ 🐰" : "เข้าสู่ระบบสมาชิก 🐰";
    document.getElementById('mainUserAuthBtn').innerText = isRegisterMode ? "ยืนยันการสมัครสมาชิก" : "ลงชื่อเข้าใช้งาน";
    document.getElementById('toggleRegBtn').innerText = isRegisterMode ? "มีบัญชีอยู่แล้ว? สลับกลับไปเข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิกใหม่ที่นี่";
}

function processUserAuth() {
    const user = document.getElementById('authUsername').value.trim(); const pass = document.getElementById('authPassword').value.trim();
    if(user === "" || pass === "") return alert("กรุณากรอกชื่อและรหัสผ่าน");
    let members = window.db.getMembers();
    if(isRegisterMode) {
        if(members.some(m => m.username === user)) return alert("ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว");
        const newMem = { username: user, password: pass, credit: 0, email: "", orderHistory: [], topupHistory: [] };
        members.push(newMem); window.db.saveMembers(members); window.db.saveCurrentUser(newMem); alert("สมัครสมาชิกเรียบร้อยค่ะ");
    } else {
        const mem = members.find(m => m.username === user && m.password === pass);
        if(!mem) return alert("ข้อมูลไม่ถูกต้อง");
        window.db.saveCurrentUser(mem); alert(`ยินดีต้อนรับคุณ ${user} ค่ะ`);
    }
    document.getElementById('authUsername').value = ""; document.getElementById('authPassword').value = "";
    closeUnifiedAuthModal(); updateCreditDisplay();
}

function logoutUser() { 
    window.db.saveCurrentUser(null); 
    closeSubPage('userMenuPage'); 
    // สั่งปิดตัวสไลด์บาร์ลงเมื่อล็อกเอาท์
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) { dropdown.style.maxHeight = "0px"; dropdown.style.opacity = "0"; }
    const arrow = document.getElementById('dropdownArrowIcon');
    if (arrow) arrow.style.transform = "rotate(0deg)";
    
    updateCreditDisplay(); 
    alert("ออกจากระบบแล้ว"); 
}

// 🌟 ฟังก์ชันสไลด์แผงลิ้นชักด้านล่าง ขึ้น-ลง แบบแอนิเมชันนุ่มนวล (Smooth Slide) ตามรูปที่วาดมา
function toggleUserDropdown() {
    const u = window.db.getCurrentUser();
    // ถ้ายังไม่ได้ล็อกอิน ไม่ต้องเปิดสไลด์ ให้เด้งหน้าต่างล็อกอินแทนเพื่อความลื่นไหลของระบบ
    if (!u) {
        openUnifiedAuthModal();
        return;
    }
    
    const dropdown = document.getElementById('userDropdownMenu');
    const arrow = document.getElementById('dropdownArrowIcon');
    if (!dropdown) return;
    
    if (dropdown.style.maxHeight === "0px" || dropdown.style.maxHeight === "") {
        // ทำการสไลด์เลื่อนแถบลงมาโชว์เมนู
        dropdown.style.maxHeight = "50px"; 
        dropdown.style.opacity = "1";
        if (arrow) arrow.style.transform = "rotate(180deg)";
    } else {
        // ทำการหดแถบกลับขึ้นไปซ่อน
        dropdown.style.maxHeight = "0px";
        dropdown.style.opacity = "0";
        if (arrow) arrow.style.transform = "rotate(0deg)";
    }
}

// 🌟 ฟังก์ชันตรวจจับเหตุการณ์คลิกนอกกรอบสี่เหลี่ยม เพื่อพับเก็บแถบสไลด์ลงอัตโนมัติ
window.addEventListener('click', function(e) {
    const headerCard = document.getElementById('userHeaderCard');
    const dropdown = document.getElementById('userDropdownMenu');
    const arrow = document.getElementById('dropdownArrowIcon');
    if (headerCard && dropdown && !headerCard.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.maxHeight = "0px";
        dropdown.style.opacity = "0";
        if (arrow) arrow.style.transform = "rotate(0deg)";
    }
});

// 🌟 ฟังก์ชันปรับปรุงโครงสร้าง Render สถานะผู้ใช้ในกรอบแบบใหม่
function updateCreditDisplay() {
    const userArea = document.getElementById('userStatusArea');
    const arrow = document.getElementById('dropdownArrowIcon');
    const u = window.db.getCurrentUser();
    if (!userArea) return;
    
    if (u) {
        // เมื่อล็อกอินแล้ว: แสดงชื่อ ยอดเครดิต และเผยโฉมลูกศรเปิดแผงสไลด์
        userArea.innerHTML = `
            <div class="text-[11px] font-bold select-none">
                <span class="text-main block max-w-[110px] truncate">👤 ${u.username}</span>
                <span class="text-green-600 block mt-0.5">฿${u.credit}</span>
            </div>
        `;
        if (arrow) arrow.classList.remove('hidden');
        if (document.getElementById('userCreditDetail')) document.getElementById('userCreditDetail').innerText = u.credit;
    } else {
        // ยังไม่ล็อกอิน: แสดงปุ่มลงชื่อเข้าใช้ และซ่อนสัญลักษณ์ลูกศร
        userArea.innerHTML = `
            <button onclick="openUnifiedAuthModal()" class="bg-[var(--btn-color)] text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95">
                ลงชื่อเข้าใช้
            </button>
        `;
        if (arrow) arrow.classList.add('hidden');
    }
}

// 🌟 ฟังก์ชันเชื่อมหน้าแยก: กดปุ่มจากแผงสไลด์แล้วพุ่งตรงไปโฟกัสฟิลด์ที่ต้องการทันที
function goToUserSubPage(section) {
    openUserMenuPage();
    
    // พับเก็บแผงสไลด์ด้านบนขึ้นไปหลังกดเลือกเสร็จ
    const dropdown = document.getElementById('userDropdownMenu');
    const arrow = document.getElementById('dropdownArrowIcon');
    if (dropdown) { dropdown.style.maxHeight = "0px"; dropdown.style.opacity = "0"; }
    if (arrow) arrow.style.transform = "rotate(0deg)";
    
    if (section === 'topup') {
        switchHistoryTab('topup');
        setTimeout(() => {
            const topupInput = document.getElementById('topupAmount');
            if (topupInput) {
                topupInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                topupInput.focus();
            }
        }, 150);
    } else if (section === 'editProfile') {
        setTimeout(() => {
            const profileInput = document.getElementById('usrEditName');
            if (profileInput) {
                profileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                profileInput.focus();
            }
        }, 150);
    } else if (section === 'history') {
        switchHistoryTab('order');
    }
}

/* ==========================================
   4. USER PROFILE EDITOR & STOREFRONT
   ========================================== */
function saveUserProfileData() {
    const u = window.db.getCurrentUser(); if(!u) return;
    const newName = document.getElementById('usrEditName').value.trim();
    const newEmail = document.getElementById('usrEditEmail').value.trim();
    const newPass = document.getElementById('usrEditPass').value.trim();
    if(newName === "") return alert("กรุณากรอกชื่อแสดงผลด้วยค่ะ");
    let members = window.db.getMembers();
    u.username = newName; u.email = newEmail; if(newPass !== "") u.password = newPass;
    const idx = members.findIndex(m => m.username === window.db.getCurrentUser().username || m.password === window.db.getCurrentUser().password);
    if(idx !== -1) members[idx] = u;
    window.db.saveMembers(members); window.db.saveCurrentUser(u); alert("บันทึกข้อมูลส่วนตัวสำเร็จ ✨");
    document.getElementById('usrEditPass').value = ""; updateCreditDisplay();
}

function openAllCategoriesPage() {
    hideAllPages(); 
    document.getElementById('allCategoriesPage').classList.remove('hidden');
    const tax = window.db.getTaxonomy();
    document.getElementById('allCategoriesGrid').innerHTML = tax.categories.map(c => `
        <div onclick="selectCategoryFromGrid('${c}')" class="category-select-card shadow-sm bg-white">
            <div class="text-main text-lg mb-2"><i class="fa-solid fa-folder text-amber-400"></i></div>
            <div class="font-bold text-main text-xs">${c}</div>
        </div>`).join('');
}
function selectCategoryFromGrid(catName) { storeFilterCat = catName; renderStore(); closeSubPage('allCategoriesPage'); }
function searchProducts(keyword) { const filtered = window.db.getProducts().filter(p => p.name.toLowerCase().includes(keyword.toLowerCase())); renderStoreCards(filtered); }

function filterStyle(styleName) {
    storeFilterStyle = styleName;
    const btns = document.querySelectorAll('.style-btn');
    btns.forEach(b => { b.className = b.innerText === styleName ? "style-btn active px-4 py-1.5 rounded-full text-[11px] font-medium border btn-main text-white" : "style-btn px-4 py-1.5 rounded-full text-[11px] font-medium border bg-white text-gray-600"; });
    renderStore();
}
function renderStore() {
    let list = window.db.getProducts();
    if(storeFilterCat !== "ทั้งหมด") list = list.filter(p => p.category === storeFilterCat);
    if(storeFilterStyle !== "ทั้งหมด") list = list.filter(p => p.subCategory === storeFilterStyle);
    renderStoreCards(list);
}
function renderStoreCards(products) {
    const cont = document.getElementById('productsContainer'); if(!cont) return;
    if(products.length === 0) { cont.innerHTML = `<p class="col-span-2 text-center py-10 text-gray-400 text-xs">ไม่พบรายการสินค้า</p>`; return; }
    cont.innerHTML = products.map((p) => {
        const realIdx = window.db.products.findIndex(item => item.name === p.name);
        return `
        <div class="product-card flex flex-col justify-between h-full bg-white border">
            <div onclick="openProductDetail(${realIdx})" class="cursor-pointer">
                <img src="${p.img}" class="w-full aspect-square object-cover rounded-xl mb-2.5">
                <span class="text-[9px] text-gray-400 font-medium block mb-0.5"><i class="fa-solid fa-folder-open mr-1"></i>${p.category}</span>
                <h4 class="text-[11px] font-bold text-main line-clamp-2 leading-tight h-8">${p.name}</h4>
                <div class="text-[12px] font-black mt-1 text-main">฿${p.price - p.discount}</div>
            </div>
            <button onclick="addToCartDirect(${realIdx})" class="w-full mt-3 btn-main py-1.5 text-[10px] font-bold rounded-lg shadow-sm active:scale-95 transition-transform">➕ ใส่ตะกร้า</button>
        </div>`;
    }).join('');
}

/* ==========================================
   5. PRODUCT DETAIL & REVIEWS
   ========================================== */
function openProductDetail(idx) {
    const p = window.db.products[idx]; const detail = document.getElementById('productDetailPage'); if(!detail) return;
    hideAllPages(); detail.classList.remove('hidden');
    detail.innerHTML = `
        <div class="sticky top-0 bg-white px-4 py-4 flex items-center justify-between border-b z-10 shadow-sm">
            <button onclick="closeProductDetail()" class="text-main font-bold text-xs"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-main text-sm">รายละเอียดสินค้า</span>
            <div class="w-4"></div>
        </div>
        <div class="p-4 space-y-4 max-w-[520px] mx-auto text-xs">
            <img src="${p.img}" class="w-full rounded-2xl border shadow-sm">
            <div class="flex justify-between items-start">
                <div><h1 class="text-base font-bold text-main">${p.name}</h1><span class="inline-block mt-1 text-[10px] bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">สินค้าพร้อมส่ง</span></div>
                <div class="text-right"><span class="text-lg font-black text-main">฿${p.price-p.discount}</span></div>
            </div>
            <div class="custom-panel-card"><p class="font-bold text-main mb-3">แอปพลิเคชันที่รองรับ</p>
                <div class="space-y-2 text-gray-600"><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Good notes</label><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Canva</label><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Procreate</label></div>
            </div>
            <div class="custom-panel-card"><p class="font-bold text-main mb-1.5">รายละเอียดเพิ่มเติม</p><p class="text-gray-500 leading-relaxed">${p.desc || 'สินค้าพรีเมียมลิขสิทธิ์แท้จากทางร้าน'}</p></div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-3 max-w-[768px] mx-auto z-50 shadow-lg">
            <button onclick="addToCartDirect(${idx}); closeProductDetail();" class="flex-1 py-3.5 border border-main text-main rounded-xl font-bold text-xs bg-white">เพิ่มลงตะกร้า</button>
            <button onclick="buyNowDirect(${idx})" class="flex-1 py-3.5 btn-main text-white rounded-xl font-bold text-xs shadow-md">ซื้อทันที</button>
        </div>`;
}
function buyNowDirect(idx) { addToCartDirect(idx); closeProductDetail(); openCartPage(); }
function closeProductDetail() { document.getElementById('productDetailPage').classList.add('hidden'); showMainLayout(); }

function addToCartDirect(idx) {
    const p = window.db.products[idx]; if(!p) return;
    const exist = cart.find(i => i.name === p.name);
    if(exist) { if(p.limitOne) return alert("จำกัด 1 ชิ้น"); exist.qty++; } else { cart.push({...p, qty: 1}); }
    updateCartCount(); alert("เพิ่มลงตะกร้าแล้วเรียบร้อย 🐰");
}
function updateCartCount() {
    const el = document.getElementById('cartCount'); const total = cart.reduce((s, i) => s + i.qty, 0);
    if(el) { el.innerText = total; el.classList.toggle('hidden', total === 0); }
    localStorage.setItem('temp_cart', JSON.stringify(cart));
}
function openReviewPage() { hideAllPages(); document.getElementById('reviewPage').classList.remove('hidden'); renderReviewsList(); }
function renderReviewsList() {
    document.getElementById('reviewsContainer').innerHTML = reviewsData.map(r => `
        <div class="custom-panel-card text-xs space-y-2 shadow-sm bg-white">
            <div class="flex justify-between items-center"><span class="font-bold text-main">${r.name}</span><span class="text-yellow-400 font-bold">${'★'.repeat(5)}</span></div>
            <p class="text-gray-600 font-medium">${r.text}</p>
        </div>`).join('');
}
function addNewReviewPrompt() {
    const name = prompt("ระบุชื่อของคุณ:"); const text = prompt("พิมพ์ข้อความรีวิว:");
    if(name && text) { reviewsData.unshift({ name: name, score: 5, date: "วันนี้", text: text }); localStorage.setItem('web_reviews', JSON.stringify(reviewsData)); renderReviewsList(); }
}

/* ==========================================
   6. USER MENU HISTORIES & TOPUP
   ========================================== */
function openUserMenuPage() { 
    hideAllPages(); const u = window.db.getCurrentUser(); document.getElementById('userMenuPage').classList.remove('hidden'); 
    document.getElementById('usrEditName').value = u.username; document.getElementById('usrEditEmail').value = u.email || "";
    updateCreditDisplay(); switchHistoryTab('order'); 
}
function switchHistoryTab(tab) {
    currentHistoryTab = tab;
    document.getElementById('tabOrderBtn').className = tab === 'order' ? 'py-2.5 rounded-xl font-bold text-xs bg-white border border-main text-main' : 'py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-400';
    document.getElementById('tabTopupBtn').className = tab === 'topup' ? 'py-2.5 rounded-xl font-bold text-xs bg-white border border-main text-main' : 'py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-400';
    renderHistoryLogs();
}
function submitTopup() {
    const u = window.db.getCurrentUser(); if(!u) return alert("กรุณาเข้าสู่ระบบก่อนค่ะ");
    const amt = Number(document.getElementById('topupAmount').value); if(!amt || amt <= 0) return alert("กรุณากรอกจำนวนเงินเติมเครดิตที่ถูกต้อง");
    myConfirm(`ยืนยันการแจ้งโอนเงินจำนวน ฿${amt} ใช่หรือไม่?`, () => {
        if(!u.topupHistory) u.topupHistory = []; u.topupHistory.unshift({ date: new Date().toLocaleString(), amount: amt, status: "รออนุมัติ" });
        let members = window.db.getMembers(); const idx = members.findIndex(m => m.username === window.db.getCurrentUser().username);
        if(idx !== -1) members[idx] = u; window.db.saveMembers(members); window.db.saveCurrentUser(u);
        document.getElementById('topupAmount').value = ""; renderHistoryLogs(); window.location.href = "https://line.me/ti/p/~@309ranuu";
    });
}
function renderHistoryLogs() {
    const cont = document.getElementById('historyLogsContainer'); const u = window.db.getCurrentUser(); if(!cont || !u) return;
    if(currentHistoryTab === 'order') {
        if(!u.orderHistory || u.orderHistory.length === 0) { cont.innerHTML = `<p class="text-center text-gray-400 py-6 text-xs">ไม่มีประวัติการสั่งซื้อสินค้า</p>`; return; }
        cont.innerHTML = u.orderHistory.map(h => `<div class="bg-white p-3 rounded-2xl border text-[11px] shadow-sm"><div class="flex justify-between text-gray-400"><span>📅 ${h.date}</span><span class="font-bold text-main">฿${h.total}</span></div><div class="font-semibold mt-1 text-gray-700">${h.items}</div></div>`).join('');
    } else {
        if(!u.topupHistory || u.topupHistory.length === 0) { cont.innerHTML = `<p class="text-center text-gray-400 py-6 text-xs">ไม่มีประวัติการเติมเครดิตค้างอยู่</p>`; return; }
        cont.innerHTML = u.topupHistory.map(h => `<div class="bg-white p-3 rounded-2xl border text-[11px] shadow-sm flex justify-between items-center"><div><p>📅 ${h.date}</p><p class="text-[9px] text-orange-400">${h.status}</p></div><div class="font-black text-main">+฿${h.amount}</div></div>`).join('');
    }
}

/* ==========================================
   7. INTERACTIVE THEME PRESETS ENGINE (ระบบจัดการพรีเซ็ตสีหลัก)
   ========================================== */
function savePreset() { 
    const currentTheme = JSON.parse(JSON.stringify(window.db.config.theme));
    if (editingPresetIdx !== null) {
        const target = window.db.config.presets[editingPresetIdx];
        myConfirm(`บันทึกสีทับพรีเซ็ต "${target.name}" ใช่หรือไม่?`, () => {
            window.db.config.presets[editingPresetIdx] = { name: target.name, ...currentTheme };
            window.db.saveConfig(window.db.config); editingPresetIdx = null; originalThemeBeforePreset = null; renderAdminDashboard();
            alert("อัปเดตพรีเซ็ตสีเรียบร้อยแล้วค่ะ ✨");
        });
    } else {
        const n = prompt("ตั้งชื่อพรีเซ็ตสี:"); if(n) { if(!window.db.config.presets) window.db.config.presets=[]; window.db.config.presets.push({name:n, ...currentTheme}); window.db.saveConfig(window.db.config); renderAdminDashboard(); }
    }
}
function renderPresets() {
    const list = document.getElementById('presetList'); if(!list) return;
    const presetsHtml = (window.db.config.presets || []).map((p, i) => `
        <div class="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <button onclick="applyPreset(${i})" class="px-3 py-2 text-[10px] font-bold flex items-center gap-1 text-main"><span class="w-2 h-2 rounded-full" style="background:${p.btn || '#102A43'}"></span> ${p.name}</button>
            <button onclick="renamePreset(${i})" class="bg-green-50 text-green-600 px-2 py-2 border-l text-[10px]"><i class="fa-solid fa-tag"></i></button>
            <button onclick="prepareEditPreset(${i})" class="bg-blue-50 text-blue-500 px-2 py-2 border-l text-[10px]"><i class="fa-solid fa-pen"></i></button>
            <button onclick="removePreset(${i})" class="bg-red-50 text-red-500 px-2 py-2 border-l text-[10px] font-bold">×</button>
        </div>`).join('');
    const backBtn = originalThemeBeforePreset ? `<button onclick="revertTheme()" class="flex-shrink-0 bg-red-500 text-white px-3 py-2 rounded-xl text-[10px] font-bold shadow-sm mr-1.5"><i class="fa-solid fa-xmark"></i> Cancel Color</button>` : '';
    list.innerHTML = backBtn + presetsHtml;
}
function applyPreset(i) { 
    if (!originalThemeBeforePreset) { originalThemeBeforePreset = JSON.parse(JSON.stringify(window.db.config.theme)); }
    const p = window.db.config.presets[i]; Object.keys(window.db.config.theme).forEach(k => { if(p[k]) window.db.config.theme[k] = p[k]; }); 
    applyTheme(); window.db.saveConfig(window.db.config); renderAdminDashboard(); 
}
function revertTheme() { if (originalThemeBeforePreset) { window.db.config.theme = JSON.parse(JSON.stringify(originalThemeBeforePreset)); originalThemeBeforePreset = null; applyTheme(); window.db.config.theme = JSON.parse(JSON.stringify(window.db.config.theme)); window.db.saveConfig(window.db.config); renderAdminDashboard(); } }
function prepareEditPreset(i) { editingPresetIdx = i; alert("เข้าสู่โหมดปรับสีพรีเซ็ต เลือกสีใหม่แล้วกดปุ่มยืนยันบันทึกทับค่ะ"); renderAdminDashboard(); }
function cancelEditPresetMode() { editingPresetIdx = null; renderAdminDashboard(); }
function renamePreset(i) { const n = prompt("ระบุชื่อใหม่สำหรับพรีเซ็ตสีนี้:", window.db.config.presets[i].name); if(n && n.trim() !== "") { window.db.config.presets[i].name = n.trim(); window.db.saveConfig(window.db.config); renderAdminDashboard(); } }
function removePreset(i) { myConfirm("ต้องการลบพรีเซ็ตสีนี้ใช่ไหม?", () => { window.db.config.presets.splice(i, 1); window.db.saveConfig(window.db.config); renderAdminDashboard(); }); }

/* ==========================================
   8. ADMIN BACKEND DASHBOARD (ผูกกล่องพรีเซ็ตสีกลับเข้าประจำการ)
   ========================================== */
function checkAdminPassword() { 
    if(document.getElementById('adminPasswordInput').value === window.db.config.adminPass) { closeUnifiedAuthModal(); document.getElementById('adminPasswordInput').value = ""; renderAdminDashboard(); } else alert("รหัสผ่านไม่ถูกต้อง!"); 
}

function renderAdminDashboard() {
    const dash = document.getElementById('adminDashboard'); hideAllPages(); dash.classList.remove('hidden');
    const cfg = window.db.config; const t = cfg.theme; const tax = window.db.getTaxonomy();

    const promoListHtml = (cfg.promotions || []).map((p, i) => `
        <div class="flex items-center justify-between p-2.5 bg-white border rounded-xl text-[11px]">
            <div class="truncate pr-2">📌 <strong>${p.title}</strong> → เครือ: <span class="text-amber-600 font-bold">${p.brandLink}</span></div>
            <button onclick="removePromotionAdmin(${i})" class="text-red-500 font-bold px-2">ลบ</button>
        </div>`).join('');

    dash.innerHTML = `
        <div class="flex justify-between items-center mb-6"><h2 class="font-bold text-main text-base uppercase">Admin Controls</h2><button onclick="location.reload()" class="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Log out</button></div>
        <div class="space-y-6 pb-24 text-xs">
            <div class="bg-gray-50 p-4 rounded-3xl border">
                <h3 class="font-bold mb-3 text-main">1. ข้อมูลร้านค้า & ลิงก์ระบบไดร์ฟ</h3>
                <input type="text" id="cfgShopName" value="${cfg.shopName}" class="w-full p-3 border rounded-xl mb-2">
                <input type="text" id="cfgShopProfile" value="${cfg.shopProfile}" class="w-full p-3 border rounded-xl mb-2">
                <textarea id="cfgMarqueeText" class="w-full p-3 border rounded-xl mb-2 h-16">${cfg.marqueeText || ""}</textarea>
                <input type="text" id="cfgGasUrl" value="${cfg.googleAppsScriptUrl || ''}" class="w-full p-3 border rounded-xl mb-3" placeholder="URL ระบบแชร์ไฟล์ในกูเกิลไดร์ฟ">
                <input type="password" id="cfgAdminPass" value="${cfg.adminPass}" class="w-full p-3 border rounded-xl mb-3">
                <button onclick="saveShopInfo()" class="w-full py-3 btn-main rounded-xl font-bold">บันทึกข้อมูลหลัก</button>
            </div>
            
            <div class="bg-amber-50/60 p-4 rounded-3xl border border-amber-200">
                <h3 class="font-bold text-xs mb-3 text-amber-900 uppercase"><i class="fa-solid fa-rectangle-ad mr-1"></i> 1.5 จัดการการ์ดโปรโมชั่น (ไอคอนกระดิ่ง)</h3>
                <div class="space-y-2 mb-4">
                    <input type="text" id="addPromoTitle" placeholder="ระบุข้อความ/ชื่อโปรโมชั่น *" class="w-full p-2.5 bg-white border rounded-xl">
                    <input type="text" id="addPromoImg" placeholder="URL ลิงก์รูปภาพโปรโมชั่น (4:3)" class="w-full p-2.5 bg-white border rounded-xl">
                    <div class="flex items-center gap-2">
                        <label class="text-[10px] font-bold text-gray-500 whitespace-nowrap">ผูกลิงก์ไปเครือ:</label>
                        <select id="addPromoBrand" class="w-full p-2 bg-white border rounded-xl">
                            ${tax.brands.map(b => `<option value="${b}">${b}</option>`).join('')}
                        </select>
                    </div>
                    <button onclick="addPromotionAdmin()" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm">➕ เพิ่มการ์ดโปรโมชั่นใหม่</button>
                </div>
                <div class="space-y-1.5 border-t border-amber-200 pt-3">
                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">รายการโปรโมชั่นปัจจุบันที่มีในระบบ:</p>
                    ${promoListHtml || '<p class="text-center text-gray-400 py-2">ไม่มีโปรโมชั่นเปิดใช้งาน</p>'}
                </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-3xl border">
                <h3 class="font-bold text-xs mb-3 text-main">2. ปรับแต่งโทนสี & พรีเซ็ตสี</h3>
                <div class="grid grid-cols-2 gap-2 text-[10px] mb-4">
                    ${Object.keys(t).map(k => `<div>${k}: <div class="flex gap-1"><input type="color" oninput="updateColor('${k}', this.value); this.nextElementSibling.value=this.value" value="${t[k]}" class="w-8 h-8 rounded border-0 cursor-pointer"><input type="text" value="${t[k]}" class="w-full border rounded px-1 text-[8px]"></div></div>`).join('')}
                </div>
                <div class="flex gap-2 mb-3">
                    <button id="savePresetBtn" onclick="savePreset()" class="flex-1 py-3 btn-main rounded-xl font-bold">${editingPresetIdx !== null ? 'ยืนยันบันทึกพรีเซ็ตสีทับ' : 'บันทึกพรีเซ็ตสีใหม่'}</button>
                    ${editingPresetIdx !== null ? `<button onclick="cancelEditPresetMode()" class="bg-gray-200 text-gray-600 px-4 rounded-xl font-bold">ยกเลิก</button>` : ''}
                </div>
                <div id="presetList" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
            </div>

            <div id="productFormPart" class="bg-white border p-4 rounded-3xl border-main">
                <h3 class="font-bold mb-3 text-main">3. เพิ่ม / แก้ไขสินค้า & สิทธิ์ใน Drive</h3>
                <input type="text" id="admName" placeholder="ชื่อสินค้า *" class="w-full p-3 border rounded-xl mb-2">
                <div class="flex gap-2 mb-2"><input type="number" id="admPrice" placeholder="ราคาเต็ม" class="w-full p-3 border rounded-xl"><input type="number" id="admDisc" placeholder="ส่วนลด" class="w-full p-3 border rounded-xl"></div>
                <select id="admCat" class="w-full p-3 border rounded-xl mb-2">${tax.categories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                <select id="admSub" class="w-full p-3 border rounded-xl mb-2">${tax.subCategories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                <select id="admBrand" class="w-full p-3 border rounded-xl mb-2">${tax.brands.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                <input type="text" id="admImg" placeholder="URL รูป" class="w-full p-3 border rounded-xl mb-2"><textarea id="admDesc" placeholder="รายละเอียด" class="w-full p-3 border rounded-xl h-16 mb-2"></textarea>
                <div class="p-3 bg-blue-50/50 border border-dashed rounded-xl mb-3 space-y-2">
                    <label class="flex items-center gap-1 font-bold"><input type="checkbox" id="admDriveShare"> ดึงเมลร่วมสิทธิ์ใน Google Drive อัตโนมัติ</label>
                    <input type="text" id="admDriveFolderId" placeholder="Google Drive Folder ID" class="w-full p-2.5 border rounded-lg">
                </div>
                <div class="flex gap-4 p-2 bg-gray-50 rounded-xl mb-3"><label><input type="checkbox" id="admFeat"> แนะนำ</label><label><input type="checkbox" id="admLimit"> จำกัด 1 ชิ้น</label></div>
                <button onclick="saveProductAdmin()" class="w-full py-3 btn-main rounded-xl font-bold">บันทึกสินค้าลงคลัง</button>
            </div>
            <div class="bg-gray-50 p-4 rounded-3xl border">
                <h3 class="font-bold text-xs mb-3 text-main">4. จัดการหมวดหมู่ป้ายคลังสินค้า & แบรนด์</h3>
                ${['Categories', 'SubCategories', 'Brands'].map(k => `
                    <div class="mb-3"><label class="text-[10px] font-bold text-gray-400 uppercase">${k}</label>
                        <div class="flex flex-wrap gap-1 mt-1">
                            ${tax[k.charAt(0).toLowerCase() + k.slice(1)].map((v, i) => `<span class="bg-white px-2.5 py-1.5 rounded-xl border border-main font-semibold text-main">${v} <button onclick="removeTax('${k}', ${i})" class="text-red-400 font-bold ml-1">×</button></span>`).join('')}
                            <button onclick="addTax('${k}')" class="bg-white w-7 h-7 rounded-xl border border-dashed font-bold text-gray-400 flex items-center justify-center text-sm">+</button>
                        </div>
                    </div>`).join('')}
            </div>
            <div class="bg-white border border-main rounded-3xl p-4 shadow-sm">
                <h3 class="font-bold text-xs mb-3 text-main">5. คลังสินค้าทั้งหมด (กด ▲/▼ เพื่อสลับคิวจัดอันดับ)</h3>
                <div id="adminProductList" class="space-y-2"></div><div id="pagination" class="flex justify-center gap-1.5 mt-6"></div>
            </div>
        </div>`;
    renderAdminProductList(); renderPresets();
}

function addPromotionAdmin() {
    const title = document.getElementById('addPromoTitle').value.trim();
    let img = document.getElementById('addPromoImg').value.trim();
    const brandLink = document.getElementById('addPromoBrand').value;
    
    if(title === "") return alert("กรุณาระบุข้อความโปรโมชั่นด้วยค่ะ");
    if(img === "") img = "https://picsum.photos/400/300?random=" + Math.floor(Math.random()*100);
    
    if(!window.db.config.promotions) window.db.config.promotions = [];
    window.db.config.promotions.push({ title, img, brandLink });
    window.db.saveConfig(window.db.config);
    alert("เพิ่มการ์ดโปรโมชั่นเรียบร้อยแล้วค่ะ! 🎉");
    renderAdminDashboard();
    
    const promoCount = window.db.config.promotions.length;
    if(document.getElementById('promoBadgeCount')) document.getElementById('promoBadgeCount').innerText = promoCount;
}

function removePromotionAdmin(i) {
    myConfirm("คุณต้องการลบการ์ดโปรโมชั่นนี้ใช่ไหม?", () => {
        window.db.config.promotions.splice(i, 1);
        window.db.saveConfig(window.db.config);
        renderAdminDashboard();
        const promoCount = window.db.config.promotions.length;
        if(document.getElementById('promoBadgeCount')) document.getElementById('promoBadgeCount').innerText = promoCount;
    });
}

function saveShopInfo() {
    window.db.config.shopName = document.getElementById('cfgShopName').value; window.db.config.shopProfile = document.getElementById('cfgShopProfile').value;
    window.db.config.adminPass = document.getElementById('cfgAdminPass').value; window.db.config.marqueeText = document.getElementById('cfgMarqueeText').value;
    window.db.config.googleAppsScriptUrl = document.getElementById('cfgGasUrl').value; window.db.saveConfig(window.db.config); alert("บันทึกเรียบร้อย! ✨"); init();
}
function moveProduct(idx, d) { const p = window.db.products; const t = idx + d; if(t >= 0 && t < p.length) { [p[idx], p[t]] = [p[t], p[idx]]; window.db.saveProducts(p); renderAdminProductList(); renderStore(); } }
function renderAdminProductList() {
    const cont = document.getElementById('adminProductList'); const pAll = window.db.products; const perPage = 10; const total = Math.ceil(pAll.length / perPage);
    const items = pAll.slice((currentAdminPage-1)*perPage, currentAdminPage*perPage); if(!cont) return;
    cont.innerHTML = items.map((p) => {
        const idx = window.db.products.indexOf(p);
        return `<div class="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border text-[10px]">
            <div class="flex flex-col"><button onclick="moveProduct(${idx},-1)" class="text-gray-400 font-bold hover:text-main">▲</button><button onclick="moveProduct(${idx},1)" class="text-gray-400 font-bold hover:text-main">▼</button></div>
            <img src="${p.img}" class="w-9 h-9 rounded object-cover border"><div class="flex-1 font-bold truncate text-main">${p.name}</div>
            <button onclick="editProduct(${idx})" class="text-blue-500 font-bold">แก้ไข</button><button onclick="deleteProduct(${idx})" class="text-red-400 font-bold">ลบ</button></div>`;
    }).join('');
    const pag = document.getElementById('pagination'); pag.innerHTML = "";
    for(let i=1; i<=total; i++) pag.innerHTML += `<button onclick="currentAdminPage=${i}; renderAdminProductList()" class="page-btn ${i===currentAdminPage?'active':''}">${i}</button>`;
}
function editProduct(idx) {
    const p = window.db.products[idx]; document.getElementById('admName').value = p.name; document.getElementById('admPrice').value = p.price; document.getElementById('admDisc').value = p.discount;
    document.getElementById('admCat').value = p.category; document.getElementById('admSub').value = p.subCategory; document.getElementById('admBrand').value = p.brand; document.getElementById('admImg').value = p.img; document.getElementById('admDesc').value = p.desc || "";
    if(document.getElementById('admDriveShare')) document.getElementById('admDriveShare').checked = p.autoDriveShare || false; 
    if(document.getElementById('admDriveFolderId')) document.getElementById('admDriveFolderId').value = p.googleDriveFolderId || "";
    window.db.products.splice(idx,1); document.getElementById('productFormPart').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function saveProductAdmin() {
    const p = { name: document.getElementById('admName').value, price: Number(document.getElementById('admPrice').value), discount: Number(document.getElementById('admDisc').value), category: document.getElementById('admCat').value, subCategory: document.getElementById('admSub').value, brand: document.getElementById('admBrand').value, img: document.getElementById('admImg').value || "https://picsum.photos/400/400", desc: document.getElementById('admDesc').value, featured: document.getElementById('admFeat').checked, limitOne: document.getElementById('admLimit').checked, autoDriveShare: document.getElementById('admDriveShare').checked, googleDriveFolderId: document.getElementById('admDriveFolderId').value };
    if(!p.name || !p.price) return alert("กรุณาระบุชื่อและราคา");
    window.db.products.unshift(p); window.db.saveProducts(window.db.products); renderAdminDashboard();
}
function addTax(k) { const v = prompt(`เพิ่มป้ายรายการใน ${k}:`); if(v) { window.db.taxonomy[k.charAt(0).toLowerCase()+k.slice(1)].push(v); window.db.saveTaxonomy(window.db.taxonomy); renderAdminDashboard(); } }
function removeTax(k, i) { myConfirm(`ลบรายการใน ${k}?`, () => { window.db.taxonomy[k.charAt(0).toLowerCase()+k.slice(1)].splice(i, 1); window.db.saveTaxonomy(window.db.taxonomy); renderAdminDashboard(); }); }

/* ==========================================
   9. CART SYSTEM & CHECKOUT
   ========================================== */
function openCartPage() { 
    hideAllPages(); 
    document.getElementById('cartPage').classList.remove('hidden'); 
    if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.remove('hidden');
    if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.remove('hidden');
    renderCart(); 
}
function renderCart() {
    const cont = document.getElementById('cartItemsContainer'); const summary = document.getElementById('receiptSummary'); if(!cont) return;
    if(cart.length === 0) { cont.innerHTML = `<div class="text-center py-24 text-gray-400 text-xs"><i class="fa-solid fa-basket-shopping text-3xl mb-3 block"></i>ไม่มีสินค้าในตะกร้าของคุณ</div>`; if(summary) summary.innerHTML = ""; return; }
    cont.innerHTML = cart.map((i, idx) => `
        <div class="card-bg p-3 rounded-2xl flex gap-3 items-center border shadow-sm text-xs bg-white">
            <img src="${i.img}" class="w-12 h-12 rounded-xl object-cover border"><div class="flex-1 font-bold text-main truncate">${i.name}</div>
            <div class="flex items-center gap-1.5"><button onclick="updateQty(${idx},-1)" class="w-7 h-7 border rounded-lg bg-gray-50">-</button><span class="w-4 text-center font-bold">${i.qty}</span><button onclick="updateQty(${idx},1)" class="w-7 h-7 border rounded-lg bg-gray-50">+</button></div>
            <button onclick="removeCartItem(${idx})" class="text-red-400 px-1 font-bold text-base">×</button>
        </div>`).join('');
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    if(summary) summary.innerHTML = `<button onclick="finalizeOrder()" class="w-full btn-main py-4 rounded-2xl font-bold text-xs shadow-xl">สรุปยอดสั่งซื้อทั้งหมด ฿${total}</button>`;
}
function updateQty(idx, d) { cart[idx].qty += d; if(cart[idx].qty <= 0) cart.splice(idx,1); updateCartCount(); renderCart(); }
function removeCartItem(idx) { myConfirm("ลบสินค้าชิ้นนี้ออกจากตะกร้า?", () => { cart.splice(idx,1); updateCartCount(); renderCart(); }); }

function finalizeOrder() {
    const u = window.db.getCurrentUser(); if(!u) { alert("กรุณาเข้าสู่ระบบสมาชิกก่อนกดชำระเงินนะคะ"); openUnifiedAuthModal(); return; }
    const hasFontOrDeco = cart.some(i => i.category === "ฟอนต์" || i.category === "ของตกแต่ง"); const hasGroup = cart.some(i => i.category === "รวมกลุ่ม");
    hideAllPages(); const rec = document.getElementById('receiptPage'); rec.classList.remove('hidden');
    let total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0); const defaultEmail = u.email || "";
    rec.innerHTML = `<div class="p-4 max-w-[500px] mx-auto text-xs space-y-4">
        <div class="receipt-card p-6 border-main bg-white text-main"><h2 class="text-center font-bold mb-4">ใบเสร็จชำระเงิน</h2><div class="space-y-2 text-[11px] border-b border-dashed pb-4 mb-4">
        ${cart.map(i => `<div class="flex justify-between"><span>${i.name} x${i.qty}</span><span class="font-bold">฿${(i.price-i.discount)*i.qty}</span></div>`).join('')}</div>
        <div class="flex justify-between font-black text-main"><span>ยอดรวมสุทธิ</span><span>฿${total}</span></div></div>
        <div class="bg-white p-5 rounded-3xl border space-y-3">
            <h3 class="font-bold text-main">ข้อมูลสำหรับรับสิทธิ์</h3>
            ${hasFontOrDeco ? `<input type="email" id="cusEmail" value="${defaultEmail}" placeholder="ระบุ Gmail สำหรับร่วมสิทธิ์ไดร์ฟ *" class="w-full p-3 border rounded-xl outline-none">` : ''}
            ${hasGroup ? `<input type="text" id="cusLine" placeholder="ระบุ LINE ID ผู้ซื้อ" class="w-full p-3 border rounded-xl outline-none">` : ''}
        </div>
        <div class="bg-white p-5 rounded-3xl text-center border">
            <div class="flex gap-2 justify-center mb-4">
                <button onclick="processOrderPayment('credit')" class="py-3 px-4 btn-main text-white font-bold rounded-xl flex-1">🪪 หักจากเครดิตสมาชิก</button>
                <button onclick="processOrderPayment('transfer')" class="py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl flex-1">โอนเงินธนาคารปกติ</button>
            </div>
            <p class="font-black text-main mb-3">เลขบัญชีร้าน: ${window.db.config.paymentNo}</p>
            <div class="p-3 border border-dashed rounded-2xl bg-gray-50 max-w-[160px] mx-auto"><img src="${window.db.config.paymentQR}" class="w-full"></div>
        </div>
        <button onclick="location.reload()" class="w-full text-gray-400 font-bold text-center">กลับหน้าหลัก</button></div>`;
}

function processOrderPayment(method) {
    const emailInput = document.getElementById('cusEmail'); const emailVal = emailInput ? emailInput.value.trim() : "";
    if(document.getElementById('cusEmail') && emailVal === "") return alert("กรุณาระบุ Gmail เพื่อแชร์สิทธิ์ไฟล์ค่ะ");
    let total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0); const u = window.db.getCurrentUser(); if(!u) return alert("บัญชีสมาชิกหลุดการเชื่อมต่อ");
    if(method === 'credit') { if(u.credit < total) return alert("เครดิตสะสมคงเหลือของคุณไม่เพียงพอค่ะ"); u.credit -= total; }
    if(!u.orderHistory) u.orderHistory = []; u.orderHistory.unshift({ date: new Date().toLocaleString(), items: cart.map(i => `${i.name} (x${i.qty})`).join(', '), total: total, status: "สำเร็จ" });
    let members = window.db.getMembers(); const idx = members.findIndex(m => m.username === u.username); if(idx !== -1) members[idx] = u;
    window.db.saveMembers(members); window.db.saveCurrentUser(u);
    cart.forEach(item => { if(item.autoDriveShare && item.googleDriveFolderId && emailVal !== "") { if(window.db.config.googleAppsScriptUrl) { fetch(window.db.config.googleAppsScriptUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailVal, folderId: item.googleDriveFolderId }) }); } } });
    alert("ทำรายการสำเร็จเรียบร้อย ขอบคุณค่ะ!"); cart = []; updateCartCount(); location.reload();
}

/* ==========================================
   10. LAYOUT CONTROLLER
   ========================================== */
function hideAllPages() {
    ['mainPage', 'productDetailPage', 'cartPage', 'receiptPage', 'userMenuPage', 'reviewPage', 'allCategoriesPage', 'adminDashboard'].forEach(id => {
        const el = document.getElementById(id); if(el) el.classList.add('hidden');
    });
}
function showMainLayout() {
    document.getElementById('mainPage').classList.remove('hidden');
    if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.remove('hidden');
    if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.remove('hidden');
    if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.remove('hidden');
}
function closeSubPage(pageId) { 
    document.getElementById(pageId).classList.add('hidden'); 
    showMainLayout(); 
}
function updateColor(k, v) { window.db.config.theme[k] = v; applyTheme(); }
function renderCategoryFilter() {
    const cont = document.getElementById('categoriesContainer'); const tax = window.db.getTaxonomy(); if(!cont) return;
    cont.innerHTML = `<button onclick="storeFilterCat='ทั้งหมด'; renderStore();" class="px-4 py-1.5 rounded-full text-[11px] font-bold border btn-main text-white">คลังทั้งหมด</button>` +
        tax.categories.map(c => `<button onclick="storeFilterCat='${c}'; renderStore();" class="px-4 py-1.5 rounded-full text-[11px] font-medium border bg-white text-gray-600 whitespace-nowrap shadow-sm">${c}</button>`).join('');
}
