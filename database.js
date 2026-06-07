const initialConfig = {
    shopName: "DekDec Shop",
    shopProfile: "https://picsum.photos/150/150?random=50",
    adminPass: "1234",
    paymentNo: "123-4-56789-0",
    paymentQR: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DekDecPay",
    marqueeText: "✨ ยินดีต้อนรับสู่ DekDec Shop แหล่งรวมฟอนต์และของตกแต่งสุดน่ารัก ✨",
    googleAppsScriptUrl: "https://script.google.com/macros/s/XXXXX/exec", 
    theme: { bg: "#F8F9FA", card: "#FFFFFF", btn: "#102A43", textMain: "#102A43", textSub: "#627D98", border: "#E4E7EB" },
    presets: [],
    // 🌟 คลังเก็บโปรโมชั่นเริ่มต้น (สามารถเพิ่ม-ลบเพิ่มจากหลังบ้านได้เองแล้ว)
    promotions: [
        { title: "โปรลด 50% ยกบ้าน เฉพาะเครือ JP!", brandLink: "JP", img: "https://picsum.photos/400/300?random=88" },
        { title: "ต้อนรับฟอนต์ใหม่ DekDec รับเครดิตคืนแจกฟรี", brandLink: "DekDec", img: "https://picsum.photos/400/300?random=89" }
    ]
};

const initialTaxonomy = {
    categories: ["ฟอนต์", "ของตกแต่ง", "รวมกลุ่ม", "อุปกรณ์ไอที", "ของแต่งบ้าน", "ดิจิทัลไฟล์", "เครื่องเขียน"],
    subCategories: ["ลายมือ", "ตัวอ้วน", "น่ารัก"],
    brands: ["DekDec", "CoolKiz", "Gade", "JP", "OJ", "Potato", "Perrine"]
};

const initialProducts = [
    { name: "ฟอนต์เด็กเดค", price: 150, discount: 51, category: "ฟอนต์", subCategory: "ลายมือ", brand: "DekDec", img: "https://picsum.photos/400/400?random=1", featured: true, limitOne: false, desc: "ฟอนต์ลายมือน่ารัก ใช้งานง่าย", autoDriveShare: true, googleDriveFolderId: "1A2B3C4D5E6F_FolderID" },
    { name: "Honey toast ฮันนี่โทสท์", price: 199, discount: 0, category: "ฟอนต์", subCategory: "ตัวอ้วน", brand: "JP", img: "https://picsum.photos/400/400?random=12", featured: true, limitOne: false, autoDriveShare: true, googleDriveFolderId: "JP_FONT_ID" },
    { name: "สติกเกอร์ตกแต่ง", price: 59, discount: 0, category: "ของตกแต่ง", subCategory: "น่ารัก", brand: "CoolKiz", img: "https://picsum.photos/400/400?random=2", featured: false, limitOne: false, autoDriveShare: false }
];

const initialMembers = JSON.parse(localStorage.getItem('web_members_list')) || [
    { username: "user1", password: "123", credit: 500, email: "", orderHistory: [], topupHistory: [] }
];

const safeGet = (key, fallback) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) { return fallback; }
};

window.db = {
    config: safeGet('web_config', initialConfig),
    taxonomy: safeGet('web_taxonomy', initialTaxonomy),
    products: safeGet('web_products', initialProducts),
    members: initialMembers,
    currentUser: JSON.parse(localStorage.getItem('web_current_logged_user')) || null,
    
    getConfig: function() { return this.config; },
    getTaxonomy: function() { return this.taxonomy; },
    getProducts: function() { return this.products; },
    getMembers: function() { return this.members; },
    getCurrentUser: function() { return this.currentUser; },
    
    saveConfig: function(c) { this.config = c; localStorage.setItem('web_config', JSON.stringify(c)); },
    saveTaxonomy: function(t) { this.taxonomy = t; localStorage.setItem('web_taxonomy', JSON.stringify(t)); },
    saveProducts: function(p) { this.products = p; localStorage.setItem('web_products', JSON.stringify(p)); },
    saveMembers: function(m) { this.members = m; localStorage.setItem('web_members_list', JSON.stringify(m)); },
    saveCurrentUser: function(u) { this.currentUser = u; localStorage.setItem('web_current_logged_user', JSON.stringify(u)); }
};
