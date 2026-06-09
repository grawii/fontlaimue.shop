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

// API Key และข้อมูลบัญชีธนาคารของคุณเกดสำหรับระบบเติมเงินอัตโนมัติ
const SLIP_API_KEY = "bank_slip_YKeDidfulHJflFdyTTEfmMsKcJVNJP9uqQq5pkz6oUlmHbUWes_1760258790";
const SHOP_BANK_NAME = "KBANK"; 
const SHOP_BANK_NO = "2148139582"; 

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
    
    restartMarqueeAnimation();

    if(document.getElementById('bankNoDisplay')) document.getElementById('bankNoDisplay').innerText = `ธนาคารกสิกรไทย เลขบัญชี: 214-8-13958-2 (พรทิพา สุนาวงค์)`;
    if(document.getElementById('bankQRDisplay')) document.getElementById('bankQRDisplay').src = cfg.paymentQR;

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
        m1.style.animation = 'none';
        m2.style.animation = 'none';
        m1.offsetHeight; 
        m2.offsetHeight;
        m1.style.animation = 'marquee 25s linear infinite';
        m2.style.animation = 'marquee2 25s linear infinite';
    }
}

function updateCreditDisplay() {
    const userArea = document.getElementById('userStatusArea');
    const arrow = document.getElementById('dropdownArrowIcon');
    const u = window.db.getCurrentUser();
    if (!userArea) return;
    
    if (u) {
        userArea.innerHTML = `
            <div onclick="openUserMenuPage()" class="cursor-pointer select-none text-right">
                <span class="text-main block font-bold max-w-[110px] truncate">👤 ${u.username}</span>
                <span class="text-green-500 block font-bold mt-0.5">฿${u.credit}</span>
            </div>
        `;
        if (arrow) arrow.classList.remove('hidden');
    } else {
        userArea.innerHTML = `
            <button onclick="openUnifiedAuthModal()" class="theme-bg-btn text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
                ลงชื่อเข้าใช้
            </button>
        `;
        if (arrow) arrow.classList.add('hidden');
    }
}

function backToStoreHome() {
    storeFilterCat = 'ทั้งหมด'; storeFilterStyle = 'ทั้งหมด';
    renderCategoryFilter(); renderStore(); hideAllPages(); showMainLayout();
    restartMarqueeAnimation();
}

function myConfirm(msg, onOk) {
    const modal = document.getElementById('customConfirm'); if(!modal) return;
    document.getElementById('confirmMsg').innerText = msg; modal.classList.remove('hidden');
    document.getElementById('confirmOk').onclick = () => { modal.classList.add('hidden'); onOk(); };
    document.getElementById('confirmCancel').onclick = () => { modal.classList.add('hidden'); };
}

/* ==========================================
   ⚙️ ระบบสี 8 แกนควบคุมไดนามิก
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
    if(isDark) {
        document.documentElement.classList.add('dark-theme-active');
    } else {
        document.documentElement.classList.remove('dark-theme-active');
    }

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

function updateColor(key, val) {
    window.db.config.theme[key] = val;
    applyTheme();
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
                <button onclick="linkToPromoProducts('${p.brandLink}')" class="w-[90%] mx-auto py-2 theme-bg-btn text-white font-bold rounded-xl text-[10px] shadow-sm flex items-center justify-center gap-1" style="background-color:var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
                    <i class="fa-solid fa-basket-shopping"></i> ดูสินค้าโปรโมชั่นเครือ ${p.brandLink}
                </button>
            </div>
        `).join('');
    }
    if(document.getElementById('promotionModal')) document.getElementById('promotionModal').classList.remove('hidden');
}
function closePromotionModal() { if(document.getElementById('promotionModal')) document.getElementById('promotionModal').classList.add('hidden'); }

/* ==========================================
   3. UNIFIED LOGIN CONTROLLER (ซ่อมปุ่มล็อกอินแอดมินขาวค้าง)
   ========================================== */
function openUnifiedAuthModal() {
    if(document.getElementById('unifiedAuthModal')) {
        document.getElementById('unifiedAuthModal').classList.remove('hidden');
        switchUnifiedTab('user');
    }
}
function closeUnifiedAuthModal() {
    if(document.getElementById('unifiedAuthModal')) {
        document.getElementById('unifiedAuthModal').classList.add('hidden');
    }
}
function switchUnifiedTab(type) {
    currentAuthTab = type; isRegisterMode = false;
    const userBtn = document.getElementById('tabAuthUserBtn'); const adminBtn = document.getElementById('tabAuthAdminBtn');
    const userForm = document.getElementById('formAuthUser'); const adminForm = document.getElementById('formAuthAdmin');
    const userSubmitBtn = document.getElementById('mainUserAuthBtn');
    const adminSubmitBtn = document.getElementById('adminAuthSubmitBtn');
    
    if(userBtn && adminBtn) {
        if(type === 'user') {
            userBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
            adminBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
            if(userForm) userForm.classList.remove('hidden'); if(adminForm) adminForm.classList.add('hidden');
            
            if(userSubmitBtn) {
                userSubmitBtn.innerText = "ลงชื่อเข้าใช้งาน";
                userSubmitBtn.className = "w-full py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md text-white cursor-pointer block text-center";
                userSubmitBtn.style.setProperty('background-color', 'var(--th-primary)', 'important');
                userSubmitBtn.style.setProperty('color', '#ffffff', 'important');
                userSubmitBtn.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.4)', 'important');
            }
        } else {
            adminBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
            userBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
            if(adminForm) adminForm.classList.remove('hidden'); if(userForm) userForm.classList.add('hidden');
            
            if(adminSubmitBtn) {
                adminSubmitBtn.innerText = "เข้าสู่ระบบผู้ดูแลระบบ";
                adminSubmitBtn.className = "w-full py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md text-white cursor-pointer block text-center";
                adminSubmitBtn.style.setProperty('background-color', 'var(--th-primary)', 'important');
                adminSubmitBtn.style.setProperty('color', '#ffffff', 'important');
                adminSubmitBtn.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.4)', 'important');
            }
        }
    }
}
function toggleRegisterMode() {
    isRegisterMode = !isRegisterMode;
    if(document.getElementById('mainUserAuthBtn')) {
        const btn = document.getElementById('mainUserAuthBtn');
        btn.innerText = isRegisterMode ? "ยืนยันการสมัครสมาชิก" : "ลงชื่อเข้าใช้งาน";
        btn.style.setProperty('background-color', 'var(--th-primary)', 'important');
        btn.style.setProperty('color', '#ffffff', 'important');
        btn.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.4)', 'important');
    }
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
    closeUnifiedAuthModal(); updateCreditDisplay();
}
function handleGearIconClick() {
    const u = window.db.getCurrentUser();
    if (u) {
        openUserMenuPage();
    } else {
        openUnifiedAuthModal();
        setTimeout(() => { switchUnifiedTab('admin'); }, 50);
    }
}
function logoutUser() { 
    window.db.saveCurrentUser(null); 
    hideAllPages();
    alert("ออกจากระบบเรียบร้อยแล้วค่ะ 👋"); 
    location.reload(); 
}

