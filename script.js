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

// ข้อมูลระบบสำหรับใช้ในการตรวจสอบ Slip โอนเงินผ่านระบบ API อัตโนมัติ
const SLIP_API_KEY = "bank_slip_YKeDidfulHJflFdyTTEfmMsKcJVNJP9uqQq5pkz6oUlmHbUWes_1760258790";
const SHOP_BANK_NO = "2148139582"; 

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
    
    restartMarqueeAnimation();

    const promoCount = cfg.promotions ? cfg.promotions.length : 0;
    if(document.getElementById('promoBadgeCount')) document.getElementById('promoBadgeCount').innerText = promoCount;

    applyTheme(); 
    renderCategoryFilter(); 
    renderStore(); 
    updateCartCount(); 
    updateCreditDisplay();
}

function restartMarqueeAnimation() {
    const m1 = document.getElementById('marqueeDisplay');
    const m2 = document.getElementById('marqueeDisplay2');
    if (m1 && m2) {
        m1.style.animation = 'none'; m2.style.animation = 'none';
        m1.offsetHeight; m2.offsetHeight;
        m1.style.animation = 'marquee 25s linear infinite';
        m2.style.animation = 'marquee2 25s linear infinite';
    }
}

function updateCreditDisplay() {
    const userArea = document.getElementById('userStatusArea');
    const u = window.db.getCurrentUser();
    if (!userArea) return;
    
    if (u) {
        userArea.innerHTML = `
            <div onclick="openUserMenuPage()" class="cursor-pointer select-none text-right">
                <span class="text-main block font-bold max-w-[110px] truncate">👤 ${u.username}</span>
                <span class="text-green-500 block font-bold mt-0.5">฿${u.credit}</span>
            </div>
        `;
    } else {
        userArea.innerHTML = `
            <button onclick="openUnifiedAuthModal()" class="theme-bg-btn text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer">
                ลงชื่อเข้าใช้
            </button>
        `;
    }
    fixButtonColors();
}

function backToStoreHome() {
    storeFilterCat = 'ทั้งหมด'; storeFilterStyle = 'ทั้งหมด';
    renderCategoryFilter(); renderStore(); hideAllPages(); showMainLayout();
    restartMarqueeAnimation();
}

/* ==========================================
   ⚙️ ระบบธีมสีไดนามิก และการแก้ไขปุ่มสีสว่างพัง
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
    
    const isDark = !isHexColorLight(t.bg || "#202430");
    if(isDark) document.documentElement.classList.add('dark-theme-active');
    else document.documentElement.classList.remove('dark-theme-active');

    fixButtonColors();
}

function isHexColorLight(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

function updateColor(key, val) {
    window.db.config.theme[key] = val;
    applyTheme();
}

// 🛠️ ฟังก์ชันแก้ไขสีปุ่มกลืนในพรีเซ็ตสว่าง บังคับฉีดสีกระบอกตามแบรนดิ้งพรีเซ็ต
function fixButtonColors() {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--th-primary').trim();
    const btnIds = ['mainUserAuthBtn', 'adminAuthSubmitBtn'];
    btnIds.forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.style.setProperty('background-color', primaryColor, 'important');
            btn.style.setProperty('color', '#ffffff', 'important');
            btn.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.4)', 'important');
        }
    });
}

/* ==========================================
   🔐 UNIFIED LOGIN CONTROLLER
   ========================================== */
function openUnifiedAuthModal() {
    if(document.getElementById('unifiedAuthModal')) {
        document.getElementById('unifiedAuthModal').classList.remove('hidden');
        switchUnifiedTab('user');
    }
}
function closeUnifiedAuthModal() { if(document.getElementById('unifiedAuthModal')) document.getElementById('unifiedAuthModal').classList.add('hidden'); }

function switchUnifiedTab(type) {
    currentAuthTab = type; isRegisterMode = false;
    const userBtn = document.getElementById('tabAuthUserBtn'), adminBtn = document.getElementById('tabAuthAdminBtn');
    const userForm = document.getElementById('formAuthUser'), adminForm = document.getElementById('formAuthAdmin');
    const userSubmitBtn = document.getElementById('mainUserAuthBtn'), adminSubmitBtn = document.getElementById('adminAuthSubmitBtn');
    
    if(type === 'user') {
        if(userBtn) userBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
        if(adminBtn) adminBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
        if(userForm) userForm.classList.remove('hidden'); 
        if(adminForm) adminForm.classList.add('hidden');
        if(userSubmitBtn) userSubmitBtn.innerText = "ลงชื่อเข้าใช้งาน";
        if(document.getElementById('toggleRegBtn')) document.getElementById('toggleRegBtn').classList.remove('hidden');
    } else {
        if(adminBtn) adminBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
        if(userBtn) userBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
        if(adminForm) adminForm.classList.remove('hidden'); 
        if(userForm) userForm.classList.add('hidden');
    }
    fixButtonColors();
}

function toggleRegisterMode() {
    isRegisterMode = !isRegisterMode;
    const btn = document.getElementById('mainUserAuthBtn');
    if(btn) btn.innerText = isRegisterMode ? "ยืนยันการสมัครสมาชิก" : "ลงชื่อเข้าใช้งาน";
    if(document.getElementById('toggleRegBtn')) document.getElementById('toggleRegBtn').innerText = isRegisterMode ? "มีบัญชีอยู่แล้ว? สลับกลับไปเข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิกใหม่ที่นี่";
    fixButtonColors();
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
    uInput.value = ""; pInput.value = ""; closeUnifiedAuthModal(); updateCreditDisplay();
}

function checkAdminPassword() { 
    if(document.getElementById('adminPasswordInput') && document.getElementById('adminPasswordInput').value === window.db.config.adminPass) {
        closeUnifiedAuthModal(); document.getElementById('adminPasswordInput').value = ""; renderAdminDashboard();
    } else alert("รหัสผ่านไม่ถูกต้อง!"); 
}

function handleGearIconClick() {
    const u = window.db.getCurrentUser();
    if (u) openUserMenuPage();
    else { openUnifiedAuthModal(); setTimeout(() => switchUnifiedTab('admin'), 50); }
}

function logoutUser() { 
    window.db.saveCurrentUser(null); hideAllPages(); 
    alert("ออกจากระบบเรียบร้อยแล้วค่ะ 👋"); location.reload(); 
}

