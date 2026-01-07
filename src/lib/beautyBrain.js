// Diccionario de reglas estéticas
const colorRules = {
    'rojo': 'tonos dorados, bronce o un delineado cat-eye clásico',
    'azul': 'tonos champagne, melocotón o tierra para contrastar',
    'verde': 'sombras rojizas, terracota o doradas',
    'negro': 'cualquier color, pero un smoky eye o labios rojos son imbatibles',
    'blanco': 'tonos rosa suave, nudes o un pop de color vibrante',
    'rosa': 'sombras grisáceas, marrones fríos o tonos malva'
};

const skinRules = {
    'clara': 'tonos rosados, pasteles y champagne',
    'media': 'tonos dorados, corales y bronces',
    'oscura': 'colores vibrantes, fucsias, dorados intensos y púrpuras'
};

export const getBeautyAdvice = (userInput, inventory) => {
    const text = userInput.toLowerCase();
    let advice = "";
    let recommendedKeywords = [];

    // 1. Lógica de Vestido/Sombras
    const colors = Object.keys(colorRules);
    const foundColor = colors.find(c => text.includes(c));
    if (foundColor) {
        advice += `Para un vestido ${foundColor}, te sugiero usar ${colorRules[foundColor]}. `;
        // Extraemos palabras clave para buscar en el inventario
        if (foundColor === 'rojo') recommendedKeywords.push('dorado', 'negro', 'delineador');
    }

    // 2. Lógica de Piel
    const skins = Object.keys(skinRules);
    const foundSkin = skins.find(s => text.includes(s));
    if (foundSkin) {
        advice += `Al tener piel ${foundSkin}, los ${skinRules[foundSkin]} te resaltarán increíblemente. `;
    }

    // 3. Lógica de Ocasión
    if (text.includes('boda') || text.includes('fiesta')) {
        advice += "Para eventos especiales, busca productos de larga duración (waterproof). ";
        recommendedKeywords.push('fijador', 'larga duracion', 'iluminador');
    }

    // Si no detectamos nada específico, damos un saludo general
    if (!advice) advice = "¡Esa combinación suena genial! Déjame buscar qué tenemos en el inventario que combine con tu estilo.";

    // 4. Filtrar productos del inventario basados en las palabras clave detectadas
    let suggestedProducts = inventory.filter(p => {
        const pData = `${p.name} ${p.description} ${p.category}`.toLowerCase();
        return recommendedKeywords.some(key => pData.includes(key));
    }).slice(0, 4);

    // Fallback: Si no hay matches específicos, mostrar los más vendidos (rating alto)
    if (suggestedProducts.length === 0) {
        suggestedProducts = inventory.sort((a, b) => b.rating - a.rating).slice(0, 3);
    }

    return { advice, suggestedProducts };
};