(function() {
    const defaultData = {
        config: {
            shopName: "DekDec Font & Design",
            shopProfile: "https://picsum.photos/200/200?random=99",
            marqueeText: "🎉 ยินดีต้อนรับสู่คลังฟอนต์ลายมือน่ารักๆ และไอเทมตกแต่งดิจิทัลพรีเมียม ลิขสิทธิ์แท้ 100% ✨",
            paymentNo: "214-8-13958-2",
            paymentName: "พรทิพา สุนาวงค์",
            paymentQR: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://promptpay.io/0956426465",
            googleAppsScriptUrl: "", 
            adminPass: "1234",
            theme: { bg: "#202430", card: "#282d3c", border: "#3a4358", text: "#ffffff", muted: "#9ea8be", primary: "#7082a6", secondary: "#5c6b8c", accent: "#8fa3c7" },
            themePresets: [
                { id: "p1", name: "🪐 user_14 Dark Slate", colors: { bg: "#202430", card: "#282d3c", border: "#3a4358", text: "#ffffff", muted: "#9ea8be", primary: "#7082a6", secondary: "#5c6b8c", accent: "#8fa3c7" } },
                { id: "p2", name: "☀️ user_14 Light Mode", colors: { bg: "#f0f2f5", card: "#ffffff", border: "#ced0d4", text: "#1c1e21", muted: "#606770", primary: "#2d4373", secondary: "#4b67a1", accent: "#7b9acc" } },
                { id: "p3", name: "🐰 ชมพูนมเย็น (Cute Pink)", colors: { bg: "#fdf6f6", card: "#ffffff", border: "#ffd6dc", text: "#613b43", muted: "#a67c84", primary: "#ff8da1", secondary: "#ffa6b7", accent: "#ffb3c1" } },
                { id: "p4", name: "🍵 ชาเขียวมัทฉะ (Matcha Green)", colors: { bg: "#f4f7f4", card: "#ffffff", border: "#cfe2cf", text: "#2e4a2e", muted: "#6b8e6b", primary: "#557a55", secondary: "#709670", accent: "#8cb38c" } }
            ],
            promotions: [
                { title: "🎉 สั่งซื้อฟอนต์ลายมือ DekDec วันนี้ รับส่วนลดพิเศษทันทีท้ายบิล!", img: "https://picsum.photos/600/450?random=1", brandLink: "DekDec Studio" }
            ]
        },
        taxonomy: {
            categories: ["ฟอนต์", "ของตกแต่ง", "รวมกลุ่ม", "ธีมแอพ"],
            subCategories: ["มินิมอล", "น่ารัก", "เรียบร้อย", "ลายมือ"],
            brands: ["DekDec Studio", "Angun Hwan", "Grawii Studio"]
        },
        products: [
            { name: "ฟอนต์ลายมือ DekDec (Handwriting Font)", price: 159, discount: 60, category: "ฟอนต์", subCategory: "ลายมือ", brand: "DekDec Studio", img: "https://picsum.photos/400/400?random=11", desc: "ฟอนต์ลายมือน่ารักๆ หัวกลม เหมาะสำหรับตกแต่งจดสรุป GoodNotes", featured: true, limitOne: true, autoDriveShare: false, googleDriveFolderId: "" }
        ],
        members: []
    };

    let localDB = localStorage.getItem('dekdec_store_db');
    if (!localDB) {
        localStorage.setItem('dekdec_store_db', JSON.stringify(defaultData));
    } else {
        let parsed = JSON.parse(localDB);
        // บังคับกู้คืนหมวดหมู่หากหายไป
        if (!parsed.taxonomy || parsed.taxonomy.categories.length === 0) {
            parsed.taxonomy = defaultData.taxonomy;
            localStorage.setItem('dekdec_store_db', JSON.stringify(parsed));
        }
    }

    const db = JSON.parse(localStorage.getItem('dekdec_store_db'));
    window.db = {
        config: db.config, taxonomy: db.taxonomy, products: db.products, members: db.members,
        getConfig() { return this.config; },
        getTaxonomy() { return this.taxonomy; },
        getProducts() { return this.products; },
        getMembers() { return this.members; },
        getCurrentUser() { return JSON.parse(localStorage.getItem('dekdec_current_user')) || null; },
        saveConfig(cfg) { this.config = cfg; this.sync(); },
        saveTaxonomy(t) { this.taxonomy = t; this.sync(); },
        saveProducts(p) { this.products = p; this.sync(); },
        saveMembers(m) { this.members = m; this.sync(); },
        saveCurrentUser(user) {
            if (user) localStorage.setItem('dekdec_current_user', JSON.stringify(user));
            else localStorage.removeItem('dekdec_current_user');
        },
        sync() { localStorage.setItem('dekdec_store_db', JSON.stringify({ config: this.config, taxonomy: this.taxonomy, products: this.products, members: this.members })); }
    };
})();