/* ==========================================
   💰 ระบบคัดกรองเช็คสลิปเติมเครดิตอัตโนมัติ
   ========================================== */
async function uploadAndVerifySlipAPI(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput || fileInput.files.length === 0) return alert("กรุณาเลือกรูปภาพสลิปโอนเงินก่อนค่ะ");

    const currentUser = window.db.getCurrentUser();
    if (!currentUser) return alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้งค่ะ");

    const formData = new FormData();
    formData.append("files", fileInput.files[0]);
    formData.append("log", "true");

    try {
        alert("ระบบกำลังส่งภาพสลิปไปตรวจสอบความถูกต้องกับธนาคารกสิกรไทย โปรดรอสักครู่ค่ะ... ⏱️");
        
        const response = await fetch("https://api.ezslip.co/v1/verify", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${SLIP_API_KEY}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.status === 200 && data.status === "success") {
            const slipDetails = data.data;
            const receiverAccount = slipDetails.receiver.account.replace(/[^0-9]/g, "");
            const amountStr = slipDetails.amount;
            const transferAmount = parseFloat(amountStr);

            if (receiverAccount !== SHOP_BANK_NO) {
                return alert("⚠️ ตรวจสอบล้มเหลว: สลิปนี้ไม่ได้โอนเข้าบัญชีธนาคารกสิกรไทยของทางร้านค่ะ!");
            }

            currentUser.credit = (currentUser.credit || 0) + transferAmount;
            
            if (!currentUser.topupHistory) currentUser.topupHistory = [];
            currentUser.topupHistory.unshift({
                amount: transferAmount,
                date: new Date().toLocaleDateString('th-TH') + " " + new Date().toLocaleTimeString('th-TH')
            });

            window.db.saveCurrentUser(currentUser);
            
            let members = window.db.getMembers();
            const mIdx = members.findIndex(m => m.username === currentUser.username);
            if (mIdx !== -1) { members[mIdx] = currentUser; window.db.saveMembers(members); }

            alert(`🎉 ตรวจสอบสำเร็จ! ระบบเติมเงินให้คุณจำนวน ฿${transferAmount} เครดิต เรียบร้อยแล้วค่ะ 🐰✨`);
            fileInput.value = ""; 
            openUserMenuPage(); 
            updateCreditDisplay();
        } else {
            alert(`❌ ตรวจสอบสลิปล้มเหลว: ${data.message || 'รูปภาพไม่ถูกต้อง หรือสลิปนี้ถูกใช้งานไปแล้ว'}`);
        }
    } catch (error) {
        console.error("Slip Verification Error:", error);
        alert("ขออภัยค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ API กรุณาลองใหม่อีกครั้ง");
    }
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
            <button onclick="addToCartDirect(${realIdx})" class="w-full mt-3 theme-bg-btn text-white py-1.5 text-[10px] font-bold rounded-lg shadow-sm active:scale-95 transition-all" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">➕ ใส่ตะกร้า</button>
        </div>`;
    }).join('');
}

/* ==========================================
   5. REVIEWS SYSTEM
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
function filterReviewsByStar(starType) {
    currentReviewStarFilter = starType;
    renderReviewsList();
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
function openEditReviewModal(reviewId) {
    const rev = reviewsData.find(r => r.id === reviewId); if(!rev) return;
    if((rev.editCount || 0) >= 2) return alert("ขออภัยค่ะ คุณสิทธิ์แก้ไขรีวิวนี้ครบพิกัด 2 ครั้งแล้วค่ะ");
    const newText = prompt("แก้ไขข้อความรีวิวของคุณที่นี่ค่ะ ✨:", rev.text);
    if(newText === null) return;
    if(!newText.trim()) return alert("กรุณากรอกข้อความรีวิวด้วยค่ะ");
    rev.text = newText.trim(); rev.editCount = (rev.editCount || 0) + 1; rev.date = "แก้ไขแล้ว";
    localStorage.setItem('web_reviews', JSON.stringify(reviewsData));
    renderReviewsList(); alert("บันทึกการแก้ไขรีวิวของคุณเรียบร้อยแล้วค่ะ! 🐰");
}

/* ==========================================
   6. ADMIN DASHBOARD & ADVANCED CONTROLS
   ========================================== */
function checkAdminPassword() { 
    if(document.getElementById('adminPasswordInput').value === window.db.config.adminPass) {
        closeUnifiedAuthModal();
        document.getElementById('adminPasswordInput').value = ""; renderAdminDashboard();
    } else alert("รหัสผ่านไม่ถูกต้อง!"); 
}

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
            <button onclick="location.reload()" class="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Log out</button>
        </div>
        
        <div class="space-y-6 pb-24 text-xs">
            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold mb-3 text-main">1. ข้อมูลร้านค้า & ลิงก์ระบบไดร์ฟ</h3>
                <input type="text" id="cfgShopName" value="${cfg.shopName}" class="w-full p-3 border border-main rounded-xl mb-2 text-main bg-transparent">
                <input type="text" id="cfgShopProfile" value="${cfg.shopProfile}" class="w-full p-3 border border-main rounded-xl mb-2 text-main bg-transparent">
                <textarea id="cfgMarqueeText" class="w-full p-3 border border-main rounded-xl mb-2 h-16 text-main bg-transparent">${cfg.marqueeText || ""}</textarea>
                <input type="text" id="cfgGasUrl" value="${cfg.googleAppsScriptUrl || ''}" class="w-full p-3 border border-main rounded-xl mb-3 text-main bg-transparent" placeholder="URL ระบบแชร์ไฟล์ในกูเกิลไดร์ฟ">
                <input type="password" id="cfgAdminPass" value="${cfg.adminPass}" class="w-full p-3 border border-main rounded-xl mb-3 text-main bg-transparent">
                <button onclick="saveShopInfo()" class="w-full py-3 theme-bg-btn text-white rounded-xl font-bold shadow-sm" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">บันทึกข้อมูลหลัก</button>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main relative">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-main">2. ศูนย์ปรับแต่งโทนสีแกนหลัก</h3>
                    <button onclick="togglePresetExpandedGrid()" class="bg-amber-400 text-slate-900 w-8 h-8 rounded-full shadow-md font-bold flex items-center justify-center text-sm active:scale-90 transition-all">🎨</button>
                </div>

                <div id="expandedPresetGridModal" class="hidden my-2 p-3 bg-black/10 border border-main rounded-2xl animate-pop">
                    <p class="font-bold text-[10px] text-main mb-2">📋 รายชื่อพรีเซ็ตสีทั้งหมดในคลังระบบ:</p>
                    <div id="presetGridContainer" class="flex flex-wrap gap-2"></div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] mb-4">
                    ${Object.keys(paletteLabels).map(k => `
                        <div class="admin-inner-panel p-2 rounded-xl border border-main shadow-inner">
                            <span class="font-bold block mb-1 text-main">${paletteLabels[k]}</span>
                            <div class="flex gap-1.5 items-center">
                                <input type="color" oninput="updateColor('${k}', this.value); this.nextElementSibling.value=this.value" value="${t[k] || '#ffffff'}" class="w-8 h-8 rounded border-0 cursor-pointer bg-transparent">
                                <input type="text" id="input-hex-${k}" value="${t[k] || '#ffffff'}" onchange="updateColor('${k}', this.value); this.previousElementSibling.value=this.value" class="w-full border border-main rounded px-2 py-1 text-[9px] uppercase font-mono theme-bg-card text-main">
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="flex gap-2 mb-3">
                    <button onclick="saveAsPresetAdmin()" class="flex-1 py-3 theme-bg-btn text-white rounded-xl font-bold shadow-md" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">✨ บันทึกเป็นพรีเซ็ตใหม่</button>
                    <button onclick="location.reload()" class="flex-1 py-3 bg-zinc-500 text-white rounded-xl font-bold shadow-md">❌ ยกเลิกการแก้ไข</button>
                </div>
                <div id="presetList" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-2">3. ระบบตรวจสอบคัดกรองรีวิวร้านค้า</h3>
                <div id="adminReviewManagementZone" class="space-y-2 max-h-52 overflow-y-auto no-scrollbar"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-2">4. ระบบจัดการโปรโมชั่นสไลด์เดอร์</h3>
                <div class="space-y-2 mb-3" id="adminPromoListZone"></div>
                <div class="admin-inner-panel p-3 border border-main rounded-xl space-y-2">
                    <p class="font-bold text-main text-[11px]">➕ เพิ่มโปรโมชั่นใหม่</p>
                    <input type="text" id="addPromoTitle" placeholder="ข้อความหัวข้อโปรโมชั่น" class="w-full p-2 border border-main rounded-lg text-main bg-transparent">
                    <input type="text" id="addPromoImg" placeholder="URL รูปภาพโปรโมชั่น" class="w-full p-2 border border-main rounded-lg text-main bg-transparent">
                    <input type="text" id="addPromoLink" placeholder="ชื่อแบรนด์สินค้าที่เชื่อมโยง" class="w-full p-2 border border-main rounded-lg text-main bg-transparent">
                    <button onclick="addNewPromoData()" class="w-full py-2 theme-bg-btn text-white font-bold rounded-xl text-[10px]" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">เพิ่มสไลด์โปรโมชั่น</button>
                </div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-2">5. จัดการโครงสร้างแท็ก & หมวดหมู่</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-2 border border-main rounded-xl admin-inner-panel">
                        <p class="font-bold text-main mb-1">หมวดหลัก</p>
                        <div class="max-h-24 overflow-y-auto space-y-1 mb-2 text-[11px]" id="admTaxCatZone"></div>
                        <div class="flex gap-1"><input type="text" id="newTaxCatInput" class="w-full p-1 border border-main text-main bg-transparent rounded"><button onclick="addTaxonomyItem('categories','newTaxCatInput')" class="px-2 theme-bg-btn text-white rounded" style="background-color: var(--th-primary);">+</button></div>
                    </div>
                    <div class="p-2 border border-main rounded-xl admin-inner-panel">
                        <p class="font-bold text-main mb-1">สไตล์/หมวดย่อย</p>
                        <div class="max-h-24 overflow-y-auto space-y-1 mb-2 text-[11px]" id="admTaxSubZone"></div>
                        <div class="flex gap-1"><input type="text" id="newTaxSubInput" class="w-full p-1 border border-main text-main bg-transparent rounded"><button onclick="addTaxonomyItem('subCategories','newTaxSubInput')" class="px-2 theme-bg-btn text-white rounded" style="background-color: var(--th-primary);">+</button></div>
                    </div>
                    <div class="p-2 border border-main rounded-xl admin-inner-panel">
                        <p class="font-bold text-main mb-1">แบรนด์/ผู้สร้าง</p>
                        <div class="max-h-24 overflow-y-auto space-y-1 mb-2 text-[11px]" id="admTaxBrandZone"></div>
                        <div class="flex gap-1"><input type="text" id="newTaxBrandInput" class="w-full p-1 border border-main text-main bg-transparent rounded"><button onclick="addTaxonomyItem('brands','newTaxBrandInput')" class="px-2 theme-bg-btn text-white rounded" style="background-color: var(--th-primary);">+</button></div>
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
                <div class="p-3 admin-inner-panel border border-main border-dashed rounded-xl mb-3 space-y-2">
                    <label class="flex items-center gap-1 font-bold text-main"><input type="checkbox" id="admDriveShare"> ดึงเมลร่วมสิทธิ์ใน Google Drive อัตโนมัติ</label>
                    <input type="text" id="admDriveFolderId" placeholder="Google Drive Folder ID" class="w-full p-2.5 border border-main rounded-lg bg-transparent text-main">
                </div>
                <div class="flex gap-4 p-2 admin-inner-panel rounded-xl mb-3 text-main"><label><input type="checkbox" id="admFeat"> แนะนำ</label><label><input type="checkbox" id="admLimit"> จำกัด 1 ชิ้น</label></div>
                <button onclick="saveProductAdmin()" class="w-full py-3 theme-bg-btn text-white rounded-xl font-bold" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">บันทึกสินค้าลงคลัง</button>
            </div>
            
            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-3">7. รายการสินค้าปัจจุบันในระบบแอป</h3>
                <div id="adminProductList" class="space-y-2"></div>
                <div id="pagination" class="flex gap-1 justify-center mt-4"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-3">8. ระบบจัดการฐานข้อมูลสมาชิก</h3>
                <div id="adminMemberListDatabaseZone" class="space-y-2 max-h-72 overflow-y-auto no-scrollbar"></div>
            </div>
        </div>`;
    renderAdminProductList(); renderPresets(); renderAdminPromoList(); renderAdminTaxonomyLists(); renderAdminReviewManagementZoneList(); renderAdminMemberListDatabase();
}

function togglePresetExpandedGrid() {
    const modal = document.getElementById('expandedPresetGridModal'); if(!modal) return;
    modal.classList.toggle('hidden');
    if(!modal.classList.contains('hidden')) {
        const container = document.getElementById('presetGridContainer'); if(!container) return;
        container.innerHTML = (window.db.config.themePresets || []).map((p) => `
            <div class="flex items-center bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <button type="button" onclick="applyPresetAdmin('${p.id}')" class="px-3 py-2 text-[10px] font-bold flex items-center gap-1 text-slate-800 bg-white">
                    <span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${p.colors.primary || '#7082a6'}"></span> ${p.name}
                </button>
                <button type="button" onclick="editPresetColorsDirect('${p.id}')" class="bg-amber-100 text-amber-700 px-2 py-2 border-l border-gray-200 text-[10px]">✏️</button>
                <button type="button" onclick="removePresetAdmin('${p.id}')" class="bg-red-50 text-red-500 px-2.5 py-2 border-l border-gray-200 text-[10px] font-bold">×</button>
            </div>`).join('');
    }
}

function renderAdminMemberListDatabase() {
    const zone = document.getElementById('adminMemberListDatabaseZone'); if(!zone) return;
    const members = window.db.getMembers() || [];
    if(members.length === 0) { zone.innerHTML = `<p class="text-sub text-[11px]">ยังไม่มีข้อมูลผู้สมัครสมาชิกในแอปพลิเคชัน</p>`; return; }
    zone.innerHTML = members.map((m, idx) => `
        <div class="p-3 border border-main rounded-xl admin-inner-panel flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[11px]">
            <div>
                <p class="font-bold text-slate-800">👤 บัญชี: ${m.username} <span class="text-green-600 ml-1 font-black">คงเหลือ ฿${m.credit}</span></p>
                <p class="text-gray-500 text-[10px] mt-0.5">📧 อีเมล: ${m.email || 'ไม่มีข้อมูล'}</p>
            </div>
            <div class="flex gap-2 justify-end">
                <button onclick="adjustMemberCreditDirect(${idx})" class="bg-emerald-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">⚙️ ปรับเครดิต</button>
                <button onclick="deleteMemberByAdmin(${idx})" class="bg-rose-500 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">ลบบัญชี</button>
            </div>
        </div>`).join('');
}

function adjustMemberCreditDirect(idx) {
    let members = window.db.getMembers(); const m = members[idx];
    const newAmount = prompt(`ระบุจำนวนยอดเครดิตกระเป๋าเงินใหม่ของคุณ ${m.username} 💰:`, m.credit);
    if(newAmount === null) return;
    if(isNaN(newAmount) || newAmount.trim() === "") return alert("กรุณากรอกเฉพาะตัวเลขที่ถูกต้องค่ะ");
    m.credit = Number(newAmount); window.db.saveMembers(members);
    const u = window.db.getCurrentUser(); if(u && u.username === m.username) { window.db.saveCurrentUser(m); updateCreditDisplay(); }
    alert(`ปรับยอดเงินของบัญชีคุณ ${m.username} เป็น ฿${newAmount} เรียบร้อยครับ`); renderAdminDashboard();
}

function deleteMemberByAdmin(idx) {
    let members = window.db.getMembers(); const name = members[idx].username;
    myConfirm(`คุณเกดแน่ใจไหมว่าต้องการลบบัญชีสมาชิกคุณ "${name}" ออกจากระบบถาวร?`, () => {
        members.splice(idx, 1); window.db.saveMembers(members);
        const u = window.db.getCurrentUser(); if(u && u.username === name) { window.db.saveCurrentUser(null); updateCreditDisplay(); }
        alert(`ลบชื่อผู้ใช้ ${name} สำเร็จครับ`); renderAdminDashboard();
    });
}

function renderAdminReviewManagementZoneList() {
    const zone = document.getElementById('adminReviewManagementZone'); if(!zone) return;
    if(reviewsData.length === 0) { zone.innerHTML = `<p class="text-sub text-[11px]">ไม่มีประวัติรีวิวร้านค้า</p>`; return; }
    zone.innerHTML = reviewsData.map(r => `
        <div class="flex justify-between items-center p-2.5 border border-main rounded-xl admin-inner-panel text-[11px]">
            <div class="truncate max-w-[80%]">
                <span class="font-bold text-main">👤 ${r.name} (${r.score} ดาว)</span>
                <p class="text-sub truncate mt-0.5">${r.text}</p>
            </div>
            <button onclick="deleteReviewByAdmin('${r.id}')" class="text-rose-400 font-bold px-2 hover:underline">ลบรีวิว</button>
        </div>`).join('');
}

function deleteReviewByAdmin(reviewId) {
    myConfirm("คุณแน่ใจนะว่าต้องการลบรีวิวชิ้นนี้ของลูกค้าออกจากระบบ?", () => {
        reviewsData = reviewsData.filter(r => r.id !== reviewId);
        localStorage.setItem('web_reviews', JSON.stringify(reviewsData));
        renderAdminReviewManagementZoneList(); calculateStarCounters();
        alert("ลบรีวิวชิ้นดังกล่าวออกจากคลังเรียบร้อยค่ะ");
    });
}

function renderPresets() {
    const list = document.getElementById('presetList'); if(!list) return;
    list.innerHTML = (window.db.config.themePresets || []).map((p) => `
        <div class="flex items-center bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <button type="button" onclick="applyPresetAdmin('${p.id}')" class="px-3 py-2 text-[10px] font-bold flex items-center gap-1 text-slate-800 bg-white">
                <span class="w-2 h-2 rounded-full" style="background:${p.colors.primary || '#7082a6'}"></span> ${p.name}
            </button>
            <button type="button" onclick="editPresetColorsDirect('${p.id}')" class="bg-amber-100 text-amber-700 px-2 py-2 border-l border-gray-200 text-[10px]">✏️ แก้ไข</button>
            <button type="button" onclick="renamePresetAdmin('${p.id}')" class="bg-gray-100 text-gray-600 px-2 py-2 border-l border-gray-200 text-[9px]">ชื่อ</button>
            <button type="button" onclick="removePresetAdmin('${p.id}')" class="bg-red-50 text-red-500 px-2 py-2 border-l border-gray-200 text-[10px] font-bold">×</button>
        </div>`).join('');
}

function editPresetColorsDirect(presetId) {
    const target = window.db.config.themePresets.find(p => p.id === presetId); if(!target) return;
    window.db.config.theme = JSON.parse(JSON.stringify(target.colors));
    applyTheme();
    Object.keys(target.colors).forEach(k => {
        const inputHex = document.getElementById(`input-hex-${k}`);
        if(inputHex) {
            inputHex.value = target.colors[k];
            if(inputHex.previousElementSibling) inputHex.previousElementSibling.value = target.colors[k];
        }
    });
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

function renderAdminPromoList() {
    const zone = document.getElementById('adminPromoListZone'); if(!zone) return;
    const promos = window.db.config.promotions || [];
    zone.innerHTML = promos.map((p, idx) => `
        <div class="flex justify-between items-center p-2 border border-main rounded-xl admin-inner-panel">
            <div class="truncate max-w-[80%]"><p class="font-bold text-main line-clamp-1">${p.title}</p></div>
            <button onclick="deletePromoData(${idx})" class="text-rose-400 font-bold px-1">ลบ</button>
        </div>`).join('');
}
function addNewPromoData() {
    const tEl = document.getElementById('addPromoTitle'); const iEl = document.getElementById('addPromoImg'); const lEl = document.getElementById('addPromoLink'); if(!tEl || !iEl) return;
    const t = tEl.value.trim(); const i = iEl.value.trim(); const l = lEl.value.trim(); if(!t || !i) return alert("กรุณากรอกข้อมูลโปรโมชั่นให้ครบ");
    if(!window.db.config.promotions) window.db.config.promotions = [];
    window.db.config.promotions.push({ title: t, img: i, brandLink: l || "DekDec Studio" });
    window.db.saveConfig(window.db.config); renderAdminPromoList(); init(); tEl.value = ""; iEl.value = ""; if(lEl) lEl.value = "";
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
        return `<div class="flex items-center gap-3 p-2 border border-main rounded-2xl text-[10px] text-main admin-inner-panel">
            <div class="flex flex-col"><button onclick="moveProduct(${idx},-1)" class="text-main font-bold">▲</button><button onclick="moveProduct(${idx},1)" class="text-main font-bold">▼</button></div>
            <img src="${p.img}" class="w-9 h-9 rounded object-cover border border-main"><div class="flex-1 font-bold truncate">${p.name}</div>
            <button onclick="editProduct(${idx})" class="text-blue-400 font-bold">แก้ไข</button><button onclick="deleteProduct(${idx})" class="text-rose-400 font-bold">ลบ</button></div>`;
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
   👥 MEMBER PROFILE & HISTORY ZONE
   ========================================== */
function openUserMenuPage() {
    hideAllPages(); if(document.getElementById('userMenuPage')) document.getElementById('userMenuPage').classList.remove('hidden');
    renderUserMenuDetails();
}
function renderUserMenuDetails() {
    const cont = document.getElementById('userMenuPage'); if(!cont) return;
    const u = window.db.getCurrentUser();
    if(!u) { cont.innerHTML = `<p class="text-center py-10 text-main">กรุณาเข้าสู่ระบบก่อนค่ะ</p>`; return; }

    cont.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto animate-pop";
    cont.innerHTML = `
        <div class="sticky top-0 theme-bg-card p-4 rounded-2xl border border-main flex items-center justify-between mb-4 shadow-sm">
            <button onclick="backToStoreHome()" class="text-main font-bold"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-sm">แผงควบคุมสมาชิก</span>
            <button onclick="logoutUser()" class="text-rose-400 font-black text-sm flex items-center gap-1 active:scale-95 transition-all">
                <i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
            </button>
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
                        <input type="email" id="usrEditEmail" value="${u.email || ''}" placeholder="ระบุอีเมลสำหรับรับฟอนต์" class="text-right bg-transparent border-0 outline-none p-0 focus:ring-0 text-slate-800 font-bold placeholder-gray-400 text-[11px] w-[55%]">
                    </div>
                </div>
                
                <div class="flex border-t border-gray-100 bg-gray-50/50 text-[11px] font-bold text-slate-700">
                    <button onclick="goToTopupPageDirect()" class="flex-1 py-3.5 text-center hover:bg-gray-100/70 border-r border-gray-100 transition-all flex items-center justify-center gap-1">
                        <span>+ เติมเครดิต</span>
                    </button>
                    <button onclick="saveUserProfileData()" class="flex-1 py-3.5 text-center hover:bg-gray-100/70 transition-all flex items-center justify-center gap-1">
                        <span>💾 บันทึกข้อมูลส่วนตัว</span>
                    </button>
                </div>
            </div>

            <div class="theme-bg-card p-4 rounded-2xl border border-main space-y-3">
                <h3 class="font-bold text-main text-[12px] opacity-90"><i class="fa-solid fa-history mr-1 text-amber-400"></i> บันทึกประวัติการใช้งาน</h3>
                <div class="flex border-b border-main">
                    <button onclick="switchHistoryTab('order')" class="flex-1 pb-2 font-bold text-center ${currentHistoryTab==='order'?'text-main border-b-2 border-main':'text-sub'}">📦 ประวัติการช้อป</button>
                    <button onclick="switchHistoryTab('topup')" class="flex-1 pb-2 font-bold text-center ${currentHistoryTab==='topup'?'text-main border-b-2 border-main':'text-sub'}">💰 ประวัติการเติมเงิน</button>
                </div>
                <div id="userHistoryListLogs" class="space-y-2 max-h-60 overflow-y-auto no-scrollbar pt-1"></div>
            </div>
        </div>
    `;
    renderUserHistoryLogsContent(u);
}
function goToTopupPageDirect() {
    hideAllPages();
    if(document.getElementById('topupPage')) {
        document.getElementById('topupPage').classList.remove('hidden');
        renderTopupPageUI();
    }
}
function renderTopupPageUI() {
    const el = document.getElementById('topupPage'); if(!el) return;
    el.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto animate-pop";
    el.innerHTML = `
        <div class="sticky top-0 theme-bg-card p-4 rounded-2xl border border-main flex items-center justify-between mb-4 shadow-sm">
            <button onclick="openUserMenuPage()" class="text-main font-bold"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-sm">เติมเงินเข้าระบบอัตโนมัติ</span>
            <div class="w-4"></div>
        </div>
        <div class="max-w-md mx-auto space-y-4 text-xs text-center">
            <div class="theme-bg-card p-5 rounded-2xl border border-main space-y-3">
                <p class="font-bold text-sm text-main">🏦 ช่องทางการโอนเงิน</p>
                <div class="p-3 bg-black/10 rounded-xl text-left border border-main text-main">
                    <p class="font-bold">ธนาคารกสิกรไทย (KBANK)</p>
                    <p class="text-base font-mono font-black my-1 text-green-500">214-8-13958-2</p>
                    <p class="text-[11px] opacity-80">ชื่อบัญชี: พรทิพา สุนาวงค์</p>
                </div>
                <div class="p-4 bg-white rounded-xl max-w-[200px] mx-auto border">
                    <img id="shopBankQRImg" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://promptpay.io/0956426465" class="w-full">
                </div>
                <p class="text-[10px] text-sub">เมื่อโอนเงินเสร็จเรียบร้อยแล้ว อัปเดตสลิปด้านล่างเพื่อเติมเครดิตเข้ากระเป๋าได้เลยค่ะ</p>
            </div>
            
            <div class="theme-bg-card p-5 rounded-2xl border border-main space-y-3">
                <input type="file" id="slipFileInputField" accept="image/*" class="w-full text-xs text-main file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-slate-900 cursor-pointer">
                <button onclick="uploadAndVerifySlipAPI('slipFileInputField')" class="w-full py-3 text-white font-bold rounded-xl shadow-md transition-all active:scale-95" style="background-color: var(--th-primary) !important;">
                    🚀 ยืนยันและตรวจสอบสลิปเงินโอน
                </button>
            </div>
        </div>
    `;
}
function switchHistoryTab(tabType) {
    currentHistoryTab = tabType;
    const u = window.db.getCurrentUser();
    if(u) renderUserMenuDetails();
}
function renderUserHistoryLogsContent(u) {
    const logZone = document.getElementById('userHistoryListLogs'); if(!logZone) return;
    if(currentHistoryTab === 'order') {
        const orders = u.orderHistory || [];
        if(orders.length === 0) { logZone.innerHTML = `<p class="text-center py-6 text-sub">ยังไม่มีประวัติการสั่งซื้อฟอนต์ค่ะ</p>`; return; }
        logZone.innerHTML = orders.map(o => `
            <div class="p-2.5 rounded-xl border border-main bg-black/5 space-y-1.5">
                <div class="flex justify-between font-bold text-main"><span>🆔 ${o.orderId}</span><span class="text-green-500">฿${o.total}</span></div>
                <div class="text-[10px] text-sub flex justify-between"><span>วันที่สั่งซื้อ: ${o.date}</span><span>ชำระสำเร็จ</span></div>
                <div class="border-t border-dashed border-main pt-1.5 space-y-1 text-main">
                    ${o.items.map(i => `<div class="flex justify-between font-medium"><span>• ${i.name} (x${i.qty})</span><button onclick="alert('กำลังเปิดลิงก์ดาวน์โหลดสิทธิ์')" class="text-blue-400 font-bold hover:underline">📥 ดาวน์โหลด</button></div>`).join('')}
                </div>
            </div>`).join('');
    } else {
        const topups = u.topupHistory || [];
        if(topups.length === 0) { logZone.innerHTML = `<p class="text-center py-6 text-sub">ยังไม่มีประวัติการแจ้งเติมเครดิตเข้ามาระบบค่ะ</p>`; return; }
        logZone.innerHTML = topups.map(t => `
            <div class="p-2.5 rounded-xl border border-main bg-black/5 flex justify-between items-center text-main">
                <div><span class="font-bold block">💵 เติมเงินผ่าน QR-Code</span><span class="text-[10px] text-sub block mt-0.5">เมื่อ: ${t.date || 'วันนี้'}</span></div>
                <div class="text-right font-black text-green-500">+฿${t.amount}</div>
            </div>`).join('');
    }
}
function saveUserProfileData() {
    const emailVal = document.getElementById('usrEditEmail').value.trim();
    const u = window.db.getCurrentUser(); if(!u) return;
    u.email = emailVal; window.db.saveCurrentUser(u);
    let members = window.db.getMembers();
    const idx = members.findIndex(m => m.username === u.username);
    if(idx !== -1) { members[idx] = u; window.db.saveMembers(members); }
    alert("อัปเดตข้อมูลส่วนตัวของคุณสำเร็จแล้วค่ะ 🐰✨"); renderUserMenuDetails();
}

/* ==========================================
   🛒 ระบบสรุปยอดชำระเงินและใบเสร็จ
   ========================================== */
function addToCartDirect(idx) {
    const p = window.db.products[idx]; if(!p) return;
    const exist = cart.find(i => i.name === p.name);
    if(exist) { if(p.limitOne) return alert("จำกัด 1 ชิ้น"); exist.qty++; } else { cart.push({...p, qty: 1}); }
    updateCartCount(); alert("เพิ่มลงตะกร้าแล้วเรียบร้อย 🐰");
}
function openCartPage() { hideAllPages(); if(document.getElementById('cartPage')) document.getElementById('cartPage').classList.remove('hidden'); renderCart(); }
function renderCart() {
    const cont = document.getElementById('cartItemsContainer'); const summary = document.getElementById('receiptSummary'); if(!cont) return;
    if(cart.length === 0) { cont.innerHTML = `<div class="text-center py-24 text-sub text-xs"><i class="fa-solid fa-basket-shopping text-3xl mb-3 block"></i>ไม่มีสินค้าในตะกร้าของคุณ</div>`; if(summary) summary.innerHTML = ""; return; }
    cont.innerHTML = cart.map((i, idx) => `
        <div class="card-bg p-3 rounded-2xl flex gap-3 items-center border border-main shadow-sm text-xs theme-bg-card">
            <img src="${i.img}" class="w-12 h-12 rounded-xl object-cover border border-main"><div class="flex-1 font-bold text-main truncate">${i.name}</div>
            <div class="flex items-center gap-1.5"><button onclick="updateQty(${idx},-1)" class="w-7 h-7 border border-main rounded-lg theme-bg-card text-main">-</button><span class="w-4 text-center font-bold text-main">${i.qty}</span><button onclick="updateQty(${idx},1)" class="w-7 h-7 border border-main rounded-lg theme-bg-card text-main">+</button></div>
            <button onclick="removeCartItem(${idx})" class="text-rose-400 px-1 font-bold text-base">×</button>
        </div>`).join('');
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    if(summary) summary.innerHTML = `<button onclick="finalizeOrder()" class="w-full theme-bg-btn text-white py-4 rounded-2xl font-bold text-xs shadow-xl transition-all active:scale-95" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 3px rgba(0,0,0,0.4);">สรุปยอดสั่งซื้อทั้งหมด ฿${total}</button>`;
}
function updateQty(idx, d) { cart[idx].qty += d; if(cart[idx].qty <= 0) cart.splice(idx,1); updateCartCount(); renderCart(); }
function removeCartItem(idx) { myConfirm("ลบสินค้าชิ้นนี้ออกจากตะกร้า?", () => { cart.splice(idx,1); updateCartCount(); renderCart(); }); }

