/* tools-interactive.js \u2013 Image Tools + PDF Tools (real client-side canvas / PDF generation).
   These tools are interactive (need a real browser + file uploads), so they use custom render
   functions and are flagged interactive:true so the headless smoke test skips output checks. */
(function (root) {
  'use strict';
  var isNode = (typeof module !== 'undefined' && module.exports);
  if (isNode) require('./tools-web.js');
  var SEO = isNode ? require('./seo-data.js') : root.SEO;
  var H = root.__megaHelpers; var push = H.push, num = H.num;
  var CS = root.CS || {};
  function el(t, a) { return CS.el ? CS.el(t, a) : { appendChild: function () {}, addEventListener: function () {}, style: {} }; }
  function field(l, n, h) { return CS.field ? CS.field(l, n, h) : n; }
  function T(id, name, cat, icon, kw, blurb, render, faqs) { push({ id: id, slug: id, cat: cat, icon: icon, name: name, kw: kw, blurb: blurb, def: render, interactive: true, faqs: faqs }); }

  /* ---- generic canvas image processor ---- */
  function imgTool(opts) {
    return function () {
      var wrap = el('div', { class: 'tool-img' });
      var file = el('input', { type: 'file', accept: 'image/*' });
      wrap.appendChild(field('Choose an image', file));
      var optNodes = {};
      (opts.inputs || []).forEach(function (f) {
        var n;
        if (f.t === 'color') n = el('input', { type: 'color', value: f.v });
        else if (f.t === 'sel') n = CS.selectInput ? CS.selectInput(f.opts, { value: f.v }) : el('input');
        else n = CS.numInput ? CS.numInput({ value: f.v, step: f.step }) : el('input', { value: f.v });
        optNodes[f.k] = n;
        wrap.appendChild(field(f.label, n));
        if (n.addEventListener) n.addEventListener('input', rerun);
        if (n.addEventListener) n.addEventListener('change', rerun);
      });
      var info = el('div', { class: 'calc-res' });
      var preview = el('div', { class: 'img-preview' });
      var dl = el('a', { class: 'btn dl-btn' });
      dl.textContent = 'Download result'; dl.style.display = 'none';
      var hint = el('div', { class: 'calc-note' }); hint.innerHTML = 'Upload an image to begin. All processing happens locally in your browser \u2013 your image never leaves your device.';
      wrap.appendChild(hint); wrap.appendChild(info); wrap.appendChild(preview); wrap.appendChild(dl);
      var lastImg = null;
      function readOpts() { var o = {}; (opts.inputs || []).forEach(function (f) { var n = optNodes[f.k]; o[f.k] = (f.t === 'color' || f.t === 'sel') ? n.value : (parseFloat(n.value) || f.v); }); return o; }
      function process(img) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        opts.transform(canvas, ctx, img, readOpts());
        var mime = opts.mime || 'image/png';
        var url = canvas.toDataURL(mime, opts.quality != null ? opts.quality : 0.92);
        preview.innerHTML = '';
        var pi = new Image(); pi.src = url; pi.style.maxWidth = '100%'; pi.style.borderRadius = '8px'; preview.appendChild(pi);
        dl.href = url; dl.download = 'calcsuite-' + opts.ext; dl.style.display = 'inline-block';
        info.innerHTML = 'Output: <b>' + canvas.width + ' \u00D7 ' + canvas.height + ' px</b> \u00B7 ' + (mime.split('/')[1].toUpperCase());
      }
      function rerun() { if (lastImg) process(lastImg); }
      file.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () { var im = new Image(); im.onload = function () { lastImg = im; process(im); }; im.src = rd.result; };
        rd.readAsDataURL(f);
      });
      return wrap;
    };
  }
  function drawSame(c, x, img) { c.width = img.width; c.height = img.height; x.drawImage(img, 0, 0); }
  var IMG = 'Image Tools', imi = '\uD83D\uDDBC\uFE0F';

  T('image-resizer', 'Image Resizer', IMG, imi, 'resize image, image resizer', 'Resize an image to exact pixel dimensions, right in your browser.', imgTool({ ext: 'resized.png', inputs: [{ k: 'w', label: 'Width (px)', v: 800 }, { k: 'h', label: 'Height (px)', v: 600 }], transform: function (c, x, img, o) { c.width = Math.max(1, o.w); c.height = Math.max(1, o.h); x.drawImage(img, 0, 0, c.width, c.height); } }), [{ q: 'Is my image uploaded to a server?', a: 'No. Resizing happens entirely in your browser using the Canvas API \u2013 nothing is uploaded.' }]);
  T('image-compressor', 'Image Compressor', IMG, imi, 'compress image, reduce image size', 'Compress JPEG images by adjusting quality to shrink file size.', imgTool({ ext: 'compressed.jpg', mime: 'image/jpeg', quality: 0.6, inputs: [{ k: 'q', label: 'Quality (0.1 - 1.0)', v: 0.6, step: 0.05 }], transform: function (c, x, img, o) { drawSame(c, x, img); this.quality = o.q; } }));
  T('image-to-png', 'Convert Image to PNG', IMG, imi, 'convert to png, jpg to png', 'Convert any image (JPG, WebP, GIF) to PNG format.', imgTool({ ext: 'image.png', mime: 'image/png', transform: drawSame }));
  T('image-to-jpg', 'Convert Image to JPG', IMG, imi, 'convert to jpg, png to jpg', 'Convert any image to JPG/JPEG format.', imgTool({ ext: 'image.jpg', mime: 'image/jpeg', quality: 0.92, transform: function (c, x, img) { c.width = img.width; c.height = img.height; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0); } }));
  T('image-to-webp', 'Convert Image to WebP', IMG, imi, 'convert to webp', 'Convert any image to the modern WebP format.', imgTool({ ext: 'image.webp', mime: 'image/webp', quality: 0.9, transform: drawSame }));
  T('image-grayscale', 'Grayscale Image', IMG, imi, 'grayscale image, black and white', 'Convert an image to grayscale.', imgTool({ ext: 'grayscale.png', transform: function (c, x, img) { drawSame(c, x, img); var d = x.getImageData(0, 0, c.width, c.height); for (var i = 0; i < d.data.length; i += 4) { var g = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]; d.data[i] = d.data[i + 1] = d.data[i + 2] = g; } x.putImageData(d, 0, 0); } }));
  T('image-invert', 'Invert Image Colors', IMG, imi, 'invert image, negative', 'Invert the colors of an image (negative effect).', imgTool({ ext: 'inverted.png', transform: function (c, x, img) { drawSame(c, x, img); var d = x.getImageData(0, 0, c.width, c.height); for (var i = 0; i < d.data.length; i += 4) { d.data[i] = 255 - d.data[i]; d.data[i + 1] = 255 - d.data[i + 1]; d.data[i + 2] = 255 - d.data[i + 2]; } x.putImageData(d, 0, 0); } }));
  T('image-brightness', 'Adjust Image Brightness', IMG, imi, 'brightness, brighten image', 'Brighten or darken an image by a percentage.', imgTool({ ext: 'brightness.png', inputs: [{ k: 'b', label: 'Brightness % (e.g. 120)', v: 120 }], transform: function (c, x, img, o) { drawSame(c, x, img); var f = o.b / 100; var d = x.getImageData(0, 0, c.width, c.height); for (var i = 0; i < d.data.length; i += 4) { d.data[i] *= f; d.data[i + 1] *= f; d.data[i + 2] *= f; } x.putImageData(d, 0, 0); } }));
  T('image-rotate', 'Rotate Image', IMG, imi, 'rotate image', 'Rotate an image by 90, 180 or 270 degrees.', imgTool({ ext: 'rotated.png', inputs: [{ k: 'a', label: 'Angle', t: 'sel', v: '90', opts: [{ value: '90', label: '90\u00B0' }, { value: '180', label: '180\u00B0' }, { value: '270', label: '270\u00B0' }] }], transform: function (c, x, img, o) { var a = parseInt(o.a, 10); if (a === 180) { c.width = img.width; c.height = img.height; } else { c.width = img.height; c.height = img.width; } x.translate(c.width / 2, c.height / 2); x.rotate(a * Math.PI / 180); x.drawImage(img, -img.width / 2, -img.height / 2); } }));
  T('image-flip', 'Flip Image', IMG, imi, 'flip image, mirror image', 'Flip an image horizontally or vertically.', imgTool({ ext: 'flipped.png', inputs: [{ k: 'd', label: 'Direction', t: 'sel', v: 'h', opts: [{ value: 'h', label: 'Horizontal' }, { value: 'v', label: 'Vertical' }] }], transform: function (c, x, img, o) { c.width = img.width; c.height = img.height; if (o.d === 'h') { x.translate(c.width, 0); x.scale(-1, 1); } else { x.translate(0, c.height); x.scale(1, -1); } x.drawImage(img, 0, 0); } }));
  T('image-crop-center', 'Center Crop Image', IMG, imi, 'crop image', 'Crop an image to a centered width \u00D7 height box.', imgTool({ ext: 'cropped.png', inputs: [{ k: 'w', label: 'Crop width (px)', v: 400 }, { k: 'h', label: 'Crop height (px)', v: 400 }], transform: function (c, x, img, o) { var w = Math.min(o.w, img.width), h = Math.min(o.h, img.height); c.width = w; c.height = h; x.drawImage(img, (img.width - w) / 2, (img.height - h) / 2, w, h, 0, 0, w, h); } }));
  T('image-circle-crop', 'Circle Crop Image', IMG, imi, 'circle crop, round image', 'Crop an image into a circle (transparent corners, PNG).', imgTool({ ext: 'circle.png', transform: function (c, x, img) { var s = Math.min(img.width, img.height); c.width = s; c.height = s; x.beginPath(); x.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); x.closePath(); x.clip(); x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, s, s); } }));
  T('image-add-border', 'Add Border to Image', IMG, imi, 'add border, frame image', 'Add a solid colored border around an image.', imgTool({ ext: 'bordered.png', inputs: [{ k: 'b', label: 'Border width (px)', v: 20 }, { k: 'col', label: 'Border color', t: 'color', v: '#1f6fb2' }], transform: function (c, x, img, o) { var b = o.b; c.width = img.width + b * 2; c.height = img.height + b * 2; x.fillStyle = o.col; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, b, b); } }));
  T('favicon-generator', 'Favicon Generator (32px)', IMG, imi, 'favicon generator', 'Generate a 32\u00D732 favicon PNG from any image.', imgTool({ ext: 'favicon.png', transform: function (c, x, img) { c.width = 32; c.height = 32; x.drawImage(img, 0, 0, 32, 32); } }));
  T('image-watermark', 'Add Text Watermark', IMG, imi, 'watermark image', 'Overlay a semi-transparent text watermark on an image.', imgTool({ ext: 'watermarked.png', inputs: [{ k: 'txt', label: 'Watermark text', t: 'text', v: '\u00A9 CalcSuite' }], transform: function (c, x, img, o) { drawSame(c, x, img); var fs = Math.max(16, Math.round(c.width / 18)); x.font = 'bold ' + fs + 'px Arial'; x.fillStyle = 'rgba(255,255,255,0.55)'; x.textAlign = 'right'; x.fillText(o.txt || '\u00A9 CalcSuite', c.width - 12, c.height - 12); } }));
  T('image-to-base64', 'Image to Base64', IMG, imi, 'image to base64, data uri', 'Convert an image to a Base64 data URI for inline embedding.', function () {
    var wrap = el('div', { class: 'tool-img' });
    var file = el('input', { type: 'file', accept: 'image/*' });
    wrap.appendChild(field('Choose an image', file));
    var out = el('textarea', { class: 'b64out', rows: 6 }); out.style.width = '100%';
    var info = el('div', { class: 'calc-note' }); info.innerHTML = 'Upload an image to get its Base64 data URI (processed locally).';
    wrap.appendChild(info); wrap.appendChild(out);
    file.addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { out.value = rd.result; info.innerHTML = 'Length: ' + rd.result.length + ' characters'; }; rd.readAsDataURL(f); });
    return wrap;
  });

  /* ---- PDF generation (vanilla, no libraries) ---- */
  function pdfEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function buildTextPdf(text) {
    var pageH = 792, pageW = 612, margin = 50, fs = 12, leading = 16;
    var maxLines = Math.floor((pageH - margin * 2) / leading);
    var raw = String(text).replace(/\r/g, '').split('\n');
    var lines = [];
    raw.forEach(function (l) { if (l === '') { lines.push(''); return; } while (l.length > 95) { lines.push(l.slice(0, 95)); l = l.slice(95); } lines.push(l); });
    var pages = []; for (var i = 0; i < lines.length; i += maxLines) pages.push(lines.slice(i, i + maxLines));
    if (!pages.length) pages.push(['']);
    var objs = [], contentRefs = [];
    pages.forEach(function (pl) {
      var stream = 'BT /F1 ' + fs + ' Tf ' + leading + ' TL ' + margin + ' ' + (pageH - margin) + ' Td';
      pl.forEach(function (l) { stream += ' (' + pdfEsc(l) + ') Tj T*'; });
      stream += ' ET';
      objs.push('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      contentRefs.push(objs.length);
    });
    var fontObj = (objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'), objs.length);
    var pageObjStart = objs.length;
    var kids = [];
    pages.forEach(function (pl, idx) {
      objs.push('<< /Type /Page /Parent PARENT 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /Font << /F1 ' + fontObj + ' 0 R >> >> /Contents ' + contentRefs[idx] + ' 0 R >>');
      kids.push(objs.length);
    });
    var pagesObj = (objs.push('<< /Type /Pages /Kids [' + kids.map(function (k) { return k + ' 0 R'; }).join(' ') + '] /Count ' + kids.length + ' >>'), objs.length);
    objs = objs.map(function (o) { return o.replace('PARENT', pagesObj); });
    var catalog = (objs.push('<< /Type /Catalog /Pages ' + pagesObj + ' 0 R >>'), objs.length);
    var pdf = '%PDF-1.4\n', offsets = [];
    for (var j = 0; j < objs.length; j++) { offsets.push(pdf.length); pdf += (j + 1) + ' 0 obj\n' + objs[j] + '\nendobj\n'; }
    var xrefPos = pdf.length;
    pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach(function (off) { pdf += ('0000000000' + off).slice(-10) + ' 00000 n \n'; });
    pdf += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + catalog + ' 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';
    return pdf;
  }
  function downloadBlob(data, type, name) { var blob = new Blob([data], { type: type }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); }
  var PDF = 'PDF Tools', pdi = '\uD83D\uDCC4';

  T('text-to-pdf', 'Text to PDF', PDF, pdi, 'text to pdf, create pdf', 'Turn any text into a downloadable, multi-page PDF \u2013 fully in your browser.', function () {
    var wrap = el('div');
    var ta = el('textarea', { rows: 8 }); ta.style.width = '100%'; ta.value = 'Hello from CalcSuite!\n\nType or paste any text here and click "Generate PDF".';
    wrap.appendChild(field('Your text', ta));
    var btn = el('button', { class: 'btn', type: 'button' }); btn.textContent = 'Generate PDF';
    wrap.appendChild(btn);
    btn.addEventListener('click', function () { downloadBlob(buildTextPdf(ta.value), 'application/pdf', 'calcsuite-text.pdf'); });
    return wrap;
  }, [{ q: 'Does this work offline?', a: 'Yes \u2013 the PDF is generated entirely in your browser with no server or library calls.' }]);
  T('markdown-to-pdf', 'Markdown to PDF', PDF, pdi, 'markdown to pdf', 'Strip Markdown formatting and export the text as a PDF.', function () {
    var wrap = el('div');
    var ta = el('textarea', { rows: 8 }); ta.style.width = '100%'; ta.value = '# Title\n\n- point one\n- point two\n\n**Bold** and *italic* text.';
    wrap.appendChild(field('Markdown', ta));
    var btn = el('button', { class: 'btn', type: 'button' }); btn.textContent = 'Generate PDF';
    wrap.appendChild(btn);
    btn.addEventListener('click', function () { var t = ta.value.replace(/^#{1,6}\s+/gm, '').replace(/\*\*|\*|`|_/g, '').replace(/^[-*]\s+/gm, '\u2022 '); downloadBlob(buildTextPdf(t), 'application/pdf', 'calcsuite-markdown.pdf'); });
    return wrap;
  });
  function imagesToPdfTool(label, fname) {
    return function () {
      var wrap = el('div', { class: 'tool-img' });
      var file = el('input', { type: 'file', accept: 'image/*' }); file.multiple = true;
      wrap.appendChild(field(label, file));
      var info = el('div', { class: 'calc-note' }); info.innerHTML = 'Select one or more images. They are placed one per A4-style page (processed locally).';
      var btn = el('button', { class: 'btn', type: 'button' }); btn.textContent = 'Create PDF'; btn.disabled = true;
      var imgs = [];
      wrap.appendChild(info); wrap.appendChild(btn);
      file.addEventListener('change', function (e) { imgs = []; var files = Array.prototype.slice.call(e.target.files || []); var loaded = 0; if (!files.length) return; files.forEach(function (f, idx) { var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0); imgs[idx] = { data: cv.toDataURL('image/jpeg', 0.9), w: im.width, h: im.height }; if (++loaded === files.length) { btn.disabled = false; info.innerHTML = files.length + ' image(s) ready. Click "Create PDF".'; } }; im.src = rd.result; }; rd.readAsDataURL(f); }); });
      btn.addEventListener('click', function () { if (!imgs.length) return; downloadBlob(buildImagePdf(imgs), 'application/pdf', fname); });
      return wrap;
    };
  }
  function buildImagePdf(imgs) {
    var pageW = 595, pageH = 842, margin = 30; // A4 in points
    var objs = [], imgObjNums = [], contentNums = [], pageNums = [];
    function pushObj(s) { objs.push(s); return objs.length; }
    // We need binary image objects; collect their raw bytes separately.
    var binaries = {}; // objNum -> {header, bytes}
    imgs.forEach(function (im) {
      var b64 = im.data.split(',')[1];
      var bin = atob(b64);
      var num = objs.length + 1; objs.push(null); // placeholder for image object
      binaries[num] = { w: im.w, h: im.h, bin: bin };
      imgObjNums.push(num);
    });
    var fontObj = pushObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    imgs.forEach(function (im, i) {
      var iw = im.w, ih = im.h; var scale = Math.min((pageW - margin * 2) / iw, (pageH - margin * 2) / ih, 1); var dw = iw * scale, dh = ih * scale; var dx = (pageW - dw) / 2, dy = (pageH - dh) / 2;
      var stream = 'q ' + dw.toFixed(2) + ' 0 0 ' + dh.toFixed(2) + ' ' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ' cm /Im' + i + ' Do Q';
      var cnum = pushObj('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'); contentNums.push(cnum);
    });
    imgs.forEach(function (im, i) { var pnum = pushObj('<< /Type /Page /Parent PARENT 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << /Im' + i + ' ' + imgObjNums[i] + ' 0 R >> /Font << /F1 ' + fontObj + ' 0 R >> >> /Contents ' + contentNums[i] + ' 0 R >>'); pageNums.push(pnum); });
    var pagesObj = pushObj('<< /Type /Pages /Kids [' + pageNums.map(function (k) { return k + ' 0 R'; }).join(' ') + '] /Count ' + pageNums.length + ' >>');
    for (var k = 0; k < objs.length; k++) { if (objs[k] != null) objs[k] = objs[k].replace('PARENT', pagesObj); }
    var catalog = pushObj('<< /Type /Catalog /Pages ' + pagesObj + ' 0 R >>');
    // assemble as binary string
    var pdf = '%PDF-1.4\n', offsets = [];
    for (var j = 0; j < objs.length; j++) {
      offsets.push(pdf.length); var n = j + 1;
      if (binaries[n]) { var b = binaries[n]; pdf += n + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + b.w + ' /Height ' + b.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + b.bin.length + ' >>\nstream\n' + b.bin + '\nendstream\nendobj\n'; }
      else { pdf += n + ' 0 obj\n' + objs[j] + '\nendobj\n'; }
    }
    var xrefPos = pdf.length;
    pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach(function (off) { pdf += ('0000000000' + off).slice(-10) + ' 00000 n \n'; });
    pdf += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + catalog + ' 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';
    // convert to byte array to preserve binary JPEG data
    var bytes = new Uint8Array(pdf.length); for (var p = 0; p < pdf.length; p++) bytes[p] = pdf.charCodeAt(p) & 0xff; return bytes;
  }
  T('images-to-pdf', 'Images to PDF', PDF, pdi, 'images to pdf, jpg to pdf, png to pdf', 'Combine multiple images (JPG, PNG, WebP) into a single PDF \u2013 one image per page.', imagesToPdfTool('Choose images', 'calcsuite-images.pdf'), [{ q: 'Are my images uploaded?', a: 'No. The PDF is built entirely in your browser; your images never leave your device.' }]);
  T('jpg-to-pdf', 'JPG to PDF', PDF, pdi, 'jpg to pdf, jpeg to pdf', 'Convert JPG/JPEG images into a single downloadable PDF.', imagesToPdfTool('Choose JPG images', 'calcsuite-jpg.pdf'));
  T('png-to-pdf', 'PNG to PDF', PDF, pdi, 'png to pdf', 'Convert PNG images into a single downloadable PDF.', imagesToPdfTool('Choose PNG images', 'calcsuite-png.pdf'));

  if (isNode) module.exports = SEO;
})(typeof window !== 'undefined' ? window : globalThis);
