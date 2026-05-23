const db = {
    config: JSON.parse(localStorage.getItem('web_config')) || {
        shopName: "DekDec Shop",
        shopProfile: "https://picsum.photos/150/150?random=50",
        adminPass: "1234",
        paymentNo: "123-4-56789-0",
        paymentQR: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DekDecPay",
        marqueeText: "✨ ยินดีต้อนรับสู่ DekDec Shop แหล่งรวมฟอนต์และของตกแต่งสุดน่ารัก ✨",
        // ปลายทางสำหรับการรับ Webhook ไปยัง Google Apps Script เพื่อดึงเข้าสิทธิ์ผู้มีสิทธิ์อ่านใน Drive
        googleAppsScriptUrl: "https://script.google.com/macros/s/XXXXX/exec", 
        theme: { bg: "#E8DFE0", card: "#FFFFFF", btn: "#8D9B6A", textMain: "#8F5B34", textSub: "#8A9EA7", border: "#DAB692" },
        presets: []
    },
    
    // ระบบบัญชีเงินเครดิตและล็อกประวัติผู้ใช้งาน
    userData: JSON.parse(localStorage.getItem('web_user_data')) || {
        credit: 500, // ค่าสมมติเริ่มต้นเครดิตสะสม
        orderHistory: [],
        topupHistory: []
    },

    taxonomy: JSON.parse(localStorage.getItem('web_taxonomy')) || {
        categories: ["ฟอนต์", "ของตกแต่ง", "รวมกลุ่ม", "อุปกรณ์ไอที", "ของแต่งบ้าน", "กิ๊ฟช็อป", "ดิจิทัลไฟล์", "เครื่องเขียน", "แฟชั่น", "อื่นๆ"],
        subCategories: ["ลายมือ", "สติกเกอร์", "เคส", "Wallpaper"],
        brands: ["DekDec", "CoolKiz", "Gade"]
    },
    
    products: JSON.parse(localStorage.getItem('web_products')) || [
        { name: "ฟอนต์เด็กเดค", price: 150, discount: 51, category: "ฟอนต์", subCategory: "ลายมือ", brand: "DekDec", img: "https://picsum.photos/400/400?random=1", featured: true, limitOne: false, desc: "ฟอนต์ลายมือน่ารัก ใช้งานง่าย", autoDriveShare: true, googleDriveFolderId: "1A2B3C4D5E6F_FolderID" },
        { name: "สติกเกอร์ตกแต่ง", price: 59, discount: 0, category: "ของตกแต่ง", subCategory: "สติกเกอร์", brand: "CoolKiz", img: "https://picsum.photos/400/400?random=2", featured: false, limitOne: false, autoDriveShare: false },
        { name: "กลุ่มรวมตกแต่ง V.1", price: 350, discount: 50, category: "รวมกลุ่ม", subCategory: "ดิจิทัล", brand: "DekDec", img: "https://picsum.photos/400/400?random=3", featured: true, limitOne: false, autoDriveShare: true, googleDriveFolderId: "2X3Y4Z_FolderID" },
        { name: "เคสมือถือพาสเทล", price: 290, discount: 0, category: "อุปกรณ์ไอที", subCategory: "เคส", brand: "Gade", img: "https://picsum.photos/400/400?random=4", featured: false, limitOne: true, autoDriveShare: false },
        { name: "Wallpaper มือถือ", price: 49, discount: 0, category: "ดิจิทัลไฟล์", subCategory: "Wallpaper", brand: "Gade", img: "https://picsum.photos/400/400?random=5", featured: false, limitOne: false, autoDriveShare: true, googleDriveFolderId: "3M4N5P_FolderID" }
    ],
    
    getProducts: function() { return this.products; },
    getConfig: function() { return this.config; },
    getTaxonomy: function() { return this.taxonomy; },
    getUserData: function() { return this.userData; },
    saveProducts: function(p) { this.products = p; localStorage.setItem('web_products', JSON.stringify(this.products)); },
    saveConfig: function(c) { this.config = c; localStorage.setItem('web_config', JSON.stringify(this.config)); },
    saveTaxonomy: function(t) { this.taxonomy = t; localStorage.setItem('web_taxonomy', JSON.stringify(this.taxonomy)); },
    saveUserData: function(u) { this.userData = u; localStorage.setItem('web_user_data', JSON.stringify(this.userData)); }
};
