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
            
            // 🪐 โทนสีเริ่มต้นอิงตามโทนมืด Slate Grey ในภาพ user_14_dark-mode-ui-for-apps.jpg
            theme: {
                bgApp: "#202430",          /* สีพื้นหลังเว็บไซต์หลัก */
                bgCard: "#282d3c",         /* สีพื้นหลังการ์ด / แผงทั่วไป / กล่องป็อปอัพ */
                bgInput: "#343b4f",        /* สีพื้นหลังกล่องพิมพ์ / ช่องรับค่า */
                bgBtn: "#7082a6",          /* สีพื้นหลังปุ่มหลัก */
                txtMain: "#ffffff",         /* สีข้อความหัวข้อหลัก */
                txtSub: "#9ea8be",          /* สีข้อความรายละเอียดซับใน */
                txtBtnInside: "#ffffff",    /* สีตัวหนังสือข้างในปุ่มหลัก */
                borderColor: "#3a4358"      /* สีเส้นขอบกรอบโครงสร้าง */
            },
            
            // 🎨 คลังพรีเซ็ตสำเร็จรูปคัดสรรตามโทนที่กำหนด ควบคุมง่ายผ่าน 8 แกนหลัก
            presets: [
                {
                    name: "🪐 user_14 Dark Slate (โทนมืดตามรูป)",
                    bgApp: "#202430",
                    bgCard: "#282d3c",
                    bgInput: "#343b4f",
                    bgBtn: "#7082a6",
                    txtMain: "#ffffff",
                    txtSub: "#9ea8be",
                    txtBtnInside: "#ffffff",
                    borderColor: "#3a4358"
                },
                {
                    name: "☀️ user_14 Light Mode (โทนสว่างพาสเทล)",
                    bgApp: "#f0f2f5",
                    bgCard: "#ffffff",
                    bgInput: "#e4e6eb",
                    bgBtn: "#2d4373",
                    txtMain: "#1c1e21",
                    txtSub: "#606770",
                    txtBtnInside: "#ffffff",
                    borderColor: "#ced0d4"
                },
                {
                    name: "🐰 ชมพูนมเย็น (Cute Pink)",
                    bgApp: "#fdf6f6",
                    bgCard: "#ffffff",
                    bgInput: "#fff0f2",
                    bgBtn: "#ff8da1",
                    txtMain: "#613b43",
                    txtSub: "#a67c84",
                    txtBtnInside: "#ffffff",
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
