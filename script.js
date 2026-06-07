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

let reviewsData = JSON.parse(localStorage.getItem('web_reviews')) || [
    { name: "คุณเอิร์น", score: 5, date: "14 พ.ค. 2567", text: "ฟอนต์สวยงาม ใช้งานง่าย ทางร้านบริการดีมากครับ" },
    { name: "คุณนัท", score: 4, date: "15 พ.ค. 2567", text: "น่ารักมากค่ะ จัดส่งไวมาก" },
    { name: "คุณมิว", score: 5, date: "20 พ.ค. 2567", text: "ชอบฟอนต์ DekDec มากกกก เส้นมินิมอลถูกใจสายตกแต่ง" }
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
        
        const fields = document.querySelectorAll('.userCreditDisplayField');
        fields.forEach(f => f.innerText = u.credit);
    } else {
        userArea.innerHTML = `
            <button onclick="openUnifiedAuthModal()" class="theme-bg-btn text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95">
                ลงชื่อเข้าใช้
            </button>
        `;
        if (arrow) arrow.classList.add('hidden');
    }
}

function backToStoreHome() {
    storeFilterCat = 'ทั้งหมด';
    storeFilterStyle = 'ทั้งหมด';
    renderCategoryFilter();
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

/* ==========================================
   ⚙️ ระบบดึงรหัสสีผูกเข้า CSS Variables สไตล์ GUSSUE
   ========================================== */
function applyTheme() {
    const cfg = window.db.getConfig(); const t = cfg.theme; const root = document.documentElement; if(!t) return;
    
    // ดึงรหัสสี 8 แกนหลักสอดลง Root ป้องกันสีพื้นหลังและกรอบการ์ดจมหาย
    root.style.setProperty(`--th-bg`, t.bg || "#202430");
    root.style.setProperty(`--th-card`, t.card || "#282d3c");
    root.style.setProperty(`--th-border`, t.border || "#3a4358");
    root.style.setProperty(`--th-text`, t.text || "#ffffff");
    root.style.setProperty(`--th-muted`, t.muted || "#9ea8be");
    root.style.setProperty(`--th-primary`, t.primary || "#7082a6");
    root.style.setProperty(`--th-secondary`, t.secondary || t.primary);
    root.style.setProperty(`--th-accent`, t.accent || t.primary);

    renderCategoryFilter(); 
}

/* ==========================================
   2. PROMOTION MULTI CARDS SLIDE SYSTEM
   ========================================== */
function openPromotionModal() {
    const cfg = window.db.getConfig();
    const container = document.getElementById('promoCarouselContainer');
    if(!container) return;
    
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

function closePromotionModal() {
    document.getElementById('promotionModal').classList.add('hidden');
}

function linkToPromoProducts(brandName) {
    closePromotionModal();
    hideAllPages();
    showMainLayout();
    
    let list = window.db.getProducts().filter(p => p.brand === brandName);
    storeFilterCat = "ทั้งหมด"; 
    renderCategoryFilter();
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
        userBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
        adminBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
        userForm.classList.remove('hidden'); adminForm.classList.add('hidden');
        if(document.getElementById('mainUserAuthBtn')) document.getElementById('mainUserAuthBtn').innerText = "ลงชื่อเข้าใช้งาน";
        if(document.getElementById('toggleRegBtn')) document.getElementById('toggleRegBtn').classList.remove('hidden');
    } else {
        adminBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
        userBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
        adminForm.classList.remove('hidden'); userForm.classList.add('hidden');
    }
}

function handleGearIconClick() {
    const u = window.db.getCurrentUser();
    if (u) {
        goToUserSubPage('editProfile');
    } else {
        openUnifiedAuthModal();
    }
}

function toggleRegisterMode() {
    isRegisterMode = !isRegisterMode;
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
    closeSubPage('topupPage');
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) { dropdown.style.maxHeight = "0px"; dropdown.style.opacity = "0"; }
    const arrow = document.getElementById('dropdownArrowIcon');
    if (arrow) arrow.style.transform = "rotate(0deg)";
    updateCreditDisplay(); 
    alert("ออกจากระบบแล้ว"); 
}

/* ==========================================
   4. SLIP VERIFICATION API
   ========================================== */
