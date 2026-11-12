//! Funciones Rust expuestas a JavaScript via wasm-bindgen.
//! Sin dependencias extra: el .wasm queda muy pequeno.

use wasm_bindgen::prelude::*;

/// Ejemplo minimo: saludo desde Rust.
#[wasm_bindgen]
pub fn saludar(nombre: &str) -> String {
    format!("Hola {nombre}, este saludo viene de Rust + WebAssembly 🦀")
}

/// Minusculas + sin acentos (espanol). "Canción Áurea" -> "cancion aurea".
fn normalizar_interno(texto: &str) -> String {
    texto
        .chars()
        .flat_map(|c| c.to_lowercase())
        .map(|c| match c {
            'á' | 'à' | 'ä' | 'â' => 'a',
            'é' | 'è' | 'ë' | 'ê' => 'e',
            'í' | 'ì' | 'ï' | 'î' => 'i',
            'ó' | 'ò' | 'ö' | 'ô' => 'o',
            'ú' | 'ù' | 'ü' | 'û' => 'u',
            other => other,
        })
        .collect()
}

#[wasm_bindgen]
pub fn normalizar(texto: &str) -> String {
    normalizar_interno(texto)
}

/// Puntua cada texto contra la consulta (sin acentos ni mayusculas).
/// Devuelve un Uint32Array en JS con un puntaje por texto (0 = sin coincidencia).
/// Cada palabra de la consulta debe aparecer; mas puntos si empieza una palabra.
#[wasm_bindgen]
pub fn puntuar(consulta: &str, textos: Vec<String>) -> Vec<u32> {
    let q = normalizar_interno(consulta);
    let palabras: Vec<&str> = q.split_whitespace().collect();

    textos
        .iter()
        .map(|t| {
            if palabras.is_empty() {
                return 1;
            }
            let t = normalizar_interno(t);
            let mut total = 0u32;
            for p in &palabras {
                match t.find(p) {
                    None => return 0,
                    Some(pos) => {
                        let inicio_palabra =
                            pos == 0 || t[..pos].ends_with(|c: char| !c.is_alphanumeric());
                        total += if inicio_palabra { 10 } else { 3 };
                    }
                }
            }
            total
        })
        .collect()
}

/// Criba de Eratostenes: cantidad de primos <= n. Ejemplo de calculo pesado.
#[wasm_bindgen]
pub fn contar_primos(n: u32) -> u32 {
    if n < 2 {
        return 0;
    }
    let n = n as usize;
    let mut criba = vec![true; n + 1];
    criba[0] = false;
    criba[1] = false;
    let mut i = 2;
    while i * i <= n {
        if criba[i] {
            let mut j = i * i;
            while j <= n {
                criba[j] = false;
                j += i;
            }
        }
        i += 1;
    }
    criba.iter().filter(|&&p| p).count() as u32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normaliza() {
        assert_eq!(normalizar("Canción ÁUREA ñandú"), "cancion aurea ñandu");
    }

    #[test]
    fn puntua() {
        let t = vec!["Carta de amor".to_string(), "Jardín romántico".to_string(), "Pocoyo".to_string()];
        assert_eq!(puntuar("JARDIN", t.clone()), vec![0, 10, 0]);
        assert_eq!(puntuar("amor carta", t.clone()), vec![20, 0, 0]);
        assert_eq!(puntuar("", t), vec![1, 1, 1]);
    }

    #[test]
    fn primos() {
        assert_eq!(contar_primos(100), 25);
        assert_eq!(contar_primos(1), 0);
        assert_eq!(contar_primos(1_000_000), 78_498);
    }
}