/* ==========================================
   🛒 STOREFRONT RENDER (เพิ่มแถบแท็ก Apps ที่รองรับ)
   ========================================== */
function renderCategoryFilter() {
    const cont = document.getElementById('categoriesContainer'); const tax = window.db.getTaxonomy(); if(!cont || !tax) return;
    let html = `<button onclick="storeFilterCat='ทั้งหมด'; renderCategoryFilter(); renderStore();" class="px-4 py-1.5 rounded-full text-[11px] border whitespace-nowrap shadow-sm transition-all review-star-filter-btn ${storeFilterCat==='ทั้งหมด'?'active':''}">คลังทั้งหมด</button>`;
    tax.categories.forEach(c => {
        html += `<button onclick="storeFilterCat='${c}'; renderCategoryFilter(); renderStore();" class="px-4 py-1.5 rounded-full text-[11px] border whitespace-nowrap shadow-sm transition-all review-star-filter-btn ${storeFilterCat===c?'active':''}">${c}</button>`;
    });
    cont.innerHTML = html;
}

function renderStore() {
    let list = window.db.getProducts(); if(storeFilterCat !== "ทั้งหมด") list = list.filter(p => p.category === storeFilterCat);
    renderStoreCards(list);
}

function renderStoreCards(products) {
    const cont = document.getElementById('productsContainer'); if(!cont) return;
    if(!products || products.length === 0) { cont.innerHTML = `<p class="col-span-2 text-center py-10 text-sub text-xs">ไม่พบรายการสินค้า</p>`; return; }
    cont.innerHTML = products.map((p) => {
        const realIdx = window.db.products.findIndex(item => item.name === p.name);
        // 🛠️ ดึงป้ายแท็กแอปพลิเคชันที่ระบุว่าใช้คู่กับแอปอะไรได้บ้างกลับมาแสดงบนการ์ดหน้าร้าน
        const appTagsHtml = p.apps && p.apps.length > 0 
            ? p.apps.map(a => `<span class="bg-black/20 text-main text-[8px] px-1.5 py-0.5 rounded-md font-bold border border-main mr-1 inline-block mt-1">${a}</span>`).join('')
            : `<span class="bg-black/10 text-sub text-[8px] px-1.5 py-0.5 rounded-md inline-block mt-1">ใช้งานได้ทั่วไป</span>`;

        return `
        <div class="product-card flex flex-col justify-between h-full theme-bg-card border-main">
            <div onclick="openProductDetail(${realIdx})" class="cursor-pointer">
                <img src="${p.img}" class="w-full aspect-square object-cover rounded-xl mb-2.5 border-main">
                <span class="text-[9px] text-sub font-medium block mb-0.5"><i class="fa-solid fa-folder-open mr-1"></i>${p.category} / ${p.subCategory || 'ทั่วไป'}</span>
                <h4 class="text-[11px] font-bold text-main line-clamp-2 leading-tight h-8">${p.name}</h4>
                <div class="mb-2">${appTagsHtml}</div>
                <div class="text-[12px] font-black mt-1 text-main">฿${p.price - p.discount}</div>
            </div>
            <button onclick="addToCartDirect(${realIdx})" class="w-full mt-2 theme-bg-btn text-white py-1.5 text-[10px] font-bold rounded-lg shadow-sm active:scale-95 transition-all">➕ ใส่ตะกร้า</button>
        </div>`;
    }).join('');
}

function openProductDetail(idx) {
    const p = window.db.products[idx]; const detail = document.getElementById('productDetailPage'); if(!detail) return;
    hideAllPages(); detail.classList.remove('hidden');
    const appTagsHtml = p.apps && p.apps.length > 0 ? p.apps.map(a => `<span class="bg-black/20 text-main text-[10px] px-2 py-0.5 rounded-md font-bold border border-main mr-1">${a}</span>`).join('') : '';
    
    detail.innerHTML = `
        <div class="sticky top-0 theme-bg-card px-4 py-4 flex items-center justify-between border-b border-main z-10 shadow-sm">
            <button onclick="closeProductDetail()" class="text-main font-bold text-xs"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-main text-sm">รายละเอียดสินค้า</span>
            <div class="w-4"></div>
        </div>
        <div class="p-4 space-y-4 max-w-[520px] mx-auto text-xs pb-24">
            <img src="${p.img}" class="w-full rounded-2xl border-main shadow-sm">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-base font-bold text-main">${p.name}</h1>
                    <div class="mt-2 flex flex-wrap gap-1">${appTagsHtml}</div>
                </div>
                <div class="text-right"><span class="text-lg font-black text-main">฿${p.price-p.discount}</span></div>
            </div>
            <div class="custom-panel-card theme-bg-card border-main"><p class="font-bold text-main mb-1.5">รายละเอียดเพิ่มเติม</p><p class="text-sub leading-relaxed">${p.desc || 'สินค้าพรีเมียมลิขสิทธิ์แท้จากทางร้าน'}</p></div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 theme-bg-card border-t border-main flex gap-3 max-w-[768px] mx-auto z-50 shadow-lg">
            <button onclick="addToCartDirect(${idx}); closeProductDetail();" class="flex-1 py-3.5 border border-main text-main rounded-xl font-bold text-xs theme-bg-card">เพิ่มลงตะกร้า</button>
            <button onclick="buyNowDirect(${idx})" class="flex-1 py-3.5 theme-bg-btn text-white rounded-xl font-bold text-xs shadow-md">ซื้อทันที</button>
        </div>`;
}
function buyNowDirect(idx) { addToCartDirect(idx); closeProductDetail(); openCartPage(); }
function closeProductDetail() { if(document.getElementById('productDetailPage')) document.getElementById('productDetailPage').classList.add('hidden'); showMainLayout(); }

/* ==========================================
   👥 MEMBER PROFILE & หน้าเติมเงินที่มี QR CODE สมบูรณ์
   ========================================== */
function openUserMenuPage() {
    hideAllPages(); if(document.getElementById('userMenuPage')) document.getElementById('userMenuPage').classList.remove('hidden');
    renderUserMenuDetails();
}