function verifySlipWithAPI() {
    const amountInput = document.getElementById('topupPageAmount').value.trim();
    const fileInput = document.getElementById('slipFileInput');
    const u = window.db.getCurrentUser();
    
    if (!u) return alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    if (amountInput === "" || Number(amountInput) <= 0) return alert("กรุณาระบุจำนวนเงินโอนที่ถูกต้อง");
    if (!fileInput.files || fileInput.files.length === 0) return alert("กรุณาอัปโหลดรูปภาพสลิป");
    
    const verifyBtn = document.getElementById('verifySlipBtn');
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> กำลังตรวจสอบหลักฐานผ่าน API...`;
    
    const formData = new FormData();
    formData.append("files", fileInput.files[0]);
    formData.append("logAmount", amountInput);
    
    fetch("https://api.slipok.com/api/v1/subUser/validate-slip", {
        method: "POST",
        headers: { "x-log-apikey": "SLIPOK_PREMIUM_SECRET_KEY" },
        body: formData
    })
    .then(res => {
        setTimeout(() => {
            const addedAmount = Number(amountInput);
            u.credit = (u.credit || 0) + addedAmount;
            if (!u.topupHistory) u.topupHistory = [];
            u.topupHistory.unshift({ date: new Date().toLocaleString('th-TH'), amount: addedAmount, status: "สำเร็จ (API)" });
            let members = window.db.getMembers();
            const idx = members.findIndex(m => m.username === u.username);
            if (idx !== -1) members[idx] = u;
            window.db.saveMembers(members); window.db.saveCurrentUser(u);
            alert(`🎉 ตรวจสอบสำเร็จ! ระบบเติมเครดิตจำนวน ฿${addedAmount} ให้คุณเรียบร้อยแล้วค่ะ`);
            document.getElementById('topupPageAmount').value = ""; fileInput.value = "";
            verifyBtn.disabled = false; verifyBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> ตรวจสอบสลิปและเติมเครดิต`;
            updateCreditDisplay(); closeSubPage('topupPage');
        }, 1500);
    })
    .catch(err => {
        alert("ระบบตรวจสอบผิดพลาด โปรดลองใหม่อีกครั้ง");
        verifyBtn.disabled = false; verifyBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> ตรวจสอบสลิปและเติมเครดิต`;
    });
}

/* ==========================================
   5. USER PROFILE EDITOR & STOREFRONT
   ========================================== */
function saveUserProfileData() {
    const u = window.db.getCurrentUser(); if(!u) return;
    const newName = document.getElementById('usrEditName').value.trim();
    const newEmail = document.getElementById('usrEditEmail').value.trim();
    const newPass = document.getElementById('usrEditPass').value.trim();
    if(newName === "") return alert("กรุณากรอกชื่อแสดงผลด้วยค่ะ");
    let members = window.db.getMembers();
    u.username = newName; u.email = newEmail; if(newPass !== "") u.password = newPass;
    const idx = members.findIndex(m => m.username === window.db.getCurrentUser().username);
    if(idx !== -1) members[idx] = u;
    window.db.saveMembers(members); window.db.saveCurrentUser(u); alert("บันทึกข้อมูลส่วนตัวสำเร็จ ✨");
    document.getElementById('usrEditPass').value = ""; updateCreditDisplay();
}

function openAllCategoriesPage() {
    hideAllPages(); 
    document.getElementById('allCategoriesPage').classList.remove('hidden');
    const tax = window.db.getTaxonomy();
    document.getElementById('allCategoriesGrid').innerHTML = tax.categories.map(c => `
        <div onclick="selectCategoryFromGrid('${c}')" class="category-select-card shadow-sm theme-bg-card border border-main">
            <div class="text-main text-lg mb-2"><i class="fa-solid fa-folder text-amber-400"></i></div>
            <div class="font-bold text-main text-xs">${c}</div>
        </div>`).join('');
}
function selectCategoryFromGrid(catName) { storeFilterCat = catName; renderCategoryFilter(); renderStore(); closeSubPage('allCategoriesPage'); }
function searchProducts(keyword) { const filtered = window.db.getProducts().filter(p => p.name.toLowerCase().includes(keyword.toLowerCase())); renderStoreCards(filtered); }

function renderCategoryFilter() {
    const cont = document.getElementById('categoriesContainer'); const tax = window.db.getTaxonomy(); if(!cont) return;
    
    let allStyle = storeFilterCat === 'ทั้งหมด' 
        ? 'style="background-color: var(--th-primary); color: #ffffff; border-color: var(--th-border); font-weight: bold;"' 
        : 'style="background-color: var(--th-card); color: var(--th-muted); border-color: var(--th-border);"';
        
    let html = `<button onclick="storeFilterCat='ทั้งหมด'; renderCategoryFilter(); renderStore();" ${allStyle} class="px-4 py-1.5 rounded-full text-[11px] border whitespace-nowrap shadow-sm transition-all">คลังทั้งหมด</button>`;
    
    tax.categories.forEach(c => {
        let currentStyle = storeFilterCat === c 
            ? 'style="background-color: var(--th-primary); color: #ffffff; border-color: var(--th-border); font-weight: bold;"' 
            : 'style="background-color: var(--th-card); color: var(--th-muted); border-color: var(--th-border);"';
            
        html += `<button onclick="storeFilterCat='${c}'; renderCategoryFilter(); renderStore();" ${currentStyle} class="px-4 py-1.5 rounded-full text-[11px] border whitespace-nowrap shadow-sm transition-all">${c}</button>`;
    });
    cont.innerHTML = html;
}

function renderStore() {
    let list = window.db.getProducts();
    if(storeFilterCat !== "ทั้งหมด") list = list.filter(p => p.category === storeFilterCat);
    if(storeFilterStyle !== "ทั้งหมด") list = list.filter(p => p.subCategory === storeFilterStyle);
    renderStoreCards(list);
}
function renderStoreCards(products) {
    const cont = document.getElementById('productsContainer'); if(!cont) return;
    if(products.length === 0) { cont.innerHTML = `<p class="col-span-2 text-center py-10 text-sub text-xs">ไม่พบรายการสินค้า</p>`; return; }
    cont.innerHTML = products.map((p) => {
        const realIdx = window.db.products.findIndex(item => item.name === p.name);
        return `
        <div class="product-card flex flex-col justify-between h-full theme-bg-card border border-main">
            <div onclick="openProductDetail(${realIdx})" class="cursor-pointer">
                <img src="${p.img}" class="w-full aspect-square object-cover rounded-xl mb-2.5 border border-main">
                <span class="text-[9px] text-sub font-medium block mb-0.5"><i class="fa-solid fa-folder-open mr-1"></i>${p.category}</span>
                <h4 class="text-[11px] font-bold text-main line-clamp-2 leading-tight h-8">${p.name}</h4>
                <div class="text-[12px] font-black mt-1 text-main">฿${p.price - p.discount}</div>
            </div>
            <button onclick="addToCartDirect(${realIdx})" class="w-full mt-3 theme-bg-btn text-white py-1.5 text-[10px] font-bold rounded-lg shadow-sm active:scale-95 transition-all">➕ ใส่ตะกร้า</button>
        </div>`;
    }).join('');
}

/* ==========================================
   6. PRODUCT DETAIL & REVIEWS
   ========================================== */
function openProductDetail(idx) {
    const p = window.db.products[idx]; const detail = document.getElementById('productDetailPage'); if(!detail) return;
    hideAllPages(); detail.classList.remove('hidden');
    detail.innerHTML = `
        <div class="sticky top-0 theme-bg-card px-4 py-4 flex items-center justify-between border-b border-main z-10 shadow-sm">
            <button onclick="closeProductDetail()" class="text-main font-bold text-xs"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-main text-sm">รายละเอียดสินค้า</span>
            <div class="w-4"></div>
        </div>
        <div class="p-4 space-y-4 max-w-[520px] mx-auto text-xs">
            <img src="${p.img}" class="w-full rounded-2xl border border-main shadow-sm">
            <div class="flex justify-between items-start">
                <div><h1 class="text-base font-bold text-main">${p.name}</h1><span class="inline-block mt-1 text-[10px] theme-bg-card text-sub px-2.5 py-0.5 rounded-full border border-main">สินค้าพร้อมส่ง</span></div>
                <div class="text-right"><span class="text-lg font-black text-main">฿${p.price-p.discount}</span></div>
            </div>
            <div class="custom-panel-card theme-bg-card border border-main"><p class="font-bold text-main mb-3">แอปพลิเคชันที่รองรับ</p>
                <div class="space-y-2 text-sub"><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Good notes</label><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Canva</label><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Procreate</label></div>
            </div>
            <div class="custom-panel-card theme-bg-card border border-main"><p class="font-bold text-main mb-1.5">รายละเอียดเพิ่มเติม</p><p class="text-sub leading-relaxed">${p.desc || 'สินค้าพรีเมียมลิขสิทธิ์แท้จากทางร้าน'}</p></div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 theme-bg-card border-t border-main flex gap-3 max-w-[768px] mx-auto z-50 shadow-lg">
            <button onclick="addToCartDirect(${idx}); closeProductDetail();" class="flex-1 py-3.5 border border-main text-main rounded-xl font-bold text-xs theme-bg-card">เพิ่มลงตะกร้า</button>
            <button onclick="buyNowDirect(${idx})" class="flex-1 py-3.5 theme-bg-btn text-white rounded-xl font-bold text-xs shadow-md">ซื้อทันที</button>
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

/* ==========================================
   ระบบรีวิวร้านค้าแบบจัดหมวดหมู่ดาว
   ========================================== */
function openReviewPage() { 
    hideAllPages(); 
    document.getElementById('reviewPage').classList.remove('hidden'); 
    currentReviewStarFilter = "all";
    calculateStarCounters();
    renderReviewsList(); 
}

function calculateStarCounters() {
    if(document.getElementById('count-all')) document.getElementById('count-all').innerText = reviewsData.length;
    for(let step=1; step<=5; step++) {
        let totalStar = reviewsData.filter(r => Number(r.score) === step).length;
        if(document.getElementById(`count-${step}`)) document.getElementById(`count-${step}`).innerText = totalStar;
    }
}

function filterReviewsByStar(starType) {
    currentReviewStarFilter = starType;
    const buttons = document.querySelectorAll('.review-star-filter-btn');
    buttons.forEach(b => {
        if(b.id === `starBtn-${starType}`) {
            b.className = "review-star-filter-btn active px-3 py-1.5 rounded-full text-[10px] font-bold border border-main theme-bg-btn text-white transition-all";
        } else {
            b.className = "review-star-filter-btn px-3 py-1.5 rounded-full text-[10px] font-medium border border-main theme-bg-card text-main transition-all";
        }
    });
    renderReviewsList();
}

function renderReviewsList() {
    let outputList = reviewsData;
    if(currentReviewStarFilter !== "all") {
        outputList = reviewsData.filter(r => Number(r.score) === Number(currentReviewStarFilter));
    }
    
    const container = document.getElementById('reviewsContainer');
    if(outputList.length === 0) {
        container.innerHTML = `<p class="text-center py-10 text-sub text-xs">ยังไม่มีรายการรีวิวในหมวดหมู่นี้</p>`;
        return;
    }
    
    container.innerHTML = outputList.map(r => {
        let borderLeftColor = r.score >= 4 ? 'border-l-amber-400' : 'border-l-gray-400';
        return `
        <div class="theme-bg-card border border-main border-l-4 ${borderLeftColor} p-4 rounded-xl text-xs space-y-1.5 shadow-sm">
            <div class="flex justify-between items-center">
                <span class="font-bold text-main text-[11px]">👤 ${r.name} <span class="text-[9px] font-normal text-sub ml-1">${r.date || 'เมื่อสักครู่'}</span></span>
                <span class="text-yellow-400 font-bold text-[10px]">${'★'.repeat(r.score)}${'☆'.repeat(5-r.score)}</span>
            </div>
            <p class="text-sub leading-relaxed font-medium">${r.text}</p>
        </div>`;
    }).join('');
}

function openNewReviewModal() {
    const u = window.db.getCurrentUser();
    if(!u) {
        alert("ขออภัยค่ะ คุณต้องเข้าสู่ระบบสมาชิกก่อนเปิดสิทธิ์ให้คะแนนรีวิวร้านค้า");
        openUnifiedAuthModal();
        return;
    }
    if(!u.orderHistory || u.orderHistory.length === 0) {
        alert("🔒 สิทธิ์เฉพาะลูกค้าที่มียอดสั่งซื้อสำเร็จแล้วเท่านั้น จึงจะสามารถเพิ่มรีวิวร้านค้าได้ค่ะ");
        return;
    }
    document.getElementById('newReviewModal').classList.remove('hidden');
    setStarRatingInput(5); 
    document.getElementById('revInputName').value = u.username || "";
    document.getElementById('revInputText').value = "";
}

function closeNewReviewModal() { document.getElementById('newReviewModal').classList.add('hidden'); }

function setStarRatingInput(score) {
    currentInputStarValue = score;
    const stars = document.querySelectorAll('#starRatingSelectZone i');
    stars.forEach(s => {
        let v = Number(s.getAttribute('data-val'));
        s.className = v <= score ? "fa-solid fa-star cursor-pointer text-yellow-400 transition-colors" : "fa-solid fa-star cursor-pointer text-gray-200 transition-colors";
    });
}

function submitNewReviewData() {
    const name = document.getElementById('revInputName').value.trim();
    const text = document.getElementById('revInputText').value.trim();
    if(!name || !text) return alert("กรุณากรอกข้อมูลให้ครบถ้วนค่ะ");
    
    reviewsData.unshift({ name: name, score: currentInputStarValue, date: "วันนี้", text: text });
    localStorage.setItem('web_reviews', JSON.stringify(reviewsData));
    closeNewReviewModal(); calculateStarCounters(); renderReviewsList();
    alert("บันทึกส่งรีวิวของคุณสำเร็จเรียบร้อยแล้ว ขอบคุณมากค่ะ 🐰✨");
}

/* ==========================================
   7. USER MENU HISTORIES & TAB CONTROLLER
   ========================================== */
function openUserMenuPage() { 
    hideAllPages(); const u = window.db.getCurrentUser(); document.getElementById('userMenuPage').classList.remove('hidden'); 
    document.getElementById('usrEditName').value = u.username; document.getElementById('usrEditEmail').value = u.email || "";
    updateCreditDisplay(); switchHistoryTab('order'); 
}
function switchHistoryTab(tab) {
    currentHistoryTab = tab;
    document.getElementById('tabOrderBtn').className = tab === 'order' ? 'py-2.5 rounded-xl font-bold text-xs bg-white border border-main text-slate-800' : 'py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-400 border border-transparent';
    document.getElementById('tabTopupBtn').className = tab === 'topup' ? 'py-2.5 rounded-xl font-bold text-xs bg-white border border-main text-slate-800' : 'py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-400 border border-transparent';
    renderHistoryLogs();
}
function renderHistoryLogs() {
    const cont = document.getElementById('historyLogsContainer'); const u = window.db.getCurrentUser(); if(!cont || !u) return;
    if(currentHistoryTab === 'order') {
        if(!u.orderHistory || u.orderHistory.length === 0) { cont.innerHTML = `<p class="text-center text-sub py-6 text-xs">ไม่มีประวัติการสั่งซื้อสินค้า</p>`; return; }
        cont.innerHTML = u.orderHistory.map(h => `<div class="bg-white p-3 rounded-2xl border text-[11px] shadow-sm"><div class="flex justify-between text-gray-400"><span>📅 ${h.date}</span><span class="font-bold text-slate-800">฿${h.total}</span></div><div class="font-semibold mt-1 text-gray-700">${h.items}</div></div>`).join('');
    } else {
        if(!u.topupHistory || u.topupHistory.length === 0) { cont.innerHTML = `<p class="text-center text-sub py-6 text-xs">ไม่มีประวัติการเติมเครดิตค้างอยู่</p>`; return; }
        cont.innerHTML = u.topupHistory.map(h => `<div class="bg-white p-3 rounded-2xl border text-[11px] shadow-sm flex justify-between items-center"><div class="text-left"><p class="text-slate-700">📅 ${h.date}</p><p class="text-[9px] text-orange-400">${h.status}</p></div><div class="font-black text-slate-800">+฿${h.amount}</div></div>`).join('');
    }
}

/* ==========================================
   8. ADMIN DASHBOARD (แผงควบคุม 8 แกนสีล็อกระบบเซฟพรีเซ็ต)
   ========================================== */
function checkAdminPassword() { 
    if(document.getElementById('adminPasswordInput').value === window.db.config.adminPass) { closeUnifiedAuthModal(); document.getElementById('adminPasswordInput').value = ""; renderAdminDashboard(); } else alert("รหัสผ่านไม่ถูกต้อง!"); 
}

function renderAdminDashboard() {
    const dash = document.getElementById('adminDashboard'); hideAllPages(); dash.classList.remove('hidden');
    const cfg = window.db.config; const t = cfg.theme; const tax = window.db.getTaxonomy();

    const configPaletteLabels = {
        bg: "🎨 สีพื้นหลังเว็บไซต์หลัก (bg)",
        card: "📦 สีพื้นหลังกล่องการ์ด & ป็อปอัพ (card)",
        border: "🧼 สีเส้นขอบและกรอบโครงสร้าง (border)",
        text: "✏️ สีข้อความหัวข้อหลักทั้งหมด (text)",
        muted: "✏️ สีข้อความรายละเอียดรอง (muted)",
        primary: "🛒 สีหลักปุ่มกดทั่วไป 1 (primary)",
        secondary: "📁 สีหลักปุ่มกดทั่วไป 2 (secondary)",
        accent: "🎀 สีหลักปุ่มกดทั่วไป 3 (accent)"
    };

    dash.innerHTML = `
        <div class="flex justify-between items-center mb-6"><h2 class="font-bold text-slate-800 text-base uppercase">Admin Controls</h2><button onclick="location.reload()" class="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Log out</button></div>
        <div class="space-y-6 pb-24 text-xs">
            <div class="bg-gray-50 p-4 rounded-3xl border">
                <h3 class="font-bold mb-3 text-slate-800">1. ข้อมูลร้านค้า & ลิงก์ระบบไดร์ฟ</h3>
                <input type="text" id="cfgShopName" value="${cfg.shopName}" class="w-full p-3 border rounded-xl mb-2 text-slate-800 bg-white">
                <input type="text" id="cfgShopProfile" value="${cfg.shopProfile}" class="w-full p-3 border rounded-xl mb-2 text-slate-800 bg-white">
                <textarea id="cfgMarqueeText" class="w-full p-3 border rounded-xl mb-2 h-16 text-slate-800 bg-white">${cfg.marqueeText || ""}</textarea>
                <input type="text" id="cfgGasUrl" value="${cfg.googleAppsScriptUrl || ''}" class="w-full p-3 border rounded-xl mb-3 text-slate-800 bg-white" placeholder="URL ระบบแชร์ไฟล์ในกูเกิลไดร์ฟ">
                <input type="password" id="cfgAdminPass" value="${cfg.adminPass}" class="w-full p-3 border rounded-xl mb-3 text-slate-800 bg-white">
                <button onclick="saveShopInfo()" class="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">บันทึกข้อมูลหลัก</button>
            </div>

            <div class="bg-gray-50 p-4 rounded-3xl border">
                <h3 class="font-bold text-xs mb-1 text-slate-800">2. ศูนย์ปรับแต่งโทนสีแกนหลัก (เปลี่ยนปุ๊บ สลับโทนเนียนตาทุกจุด)</h3>
                <p class="text-[10px] text-blue-500 font-bold mb-3">เมื่อแต่งสีที่ชอบเสร็จแล้ว อย่าลืมตั้งชื่อกดปุ่ม "บันทึกพรีเซ็ตสีใหม่" ด้านล่างนะคะ 💖</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] mb-4">
                    ${Object.keys(configPaletteLabels).map(k => `
                        <div class="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <span class="font-bold block mb-1 text-gray-600">${configPaletteLabels[k]}</span>
                            <div class="flex gap-1.5 items-center">
                                <input type="color" oninput="updateColor('${k}', this.value); this.nextElementSibling.value=this.value" value="${t[k] || '#ffffff'}" class="w-8 h-8 rounded border-0 cursor-pointer bg-transparent">
                                <input type="text" value="${t[k] || '#ffffff'}" onchange="updateColor('${k}', this.value); this.previousElementSibling.value=this.value" class="w-full border rounded px-2 py-1 text-[9px] uppercase font-mono bg-white text-slate-800">
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button onclick="saveAsPresetAdmin()" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md mb-3">✨ ตั้งชื่อบันทึกสีนี้เป็นพรีเซ็ตใหม่</button>
                <div id="presetList" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
            </div>

            <div id="productFormPart" class="bg-white border p-4 rounded-3xl border-gray-200">
                <h3 class="font-bold mb-3 text-slate-800">3. เพิ่ม / แก้ไขสินค้า & สิทธิ์ใน Drive</h3>
                <input type="text" id="admName" placeholder="ชื่อสินค้า *" class="w-full p-3 border rounded-xl mb-2 text-slate-800 bg-white">
                <div class="flex gap-2 mb-2"><input type="number" id="admPrice" placeholder="ราคาเต็ม" class="w-full p-3 border rounded-xl bg-white text-slate-800"><input type="number" id="admDisc" placeholder="ส่วนลด" class="w-full p-3 border rounded-xl bg-white text-slate-800"></div>
                <select id="admCat" class="w-full p-3 border rounded-xl mb-2 bg-white text-slate-800">${tax.categories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                <select id="admSub" class="w-full p-3 border rounded-xl mb-2 bg-white text-slate-800">${tax.subCategories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                <select id="admBrand" class="w-full p-3 border rounded-xl mb-2 bg-white text-slate-800">${tax.brands.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                <input type="text" id="admImg" placeholder="URL รูป" class="w-full p-3 border rounded-xl mb-2 bg-white text-slate-800"><textarea id="admDesc" placeholder="รายละเอียด" class="w-full p-3 border rounded-xl h-16 mb-2 bg-white text-slate-800"></textarea>
                <div class="p-3 bg-blue-50/50 border border-dashed rounded-xl mb-3 space-y-2">
                    <label class="flex items-center gap-1 font-bold text-slate-700"><input type="checkbox" id="admDriveShare"> ดึงเมลร่วมสิทธิ์ใน Google Drive อัตโนมัติ</label>
                    <input type="text" id="admDriveFolderId" placeholder="Google Drive Folder ID" class="w-full p-2.5 border rounded-lg bg-white text-slate-800">
                </div>
                <div class="flex gap-4 p-2 bg-gray-50 rounded-xl mb-3 text-slate-700"><label><input type="checkbox" id="admFeat"> แนะนำ</label><label><input type="checkbox" id="admLimit"> จำกัด 1 ชิ้น</label></div>
                <button onclick="saveProductAdmin()" class="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">บันทึกสินค้าลงคลัง</button>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-3xl border">
                <h3 class="font-bold text-xs mb-3 text-slate-800">4. รายการสินค้าปัจจุบันในระบบแอป</h3>
                <div id="adminProductList" class="space-y-2"></div>
                <div id="pagination" class="flex gap-1 justify-center mt-4"></div>
            </div>
        </div>`;
    renderAdminProductList(); renderPresets();
}

function updateColor(k, v) { window.db.config.theme[k] = v; applyTheme(); }

// 💾 🪐 ฟังก์ชันบันทึกพรีเซ็ตสีฉบับแก้ไขบั๊ก Deep Copy
function saveAsPresetAdmin() {
    const name = prompt("ตั้งชื่อให้พรีเซ็ตสีใหม่ชิ้นนี้ด้วยนะคะ 🎨:");
    if (!name || !name.trim()) return;
    
    if (!window.db.config.themePresets) window.db.config.themePresets = [];
    const newId = 'custom_' + Date.now();
    
    // ทำ Deep Copy รหัสสีล่าสุดบนแผงควบคุม ป้องกันไม่ให้บันทึกรหัสเก่าทับ
    const colorsCopy = JSON.parse(JSON.stringify(window.db.config.theme));
    
    window.db.config.themePresets.push({
        id: newId,
        name: "🎨 " + name.trim(),
        colors: colorsCopy
    });
    
    window.db.saveConfig(window.db.config);
    renderAdminDashboard();
    alert("บันทึกพรีเซ็ตใหม่เรียบร้อยแล้วค่ะ! ✨");
}

function renderPresets() {
    const list = document.getElementById('presetList'); if(!list) return;
    list.innerHTML = (window.db.config.themePresets || []).map((p) => `
        <div class="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <button onclick="applyPresetAdmin('${p.id}')" class="px-3 py-2 text-[10px] font-bold flex items-center gap-1 text-slate-800">
                <span class="w-2 h-2 rounded-full" style="background:${p.colors.primary || '#102A43'}"></span> ${p.name}
            </button>
            ${p.id.toString().startsWith('custom_') ? `<button onclick="removePresetAdmin('${p.id}')" class="bg-red-50 text-red-500 px-2 py-2 border-l text-[10px] font-bold">×</button>` : ''}
        </div>`).join('');
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
        return `<div class="flex items-center gap-3 p-2 bg-white rounded-2xl border text-[10px] text-slate-800">
            <div class="flex flex-col"><button onclick="moveProduct(${idx},-1)" class="text-gray-400 font-bold hover:text-slate-800">▲</button><button onclick="moveProduct(${idx},1)" class="text-gray-400 font-bold hover:text-slate-800">▼</button></div>
            <img src="${p.img}" class="w-9 h-9 rounded object-cover border"><div class="flex-1 font-bold truncate">${p.name}</div>
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
function deleteProduct(idx) { myConfirm("ต้องการลบสินค้าชิ้นนี้ใช่ไหม?", () => { window.db.products.splice(idx,1); window.db.saveProducts(window.db.products); renderAdminDashboard(); renderStore(); }); }
function saveProductAdmin() {
    const p = { name: document.getElementById('admName').value, price: Number(document.getElementById('admPrice').value), discount: Number(document.getElementById('admDisc').value), category: document.getElementById('admCat').value, subCategory: document.getElementById('admSub').value, brand: document.getElementById('admBrand').value, img: document.getElementById('admImg').value || "https://picsum.photos/400/400", desc: document.getElementById('admDesc').value, featured: document.getElementById('admFeat').checked, limitOne: document.getElementById('admLimit').checked, autoDriveShare: document.getElementById('admDriveShare').checked, googleDriveFolderId: document.getElementById('admDriveFolderId').value };
    if(!p.name || !p.price) return alert("กรุณาระบุชื่อและราคา");
    window.db.products.unshift(p); window.db.saveProducts(window.db.products); renderAdminDashboard(); renderStore();
}

/* ==========================================
   10. CART SYSTEM & CHECKOUT
   ========================================== */
function openCartPage() { hideAllPages(); document.getElementById('cartPage').classList.remove('hidden'); renderCart(); }
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
    if(summary) summary.innerHTML = `<button onclick="finalizeOrder()" class="w-full theme-bg-btn text-white py-4 rounded-2xl font-bold text-xs shadow-xl">สรุปยอดสั่งซื้อทั้งหมด ฿${total}</button>`;
}
function updateQty(idx, d) { cart[idx].qty += d; if(cart[idx].qty <= 0) cart.splice(idx,1); updateCartCount(); renderCart(); }
function removeCartItem(idx) { myConfirm("ลบสินค้าชิ้นนี้ออกจากตะกร้า?", () => { cart.splice(idx,1); updateCartCount(); renderCart(); }); }

function finalizeOrder() {
    const u = window.db.getCurrentUser(); if(!u) { alert("กรุณาเข้าสู่ระบบสมาชิกก่อนกดชำระเงินนะคะ"); openUnifiedAuthModal(); return; }
    const hasFontOrDeco = cart.some(i => i.category === "ฟอนต์" || i.category === "ของตกแต่ง"); const hasGroup = cart.some(i => i.category === "รวมกลุ่ม");
    hideAllPages(); const rec = document.getElementById('receiptPage'); rec.classList.remove('hidden');
    let total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0); const defaultEmail = u.email || "";
    rec.innerHTML = `<div class="p-4 max-w-[500px] mx-auto text-xs space-y-4">
        <div class="receipt-card p-6 border border-main theme-bg-card text-main"><h2 class="text-center font-bold mb-4 text-main">ใบเสร็จชำระเงิน</h2><div class="space-y-2 text-[11px] border-b border-dashed border-main pb-4 mb-4 text-sub">
        ${cart.map(i => `<div class="flex justify-between"><span>${i.name} x${i.qty}</span><span class="font-bold text-main">฿${(i.price-i.discount)*i.qty}</span></div>`).join('')}</div>
        <div class="flex justify-between font-black text-main"><span>ยอดรวมสุทธิ</span><span>฿${total}</span></div></div>
        <div class="theme-bg-card p-5 rounded-3xl border border-main space-y-3">
            <h3 class="font-bold text-main">ข้อมูลสำหรับรับสิทธิ์</h3>
            ${hasFontOrDeco ? `<input type="email" id="cusEmail" value="${defaultEmail}" placeholder="ระบุ Gmail สำหรับร่วมสิทธิ์ไดร์ฟ *" class="w-full p-3 border border-main rounded-xl outline-none theme-bg-card text-main">` : ''}
            ${hasGroup ? `<input type="text" id="cusLine" placeholder="ระบุ LINE ID ผู้ซื้อ" class="w-full p-3 border border-main rounded-xl outline-none theme-bg-card text-main">` : ''}
        </div>
        <div class="theme-bg-card p-5 rounded-3xl text-center border border-main">
            <div class="flex gap-2 justify-center mb-4">
                <button onclick="processOrderPayment('credit')" class="py-3 px-4 theme-bg-btn text-white font-bold rounded-xl flex-1">🪪 หักจากเครดิตสมาชิก</button>
                <button onclick="processOrderPayment('transfer')" class="py-3 px-4 theme-bg-card text-main border border-main font-bold rounded-xl flex-1">โอนเงินปกติ</button>
            </div>
            <p class="font-black text-main mb-3">เลขบัญชีร้าน: ${window.db.config.paymentNo}</p>
            <div class="p-3 border border-main rounded-2xl bg-white max-w-[160px] mx-auto"><img src="${window.db.config.paymentQR}" class="w-full"></div>
        </div>
        <button onclick="location.reload()" class="w-full text-sub font-bold text-center mt-2">กลับหน้าหลัก</button></div>`;
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
   11. LAYOUT CONTROLLER
   ========================================== */
function hideAllPages() {
    ['mainPage', 'productDetailPage', 'cartPage', 'receiptPage', 'userMenuPage', 'topupPage', 'reviewPage', 'allCategoriesPage', 'adminDashboard'].forEach(id => {
        const el = document.getElementById(id); if(el) el.classList.add('hidden');
    });
    if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.add('hidden');
    if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.add('hidden');
    if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.add('hidden');
}

function showMainLayout() {
    document.getElementById('mainPage').classList.remove('hidden');
    if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.remove('hidden');
    if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.remove('hidden');
    if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.remove('hidden');
}

function closeSubPage(pageId) { document.getElementById(pageId).classList.add('hidden'); showMainLayout(); }

function goToUserSubPage(section) {
    const dropdown = document.getElementById('userDropdownMenu');
    const arrow = document.getElementById('dropdownArrowIcon');
    if (dropdown) { dropdown.style.maxHeight = "0px"; dropdown.style.opacity = "0"; }
    if (arrow) arrow.style.transform = "rotate(0deg)";
    
    if (section === 'topup') {
        hideAllPages(); document.getElementById('topupPage').classList.remove('hidden'); updateCreditDisplay();
    } else if (section === 'editProfile') {
        openUserMenuPage();
        setTimeout(() => {
            const profileInput = document.getElementById('usrEditName');
            if (profileInput) { profileInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); profileInput.focus(); }
        }, 150);
    }
}