function finalizeOrder() {
    const u = window.db.getCurrentUser(); if(!u) { alert("กรุณาเข้าสู่ระบบก่อนชำระเงินค่ะ"); openUnifiedAuthModal(); return; }
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    if(u.credit < total) { alert("เครดิตของคุณไม่เพียงพอ กรุณาเติมเงินก่อนนะคะ"); return; }
    
    u.credit -= total;
    const newOrder = { orderId: "OR-" + Date.now(), items: [...cart], total: total, date: "วันนี้" };
    if(!u.orderHistory) u.orderHistory = []; u.orderHistory.unshift(newOrder);
    window.db.saveCurrentUser(u);
    
    let members = window.db.getMembers();
    const idx = members.findIndex(m => m.username === u.username);
    if(idx !== -1) { members[idx] = u; window.db.saveMembers(members); }
    
    renderReceiptPage(newOrder);
    cart = []; updateCartCount();
}
function renderReceiptPage(order) {
    hideAllPages(); if(document.getElementById('receiptPage')) document.getElementById('receiptPage').classList.remove('hidden');
    const container = document.getElementById('receiptPage'); if(!container) return;
    container.innerHTML = `
        <div class="p-6 text-center space-y-4 max-w-[420px] mx-auto text-xs animate-pop">
            <div class="text-emerald-500 text-4xl"><i class="fa-solid fa-circle-check"></i></div>
            <h2 class="text-base font-bold text-main">ชำระเงินสำเร็จแล้วค่ะ!</h2>
            <p class="text-sub">รหัสสั่งซื้อ: ${order.orderId}</p>
            <div class="theme-bg-card p-4 rounded-2xl border border-main text-left space-y-2 text-main">
                ${order.items.map(i => `<div class="flex justify-between"><span>${i.name} (x${i.qty})</span><span>฿${(i.price-i.discount)*i.qty}</span></div>`).join('')}
                <div class="border-t border-main pt-2 flex justify-between font-bold text-sm"><span>ยอดรวมทั้งสิ้น</span><span>฿${order.total}</span></div>
            </div>
            <button onclick="backToStoreHome()" class="w-full py-3 theme-bg-btn text-white rounded-xl font-bold" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">กลับสู่หน้าร้านค้าหลัก</button>
        </div>`;
}

