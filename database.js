const db = {
    config: JSON.parse(localStorage.getItem('web_config')) || {
        shopName: "DekDec Shop",
        shopProfile: "https://picsum.photos/150/150?random=50",
        adminPass: "1234",
        paymentNo: "123-4-56789-0",
        paymentQR: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DekDecPay",
        marqueeText: "✨ ยินดีต้อนรับสู่ DekDec Shop แหล่งรวมฟอนต์และของตกแต่งสุดน่ารัก ✨",
        theme: { bg: "#E8DFE0", card: "#FFFFFF", btn: "#8D9B6A", textMain: "#8F5B34", textSub: "#8A9EA7", border: "#DAB692" },
        presets: []
    },
    taxonomy: JSON.parse(localStorage.getItem('web_taxonomy')) || {
        categories: ["ฟอนต์", "ของตกแต่ง", "รวมกลุ่ม", "อุปกรณ์ไอที", "ของแต่งบ้าน", "กิ๊ฟช็อป", "ดิจิทัลไฟล์", "เครื่องเขียน", "แฟชั่น", "อื่นๆ"],
        subCategories: ["ลายมือ", "สติกเกอร์", "เคส", "Wallpaper"],
        brands: ["DekDec", "CoolKiz", "Gade"]
    },
    products: JSON.parse(localStorage.getItem('web_products')) || [
        { name: "ฟอนต์เด็กเดค", price: 150, discount: 51, category: "ฟอนต์", subCategory: "ลายมือ", brand: "DekDec", img: "https://picsum.photos/400/400?random=1", featured: true, limitOne: false, desc: "ฟอนต์ลายมือน่ารัก ใช้งานง่าย" },
        { name: "สติกเกอร์ตกแต่ง", price: 59, discount: 0, category: "ของตกแต่ง", subCategory: "สติกเกอร์", brand: "CoolKiz", img: "https://picsum.photos/400/400?random=2", featured: false, limitOne: false },
        { name: "กลุ่มรวมตกแต่ง V.1", price: 350, discount: 50, category: "รวมกลุ่ม", subCategory: "ดิจิทัล", brand: "DekDec", img: "https://picsum.photos/400/400?random=3", featured: true, limitOne: false },
        { name: "เคสมือถือพาสเทล", price: 290, discount: 0, category: "อุปกรณ์ไอที", subCategory: "เคส", brand: "Gade", img: "https://picsum.photos/400/400?random=4", featured: false, limitOne: true },
        { name: "Wallpaper มือถือ", price: 49, discount: 0, category: "ดิจิทัลไฟล์", subCategory: "Wallpaper", brand: "Gade", img: "https://picsum.photos/400/400?random=5", featured: false, limitOne: false },
        { name: "โคมไฟตั้งโต๊ะ", price: 590, discount: 100, category: "ของแต่งบ้าน", subCategory: "ไฟ", brand: "Santiwong", img: "https://picsum.photos/400/400?random=6", featured: false, limitOne: false },
        { name: "พวงกุญแจตุ๊กตา", price: 129, discount: 0, category: "กิ๊ฟช็อป", subCategory: "ตุ๊กตา", brand: "DekDec", img: "https://picsum.photos/400/400?random=7", featured: false, limitOne: false },
        { name: "ปากกาเจลสีหวาน", price: 35, discount: 5, category: "เครื่องเขียน", subCategory: "ปากกา", brand: "CoolKiz", img: "https://picsum.photos/400/400?random=8", featured: false, limitOne: false },
        { name: "หมอนอิงหัวใจ", price: 450, discount: 100, category: "ของแต่งบ้าน", subCategory: "ห้องนอน", brand: "DekDec", img: "https://picsum.photos/400/400?random=9", featured: false, limitOne: false },
        { name: "เสื้อยืด Oversize", price: 350, discount: 60, category: "แฟชั่น", subCategory: "Oversize", brand: "CoolKiz", img: "https://picsum.photos/400/400?random=10", featured: false, limitOne: false }
    ],
    getProducts: function() { return this.products; },
    getConfig: function() { return this.config; },
    getTaxonomy: function() { return this.taxonomy; },
    saveProducts: function(p) { this.products = p; localStorage.setItem('web_products', JSON.stringify(this.products)); },
    saveConfig: function(c) { this.config = c; localStorage.setItem('web_config', JSON.stringify(c)); },
    saveTaxonomy: function(t) { this.taxonomy = t; localStorage.setItem('web_taxonomy', JSON.stringify(t)); }
};
