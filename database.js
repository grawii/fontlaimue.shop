(function() {
    // โครงสร้างฐานข้อมูลหลักของร้าน DekDec
    const defaultData = {
        config: {
            shopName: "DekDec Font & Design",
            shopProfile: "https://picsum.photos/200/200?random=99",
            marqueeText: "🎉 ยินดีต้อนรับสู่คลังฟอนต์ลายมือน่ารักๆ และไอเทมตกแต่งดิจิทัลพรีเมียม ลิขสิทธิ์แท้ 100% ✨",
            paymentNo: "012-3-45678-9 (ธนาคารกสิกรไทย - บจก. เดคเดค สตูดิโอ)",
            paymentQR: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DekDecStudioPayment",
            googleAppsScriptUrl: "", 
            adminPass: "1234",
            
            // 🌟 1. โทนสีเริ่มต้นเมื่อเปิดเว็บครั้งแรก
            theme: {
                bgApp: "#202430",          /* พื้นหลังแอปโทนเข้มลึก Slate Grey */
                bgCard: "#282d3c",         /* พื้นหลังการ์ด/กล่องข้อความย่อย */
                bgProductCard: "#1d212c",  /* พื้นหลังการ์ดสินค้า */
                bgInput: "#343b4f",        /* ช่องค้นหา/ช่องรับค่า */
                bgMarquee: "#282d3c",      /* แบนเนอร์ข้อความวิ่ง */
                bgBtn: "#7082a6",          /* ปุ่มหลักโทนน้ำเงินอมเทา */
                bgCatBtnNormal: "#343b4f",  /* ปุ่มหมวดหมู่ปกติ */
                bgCatBtnActive: "#94b3ff",  /* ปุ่มหมวดหมู่ที่เลือกอยู่ (สีฟ้าสว่างไฮไลต์) */
                txtMain: "#ffffff",         /* ข้อความหลัก */
                txtSub: "#9ea8be",          /* ข้อความรอง */
                txtProductName: "#ffffff",  /* ชื่อสินค้า */
                txtMarquee: "#94b3ff",      /* ข้อความวิ่ง */
                txtBtnInside: "#ffffff",    /* ตัวหนังสือบนปุ่มหลัก */
                txtCatNormal: "#9ea8be",    /* ตัวหนังสือหมวดหมู่ปกติ */
                txtCatActive: "#1a1d24",    /* ตัวหนังสือหมวดหมู่ที่เลือกอยู่ */
                borderColor: "#3a4358"      /* เส้นขอบ */
            },
            
            // 🌟 2. แผงพรีเซ็ตสีสำเร็จรูปถอดแบบจากรูป user_14_dark-mode-ui-for-apps.jpg (แก้ไขในระบบได้ทุกส่วน)
            presets: [
                {
                    name: "🪐 user_14 Dark Slate (โทนมืดตามรูป)",
                    bgApp: "#202430",
                    bgCard: "#282d3c",
                    bgProductCard: "#1d212c",
                    bgInput: "#343b4f",
                    bgMarquee: "#282d3c",
                    bgBtn: "#7082a6",
                    bgCatBtnNormal: "#343b4f",
                    bgCatBtnActive: "#94b3ff",
                    txtMain: "#ffffff",
                    txtSub: "#9ea8be",
                    txtProductName: "#ffffff",
                    txtMarquee: "#94b3ff",
                    txtBtnInside: "#ffffff",
                    txtCatNormal: "#9ea8be",
                    txtCatActive: "#1a1d24",
                    borderColor: "#3a4358"
                },
                {
                    name: "☀️ user_14 Light Mode (โทนสว่างพาสเทล)",
                    bgApp: "#f0f2f5",
                    bgCard: "#ffffff",
                    bgProductCard: "#ffffff",
                    bgInput: "#e4e6eb",
                    bgMarquee: "#f7f9fa",
                    bgBtn: "#2d4373",
                    bgCatBtnNormal: "#e4e6eb",
                    bgCatBtnActive: "#2d4373",
                    txtMain: "#1c1e21",
                    txtSub: "#606770",
                    txtProductName: "#1c1e21",
                    txtMarquee: "#2d4373",
                    txtBtnInside: "#ffffff",
                    txtCatNormal: "#606770",
                    txtCatActive: "#ffffff",
                    borderColor: "#ced0d4"
                },
                {
                    name: "🎨 คิวท์พาสเทล (Cute Pastel)",
                    bgApp: "#fdf6f6",
                    bgCard: "#ffffff",
                    bgProductCard: "#ffffff",
                    bgInput: "#fff0f2",
                    bgMarquee: "#fff0f2",
                    bgBtn: "#ff8da1",
                    bgCatBtnNormal: "#fff0f2",
                    bgCatBtnActive: "#ff8da1",
                    txtMain: "#613b43",
                    txtSub: "#a67c84",
                    txtProductName: "#613b43",
                    txtMarquee: "#ff6b84",
                    txtBtnInside: "#ffffff",
                    txtCatNormal: "#a67c84",
                    txtCatActive: "#ffffff",
                    borderColor: "#ffd6dc"
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

    // ระบบโหลดและบันทึกลง LocalStorage
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

        saveConfig(cfg) {
            this.config = cfg;
            this.sync();
        },
        saveProducts(p) {
            this.products = p;
            this.sync();
        },
        saveMembers(m) {
            this.members = m;
            this.sync();
        },
        saveCurrentUser(user) {
            if (user) {
                localStorage.setItem('dekdec_current_user', JSON.stringify(user));
            } else {
                localStorage.removeItem('dekdec_current_user');
            }
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