/* ==========================================
   📦 ส่วนเปิด-ปิดโครงสร้าง Layout หน้าเว็บ
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
            <img src="${p.img}" class="w-full rounded-2xl border-main shadow-sm">
            <div class="flex justify-between items-start">
                <div><h1 class="text-base font-bold text-main">${p.name}</h1><span class="inline-block mt-1 text-[10px] theme-bg-card text-sub px-2.5 py-0.5 rounded-full border-main">สินค้าพร้อมส่ง</span></div>
                <div class="text-right"><span class="text-lg font-black text-main">฿${p.price-p.discount}</span></div>
            </div>
            <div class="custom-panel-card theme-bg-card border-main"><p class="font-bold text-main mb-3">แอปพลิเคชันที่รองรับ</p>
                <div class="space-y-2 text-sub"><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Good notes</label><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Canva</label><label class="flex items-center gap-2"><input type="checkbox" checked disabled> Procreate</label></div>
            </div>
            <div class="custom-panel-card theme-bg-card border-main"><p class="font-bold text-main mb-1.5">รายละเอียดเพิ่มเติม</p><p class="text-sub leading-relaxed">${p.desc || 'สินค้าพรีเมียมลิขสิทธิ์แท้จากทางร้าน'}</p></div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 theme-bg-card border-t border-main flex gap-3 max-w-[768px] mx-auto z-50 shadow-lg">
            <button onclick="addToCartDirect(${idx}); closeProductDetail();" class="flex-1 py-3.5 border border-main text-main rounded-xl font-bold text-xs theme-bg-card">เพิ่มลงตะกร้า</button>
            <button onclick="buyNowDirect(${idx})" class="flex-1 py-3.5 theme-bg-btn text-white rounded-xl font-bold text-xs shadow-md" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">ซื้อทันที</button>
        </div>`;
}
function closeProductDetail() { if(document.getElementById('productDetailPage')) document.getElementById('productDetailPage').classList.add('hidden'); showMainLayout(); }

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
function closeSubPage(pageId) { if(document.getElementById(pageId)) document.getElementById(pageId).classList.add('hidden'); showMainLayout(); restartMarqueeAnimation(); }