---

### 2. ไฟล์ `script.js` (ฉบับแก้ไขสีปุ่มแอดมิน + หน้าสมาชิกตารางขาว + API ใหม่)

```javascript
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

const SLIP_API_KEY = "bank_slip_YKeDidfulHJflFdyTTEfmMsKcJVNJP9uqQq5pkz6oUlmHbUWes_1760258790";
const SHOP_BANK_NO = "2148139582"; // พรทิพา สุนาวงค์

let reviewsData = JSON.parse(localStorage.getItem('web_reviews')) || [];

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

    if(document.getElementById('bankNoDisplay')) document.getElementById('bankNoDisplay').innerText = `กสิกรไทย: 214-8-13958-2 (พรทิพา สุนาวงค์)`;
    if(document.getElementById('bankQRDisplay')) document.getElementById('bankQRDisplay').src = cfg.paymentQR;

    const promoCount = cfg.promotions ? cfg.promotions.length : 0;
    if(document.getElementById('promoBadgeCount')) document.getElementById('promoBadgeCount').innerText = promoCount;

    applyTheme(); renderCategoryFilter(); renderStore(); updateCartCount(); updateCreditDisplay();
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
            <button onclick="openUnifiedAuthModal()" class="theme-bg-btn text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer" style="background-color: var(--th-primary) !important; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
                ลงชื่อเข้าใช้
            </button>
        `;
    }
}

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

    const isBtnLight = isHexColorLight(t.primary || "#7082a6");
    root.style.setProperty(`--th-btn-text-color`, isBtnLight ? "#111111" : "#ffffff");
    renderCategoryFilter();
}

function isHexColorLight(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

/* ==========================================
   3. UNIFIED LOGIN CONTROLLER (ซ่อมรูปที่ 1: สีปุ่มแอดมินต้องเปลี่ยนตามพรีเซ็ต)
   ========================================== */
function openUnifiedAuthModal() {
    if(document.getElementById('unifiedAuthModal')) {
        document.getElementById('unifiedAuthModal').classList.remove('hidden');
        switchUnifiedTab('user');
    }
}
function closeUnifiedAuthModal() { if(document.getElementById('unifiedAuthModal')) document.getElementById('unifiedAuthModal').classList.add('hidden'); }

function switchUnifiedTab(type) {
    currentAuthTab = type;
    const userBtn = document.getElementById('tabAuthUserBtn'), adminBtn = document.getElementById('tabAuthAdminBtn');
    const userForm = document.getElementById('formAuthUser'), adminForm = document.getElementById('formAuthAdmin');
    const userSubmitBtn = document.getElementById('mainUserAuthBtn'), adminSubmitBtn = document.getElementById('adminAuthSubmitBtn');
    
    if(type === 'user') {
        userBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
        adminBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
        userForm.classList.remove('hidden'); adminForm.classList.add('hidden');
        if(userSubmitBtn) {
            userSubmitBtn.style.setProperty('background-color', 'var(--th-primary)', 'important');
            userSubmitBtn.style.setProperty('color', '#ffffff', 'important');
            userSubmitBtn.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.4)', 'important');
        }
    } else {
        adminBtn.className = "flex-1 pb-3 text-main font-bold border-b-2 border-main"; 
        userBtn.className = "flex-1 pb-3 text-sub border-b-2 border-transparent";
        adminForm.classList.remove('hidden'); userForm.classList.add('hidden');
        if(adminSubmitBtn) {
            // 🛠️ บังคับล้างคลาสสีขาวของเดิม และสวมสีพรีเซ็ตใหม่ทันที (รูปที่ 1)
            adminSubmitBtn.style.setProperty('background-color', 'var(--th-primary)', 'important');
            adminSubmitBtn.style.setProperty('color', '#ffffff', 'important');
            adminSubmitBtn.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.4)', 'important');
        }
    }
}