function renderUserMenuDetails() {
    const cont = document.getElementById('userMenuPage'); if(!cont) return;
    const u = window.db.getCurrentUser(); if(!u) return;

    cont.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto";
    cont.innerHTML = `
        <div class="sticky top-0 theme-bg-card p-4 rounded-2xl border border-main flex items-center justify-between mb-4 shadow-sm">
            <button onclick="backToStoreHome()" class="text-main font-bold"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-sm">แผงควบคุมสมาชิก</span>
            <button onclick="logoutUser()" class="text-rose-400 font-black text-sm flex items-center gap-1"><i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ</button>
        </div>

        <div class="space-y-5 text-xs pb-24">
            <div class="bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-md text-slate-800">
                <div class="p-5 space-y-3">
                    <div class="flex justify-between items-center border-b border-gray-100 pb-2.5">
                        <span class="text-gray-400 font-medium text-[11px]">ชื่อผู้ใช้งาน (Username)</span>
                        <span class="font-bold text-slate-800 text-[12px]">👤 ${u.username}</span>
                    </div>
                    <div class="flex justify-between items-center border-b border-gray-100 pb-2.5">
                        <span class="text-gray-400 font-medium text-[11px]">เครดิตคงเหลือ (Balance)</span>
                        <span class="font-black text-green-600 text-[13px]">฿${u.credit}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400 font-medium text-[11px]">อีเมลติดต่อ (Email)</span>
                        <input type="email" id="usrEditEmail" value="${u.email || ''}" placeholder="ระบุอีเมลสำหรับรับฟอนต์" class="text-right bg-transparent border-0 outline-none p-0 text-slate-800 font-bold text-[11px] w-[55%]">
                    </div>
                </div>
                <div class="flex border-t border-gray-100 bg-gray-50/50 text-[11px] font-bold text-slate-700">
                    <button onclick="goToTopupPageDirect()" class="flex-1 py-3.5 text-center border-r border-gray-100 transition-all flex items-center justify-center gap-1"><span>+ เติมเครดิต</span></button>
                    <button onclick="saveUserProfileData()" class="flex-1 py-3.5 text-center transition-all flex items-center justify-center gap-1"><span>💾 บันทึกข้อมูลส่วนตัว</span></button>
                </div>
            </div>

            <div class="theme-bg-card p-4 rounded-2xl border border-main space-y-3">
                <h3 class="font-bold text-main text-[12px] opacity-90"><i class="fa-solid fa-history mr-1 text-amber-400"></i> บันทึกประวัติการใช้งาน</h3>
                <div class="flex border-b border-main">
                    <button onclick="switchHistoryTab('order')" class="flex-1 pb-2 font-bold text-center ${currentHistoryTab==='order'?'text-main border-b-2 border-main':'text-sub'}">📦 ประวัติการช้อป</button>
                    <button onclick="switchHistoryTab('topup')" class="flex-1 pb-2 font-bold text-center ${currentHistoryTab==='topup'?'text-main border-b-2 border-main':'text-sub'}">💰 ประวัติการเติมเงิน</button>
                </div>
                <div id="userHistoryListLogs" class="space-y-2 max-h-60 overflow-y-auto pt-1"></div>
            </div>
        </div>
    `;
    renderUserHistoryLogsContent(u);
}

function saveUserProfileData() {
    const emailVal = document.getElementById('usrEditEmail').value.trim();
    const u = window.db.getCurrentUser(); if(!u) return;
    u.email = emailVal; window.db.saveCurrentUser(u);
    let members = window.db.getMembers(); const idx = members.findIndex(m => m.username === u.username);
    if(idx !== -1) { members[idx] = u; window.db.saveMembers(members); }
    alert("อัปเดตข้อมูลส่วนตัวของคุณสำเร็จแล้วค่ะ 🐰✨"); renderUserMenuDetails();
}

function switchHistoryTab(tabType) { currentHistoryTab = tabType; const u = window.db.getCurrentUser(); if(u) renderUserMenuDetails(); }

function renderUserHistoryLogsContent(u) {
    const logZone = document.getElementById('userHistoryListLogs'); if(!logZone) return;
    if(currentHistoryTab === 'order') {
        const orders = u.orderHistory || [];
        if(orders.length === 0) { logZone.innerHTML = `<p class="text-center py-6 text-sub">ยังไม่มีประวัติการสั่งซื้อฟอนต์ค่ะ</p>`; return; }
        logZone.innerHTML = orders.map(o => `
            <div class="p-2.5 rounded-xl border border-main bg-black/5 flex justify-between items-center text-main">
                <div><span class="font-bold block">🆔 ยอดสั่งซื้อฟอนต์</span><span class="text-[10px] text-sub block">รหัส: ${o.orderId}</span></div>
                <div class="text-right font-black text-green-500">฿${o.total}</div>
            </div>`).join('');
    } else {
        const topups = u.topupHistory || [];
        if(topups.length === 0) { logZone.innerHTML = `<p class="text-center py-6 text-sub">ยังไม่มีประวัติการเติมเงินเข้ามาค่ะ</p>`; return; }
        logZone.innerHTML = topups.map(t => `
            <div class="p-2.5 rounded-xl border border-main bg-black/5 flex justify-between items-center text-main">
                <div><span class="font-bold block">💵 เติมเงินอัตโนมัติ (API เช็คสลิป)</span><span class="text-[10px] text-sub block mt-0.5">${t.date || 'วันนี้'}</span></div>
                <div class="text-right font-black text-green-500">+฿${t.amount}</div>
            </div>`).join('');
    }
}

function goToTopupPageDirect() {
    hideAllPages(); if(document.getElementById('topupPage')) {
        document.getElementById('topupPage').classList.remove('hidden');
        renderTopupPageUI();
    }
}

