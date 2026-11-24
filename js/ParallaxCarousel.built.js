(function () {
const { useEffect, useRef } = window.React;
const THREE = window.THREE;
const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTexAspect;   // 图片宽高比
uniform float uPlaneAspect; // 平面宽高比
uniform float uShift;       // UV 视差横向偏移 (-1..1 之间微调)
uniform float uScale;       // 内纹理缩放 (<1 留出视差空间)
uniform float uRadius;      // 圆角(UV 空间, 按平面比例近似)
uniform vec3  uAccent;
uniform float uBorder;      // 描边宽度(UV)
uniform float uDim;         // 离中心的暗化 0..1

vec2 coverUv(vec2 uv) {
  // object-fit: cover：按平面/图片宽高比裁切 UV
  vec2 s = vec2(1.0);
  if (uTexAspect > uPlaneAspect) {
    s.x = uPlaneAspect / uTexAspect;
  } else {
    s.y = uTexAspect / uPlaneAspect;
  }
  return (uv - 0.5) * s + 0.5;
}

float roundedBoxSDF(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  // 先缩放内纹理，再叠加视差偏移
  vec2 uv = (vUv - 0.5) / uScale + 0.5;
  uv.x += uShift;
  uv = coverUv(uv);
  // 越界部分不采样（uvScale<1 时边缘留白，用背景色）
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec4 tex = texture2D(uTex, uv);
  tex.rgb *= (1.0 - uDim * 0.35);

  // 圆角 + 描边（在平面 UV 空间算，p 中心为 0）
  vec2 p = vUv - 0.5;
  // 把 X 按比例换算，使圆角在屏幕上是正圆
  p.x *= uPlaneAspect;
  vec2 b = vec2(0.5 * uPlaneAspect, 0.5);
  float d = roundedBoxSDF(p, b, uRadius);
  float aa = 0.004;
  float inside = 1.0 - smoothstep(-aa, aa, d);
  // 描边：只取边界内 [-uBorder, 0] 这条窄带（d 越接近 0 越靠边）
  float border = smoothstep(-uBorder - aa, -uBorder + aa, d) * inside;

  vec3 col = mix(tex.rgb, uAccent, border * 0.95);
  gl_FragColor = vec4(col, inside);
}
`;
function hexToRgb(hex) {
  const h = String(hex || '#E6B422').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
function ParallaxCarousel({
  images = [],
  captions = [],
  imageWidth = 300,
  imageHeight = 400,
  gap = 26,
  parallaxIntensity = 0.4,
  uvScale = 0.85,
  lerp = 0.09,
  wheelSensitivity = 1,
  dragSensitivity = 1.4,
  loop = false,
  borderRadius = 14,
  autoplaySpeed = 0,
  pauseOnHover = true,
  showProgress = true,
  className = '',
  accent = '#E6B422'
}) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !images.length) return;
    let renderer,
      scene,
      camera,
      raf = 0,
      alive = true;
    let meshes = [],
      textures = [],
      materials = [],
      geos = [];
    let W = 0,
      H = 0;
    let target = 0,
      current = 0,
      maxScroll = 0,
      minScroll = 0;
    let dragging = false,
      dragStartX = 0,
      dragStartScroll = 0,
      hovered = false;
    let lastT = performance.now(),
      autoAccum = 0;
    const step = imageWidth + gap;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab;';
    host.appendChild(canvas);
    let bar, barFill, capEl;
    if (showProgress) {
      bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:min(70%,360px);height:4px;border-radius:4px;background:rgba(62,39,35,.14);overflow:hidden;pointer-events:none;';
      barFill = document.createElement('div');
      barFill.style.cssText = 'height:100%;width:0%;border-radius:4px;background:' + accent + ';transition:width .08s linear;';
      bar.appendChild(barFill);
      host.appendChild(bar);
    }
    if (captions && captions.length) {
      capEl = document.createElement('div');
      capEl.style.cssText = 'position:absolute;left:50%;bottom:30px;transform:translateX(-50%);font-size:12px;letter-spacing:1px;color:#6b5747;font-weight:700;white-space:nowrap;pointer-events:none;';
      host.appendChild(capEl);
    }
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const loader = new THREE.TextureLoader();
    const accentRgb = hexToRgb(accent);
    const pw = imageWidth,
      ph = imageHeight;
    function buildMeshes() {
      images.forEach(function (src, i) {
        const geo = new THREE.PlaneGeometry(pw, ph);
        geos.push(geo);
        const mat = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          uniforms: {
            uTex: {
              value: null
            },
            uTexAspect: {
              value: 1
            },
            uPlaneAspect: {
              value: pw / ph
            },
            uShift: {
              value: 0
            },
            uScale: {
              value: uvScale
            },
            uRadius: {
              value: borderRadius / Math.min(pw, ph)
            },
            uAccent: {
              value: new THREE.Vector3(accentRgb[0], accentRgb[1], accentRgb[2])
            },
            uBorder: {
              value: 0.012
            },
            uDim: {
              value: 0
            }
          }
        });
        materials.push(mat);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.index = i;
        scene.add(mesh);
        meshes.push(mesh);
        loader.load(src, function (tex) {
          if (!alive) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          textures.push(tex);
          mat.uniforms.uTex.value = tex;
          mat.uniforms.uTexAspect.value = tex.image.width / tex.image.height;
          renderOnce();
        });
      });
    }
    function resize() {
      const rect = host.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      renderer.setSize(W, H, false);
      camera.left = -W / 2;
      camera.right = W / 2;
      camera.top = H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
      const total = images.length * step - gap;
      maxScroll = 0;
      minScroll = Math.min(0, W - total);
      if (!loop && current < minScroll) current = target = minScroll;
      if (!loop && current > maxScroll) current = target = maxScroll;
      layout();
      renderOnce();
    }
    function wrapScroll(s) {
      if (!loop) return s;
      const span = images.length * step;
      if (span <= 0) return s;
      s = (s % span + span) % span;
      return s;
    }
    function layout() {
      const N = images.length;
      const totalWidth = N * step - gap;
      const span = N * step;
      let centerIndex = 0,
        centerDist = Infinity;
      meshes.forEach(function (mesh, i) {
        let x;
        if (loop) {
          let logical = ((i * step + current) % span + span) % span;
          x = logical - (W / 2 + step);
          const rightMost = (N - 1) * step - (W / 2 + step);
          if (rightMost + pw < W / 2 && logical < step) x += span;
        } else {
          x = -W / 2 + pw / 2 + 40 - current + i * step;
          if (minScroll < 0 && current <= minScroll) x = -totalWidth + gap + pw / 2 + i * step + (W / 2 - pw / 2);
        }
        const distCenter = Math.abs(x);
        if (distCenter < centerDist) {
          centerDist = distCenter;
          centerIndex = i;
        }
        mesh.position.x = x;
        mesh.position.y = 0;
        const dist = x / (W / 2);
        const clampDist = Math.max(-1.4, Math.min(1.4, dist));
        mesh.material.uniforms.uShift.value = clampDist * parallaxIntensity * (uvScale > 0 ? 1 - uvScale : 0.15);
        mesh.material.uniforms.uDim.value = Math.min(1, Math.abs(clampDist));
        const sc = 1 - Math.min(0.12, Math.abs(clampDist) * 0.08);
        mesh.scale.setScalar(sc);
      });
      if (barFill) {
        const p = minScroll < 0 ? (current - minScroll) / (maxScroll - minScroll) : 0;
        barFill.style.width = (loop ? 100 : Math.max(4, Math.min(100, p * 100))) + '%';
      }
      if (capEl) {
        capEl.textContent = captions[centerIndex] || '';
      }
    }
    function renderOnce() {
      if (!alive || !renderer) return;
      layout();
      renderer.render(scene, camera);
    }
    function tick(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (autoplaySpeed && !(pauseOnHover && hovered) && !dragging) {
        target -= autoplaySpeed * dt;
      }
      if (!loop) target = Math.max(minScroll, Math.min(maxScroll, target));
      current += (target - current) * Math.min(1, lerp * 60 * dt + lerp);
      layout();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    function onWheel(e) {
      e.preventDefault();
      target -= e.deltaY * 0.6 * wheelSensitivity + e.deltaX * wheelSensitivity;
      if (!loop) target = Math.max(minScroll, Math.min(maxScroll, target));
    }
    function onDown(e) {
      dragging = true;
      dragStartX = e.clientX;
      dragStartScroll = target;
      canvas.style.cursor = 'grabbing';
      if (canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    }
    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      target = dragStartScroll - dx * dragSensitivity;
      if (!loop) target = Math.max(minScroll, Math.min(maxScroll, target));
    }
    function onUp() {
      dragging = false;
      canvas.style.cursor = 'grab';
    }
    function onEnter() {
      hovered = true;
    }
    function onLeave() {
      hovered = false;
      if (dragging) onUp();
    }
    canvas.addEventListener('wheel', onWheel, {
      passive: false
    });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (!raf) {
            lastT = performance.now();
            raf = requestAnimationFrame(tick);
          }
        } else {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      });
    });
    io.observe(host);
    buildMeshes();
    resize();
    return function () {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
      geos.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      textures.forEach(t => t.dispose());
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
      if (capEl && capEl.parentNode) capEl.parentNode.removeChild(capEl);
    };
  }, [images, imageWidth, imageHeight, gap, parallaxIntensity, uvScale, lerp, wheelSensitivity, dragSensitivity, loop, borderRadius, autoplaySpeed, pauseOnHover, showProgress, accent]);
  return React.createElement("div", {
    ref: hostRef,
    className: 'parallax-carousel ' + className,
    style: {
      position: 'absolute',
      inset: 0
    }
  });
}
window.ReactBitsParallaxCarousel = ParallaxCarousel;
})();