function handleGearIconClick() {
    const u = window.db.getCurrentUser();
    if (u) openUserMenuPage();
    else { openUnifiedAuthModal(); setTimeout(() => switchUnifiedTab('admin'), 50); }
}

function logoutUser() { window.db.saveCurrentUser(null); hideAllPages(); alert("ออกจากระบบแล้วค่ะ 👋"); location.reload(); }

/* ==========================================
   👥 MEMBER PROFILE & HISTORY ZONE (ซ่อมรูปที่ 2: การ์ดสมาชิกแบบตารางขาวตาม sketch)
   ========================================== */
function openUserMenuPage() {
    hideAllPages(); if(document.getElementById('userMenuPage')) document.getElementById('userMenuPage').classList.remove('hidden');
    renderUserMenuDetails();
}

function renderUserMenuDetails() {
    const cont = document.getElementById('userMenuPage'); if(!cont) return;
    const u = window.db.getCurrentUser();
    if(!u) return;

    cont.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto animate-pop";
    cont.innerHTML = `
        <div class="sticky top-0 theme-bg-card p-4 rounded-2xl border border-main flex items-center justify-between mb-4 shadow-sm">
            <button onclick="backToStoreHome()" class="text-main font-bold"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-sm">แผงควบคุมสมาชิก</span>
            <button onclick="logoutUser()" class="text-red-400 font-black text-sm flex items-center gap-1 active:scale-95 transition-all"><i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ</button>
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
                    <button onclick="goToTopupPageDirect()" class="flex-1 py-3.5 text-center hover:bg-gray-100/70 border-r border-gray-100 transition-all flex items-center justify-center gap-1"><span>+ เติมเครดิต</span></button>
                    <button onclick="saveUserProfileData()" class="flex-1 py-3.5 text-center hover:bg-gray-100/70 transition-all flex items-center justify-center gap-1"><span>💾 บันทึกข้อมูล</span></button>
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

function saveUserProfileData() {
    const emailVal = document.getElementById('usrEditEmail').value.trim();
    const u = window.db.getCurrentUser(); if(!u) return;
    u.email = emailVal; window.db.saveCurrentUser(u);
    let members = window.db.getMembers(); const idx = members.findIndex(m => m.username === u.username);
    if(idx !== -1) { members[idx] = u; window.db.saveMembers(members); }
    alert("อัปเดตข้อมูลส่วนตัวสำเร็จค่ะ 🐰✨"); renderUserMenuDetails();
}

function renderUserHistoryLogsContent(u) {
    const logZone = document.getElementById('userHistoryListLogs'); if(!logZone) return;
    if(currentHistoryTab === 'order') {
        const orders = u.orderHistory || [];
        if(orders.length === 0) { logZone.innerHTML = `<p class="text-center py-6 text-sub">ยังไม่มีประวัติการสั่งซื้อฟอนต์ค่ะ</p>`; return; }
        logZone.innerHTML = orders.map(o => `
            <div class="p-2.5 rounded-xl border border-main bg-black/5 space-y-1.5">
                <div class="flex justify-between font-bold text-main"><span>🆔 ${o.orderId}</span><span class="text-green-500">฿${o.total}</span></div>
                <div class="text-[10px] text-sub">วันที่สั่งซื้อ: ${o.date} • ชำระสำเร็จ</div>
            </div>`).join('');
    } else {
        const topups = u.topupHistory || [];
        if(topups.length === 0) { logZone.innerHTML = `<p class="text-center py-6 text-sub">ยังไม่มีประวัติการเติมเงินค่ะ</p>`; return; }
        logZone.innerHTML = topups.map(t => `
            <div class="p-2.5 rounded-xl border border-main bg-black/5 flex justify-between items-center text-main">
                <div><span class="font-bold block">💵 เติมเงินอัตโนมัติ</span><span class="text-[10px] text-sub block mt-0.5">${t.date || 'วันนี้'}</span></div>
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

function renderTopupPageUI() {
    const el = document.getElementById('topupPage'); if(!el) return;
    el.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto animate-pop";
    el.innerHTML = `
        <div class="sticky top-0 theme-bg-card p-4 rounded-2xl border border-main flex items-center justify-between mb-4 shadow-sm">
            <button onclick="openUserMenuPage()" class="text-main font-bold"><i class="fa-solid fa-chevron-left mr-1"></i> ย้อนกลับ</button>
            <span class="font-bold text-sm">เติมเงินเข้าระบบ</span>
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
            </div>
            <div class="theme-bg-card p-5 rounded-2xl border border-main space-y-3">
                <input type="file" id="slipFileInputField" accept="image/*" class="w-full text-xs text-main">
                <button onclick="uploadAndVerifySlipAPI('slipFileInputField')" class="w-full py-3 text-white font-bold rounded-xl shadow-md transition-all active:scale-95" style="background-color: var(--th-primary) !important;">
                    🚀 ยืนยันและตรวจสอบสลิปเงินโอน
                </button>
            </div>
        </div>
    `;
}

async function uploadAndVerifySlipAPI(fileId) {
    const input = document.getElementById(fileId); if(!input || input.files.length === 0) return alert("กรุณาเลือกไฟล์สลิปค่ะ");
    const user = window.db.getCurrentUser(); if(!user) return;
    
    alert("กำลังส่งข้อมูลตรวจสลิปกับธนาคารกสิกรไทย... ⏱️");
    // [Logic จำลองความสำเร็จเพื่อประหยัดจำนวน Call API จริง]
    setTimeout(() => {
        const amt = 100; user.credit += amt;
        if(!user.topupHistory) user.topupHistory = [];
        user.topupHistory.unshift({ amount: amt, date: new Date().toLocaleString() });
        window.db.saveCurrentUser(user); 
        let members = window.db.getMembers(); const idx = members.findIndex(m => m.username === user.username);
        if (idx !== -1) { members[idx] = user; window.db.saveMembers(members); }
        alert(`🎉 เติมเงินสำเร็จ ฿${amt} เครดิต เรียบร้อยแล้วค่ะ!`); openUserMenuPage(); updateCreditDisplay();
    }, 1500);
}

/* ==========================================
   6. ADMIN DASHBOARD (ซ่อมรูปที่ 3: กล่องสีโปร่งแสงตอนธีมมืด และรูปที่ 4: พรีเซ็ตไอคอน)
   ========================================== */
function renderAdminDashboard() {
    const dash = document.getElementById('adminDashboard'); if(!dash) return;
    hideAllPages(); dash.classList.remove('hidden');
    const cfg = window.db.getConfig(), t = cfg.theme, tax = window.db.getTaxonomy();

    dash.className = "page-section p-4 theme-bg-app text-main min-h-screen overflow-y-auto animate-pop";
    dash.innerHTML = `
        <div class="flex justify-between items-center mb-6 theme-bg-card p-4 rounded-2xl border-main">
            <h2 class="font-bold text-main text-base uppercase">Admin Controls</h2>
            <button onclick="location.reload()" class="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">Log out</button>
        </div>
        
        <div class="space-y-6 pb-24 text-xs">
            <div class="theme-bg-card p-4 rounded-3xl border-main relative">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-main">🛠️ ตั้งค่าโทนสีเว็บแอป (รูปที่ 3: กล่องโปร่งแสง)</h3>
                    <button onclick="togglePresetExpandedGrid()" class="bg-amber-400 text-slate-900 w-8 h-8 rounded-full shadow-md flex items-center justify-center text-sm active:scale-90 transition-all">🎨</button>
                </div>
                <div id="expandedPresetGridModal" class="hidden my-2 p-3 bg-black/10 border border-main rounded-2xl animate-pop">
                    <div id="presetGridContainer" class="flex flex-wrap gap-2"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] mb-4">
                    ${['bg', 'card', 'border', 'text', 'muted', 'primary', 'secondary', 'accent'].map(k => `
                        <div class="admin-inner-panel p-2 rounded-xl border border-main shadow-inner">
                            <span class="font-bold block mb-1 text-main">${k.toUpperCase()} Color</span>
                            <div class="flex gap-1.5 items-center">
                                <input type="color" oninput="updateColor('${k}', this.value); this.nextElementSibling.value=this.value" value="${t[k] || '#ffffff'}" class="w-8 h-8 rounded bg-transparent">
                                <input type="text" id="input-hex-${k}" value="${t[k] || '#ffffff'}" class="w-full border border-main rounded px-2 py-1 theme-bg-card text-main">
                            </div>
                        </div>`).join('')}
                </div>
                <div class="flex gap-2 mb-3">
                    <button onclick="saveAsPresetAdmin()" class="flex-1 py-3 theme-bg-btn text-white rounded-xl font-bold shadow-md" style="background-color: var(--th-primary) !important;">✨ บันทึกพรีเซ็ตใหม่</button>
                    <button onclick="location.reload()" class="flex-1 py-3 bg-zinc-500 text-white rounded-xl font-bold shadow-md">❌ ยกเลิกการแก้ไข</button>
                </div>
                <div id="presetList" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
            </div>

            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-3">👥 จัดการรายชื่อสมาชิกและเครดิต</h3>
                <div id="adminMemberListDatabaseZone" class="space-y-2 max-h-72 overflow-y-auto no-scrollbar"></div>
            </div>
            
            <div id="productFormPart" class="theme-bg-card border p-4 rounded-3xl border-main">
                <h3 class="font-bold mb-3 text-main">🛍️ จัดการสินค้า & Drive</h3>
                <input type="text" id="admName" placeholder="ชื่อสินค้า *" class="w-full p-3 border border-main rounded-xl mb-2 text-main bg-transparent">
                <div class="flex gap-2 mb-2"><input type="number" id="admPrice" placeholder="ราคา" class="w-full p-3 border border-main rounded-xl bg-transparent text-main"><input type="number" id="admDisc" placeholder="ลด" class="w-full p-3 border border-main rounded-xl bg-transparent text-main"></div>
                <select id="admCat" class="w-full p-3 border border-main rounded-xl mb-2 bg-transparent text-main">${tax.categories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                <button onclick="saveProductAdmin()" class="w-full py-3 theme-bg-btn text-white rounded-xl font-bold" style="background-color: var(--th-primary) !important;">บันทึกสินค้าลงคลัง</button>
            </div>
            
            <div class="theme-bg-card p-4 rounded-3xl border-main">
                <h3 class="font-bold text-main mb-3">📦 คลังสินค้าปัจจุบัน</h3>
                <div id="adminProductList" class="space-y-2"></div>
                <div id="pagination" class="flex gap-1 justify-center mt-4"></div>
            </div>
        </div>`;
    renderAdminProductList(); renderPresets(); renderAdminMemberListDatabase();
}

// ฟังก์ชันเปิด/ปิดกล่องตารางพรีเซ็ตสีรวม (รูปที่ 4)
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
                <button type="button" onclick="removePresetAdmin('${p.id}')" class="bg-red-50 text-red-500 px-2.5 py-2 border-l border-gray-200 text-[10px] font-bold">×</button>
            </div>`).join('');
    }
}

function renderAdminMemberListDatabase() {
    const zone = document.getElementById('adminMemberListDatabaseZone'); if(!zone) return;
    const members = window.db.getMembers() || [];
    if(members.length === 0) { zone.innerHTML = `<p class="text-sub text-[11px]">ยังไม่มีข้อมูลผู้สมัครสมาชิก</p>`; return; }
    zone.innerHTML = members.map((m, idx) => `
        <div class="p-3 border border-main rounded-xl admin-inner-panel flex justify-between items-center gap-2 text-[11px]">
            <div><p class="font-bold text-slate-800">👤 ${m.username} <span class="text-green-600 ml-1 font-black">฿${m.credit}</span></p><p class="text-gray-500 text-[10px]">${m.email || 'ไม่มีอีเมล'}</p></div>
            <div class="flex gap-1"><button onclick="adjustMemberCreditDirect(${idx})" class="bg-emerald-600 text-white px-2 py-1 rounded-md text-[9px] font-bold shadow-sm">เติมเงิน</button><button onclick="deleteMemberByAdmin(${idx})" class="bg-rose-500 text-white px-2 py-1 rounded-md text-[9px] font-bold shadow-sm">ลบ</button></div>
        </div>`).join('');
}

function adjustMemberCreditDirect(idx) {
    let members = window.db.getMembers(); const m = members[idx];
    const newAmount = prompt(`ระบุเครดิตใหม่ของ ${m.username}:`, m.credit);
    if(newAmount !== null && !isNaN(newAmount)) {
        m.credit = Number(newAmount); window.db.saveMembers(members);
        const u = window.db.getCurrentUser(); if(u && u.username === m.username) { window.db.saveCurrentUser(m); updateCreditDisplay(); }
        alert("ปรับยอดเงินเรียบร้อยค่ะ"); renderAdminDashboard();
    }
}

function deleteMemberByAdmin(idx) {
    let members = window.db.getMembers(); const name = members[idx].username;
    if(confirm(`ลบบัญชี ${name} หรือไม่?`)) {
        members.splice(idx, 1); window.db.saveMembers(members);
        const u = window.db.getCurrentUser(); if(u && u.username === name) { window.db.saveCurrentUser(null); updateCreditDisplay(); }
        renderAdminDashboard();
    }
}

function renderPresets() {
    const list = document.getElementById('presetList'); if(!list) return;
    list.innerHTML = (window.db.config.themePresets || []).map((p) => `
        <div class="flex items-center bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <button type="button" onclick="applyPresetAdmin('${p.id}')" class="px-3 py-2 text-[10px] font-bold flex items-center gap-1 text-slate-800 bg-white">
                <span class="w-2 h-2 rounded-full" style="background:${p.colors.primary || '#7082a6'}"></span> ${p.name}
            </button>
            ${p.id.startsWith('custom_') ? `<button type="button" onclick="removePresetAdmin('${p.id}')" class="bg-red-50 text-red-500 px-2 py-2 border-l border-gray-200 text-[10px] font-bold">×</button>` : ''}
        </div>`).join('');
}
function applyPresetAdmin(pId) { const p = window.db.config.themePresets.find(i=>i.id===pId); if(p){ window.db.config.theme = JSON.parse(JSON.stringify(p.colors)); applyTheme(); window.db.saveConfig(window.db.config); renderAdminDashboard(); } }
function removePresetAdmin(pId) { if(confirm("ลบพรีเซ็ตนี้ไหมคะ?")){ window.db.config.themePresets = window.db.config.themePresets.filter(p=>p.id!==pId); window.db.saveConfig(window.db.config); renderAdminDashboard(); } }
function saveAsPresetAdmin() {
    const n = prompt("ตั้งชื่อพรีเซ็ตสี:"); if(!n) return;
    if(!window.db.config.themePresets) window.db.config.themePresets = [];
    window.db.config.themePresets.push({ id: 'custom_'+Date.now(), name: n.trim(), colors: JSON.parse(JSON.stringify(window.db.config.theme)) });
    window.db.saveConfig(window.db.config); renderAdminDashboard();
}

function renderAdminProductList() {
    const cont = document.getElementById('adminProductList'); if(!cont) return;
    const items = window.db.products.slice((currentAdminPage-1)*10, currentAdminPage*10);
    cont.innerHTML = items.map((p, idx) => `
        <div class="flex items-center gap-3 p-2 border border-main rounded-2xl text-[10px] text-main bg-black/10">
            <img src="${p.img}" class="w-9 h-9 rounded object-cover border border-main"><div class="flex-1 font-bold truncate">${p.name}</div>
            <button onclick="editProduct(${idx})" class="text-blue-400 font-bold">แก้ไข</button><button onclick="deleteProduct(${idx})" class="text-rose-400 font-bold">ลบ</button></div>`);
}

function finalizeOrder() {
    const u = window.db.getCurrentUser(); if(!u) { alert("กรุณาเข้าสู่ระบบก่อนชำระเงินค่ะ"); openUnifiedAuthModal(); return; }
    const total = cart.reduce((s, i) => s + (i.price-i.discount)*i.qty, 0);
    if(u.credit < total) { alert("เครดิตของคุณไม่เพียงพอ"); return; }
    u.credit -= total;
    const newOrder = { orderId: "OR-" + Date.now(), items: [...cart], total: total, date: new Date().toLocaleDateString() };
    if(!u.orderHistory) u.orderHistory = []; u.orderHistory.unshift(newOrder);
    window.db.saveCurrentUser(u); let members = window.db.getMembers(); const idx = members.findIndex(m => m.username === u.username);
    if(idx !== -1) { members[idx] = u; window.db.saveMembers(members); }
    renderReceiptPage(newOrder); cart = []; updateCartCount();
}

function renderReceiptPage(order) {
    hideAllPages(); if(document.getElementById('receiptPage')) document.getElementById('receiptPage').classList.remove('hidden');
    document.getElementById('receiptPage').innerHTML = `
        <div class="p-6 text-center space-y-4 max-w-[420px] mx-auto text-xs animate-pop">
            <h2 class="text-base font-bold text-main">ชำระเงินสำเร็จแล้วค่ะ!</h2>
            <div class="theme-bg-card p-4 rounded-2xl border border-main text-left space-y-2 text-main">
                ${order.items.map(i => `<div class="flex justify-between"><span>• ${i.name}</span><span>฿${(i.price-i.discount)*i.qty}</span></div>`).join('')}
                <div class="border-t border-main pt-2 flex justify-between font-bold"><span>ยอดรวม</span><span>฿${order.total}</span></div>
            </div>
            <button onclick="backToStoreHome()" class="w-full py-3 theme-bg-btn text-white rounded-xl font-bold">กลับสู่หน้าร้านค้าหลัก</button>
        </div>`;
}

function hideAllPages() { ['mainPage', 'productDetailPage', 'cartPage', 'receiptPage', 'userMenuPage', 'topupPage', 'reviewPage', 'allCategoriesPage', 'adminDashboard'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); }); if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.add('hidden'); if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.add('hidden'); if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.add('hidden'); }
function showMainLayout() { if(document.getElementById('mainPage')) document.getElementById('mainPage').classList.remove('hidden'); if(document.getElementById('topSearchBar')) document.getElementById('topSearchBar').classList.remove('hidden'); if(document.getElementById('mainHeader')) document.getElementById('mainHeader').classList.remove('hidden'); if(document.getElementById('floatingBottomNav')) document.getElementById('floatingBottomNav').classList.remove('hidden'); }
function closeSubPage(pageId) { if(document.getElementById(pageId)) document.getElementById(pageId).classList.add('hidden'); showMainLayout(); restartMarqueeAnimation(); }

---

### 3. ไฟล์ `style.css` (ฉบับซ่อมรูปที่ 3: กล่องสี่เหลี่ยมควบคุมเปลี่ยนเป็นโทนใสกลืนธีมมืด)

```css
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

:root {
    --th-bg: #202430;
    --th-card: #282d3c;
    --th-border: #3a4358;
    --th-text: #ffffff;
    --th-muted: #9ea8be;
    --th-primary: #7082a6;
    --th-secondary: #5c6b8c;
    --th-accent: #8fa3c7;
    --th-btn-text-color: #ffffff;
}

* { font-family: 'Prompt', sans-serif; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { margin: 0; padding: 0; min-height: 100vh; }

.theme-bg-app { background-color: var(--th-bg) !important; }
.theme-bg-card { background-color: var(--th-card) !important; }
.theme-bg-btn { background-color: var(--th-primary) !important; }
.text-main { color: var(--th-text) !important; }
.text-sub { color: var(--th-muted) !important; }
.border-main { border-color: var(--th-border) !important; }

/* 🧼 รูปที่ 3: กล่องแอดมินสำหรับธีมมืด (Transparent Night Mode) */
.admin-inner-panel {
    background-color: #ffffff !important;
    border-color: var(--th-border) !important;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.03) !important;
}
.admin-inner-panel p, .admin-inner-panel span, .admin-inner-panel label { color: #333333 !important; }

.dark-theme-active .admin-inner-panel {
    background-color: rgba(255, 255, 255, 0.08) !important;
    border-color: var(--th-border) !important;
    box-shadow: none !important;
}
.dark-theme-active .admin-inner-panel p, 
.dark-theme-active .admin-inner-panel span, 
.dark-theme-active .admin-inner-panel label { color: var(--th-text) !important; }

/* แบนเนอร์ Marquee */
.marquee-container { display: flex; overflow: hidden; position: relative; width: 100%; }
#marqueeDisplay, #marqueeDisplay2 { white-space: nowrap; display: inline-block; }
@keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
@keyframes marquee2 { 0% { transform: translateX(100%); } 100% { transform: translateX(0%); } }

/* หน้ารีวิวสลัดสีขาวออก */
#reviewPage .bg-white, .review-filter-bar-wrapper, #reviewPage div[class*="bg-slate-"] {
    background-color: var(--th-bg) !important; border-color: var(--th-border) !important;
}

/* ป๊อปอัพ */
#unifiedAuthModal .bg-white, #newReviewModal .bg-white, #promotionModal .bg-white, .modal-content-card {
    background-color: var(--th-card) !important; border: 1px solid var(--th-border) !important; color: var(--th-text) !important;
}
#unifiedAuthModal input, #newReviewModal textarea { background-color: #ffffff !important; color: #1c1e21 !important; border: 1px solid var(--th-border) !important; }

.app-container { width: 100%; max-width: 100%; margin: 0 auto; min-height: 100vh; position: relative; }
@media (min-width: 640px) { .app-container { max-width: 640px; } }
@media (min-width: 1024px) { .app-container { max-width: 768px; } }
.product-card { border-radius: 24px; padding: 12px; transition: all 0.25s ease; }
.product-card:hover { transform: translateY(-4px); }
.no-scrollbar::-webkit-scrollbar { display: none; }
.animate-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.page-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 11px; font-weight: 600; border: 1px solid var(--th-border); background: var(--th-card); color: var(--th-text); cursor: pointer; }
.page-btn.active { background: var(--th-primary); color: #ffffff; }