// 🛠️ คืนชีพแผงพรีเซนต์ข้อมูลเลขบัญชี พร้อมแสดงรูปภาพกล่องคิวอาร์โค้ดสแกนจ่ายครบถ้วน
function renderTopupPageUI() {
    const el = document.getElementById('topupPage'); if(!el) return;
    const cfg = window.db.getConfig();
    el.innerHTML = `
        <div class="sticky top-0 theme-bg-card p-4 rounded-2xl border border-main flex items-center justify-between mb-4 shadow-sm">
            <button onclick="openUserMenuPage()" class="text-main font-bold"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-sm">เติมเงินเข้าระบบอัตโนมัติ</span>
            <div class="w-4"></div>
        </div>
        <div class="max-w-md mx-auto space-y-4 text-xs text-center p-4 pb-24">
            <div class="theme-bg-card p-4 rounded-2xl border border-main text-main text-left space-y-2">
                <p class="font-bold text-center border-b pb-1.5 mb-2">🏦 ช่องทางการโอนเงินของทางร้าน</p>
                <p>ธนาคาร: <span class="font-bold text-green-500">กสิกรไทย (KBANK)</span></p>
                <p>เลขที่บัญชี: <span class="font-mono font-black text-sm text-green-500">214-8-13958-2</span></p>
                <p>ชื่อบัญชีผู้รับโอน: <span class="font-bold text-main">${cfg.paymentName}</span></p>
            </div>
            
            <div class="theme-bg-card p-4 rounded-2xl border border-main flex flex-col items-center justify-center">
                <p class="font-bold text-main mb-2">📸 สแกน QR Code เพื่อพร้อมเพย์โอนเงินที่นี่</p>
                <img src="${cfg.paymentQR}" class="w-48 aspect-square rounded-xl border border-gray-200 bg-white p-2">
            </div>

            <div class="theme-bg-card p-5 rounded-2xl border border-main space-y-4">
                <p class="font-bold text-main text-left">📤 อัปโหลดสลิปที่โอนสำเร็จเพื่อเติมเงิน</p>
                <input type="file" id="slipFileInputField" accept="image/*" class="w-full text-main file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:bg-amber-400 file:text-slate-900 cursor-pointer">
                <button onclick="uploadAndVerifySlipAPI('slipFileInputField')" class="w-full py-3 text-white font-bold rounded-xl theme-bg-btn shadow-md">🚀 ยืนยันและสแกนตรวจสลิปเงินโอน</button>
            </div>
        </div>
    `;
}

