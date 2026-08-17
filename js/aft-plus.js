/* ============================================================
 * aft-plus.js  -  advanced client-side tool engine
 * Reads window.__AFT = { kind, title, config } and mounts into #aft-app.
 * Kinds: pdfjpg, pdf2word, pdfcompress, pdfwatermark, pdfpagenum,
 *        pdfdelete, pdfsign, pdfprotect, pdfunlock,
 *        aisum, aiparaphrase, aigrammar, aiexplain,
 *        ocr, bgremove, videocompress, audioconvert
 * All processing is client-side (files never leave the browser),
 * except AI which calls /api/ai (needs an API key set in admin).
 * ============================================================ */
(function () {
  "use strict";
  var A = window.__AFT || {}, K = A.kind || "", CFG = A.config || {};
  var APP = document.getElementById("aft-app");
  if (!APP) return;

  var CDN = {
    pdflib: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
    pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    pdfjsWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    tesseract: "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js",
    ffmpeg: "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"
  };
  var loaded = {};
  function load(url) {
    return new Promise(function (res, rej) {
      if (loaded[url]) return res();
      var s = document.createElement("script"); s.src = url;
      s.onload = function () { loaded[url] = 1; res(); };
      s.onerror = function () { rej(new Error("Failed to load " + url)); };
      document.head.appendChild(s);
    });
  }

  // ---- tiny DOM helpers ----
  function el(t, a, html) { var e = document.createElement(t); if (a) for (var k in a) { if (k === "style") e.style.cssText = a[k]; else if (k === "class") e.className = a[k]; else e.setAttribute(k, a[k]); } if (html != null) e.innerHTML = html; return e; }
  function mk(html) { var d = el("div", null, html); return d; }
  var statusEl;
  function say(msg, kind) { if (!statusEl) return; statusEl.textContent = msg || ""; statusEl.style.color = kind === "err" ? "#c0392b" : kind === "ok" ? "#2e7d32" : "var(--muted,#666)"; }
  function fileInput(accept, multiple) { var i = el("input", { type: "file", accept: accept || "", class: "aft-file" }); if (multiple) i.multiple = true; return i; }
  function button(label) { return el("button", { class: "aft-btn", style: "margin:6px 8px 6px 0" }, label); }
  function download(blob, name) { var u = URL.createObjectURL(blob); var a = el("a", { href: u, download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500); }
  function readAB(file) { return file.arrayBuffer ? file.arrayBuffer() : new Promise(function (r) { var fr = new FileReader(); fr.onload = function () { r(fr.result); }; fr.readAsArrayBuffer(file); }); }

  // shared shell
  function shell(desc) {
    APP.innerHTML = "";
    var wrap = el("div", { class: "aft-plus" });
    if (desc) wrap.appendChild(el("p", { style: "color:var(--muted,#666);margin:0 0 10px" }, desc));
    var body = el("div");
    statusEl = el("div", { class: "aft-status", style: "margin-top:12px;font-size:14px;min-height:20px" });
    wrap.appendChild(body); wrap.appendChild(statusEl);
    APP.appendChild(wrap);
    return body;
  }

  // ================= PDF (pdf-lib) =================
  function pdfLib() { return load(CDN.pdflib).then(function () { return window.PDFLib; }); }
  function pdfJs() { return load(CDN.pdfjs).then(function () { var p = window.pdfjsLib; if (p && p.GlobalWorkerOptions) p.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker; return p; }); }

  function mountPdfWatermark() {
    var b = shell("Add a text watermark to every page of your PDF.");
    var inp = fileInput("application/pdf");
    var txt = el("input", { type: "text", class: "aft-input", placeholder: "Watermark text (e.g. CONFIDENTIAL)", style: "display:block;margin:8px 0;width:100%;max-width:360px" });
    txt.value = "allfreecalculators.in";
    var go = button("Add Watermark & Download");
    b.appendChild(inp); b.appendChild(txt); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err");
      say("Processing...");
      pdfLib().then(function (P) { return readAB(inp.files[0]).then(function (ab) { return P.PDFDocument.load(ab).then(function (doc) {
        return doc.embedFont(P.StandardFonts.HelveticaBold).then(function (font) {
          doc.getPages().forEach(function (pg) { var w = pg.getWidth(), h = pg.getHeight();
            pg.drawText(txt.value || "WATERMARK", { x: w / 2 - 140, y: h / 2, size: 40, font: font, color: P.rgb(0.6, 0.6, 0.6), rotate: P.degrees(45), opacity: 0.35 }); });
          return doc.save();
        });
      }); }); }).then(function (bytes) { download(new Blob([bytes], { type: "application/pdf" }), "watermarked.pdf"); say("Done! Downloaded.", "ok"); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  function mountPdfPagenum() {
    var b = shell("Add page numbers to the bottom of every page.");
    var inp = fileInput("application/pdf"); var go = button("Add Page Numbers & Download");
    b.appendChild(inp); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err"); say("Processing...");
      pdfLib().then(function (P) { return readAB(inp.files[0]).then(function (ab) { return P.PDFDocument.load(ab).then(function (doc) {
        return doc.embedFont(P.StandardFonts.Helvetica).then(function (font) {
          var pages = doc.getPages(); pages.forEach(function (pg, i) { var w = pg.getWidth();
            pg.drawText((i + 1) + " / " + pages.length, { x: w / 2 - 20, y: 20, size: 11, font: font, color: P.rgb(0.3, 0.3, 0.3) }); });
          return doc.save();
        });
      }); }); }).then(function (bytes) { download(new Blob([bytes], { type: "application/pdf" }), "numbered.pdf"); say("Done!", "ok"); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  function mountPdfDelete() {
    var b = shell("Delete pages from a PDF. Enter page numbers to remove (e.g. 2,5,7).");
    var inp = fileInput("application/pdf");
    var pages = el("input", { type: "text", class: "aft-input", placeholder: "Pages to delete e.g. 2,4,6", style: "display:block;margin:8px 0;width:100%;max-width:300px" });
    var go = button("Delete Pages & Download"); b.appendChild(inp); b.appendChild(pages); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err"); say("Processing...");
      var rm = {}; (pages.value || "").split(",").forEach(function (x) { var n = parseInt(x.trim(), 10); if (n) rm[n - 1] = 1; });
      pdfLib().then(function (P) { return readAB(inp.files[0]).then(function (ab) { return P.PDFDocument.load(ab).then(function (src) {
        var out = P.PDFDocument.create(); return out.then ? out : Promise.resolve(out);
      }).then(function () { return P.PDFDocument.load(ab); }).then(function (src) {
        return P.PDFDocument.create().then(function (out) {
          var keep = []; for (var i = 0; i < src.getPageCount(); i++) if (!rm[i]) keep.push(i);
          return out.copyPages(src, keep).then(function (cp) { cp.forEach(function (p) { out.addPage(p); }); return out.save(); });
        });
      }); }); }).then(function (bytes) { download(new Blob([bytes], { type: "application/pdf" }), "edited.pdf"); say("Done!", "ok"); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  function mountPdfToJpg() {
    var b = shell("Convert each PDF page to a JPG image (rendered in your browser).");
    var inp = fileInput("application/pdf"); var go = button("Convert to JPG"); var out = el("div", { style: "margin-top:12px;display:flex;flex-wrap:wrap;gap:10px" });
    b.appendChild(inp); b.appendChild(go); b.appendChild(out);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err"); say("Rendering..."); out.innerHTML = "";
      pdfJs().then(function (pj) { return readAB(inp.files[0]).then(function (ab) { return pj.getDocument({ data: ab }).promise.then(function (pdf) {
        var chain = Promise.resolve();
        for (var i = 1; i <= pdf.numPages; i++) (function (n) { chain = chain.then(function () { return pdf.getPage(n).then(function (page) {
          var vp = page.getViewport({ scale: 2 }); var c = el("canvas"); c.width = vp.width; c.height = vp.height;
          return page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise.then(function () {
            var url = c.toDataURL("image/jpeg", 0.9); var a = el("a", { href: url, download: "page-" + n + ".jpg", style: "display:inline-block" });
            var im = el("img", { src: url, style: "width:120px;border:1px solid #ccc;border-radius:6px" }); a.appendChild(im); out.appendChild(a);
          });
        }); }); })(i);
        return chain.then(function () { say("Done! Click any thumbnail to download.", "ok"); });
      }); }); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  function mountPdfCompress() {
    var b = shell("Compress a PDF by re-rendering pages as optimized JPEG images.");
    var inp = fileInput("application/pdf");
    var q = el("input", { type: "range", min: "30", max: "90", value: "60", style: "vertical-align:middle" });
    var ql = el("span", null, " quality 60% "); q.oninput = function () { ql.textContent = " quality " + q.value + "% "; };
    var go = button("Compress & Download"); b.appendChild(inp); b.appendChild(el("div", { style: "margin:8px 0" })); b.lastChild.appendChild(q); b.lastChild.appendChild(ql); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err"); say("Compressing... (this can take a moment)");
      Promise.all([pdfJs(), pdfLib()]).then(function (r) { var pj = r[0], P = r[1];
        return readAB(inp.files[0]).then(function (ab) { return pj.getDocument({ data: ab.slice(0) }).promise.then(function (pdf) {
          return P.PDFDocument.create().then(function (outDoc) {
            var chain = Promise.resolve();
            for (var i = 1; i <= pdf.numPages; i++) (function (n) { chain = chain.then(function () { return pdf.getPage(n).then(function (page) {
              var vp = page.getViewport({ scale: 1.3 }); var c = el("canvas"); c.width = vp.width; c.height = vp.height;
              return page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise.then(function () {
                var dataUrl = c.toDataURL("image/jpeg", parseInt(q.value, 10) / 100);
                return P.PDFDocument.prototype; }).then(function () {
                var dataUrl = c.toDataURL("image/jpeg", parseInt(q.value, 10) / 100);
                return fetch(dataUrl).then(function (rr) { return rr.arrayBuffer(); }).then(function (jab) {
                  return outDoc.embedJpg(jab).then(function (img) { var pg = outDoc.addPage([c.width, c.height]); pg.drawImage(img, { x: 0, y: 0, width: c.width, height: c.height }); });
                });
              });
            }); }); })(i);
            return chain.then(function () { return outDoc.save(); });
          });
        }); });
      }).then(function (bytes) { download(new Blob([bytes], { type: "application/pdf" }), "compressed.pdf"); say("Done! Downloaded compressed PDF.", "ok"); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  function mountPdfToWord() {
    var b = shell("Extract text from a PDF into an editable Word (.doc) file.");
    var inp = fileInput("application/pdf"); var go = button("Convert to Word"); b.appendChild(inp); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err"); say("Extracting text...");
      pdfJs().then(function (pj) { return readAB(inp.files[0]).then(function (ab) { return pj.getDocument({ data: ab }).promise.then(function (pdf) {
        var chain = Promise.resolve(), all = [];
        for (var i = 1; i <= pdf.numPages; i++) (function (n) { chain = chain.then(function () { return pdf.getPage(n).then(function (pg) { return pg.getTextContent().then(function (tc) { all.push(tc.items.map(function (it) { return it.str; }).join(" ")); }); }); }); })(i);
        return chain.then(function () {
          var htmlDoc = "<html xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body>" + all.map(function (t) { return "<p>" + t.replace(/</g, "&lt;") + "</p>"; }).join("") + "</body></html>";
          download(new Blob(["\ufeff", htmlDoc], { type: "application/msword" }), "converted.doc"); say("Done! Downloaded .doc", "ok");
        });
      }); }); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  function mountPdfSign() {
    var b = shell("Draw your signature and stamp it on the last page of a PDF.");
    var inp = fileInput("application/pdf");
    var c = el("canvas", { style: "border:1px dashed #999;border-radius:8px;display:block;margin:10px 0;touch-action:none;background:#fff" }); c.width = 360; c.height = 120;
    var ctx = c.getContext("2d"); ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#111"; var drawing = false, last = null;
    function pos(e) { var r = c.getBoundingClientRect(); var t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    function start(e) { drawing = true; last = pos(e); e.preventDefault(); }
    function move(e) { if (!drawing) return; var p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; e.preventDefault(); }
    function end() { drawing = false; }
    c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    c.addEventListener("touchstart", start); c.addEventListener("touchmove", move); c.addEventListener("touchend", end);
    var clr = button("Clear"); clr.onclick = function () { ctx.clearRect(0, 0, c.width, c.height); };
    var go = button("Sign PDF & Download");
    b.appendChild(inp); b.appendChild(c); b.appendChild(clr); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err"); say("Signing...");
      var png = c.toDataURL("image/png");
      pdfLib().then(function (P) { return readAB(inp.files[0]).then(function (ab) { return P.PDFDocument.load(ab).then(function (doc) {
        return fetch(png).then(function (r) { return r.arrayBuffer(); }).then(function (pab) { return doc.embedPng(pab).then(function (img) {
          var pg = doc.getPages()[doc.getPageCount() - 1]; pg.drawImage(img, { x: 40, y: 40, width: 180, height: 60 }); return doc.save();
        }); });
      }); }); }).then(function (bytes) { download(new Blob([bytes], { type: "application/pdf" }), "signed.pdf"); say("Done!", "ok"); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  function mountPdfProtect(lock) {
    var b = shell(lock ? "Password-protect (encrypt) a PDF." : "Remove the password from a PDF you can open.");
    var inp = fileInput("application/pdf");
    var pw = el("input", { type: "text", class: "aft-input", placeholder: "Password", style: "display:block;margin:8px 0;width:100%;max-width:260px" });
    var go = button(lock ? "Protect & Download" : "Unlock & Download"); b.appendChild(inp); b.appendChild(pw); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a PDF first.", "err"); if (!pw.value) return say("Enter the password.", "err"); say("Working...");
      import("https://esm.sh/@cantoo/pdf-lib@1.20.1").then(function (P) { return readAB(inp.files[0]).then(function (ab) {
        return P.PDFDocument.load(ab, lock ? {} : { password: pw.value }).then(function (doc) {
          var opts = lock ? { userPassword: pw.value, ownerPassword: pw.value } : {};
          return doc.save(lock ? { encrypt: opts } : {});
        });
      }); }).then(function (bytes) { download(new Blob([bytes], { type: "application/pdf" }), lock ? "protected.pdf" : "unlocked.pdf"); say("Done!", "ok"); })
        .catch(function (e) { say("Could not process: " + e.message + " (needs a modern browser + internet).", "err"); });
    };
  }

  // ================= AI (server proxy) =================
  function mountAi(task, desc) {
    var b = shell(desc + " Powered by AI (requires an API key configured in the admin panel).");
    var ta = el("textarea", { class: "aft-input", rows: "7", placeholder: task === "explain" ? "Paste code here..." : "Paste your text here...", style: "width:100%;box-sizing:border-box" });
    var go = button("Run"); var out = el("textarea", { class: "aft-input", rows: "7", readonly: "readonly", placeholder: "Result...", style: "width:100%;box-sizing:border-box;margin-top:10px" });
    b.appendChild(ta); b.appendChild(go); b.appendChild(out);
    go.onclick = function () {
      if (!ta.value.trim()) return say("Enter some text first.", "err"); say("Thinking...");
      fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: task, text: ta.value }) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.ok && d.result) { out.value = d.result; say("Done!", "ok"); }
          else { out.value = offlineFallback(task, ta.value); say((d && d.error ? d.error : "AI unavailable") + " - showing offline basic result.", "err"); }
        }).catch(function () { out.value = offlineFallback(task, ta.value); say("AI offline - showing basic result.", "err"); });
    };
  }
  function offlineFallback(task, t) {
    if (task === "summarize") { var s = t.replace(/\s+/g, " ").split(/(?<=[.!?])\s/); return s.slice(0, Math.max(2, Math.ceil(s.length * 0.3))).join(" "); }
    if (task === "grammar") { return t.replace(/\s+([,.!?])/g, "$1").replace(/\s{2,}/g, " ").replace(/(^|[.!?]\s+)([a-z])/g, function (m, a, c) { return a + c.toUpperCase(); }).trim(); }
    if (task === "paraphrase") { return t; }
    return "(AI required for a full explanation.)";
  }

  // ================= OCR (tesseract.js) =================
  function mountOcr() {
    var b = shell("Extract text from an image (OCR). Runs fully in your browser.");
    var inp = fileInput("image/*"); var go = button("Extract Text");
    var out = el("textarea", { class: "aft-input", rows: "8", style: "width:100%;box-sizing:border-box;margin-top:10px", placeholder: "Recognized text..." });
    b.appendChild(inp); b.appendChild(go); b.appendChild(out);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose an image first.", "err"); say("Loading OCR engine...");
      load(CDN.tesseract).then(function () { say("Recognizing... (first run downloads a language model)");
        return window.Tesseract.recognize(inp.files[0], "eng", { logger: function (m) { if (m.status === "recognizing text") say("Recognizing... " + Math.round(m.progress * 100) + "%"); } }); })
        .then(function (r) { out.value = r.data.text; say("Done!", "ok"); }).catch(function (e) { say(e.message, "err"); });
    };
  }

  // ================= Background remover (@imgly) =================
  function mountBgRemove() {
    var b = shell("Remove the background from a photo. Runs locally with an AI model (first run downloads it).");
    var inp = fileInput("image/*"); var go = button("Remove Background"); var out = el("div", { style: "margin-top:12px" });
    b.appendChild(inp); b.appendChild(go); b.appendChild(out);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose an image first.", "err"); say("Loading model... (may take a moment)");
      import("https://esm.sh/@imgly/background-removal@1.5.5").then(function (mod) {
        var fn = mod.removeBackground || (mod.default && mod.default.removeBackground) || mod.default;
        return fn(inp.files[0]);
      }).then(function (blob) {
        var url = URL.createObjectURL(blob); out.innerHTML = "";
        out.appendChild(el("img", { src: url, style: "max-width:100%;border-radius:8px;background:repeating-conic-gradient(#eee 0% 25%,#fff 0% 50%) 50%/20px 20px" }));
        var a = el("a", { href: url, download: "no-bg.png", class: "aft-btn", style: "display:inline-block;margin-top:10px" }, "Download PNG"); out.appendChild(a); say("Done!", "ok");
      }).catch(function (e) { say("Could not process: " + e.message, "err"); });
    };
  }

  // ================= Video / Audio (ffmpeg.wasm) =================
  function mountFfmpeg(mode) {
    var isVideo = mode === "video";
    var b = shell(isVideo ? "Compress a video in your browser (MP4)." : "Convert audio between MP3, WAV, OGG, M4A.");
    var inp = fileInput(isVideo ? "video/*" : "audio/*");
    var fmt = el("select", { class: "aft-input", style: "margin:8px 0" });
    (isVideo ? ["mp4 (smaller)", "webm"] : ["mp3", "wav", "ogg", "m4a"]).forEach(function (o) { fmt.appendChild(el("option", null, o)); });
    var go = button(isVideo ? "Compress" : "Convert"); b.appendChild(inp); b.appendChild(fmt); b.appendChild(go);
    go.onclick = function () {
      if (!inp.files[0]) return say("Choose a file first.", "err");
      if (!self.crossOriginIsolated) { say("This tool needs cross-origin isolation (COOP/COEP headers). It will work once the site is deployed with those headers enabled.", "err"); }
      say("Loading engine... (large, first run only)");
      load(CDN.ffmpeg).then(function () {
        var createFFmpeg = window.FFmpeg.createFFmpeg, fetchFile = window.FFmpeg.fetchFile;
        var ff = createFFmpeg({ log: false, corePath: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js" });
        var outName, ext = (fmt.value.split(" ")[0]);
        return ff.load().then(function () { say("Processing..."); return fetchFile(inp.files[0]); }).then(function (data) {
          ff.FS("writeFile", "in", data); outName = "out." + ext;
          var args = isVideo ? ["-i", "in", "-vcodec", "libx264", "-crf", "30", outName] : ["-i", "in", outName];
          return ff.run.apply(ff, args);
        }).then(function () { var out = ff.FS("readFile", outName); download(new Blob([out.buffer]), "output." + ext); say("Done!", "ok"); });
      }).catch(function (e) { say("Could not process: " + e.message, "err"); });
    };
  }

  // ================= dispatch =================
  var map = {
    pdfwatermark: mountPdfWatermark, pdfpagenum: mountPdfPagenum, pdfdelete: mountPdfDelete,
    pdfjpg: mountPdfToJpg, pdfcompress: mountPdfCompress, pdf2word: mountPdfToWord, pdfsign: mountPdfSign,
    pdfprotect: function () { mountPdfProtect(true); }, pdfunlock: function () { mountPdfProtect(false); },
    aisum: function () { mountAi("summarize", "Summarize long text into key points."); },
    aiparaphrase: function () { mountAi("paraphrase", "Rewrite text in fresh wording."); },
    aigrammar: function () { mountAi("grammar", "Fix grammar, spelling and punctuation."); },
    aiexplain: function () { mountAi("explain", "Explain what a piece of code does."); },
    ocr: mountOcr, bgremove: mountBgRemove,
    videocompress: function () { mountFfmpeg("video"); }, audioconvert: function () { mountFfmpeg("audio"); }
  };
  var fn = map[K];
  if (fn) { try { fn(); } catch (e) { APP.innerHTML = "<p style='color:#c0392b'>Tool error: " + e.message + "</p>"; } }
  else { APP.innerHTML = "<p style='color:var(--muted,#888)'>This tool is loading...</p>"; }
})();
