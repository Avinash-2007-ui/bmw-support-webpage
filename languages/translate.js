// 🌍 BMW Translations + Switcher
const translations = {
    en: {
        title: "BMW Life: Driven by Passion",
        brand_main: "Performance",
        brand_sub: "Sheer Driving Pleasure",
        nav_home: "Home",
        nav_m3: "M3 Series",
        m3_e30: "E30 M3",
        m3_e46: "E46 M3",
        m3_e92: "E92 M3",
        nav_m5: "M5 Series",
        m5_e28: "E28 M5 (1985-1988)",
        m5_e34: "E34 M5 (1988-1995)",
        m5_e39: "E39 M5 (1998-2003)",
        learn_more: "Learn More",
        search_placeholder: "Search BMW..."
    },
    es: {
        title: "BMW Vida: Impulsado por la Pasión",
        brand_main: "Rendimiento",
        brand_sub: "Placer de Conducir",
        nav_home: "Inicio",
        nav_m3: "Serie M3",
        m3_e30: "E30 M3",
        m3_e46: "E46 M3",
        m3_e92: "E92 M3",
        nav_m5: "Serie M5",
        m5_e28: "E28 M5 (1985-1988)",
        m5_e34: "E34 M5 (1988-1995)",
        m5_e39: "E39 M5 (1998-2003)",
        learn_more: "Saber Más",
        search_placeholder: "Buscar BMW..."
    },
    de: {
        title: "BMW Leben: Getrieben von Leidenschaft",
        brand_main: "Leistung",
        brand_sub: "Freude am Fahren",
        nav_home: "Startseite",
        nav_m3: "M3 Serie",
        m3_e30: "E30 M3",
        m3_e46: "E46 M3",
        m3_e92: "E92 M3",
        nav_m5: "M5 Serie",
        m5_e28: "E28 M5 (1985-1988)",
        m5_e34: "E34 M5 (1988-1995)",
        m5_e39: "E39 M5 (1998-2003)",
        learn_more: "Mehr Erfahren",
        search_placeholder: "BMW suchen..."
    },
    it: {
        title: "BMW Vita: Guidato dalla Passione",
        brand_main: "Prestazioni",
        brand_sub: "Piacere di Guidare",
        nav_home: "Home",
        nav_m3: "Serie M3",
        m3_e30: "E30 M3",
        m3_e46: "E46 M3",
        m3_e92: "E92 M3",
        nav_m5: "Serie M5",
        m5_e28: "E28 M5 (1985-1988)",
        m5_e34: "E34 M5 (1988-1995)",
        m5_e39: "E39 M5 (1998-2003)",
        learn_more: "Scopri di più",
        search_placeholder: "Cerca BMW..."
    },
    fr: {
        title: "BMW Vie : Animé par la Passion",
        brand_main: "Performance",
        brand_sub: "Plaisir de Conduire",
        nav_home: "Accueil",
        nav_m3: "Série M3",
        m3_e30: "E30 M3",
        m3_e46: "E46 M3",
        m3_e92: "E92 M3",
        nav_m5: "Série M5",
        m5_e28: "E28 M5 (1985-1988)",
        m5_e34: "E34 M5 (1988-1995)",
        m5_e39: "E39 M5 (1998-2003)",
        learn_more: "En Savoir Plus",
        search_placeholder: "Rechercher BMW..."
    },
    zh: {
        title: "宝马人生：激情驱动",
        brand_main: "性能",
        brand_sub: "纯粹驾驶乐趣",
        nav_home: "首页",
        nav_m3: "M3 系列",
        m3_e30: "E30 M3",
        m3_e46: "E46 M3",
        m3_e92: "E92 M3",
        nav_m5: "M5 系列",
        m5_e28: "E28 M5 (1985-1988)",
        m5_e34: "E34 M5 (1988-1995)",
        m5_e39: "E39 M5 (1998-2003)",
        learn_more: "了解更多",
        search_placeholder: "搜索宝马..."
    }
};

// 🔄 Apply translations
function applyTranslations(lang) {
    const dictionary = translations[lang];
    if (!dictionary) return;

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (dictionary[key]) {
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                el.placeholder = dictionary[key];
            } else {
                el.innerHTML = dictionary[key];
            }
        }
    });
}

// 🌐 Switcher buttons (data-lang attr)
document.querySelectorAll('[data-lang]').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = el.getAttribute('data-lang');
        applyTranslations(lang);
        localStorage.setItem('bmw_lang', lang);
    });
});

// 🚀 Auto-load saved/browser language
window.addEventListener("DOMContentLoaded", () => {
    let savedLang = localStorage.getItem('bmw_lang');
    if (!savedLang) {
        let browserLang = navigator.language.substring(0,2);
        savedLang = translations[browserLang] ? browserLang : 'en';
    }
    applyTranslations(savedLang);
});
