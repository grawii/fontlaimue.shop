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
const SHOP_BANK_NAME = "KBANK"; // ธนาคารกสิกรไทย
const SHOP_BANK_NO = "2148139582"; // เลขบัญชี พรทิพา สุนาวงค์

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

    // ผูกค่าบัญชีของคุณเกดแสดงบนหน้าเว็บอัตโนมัติ
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
   3. UNIFIED LOGIN CONTROLLER (ซ่อมบั๊กสีปุ่มแอดมินขาวค้างแบบเด็ดขาด)
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
                // 🛠️ ล้างคลาสสีขาวของเดิมออกให้หมด เพื่อไม่ให้ Tailwind ขัดขวางการเปลี่ยนสี
                adminSubmitBtn.className = "w-full py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md text-white cursor-pointer block text-center";
                // บังคับย้อมสีตาม Preset โทนสว่าง/มืด ทันที
                adminSubmitBtn.style.setProperty('background-color', 'var(--th-primary)', 'important');
                adminSubmitBtn.style.setProperty('color', '#ffffff', 'important');
                adminSubmitBtn.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.4)', 'important');
            }
        }
    }
}

/* ==========================================
   💰 ระบบคัดกรองเช็คสลิปเติมเครดิตอัตโนมัติ (ผูก API ใหม่ของคุณเกด)
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

            // ตรวจสอบความถูกต้องของบัญชีผู้รับโอนเงินปลายทาง (ป้องกันสลิปปลอม/สลิปโอนให้คนอื่น)
            if (receiverAccount !== SHOP_BANK_NO) {
                return alert("⚠️ ตรวจสอบล้มเหลว: สลิปนี้ไม่ได้โอนเข้าบัญชีธนาคารกสิกรไทยของทางร้านค่ะ!");
            }

            // เพิ่มยอดเงินเข้ากระเป๋าเครดิตสมาชิก
            currentUser.credit = (currentUser.credit || 0) + transferAmount;
            
            // บันทึกลงตารางประวัติการเติมเงิน
            if (!currentUser.topupHistory) currentUser.topupHistory = [];
            currentUser.topupHistory.unshift({
                amount: transferAmount,
                date: new Date().toLocaleDateString('th-TH') + " " + new Date().toLocaleTimeString('th-TH')
            });

            window.db.saveCurrentUser(currentUser);
            
            // อัปเดตข้อมูลลงถังรายชื่อสมาชิกรวม
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

// ฟังก์ชันเปิดเรนเดอร์หน้าจอแนบสลิปเพื่อตรวจสลิป
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
                <p class="text-[10px] text-sub">เมื่อโอนเงินเสร็จเรียบร้อยแล้ว กรุณาอัปโหลดรูปภาพสลิปที่ปุ่มด้านล่างเพื่อตรวจสอบยอดเงินอัตโนมัติได้เลยค่ะ</p>
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

function goToTopupPageDirect() {
    hideAllPages();
    if(document.getElementById('topupPage')) {
        document.getElementById('topupPage').classList.remove('hidden');
        renderTopupPageUI();
    }
}

// ส่วนฟังก์ชันอื่นๆ ที่เหลือคงรูปเดิมครบทุกจุด (สมัครสมาชิก, รีวิว, แอดมินจานสี, จัดการสมาชิก)
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
function deletePromoData(idx) {
    if(!window.db.config.promotions) return; window.db.config.promotions.splice(idx,1); window.db.saveConfig(window.db.config); renderAdminPromoList(); init();
}
function renderAdminTaxonomyLists() {
    const tax = window.db.getTaxonomy();
    if(document.getElementById('admTaxCatZone')) {
        document.getElementById('admTaxCatZone').innerHTML = tax.categories.map((c, i) => `<div class="flex justify-between text-main"><span>• ${c}</span><span onclick="removeTaxonomyItem('categories',${i})" class="text-rose-400 cursor-pointer">🗑️</span></div>`).join('');
    }
    if(document.getElementById('admTaxSubZone')) {
        document.getElementById('admTaxSubZone').innerHTML = tax.subCategories.map((s, i) => `<div class="flex justify-between text-main"><span>• ${s}</span><span onclick="removeTaxonomyItem('subCategories',${i})" class="text-rose-400 cursor-pointer">🗑️</span></div>`).join('');
    }
    if(document.getElementById('admTaxBrandZone')) {
        document.getElementById('admTaxBrandZone').innerHTML = tax.brands.map((b, i) => `<div class="flex justify-between text-main"><span>• ${b}</span><span onclick="removeTaxonomyItem('brands',${i})" class="text-rose-400 cursor-pointer">🗑️</span></div>`).join('');
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
   📦ระบบตะกร้าและใบเสร็จสรุปยอดเงิน
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
function buyNowDirect(idx) { addToCartDirect(idx); closeProductDetail(); openCartPage(); }
function closeProductDetail() { if(document.getElementById('productDetailPage')) document.getElementById('productDetailPage').classList.add('hidden'); showMainLayout(); }
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
