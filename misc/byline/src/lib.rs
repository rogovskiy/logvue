mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


#[wasm_bindgen]
pub struct IntegerStream {
    offset: *const u32,
    size: usize,
}

#[wasm_bindgen]
impl IntegerStream {

    pub fn offset(&self) -> *const u32 {
        self.offset
    }

    pub fn size(&self) -> usize {
        self.size
    }
}

#[wasm_bindgen]
pub fn split_lines(buffer: &[u8]) -> IntegerStream {
    let mut indexes: Vec<u32> = Vec::new();
    for (pos, &b) in buffer.iter().enumerate() {
        if b == 13u8 || b == 10u8 {
            indexes.push(pos as u32);
        }
    }

    IntegerStream {
        offset: indexes.as_ptr(),
        size: indexes.len(),
    }
}


#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_add() {
        let res = split_lines(b"123\n234\r\n567");
        assert_eq!(res.size, 3);
        let slice = unsafe { std::slice::from_raw_parts(res.offset, res.size) };
        assert!(slice.iter().zip([ 3, 7, 8 ].iter()).all(|(a,b)| a == b), "Arrays are not equal");
    }
}