async function uploadAndVerifySlipAPI(fileId) {
    const fileInput = document.getElementById(fileId);
    if (!fileInput || fileInput.files.length === 0) return alert("กรุณาเลือกรูปภาพสลิปโอนเงินก่อนค่ะ");
    const currentUser = window.db.getCurrentUser(); if (!currentUser) return;

    const formData = new FormData();
    formData.append("files", fileInput.files[0]);
    formData.append("log", "true");

    try {
        alert("ระบบกำลังเชื่อมต่อ API เพื่อตรวจสอบความถูกต้องของสลิปเงินโอน... ⏱️");
        const response = await fetch("https://api.ezslip.co/v1/verify", {
            method: "POST",
            headers: { "Authorization": `Bearer ${SLIP_API_KEY}` },
            body: formData
        });
        const data = await response.json();

        if (response.status === 200 && data.status === "success") {
            const slipDetails = data.data;
            const receiverAccount = slipDetails.receiver.account.replace(/[^0-9]/g, "");
            const transferAmount = parseFloat(slipDetails.amount);

            if (receiverAccount !== "2148139582") {
                return alert("⚠️ สแกนล้มเหลว: สลิปนี้ไม่ได้โอนเงินเข้าเลขบัญชีกสิกรไทยของคุณเกดค่ะ!");
            }

            currentUser.credit = (currentUser.credit || 0) + transferAmount;
            if (!currentUser.topupHistory) currentUser.topupHistory = [];
            currentUser.topupHistory.unshift({
                amount: transferAmount,
                date: new Date().toLocaleDateString('th-TH') + " " + new Date().toLocaleTimeString('th-TH')
            });

            window.db.saveCurrentUser(currentUser);
            let members = window.db.getMembers(); const mIdx = members.findIndex(m => m.username === currentUser.username);
            if (mIdx !== -1) { members[mIdx] = currentUser; window.db.saveMembers(members); }

            alert(`🎉 ตรวจสอบสำเร็จ! ยอดเครดิตถูกเติมเข้ากระเป๋าจำนวน ฿${transferAmount} เรียบร้อยแล้วค่ะ 🐰✨`);
            fileInput.value = ""; openUserMenuPage(); updateCreditDisplay();
        } else {
            alert(`❌ ตรวจสอบสลิปล้มเหลว: ${data.message || 'ข้อมูลสลิปไม่ถูกต้อง'}`);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ API คัดกรองกรุณาลองใหม่อีกครั้งค่ะ");
    }
}

/* ==========================================
   🛒 ตะกร้าสินค้า และหน้าต่างใบเสร็จหลังกดสรุปยอด
   ========================================== */
function addToCartDirect(idx) {
    const p = window.db.products[idx]; if(!p) return;
    const exist = cart.find(i => i.name === p.name);
    if(exist) { if(p.limitOne) return alert("จำกัดสิทธิ์ซื้อ 1 ชิ้นต่อ 1 ไอดีค่ะ"); exist.qty++; } else { cart.push({...p, qty: 1}); }
    updateCartCount(); alert("เพิ่มลงตะกร้าเรียบร้อย 🐰");
}

function updateCartCount() {
    const el = document.getElementById('cartCount'); const total = cart.reduce((s, i) => s + i.qty, 0);
    if(el) { el.innerText = total; el.classList.toggle('hidden', total === 0); }
    localStorage.setItem('temp_cart', JSON.stringify(cart));
}

function openCartPage() { hideAllPages(); if(document.getElementById('cartPage')) document.getElementById('cartPage').classList.remove('hidden'); renderCart(); }

function renderCart() {
    const cont = document.getElementById('cartItemsContainer'); const summary = document.getElementById('receiptSummary'); if(!cont) return;
    if(cart.length === 0) { cont.innerHTML = `<div class="text-center py-24 text-sub text-xs">ไม่มีสินค้าในตะกร้าของคุณ</div>`; if(summary) summary.innerHTML = ""; return; }
    cont.innerHTML = cart.map((i, idx) => `
        <div class="p-3 rounded-2xl flex justify-between items-center border border-main theme-bg-card text-xs text-main">
            <span class="truncate max-w-[50%] font-bold">${i.name}</span>
            <div class="flex gap-2 items-center">
                <button onclick="updateQty(${idx},-1)" class="px-2 border border-main rounded font-black text-center">-</button>
                <span class="font-bold">${i.qty}</span>
                <button onclick="updateQty(${idx},1)" class="px-2 border border-main rounded font-black">+</button>
                <button onclick="removeCartItem(${idx})" class="text-rose-400 font-bold ml-2">×</button>
            </div>
        </div>`).join('');
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    if(summary) summary.innerHTML = `<button onclick="finalizeOrder()" class="w-full theme-bg-btn text-white py-3.5 rounded-2xl font-bold">ยืนยันชำระเงินรวม ฿${total}</button>`;
}

function updateQty(idx, d) { cart[idx].qty += d; if(cart[idx].qty <= 0) cart.splice(idx,1); updateCartCount(); renderCart(); }
function removeCartItem(idx) { if(confirm("ลบสินค้าชิ้นนี้ออกจากตะกร้า?")) { cart.splice(idx,1); updateCartCount(); renderCart(); } }

// 🛠️ คืนชีพหน้าต่างใบเสร็จรับเงิน (Receipt Page) ฉบับเต็ม แสดงรายชื่อไฟล์พร้อมสิทธิ์การเข้าถึงทันที
function finalizeOrder() {
    const u = window.db.getCurrentUser(); if(!u) return openUnifiedAuthModal();
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    if(u.credit < total) return alert("เครดิตเงินคงเหลือไม่เพียงพอ กรุณาเติมเงินก่อนนะคะ");
    
    u.credit -= total; 
    const orderId = "OR-" + Date.now();
    const newOrder = { orderId: orderId, items: [...cart], total: total, date: new Date().toLocaleDateString('th-TH') };
    
    if(!u.orderHistory) u.orderHistory = []; 
    u.orderHistory.unshift(newOrder);
    window.db.saveCurrentUser(u); 
    
    let m = window.db.getMembers(); const idx = m.findIndex(i => i.username === u.username);
    if(idx !== -1) { m[idx] = u; window.db.saveMembers(m); }
    
    hideAllPages(); 
    const rPage = document.getElementById('receiptPage');
    if(rPage) {
        rPage.classList.remove('hidden');
        
        const itemsListHtml = cart.map(item => `
            <div class="p-3 border border-main rounded-xl theme-bg-card text-left space-y-1">
                <p class="font-bold text-main">📦 ${item.name}</p>
                <p class="text-[10px] text-sub">จำนวน: ${item.qty} ชิ้น | ราคาหักส่วนลดแล้ว</p>
                ${item.googleDriveFolderId ? `<a href="${item.googleDriveFolderId}" target="_blank" class="inline-block mt-1 bg-green-600 text-white font-bold text-[9px] px-2.5 py-1 rounded-md shadow-sm"><i class="fa-brands fa-google-drive mr-1"></i> กดเปิดรับสิทธิ์ลิงก์ดาวน์โหลดที่นี่</a>` : ''}
            </div>
        `).join('');

        rPage.innerHTML = `
            <div class="sticky top-0 theme-bg-card p-4 rounded-2xl border border-main flex items-center justify-between mb-4 shadow-sm">
                <span class="font-bold text-sm mx-auto text-main">🧾 ใบเสร็จรับเงินระบบดิจิทัล</span>
            </div>
            <div class="max-w-md mx-auto p-4 space-y-4 text-xs text-center pb-24">
                <div class="theme-bg-card p-5 rounded-3xl border border-main text-main space-y-3">
                    <div class="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-xl mx-auto mb-1">✔</div>
                    <h2 class="text-sm font-black text-green-500">ชำระเงินตัดยอดบิลสำเร็จเรียบร้อย!</h2>
                    <p class="text-sub">เลขที่สั่งซื้อ: <span class="font-mono font-bold text-main">${orderId}</span></p>
                    <div class="border-t border-main my-2 pt-2 space-y-2">${itemsListHtml}</div>
                    <div class="border-t border-main pt-2 flex justify-between items-center font-bold">
                        <span class="text-sub">ยอดเงินที่หักจากกระเป๋า:</span>
                        <span class="text-lg font-black text-green-500">฿${total}</span>
                    </div>
                </div>
                <button onclick="backToStoreHome()" class="w-full py-3.5 theme-bg-btn text-white font-bold rounded-2xl shadow-md">กลับไปเลือกซื้อสินค้าต่อหน้าร้านหลัก</button>
            </div>
        `;
    }
    cart = []; updateCartCount();
}

/* ==========================================
   ⚙️ ADMIN DASHBOARD (ระบบจัดการโปรโมชั่น คลังหมวดหมู่ แบรนด์ ข้อมูลครบถ้วน)
   ========================================== */
function renderAdminDashboard() {
    const dash = document.getElementById('adminDashboard'); if(!dash) return;
    hideAllPages(); dash.classList.remove('hidden');
    const cfg = window.db.getConfig(), t = cfg.theme, tax = window.db.getTaxonomy();

    dash.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto";
    dash.innerHTML = `
        <div class="flex justify-between items-center mb-6 theme-bg-card p-4 rounded-2xl border-main">
            <h2 class="font-bold text-main text-sm uppercase">Admin Control Panels</h2>
            <button onclick="location.reload()" class="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Log out</button>
        </div>
        
        <div class="space-y-6 pb-24 text-xs">
            <div class="theme-bg-card p-4 rounded-3xl border-main relative">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-main">🎨 ศูนย์ตั้งค่าโทนสี 8 แกนควบคุม</h3>
                    <button onclick="togglePresetExpandedGrid()" class="bg-amber-400 text-slate-900 w-8 h-8 rounded-full shadow-md flex items-center justify-center text-sm">🎨</button>
                </div>
                <div id="expandedPresetGridModal" class="hidden my-2 p-3 bg-black/20 border border-main rounded-2xl">
                    <div id="presetGridContainer" class="flex flex-wrap gap-2"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] mb-4">
                    ${['bg', 'card', 'border', 'text', 'muted', 'primary', 'secondary', 'accent'].map(k => `
                        <div class="admin-inner-panel p-2 rounded-xl border border-main">
                            <span class="font-bold block mb-1 text-main">${k.toUpperCase()} เฉดสีควบคุม</span>
                            <div class="flex gap-1.5 items-center">
                                <input type="color" oninput="updateColor('${k}', this.value); document.getElementById('input-hex-'+'${k}').value=this.value" value="${t[k] || '#ffffff'}" class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer">
                                <input type="text" id="input-hex-${k}" value="${t[k] || '#ffffff'}" class="w-full border border-main rounded px-2 py-1 theme-bg-card text-main" readonly>
                            </div>
                        </div>`).join('')}
                </div>
                <div id="presetList" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main space-y-3">
                <h3 class="font-bold text-main"><i class="fa-solid fa-rectangle-ad mr-1"></i> ระบบจัดการข้อความ / แบนเนอร์โปรโมชั่น</h3>
                <div class="space-y-2">
                    <input type="text" id="newPromoTitle" placeholder="ระบุข้อความโปรโมชั่น เช่น ลดกระหน่ำต้อนรับหน้าฝน..." class="w-full p-2.5 border border-main rounded-xl bg-transparent text-main">
                    <input type="text" id="newPromoLink" placeholder="ลิงก์เจ้าของแบรนด์ หรือเจ้าของฟอนต์ (เช่น DekDec Studio)" class="w-full p-2.5 border border-main rounded-xl bg-transparent text-main">
                    <button onclick="addNewPromotionFromAdmin()" class="w-full py-2 bg-amber-400 text-slate-900 font-bold rounded-xl text-[11px]">➕ เพิ่มโปรโมชั่นใหม่ลงแอป</button>
                </div>
                <div id="adminPromotionListContainer" class="space-y-2 pt-1"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main space-y-4">
                <h3 class="font-bold text-main"><i class="fa-solid fa-tags mr-1"></i> ตั้งค่าระบบหมวดหมู่หลัก & หมวดหมู่รองของร้าน</h3>
                
                <div class="p-3 border border-main rounded-2xl space-y-2 bg-black/5">
                    <p class="font-bold text-main text-[11px]">📁 เพิ่มหมวดหมู่สินค้าหลัก (Category)</p>
                    <div class="flex gap-2"><input type="text" id="newTaxCat" placeholder="เช่น ฟอนต์ลายมือ, แปรงสี..." class="flex-1 p-2 border border-main rounded-lg bg-transparent text-main"><button onclick="addTaxonomyField('categories', 'newTaxCat')" class="px-4 bg-green-600 text-white rounded-lg font-bold">เพิ่ม</button></div>
                    <div id="taxCatBadgeZone" class="flex flex-wrap gap-1 pt-1"></div>
                </div>

                <div class="p-3 border border-main rounded-2xl space-y-2 bg-black/5">
                    <p class="font-bold text-main text-[11px]">🏷️ เพิ่มหมวดหมู่ย่อย / สไตล์สินค้า (Sub-Category)</p>
                    <div class="flex gap-2"><input type="text" id="newTaxSub" placeholder="เช่น มินิมอล, น่ารักฟรุ้งฟริ้ง..." class="flex-1 p-2 border border-main rounded-lg bg-transparent text-main"><button onclick="addTaxonomyField('subCategories', 'newTaxSub')" class="px-4 bg-green-600 text-white rounded-lg font-bold">เพิ่ม</button></div>
                    <div id="taxSubBadgeZone" class="flex flex-wrap gap-1 pt-1"></div>
                </div>

                <div class="p-3 border border-main rounded-2xl space-y-2 bg-black/5">
                    <p class="font-bold text-main text-[11px]">🏢 เพิ่มข้อมูลรายชื่อแบรนด์ค่ายออกแบบ (Brands)</p>
                    <div class="flex gap-2"><input type="text" id="newTaxBrand" placeholder="เช่น Angun Studio..." class="flex-1 p-2 border border-main rounded-lg bg-transparent text-main"><button onclick="addTaxonomyField('brands', 'newTaxBrand')" class="px-4 bg-green-600 text-white rounded-lg font-bold">เพิ่ม</button></div>
                    <div id="taxBrandBadgeZone" class="flex flex-wrap gap-1 pt-1"></div>
                </div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-3">👥 ระบบจัดการฐานข้อมูลกระเป๋าเงินสมาชิก</h3>
                <div id="adminMemberListDatabaseZone" class="space-y-2 max-h-72 overflow-y-auto"></div>
            </div>

            <div id="productFormPart" class="theme-bg-card border p-4 rounded-3xl border-main">
                <h3 class="font-bold mb-3 text-main">🛍️ เพิ่มสินค้าใหม่ลงหน้าร้านค้า</h3>
                <input type="text" id="admName" placeholder="ระบุชื่อสินค้าลิขสิทธิ์ *" class="w-full p-3 border border-main rounded-xl mb-2 text-main bg-transparent">
                <div class="flex gap-2 mb-2">
                    <input type="number" id="admPrice" placeholder="ราคาเต็ม" class="w-full p-3 border border-main rounded-xl bg-transparent text-main">
                    <input type="number" id="admDisc" placeholder="ส่วนลดที่จะหักลบออก" class="w-full p-3 border border-main rounded-xl bg-transparent text-main">
                </div>
                
                <div class="space-y-2 mb-3">
                    <label class="block font-bold text-main text-[10px]">เลือกหมวดหมู่หลักสินค้า:</label>
                    <select id="admCat" class="w-full p-2.5 border border-main rounded-xl bg-transparent text-main">
                        ${tax.categories.map(c => `<option value="${c}" style="background:var(--th-card); color:var(--th-text);">${c}</option>`).join('')}
                    </select>
                </div>

                <div class="space-y-2 mb-3">
                    <label class="block font-bold text-main text-[10px]">เลือกหมวดหมู่ย่อยสินค้า:</label>
                    <select id="admSubCat" class="w-full p-2.5 border border-main rounded-xl bg-transparent text-main">
                        ${tax.subCategories.map(s => `<option value="${s}" style="background:var(--th-card); color:var(--th-text);">${s}</option>`).join('')}
                    </select>
                </div>

                <div class="space-y-2 mb-3">
                    <label class="block font-bold text-main text-[10px]">เลือกค่ายผู้ออกแบบ (Brand):</label>
                    <select id="admBrand" class="w-full p-2.5 border border-main rounded-xl bg-transparent text-main">
                        ${tax.brands.map(b => `<option value="${b}" style="background:var(--th-card); color:var(--th-text);">${b}</option>`).join('')}
                    </select>
                </div>

                <div class="space-y-1 mb-3">
                    <label class="block font-bold text-main text-[10px]">ระบุแอปพลิเคชันที่ใช้คู่กันได้ (เว้นวรรคด้วยเครื่องหมาย คอมม่า , ):</label>
                    <input type="text" id="admAppsInput" placeholder="เช่น GoodNotes, Canva, Procreate" class="w-full p-3 border border-main rounded-xl bg-transparent text-main">
                </div>

                <input type="text" id="admDriveUrl" placeholder="ลิงก์ส่งมอบปลายทาง Google Drive Folder Link" class="w-full p-3 border border-main rounded-xl mb-3 bg-transparent text-main">

                <button onclick="saveProductAdmin()" class="w-full py-3 theme-bg-btn text-white rounded-xl font-bold">💾 บันทึกและนำสินค้าขึ้นหน้าร้าน</button>
            </div>
            
            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-3">📦 ตารางตรวจสอบรายการสินค้าปัจจุบัน</h3>
                <div id="adminProductList" class="space-y-2"></div>
            </div>
        </div>`;
    renderPresets(); renderAdminMemberListDatabase(); renderAdminProductList(); renderTaxonomyBadgesAdmin(); renderAdminPromotionsList();
}

function togglePresetExpandedGrid() {
    const modal = document.getElementById('expandedPresetGridModal'); if(!modal) return;
    modal.classList.toggle('hidden');
    if(!modal.classList.contains('hidden')) {
        const container = document.getElementById('presetGridContainer'); if(!container) return;
        container.innerHTML = (window.db.config.themePresets || []).map((p) => `
            <button type="button" onclick="applyPresetAdmin('${p.id}')" class="px-3 py-1.5 bg-white text-slate-800 text-[10px] font-bold border rounded-xl shadow-sm flex items-center gap-1">
                <span class="w-2 h-2 rounded-full inline-block" style="background:${p.colors.primary}"></span> ${p.name}
            </button>`).join('');
    }
}

/* 🛠️ ฟังก์ชันย่อยของระบบแผง Taxonomy สั่งเพิ่มหมวดหมู่หลัก/รอง/แบรนด์ */
function renderTaxonomyBadgesAdmin() {
    const tax = window.db.getTaxonomy();
    if(document.getElementById('taxCatBadgeZone')) {
        document.getElementById('taxCatBadgeZone').innerHTML = tax.categories.map((c, i) => `<span class="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1">${c} <b class="cursor-pointer text-rose-300" onclick="removeTaxField('categories', ${i})">×</b></span>`).join('');
    }
    if(document.getElementById('taxSubBadgeZone')) {
        document.getElementById('taxSubBadgeZone').innerHTML = tax.subCategories.map((s, i) => `<span class="bg-purple-600 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1">${s} <b class="cursor-pointer text-rose-300" onclick="removeTaxField('subCategories', ${i})">×</b></span>`).join('');
    }
    if(document.getElementById('taxBrandBadgeZone')) {
        document.getElementById('taxBrandBadgeZone').innerHTML = tax.brands.map((b, i) => `<span class="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1">${b} <b class="cursor-pointer text-rose-300" onclick="removeTaxField('brands', ${i})">×</b></span>`).join('');
    }
}

function addTaxonomyField(targetKey, inputId) {
    const input = document.getElementById(inputId); if(!input) return;
    const val = input.value.trim(); if(!val) return;
    let tax = window.db.getTaxonomy();
    if(!tax[targetKey].includes(val)) {
        tax[targetKey].push(val); window.db.saveTaxonomy(tax); input.value = "";
        renderAdminDashboard(); alert("เพิ่มข้อมูล Taxonomy เรียบร้อยค่ะ");
    }
}
function removeTaxField(targetKey, index) {
    let tax = window.db.getTaxonomy(); tax[targetKey].splice(index, 1);
    window.db.saveTaxonomy(tax); renderAdminDashboard();
}

/* 🛠️ ฟังก์ชันจัดการโปรโมชั่นเสริมของแอปแอดมิน */
function renderAdminPromotionsList() {
    const cont = document.getElementById('adminPromotionListContainer'); if(!cont) return;
    const promos = window.db.config.promotions || [];
    if(promos.length === 0) { cont.innerHTML = `<p class="text-sub py-1 text-center">ไม่มีแบนเนอร์โปรโมชั่นในปัจจุบัน</p>`; return; }
    cont.innerHTML = promos.map((p, i) => `
        <div class="p-2 border border-main rounded-xl flex justify-between items-center bg-black/10 text-main text-[11px]">
            <p class="truncate max-w-[80%] font-bold">📢 ${p.title}</p>
            <button onclick="deletePromoDirect(${i})" class="text-rose-400 font-bold px-1">🗑️ ลบ</button>
        </div>
    `).join('');
}
function addNewPromotionFromAdmin() {
    const title = document.getElementById('newPromoTitle').value.trim();
    const link = document.getElementById('newPromoLink').value.trim() || "DekDec Studio";
    if(!title) return alert("กรุณากรอกข้อความรายละเอียดโปรโมชั่นก่อนค่ะ");
    if(!window.db.config.promotions) window.db.config.promotions = [];
    window.db.config.promotions.push({ id: "promo_" + Date.now(), title: title, img: "https://picsum.photos/600/450?random=" + Date.now(), brandLink: link });
    window.db.saveConfig(window.db.config); document.getElementById('newPromoTitle').value = "";
    renderAdminDashboard(); alert("อัปโหลดเพิ่มแถบโปรโมชั่นใหม่สำเร็จแล้วค่ะ!");
    const pCount = window.db.config.promotions.length; if(document.getElementById('promoBadgeCount')) document.getElementById('promoBadgeCount').innerText = pCount;
}
function deletePromoDirect(idx) {
    window.db.config.promotions.splice(idx, 1); window.db.saveConfig(window.db.config); renderAdminDashboard();
    const pCount = (window.db.config.promotions || []).length; if(document.getElementById('promoBadgeCount')) document.getElementById('promoBadgeCount').innerText = pCount;
}

function renderAdminMemberListDatabase() {
    const zone = document.getElementById('adminMemberListDatabaseZone'); if(!zone) return;
    const members = window.db.getMembers() || [];
    if(members.length === 0) { zone.innerHTML = `<p class="text-sub text-center py-4">ยังไม่มีรายชื่อสมาชิกลงทะเบียนในระบบค่ะ</p>`; return; }
    zone.innerHTML = members.map((m, idx) => `
        <div class="p-3 border border-main rounded-xl admin-inner-panel flex justify-between items-center gap-2 text-[11px]">
            <div><p class="font-bold text-slate-800">👤 ชื่อบัญชี: ${m.username} <span class="text-green-600 font-black">คงเหลือ ฿${m.credit}</span></p><p class="text-gray-500 text-[10px]">เมลผู้รับสิทธิ์: ${m.email || 'ยังไม่ได้ระบุ'}</p></div>
            <div class="flex gap-1.5"><button onclick="adjustMemberCreditDirect(${idx})" class="bg-emerald-600 text-white px-2 py-1 rounded-md text-[9px] font-bold">⚙️ ปรับยอด</button><button onclick="deleteMemberByAdmin(${idx})" class="bg-rose-500 text-white px-2 py-1 rounded-md text-[9px] font-bold">🗑️ ลบไอดี</button></div>
        </div>`).join('');
}

function adjustMemberCreditDirect(idx) {
    let members = window.db.getMembers(); const m = members[idx];
    const newAmount = prompt(`พิมพ์ตัวเลขยอดเงินใหม่ที่ต้องการตั้งให้คุณ ${m.username}:`, m.credit);
    if(newAmount !== null && !isNaN(newAmount) && newAmount.trim() !== "") {
        m.credit = Number(newAmount); window.db.saveMembers(members);
        const u = window.db.getCurrentUser(); if(u && u.username === m.username) { window.db.saveCurrentUser(m); updateCreditDisplay(); }
        alert(`ปรับยอดเครดิตสำเร็จเรียบร้อยค่ะ!`); renderAdminDashboard();
    }
}

function deleteMemberByAdmin(idx) {
    let members = window.db.getMembers(); const name = members[idx].username;
    if(confirm(`คุณเกดต้องการลบบัญชีคุณ "${name}" ออกจากระบบถาวรใช่ไหมคะ?`)) {
        members.splice(idx, 1); window.db.saveMembers(members);
        const u = window.db.getCurrentUser(); if(u && u.username === name) { window.db.saveCurrentUser(null); updateCreditDisplay(); }
        renderAdminDashboard();
    }
}

function renderPresets() {
    const list = document.getElementById('presetList'); if(!list) return;
    list.innerHTML = (window.db.config.themePresets || []).map((p) => `
        <button type="button" onclick="applyPresetAdmin('${p.id}')" class="px-3 py-1.5 bg-white border rounded-xl text-slate-800 font-bold text-[10px] flex-shrink-0 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full inline-block" style="background:${p.colors.primary}"></span> ${p.name}
        </button>`).join('');
}

function applyPresetAdmin(pId) { const p = window.db.config.themePresets.find(i=>i.id===pId); if(p){ window.db.config.theme = JSON.parse(JSON.stringify(p.colors)); applyTheme(); window.db.saveConfig(window.db.config); renderAdminDashboard(); } }

function renderAdminProductList() {
    const cont = document.getElementById('adminProductList'); if(!cont) return;
    const items = window.db.products;
    if(items.length === 0) { cont.innerHTML = `<p class="text-sub py-2">ไม่มีสินค้าคงคลังในขณะนี้</p>`; return; }
    cont.innerHTML = items.map((p, idx) => `
        <div class="flex items-center justify-between p-2.5 border border-main rounded-2xl text-[10px] text-main bg-black/10">
            <div class="truncate max-w-[70%] font-bold">📦 ${p.name} (ราคา ฿${p.price - p.discount})</div>
            <button onclick="deleteProductDirect(${idx})" class="text-rose-400 font-bold hover:underline px-2">🗑️ ลบชิ้นนี้</button>
        </div>`).join('');
}

function deleteProductDirect(idx) { if(confirm("ต้องการลบสินค้าชิ้นนี้ออกจากแอปถาวรใช่ไหมคะ?")) { window.db.products.splice(idx,1); window.db.saveProducts(window.db.products); renderAdminDashboard(); renderStore(); } }

function saveProductAdmin() {
    const nameEl = document.getElementById('admName'), priceEl = document.getElementById('admPrice'); if(!nameEl || !priceEl) return;
    const n = nameEl.value.trim(), pr = Number(priceEl.value); if(!n || !pr) return alert("กรุณาป้อนข้อมูลชื่อสินค้าและราคาเต็มก่อนค่ะ");
    
    // จัดกลุ่มอาร์เรย์รายการแอปพลิเคชันที่รองรับจากการดึงข้อความ Input แยกคอมม่า
    const appsText = document.getElementById('admAppsInput')?.value || "";
    const appsArr = appsText.split(',').map(a => a.trim()).filter(a => a !== "");

    const p = { 
        name: n, price: pr, discount: Number(document.getElementById('admDisc')?.value || 0), 
        category: document.getElementById('admCat')?.value || "ฟอนต์", 
        subCategory: document.getElementById('admSubCat')?.value || "ลายมือ", 
        brand: document.getElementById('admBrand')?.value || "DekDec Studio", 
        apps: appsArr.length > 0 ? appsArr : ["GoodNotes", "Canva"],
        img: "https://picsum.photos/400/400?random="+Date.now(), 
        desc: "สินค้าดิจิทัลลิขสิทธิ์แท้พร้อมสิทธิ์เข้าถึงลิงก์กูเกิลไดร์ฟดาวน์โหลดใช้งานได้สมบูรณ์", 
        featured: true, limitOne: true, autoDriveShare: false, 
        googleDriveFolderId: document.getElementById('admDriveUrl')?.value || "https://drive.google.com" 
    };
    window.db.products.unshift(p); window.db.saveProducts(window.db.products); 
    nameEl.value = ""; priceEl.value = ""; 
    if(document.getElementById('admDisc')) document.getElementById('admDisc').value = "";
    if(document.getElementById('admAppsInput')) document.getElementById('admAppsInput').value = "";
    if(document.getElementById('admDriveUrl')) document.getElementById('admDriveUrl').value = "";
    
    renderAdminDashboard(); renderStore(); alert("อัปโหลดสินค้าใหม่เรียบร้อยค่ะ! ✨");
}

function hideAllPages() { ['mainPage', 'productDetailPage', 'cartPage', 'receiptPage', 'userMenuPage', 'topupPage', 'allCategoriesPage', 'adminDashboard'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); }); if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.add('hidden'); if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.add('hidden'); if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.add('hidden'); }
function showMainLayout() { if(document.getElementById('mainPage')) document.getElementById('mainPage').classList.remove('hidden'); if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.remove('hidden'); if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.remove('hidden'); if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.remove('hidden'); }
