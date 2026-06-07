(function() {
    // 📦 โครงสร้างฐานข้อมูลหลักร้าน DekDec พร้อมคลังพรีเซ็ตดั้งเดิมครบถ้วน
    const defaultData = {
        config: {
            shopName: "DekDec Font & Design",
            shopProfile: "https://picsum.photos/200/200?random=99",
            marqueeText: "🎉 ยินดีต้อนรับสู่คลังฟอนต์ลายมือน่ารักๆ และไอเทมตกแต่งดิจิทัลพรีเมียม ลิขสิทธิ์แท้ 100% ✨",
            paymentNo: "012-3-45678-9 (ธนาคารกสิกรไทย - บจก. เดคเดค สตูดิโอ)",
            paymentQR: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DekDecStudioPayment",
            googleAppsScriptUrl: "", 
            adminPass: "1234",
            
            // ค่าสีเริ่มต้นอิงตามสไตล์หรูหรามืด Slate Grey (user_14)
            theme: {
                bg: "#202430",         
                card: "#282d3c",       
                border: "#3a4358",     
                text: "#ffffff",       
                muted: "#9ea8be",      
                primary: "#7082a6",    
                secondary: "#5c6b8c",  
                accent: "#8fa3c7"      
            },
            
            // 🪐 คลังพรีเซ็ตสำเร็จรูปครบเซ็ต
            themePresets: [
                {
                    id: "p1",
                    name: "🪐 user_14 Dark Slate",
                    colors: { bg: "#202430", card: "#282d3c", border: "#3a4358", text: "#ffffff", muted: "#9ea8be", primary: "#7082a6", secondary: "#5c6b8c", accent: "#8fa3c7" }
                },
                {
                    id: "p2",
                    name: "☀️ user_14 Light Mode",
                    colors: { bg: "#f0f2f5", card: "#ffffff", border: "#ced0d4", text: "#1c1e21", muted: "#606770", primary: "#2d4373", secondary: "#4b67a1", accent: "#7b9acc" }
                },
                {
                    id: "p3",
                    name: "🐰 ชมพูนมเย็น (Cute Pink)",
                    colors: { bg: "#fdf6f6", card: "#ffffff", border: "#ffd6dc", text: "#613b43", muted: "#a67c84", primary: "#ff8da1", secondary: "#ffa6b7", accent: "#ffb3c1" }
                },
                {
                    id: "p4",
                    name: "🍵 ชาเขียวมัทฉะ (Matcha Green)",
                    colors: { bg: "#f4f7f4", card: "#ffffff", border: "#cfe2cf", text: "#2e4a2e", muted: "#6b8e6b", primary: "#557a55", secondary: "#709670", accent: "#8cb38c" }
                }
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
            { name: "ฟอนต์ลายมือ DekDec (Handwriting Font)", price: 159, discount: 60, category: "ฟอนต์", subCategory: "ลายมือ", brand: "DekDec Studio", img: "https://picsum.photos/400/400?random=11", desc: "ฟอนต์ลายมือน่ารักๆ หัวกลม เหมาะสำหรับตกแต่งจดสรุป GoodNotes โน้ตสรุป หรือทำกราฟิกคอนเทนต์โปรโมทสินค้าน่ารักๆ", featured: true, limitOne: true, autoDriveShare: false, googleDriveFolderId: "" },
            { name: "Sticker Pack น้องกระต่ายอ้วน สำหรับ GoodNotes", price: 89, discount: 30, category: "ของตกแต่ง", subCategory: "น่ารัก", brand: "Angun Hwan", img: "https://picsum.photos/400/400?random=12", desc: "สติกเกอร์ตกแต่งแพลนเนอร์ ไฟล์ PNG โปร่งใส พร้อมใช้งานบน iPad/Tablet", featured: false, limitOne: false, autoDriveShare: false, googleDriveFolderId: "" }
        ],
        members: [
            { username: "gade", password: "gade", credit: 500, email: "gade@gmail.com", orderHistory: [], topupHistory: [] }
        ]
    };

    if (!localStorage.getItem('dekdec_store_db')) {
        localStorage.setItem('dekdec_store_db', JSON.stringify(defaultData));
    }

    const db = JSON.parse(localStorage.getItem('dekdec_store_db'));

    window.db = {
        config: db.config,
        taxonomy: db.taxonomy,
        products: db.products,
        members: db.members,

        getConfig() { return this.config; },
        getTaxonomy() { return this.taxonomy; },
        getProducts() { return this.products; },
        getMembers() { return this.members; },

        getCurrentUser() {
            return JSON.parse(localStorage.getItem('dekdec_current_user')) || null;
        },
        saveConfig(cfg) { this.config = cfg; this.sync(); },
        saveTaxonomy(t) { this.taxonomy = t; this.sync(); },
        saveProducts(p) { this.products = p; this.sync(); },
        saveMembers(m) { this.members = m; this.sync(); },
        saveCurrentUser(user) {
            if (user) localStorage.setItem('dekdec_current_user', JSON.stringify(user));
            else localStorage.removeItem('dekdec_current_user');
        },
        sync() {
            localStorage.setItem('dekdec_store_db', JSON.stringify({
                config: this.config,
                taxonomy: this.taxonomy,
                products: this.products,
                members: this.members
            }));
        }
    };
})();
