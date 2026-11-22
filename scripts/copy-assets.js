// Copia o motor de OCR (Tesseract) e o leitor de QR para www/vendor,
// para que tudo funcione offline dentro do app.
const fs = require('fs'), path = require('path');
const nm = p => path.join(__dirname, '..', 'node_modules', p);
const out = path.join(__dirname, '..', 'www', 'vendor');
fs.mkdirSync(path.join(out, 'core'), { recursive: true });
fs.mkdirSync(path.join(out, 'lang'), { recursive: true });
const cp = (from, to) => { fs.copyFileSync(nm(from), path.join(out, to)); console.log('ok', to); };
cp('tesseract.js/dist/tesseract.min.js', 'tesseract.min.js');
cp('tesseract.js/dist/worker.min.js', 'worker.min.js');
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'])
  cp('tesseract.js-core/' + f, 'core/' + f);
cp('@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz', 'lang/por.traineddata.gz');
cp('jsqr/dist/jsQR.js', 'jsQR.js');
