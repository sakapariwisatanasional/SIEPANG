import fs from 'fs';
import { PNG } from 'pngjs';

const width = 512;
const height = 512;
const png = new PNG({ width, height });

// Fill transparent or soft radial glow
function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (width * y + x) << 2;
  // Alpha blend
  const prevA = png.data[idx + 3] / 255;
  const newA = a / 255;
  const outA = newA + prevA * (1 - newA);
  if (outA > 0) {
    png.data[idx] = Math.round((r * newA + png.data[idx] * prevA * (1 - newA)) / outA);
    png.data[idx + 1] = Math.round((g * newA + png.data[idx + 1] * prevA * (1 - newA)) / outA);
    png.data[idx + 2] = Math.round((b * newA + png.data[idx + 2] * prevA * (1 - newA)) / outA);
    png.data[idx + 3] = Math.round(outA * 255);
  }
}

function fillCircle(cx, cy, r, color, alpha = 255) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d2 <= r2) {
        // antialiased edge
        const dist = Math.sqrt(d2);
        let a = alpha;
        if (r - dist < 1.5) {
          a = Math.round(alpha * Math.max(0, (r - dist) / 1.5));
        }
        setPixel(x, y, color[0], color[1], color[2], a);
      }
    }
  }
}

function fillEllipse(cx, cy, rx, ry, color, alpha = 255, angle = 0) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const maxR = Math.max(rx, ry);
  for (let y = Math.floor(cy - maxR); y <= Math.ceil(cy + maxR); y++) {
    for (let x = Math.floor(cx - maxR); x <= Math.ceil(cx + maxR); x++) {
      const dx = x - cx;
      const dy = y - cy;
      const nx = (dx * cos + dy * sin) / rx;
      const ny = (-dx * sin + dy * cos) / ry;
      const d = nx * nx + ny * ny;
      if (d <= 1) {
        let a = alpha;
        if (1 - Math.sqrt(d) < 0.05) {
          a = Math.round(alpha * Math.max(0, (1 - Math.sqrt(d)) / 0.05));
        }
        setPixel(x, y, color[0], color[1], color[2], a);
      }
    }
  }
}

function fillRect(x0, y0, w, h, color, alpha = 255) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(x, y, color[0], color[1], color[2], alpha);
    }
  }
}

// 1. Soft glowing backdrop
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const d = Math.hypot(x - 256, y - 260);
    if (d < 230) {
      const g = (1 - d / 230);
      setPixel(x, y, 255, 237, 213, Math.round(g * 60)); // soft amber glow
    }
  }
}

// 2. Red Butterfly Wings (Left & Right)
// Upper Left Wing
fillEllipse(155, 245, 95, 75, [220, 38, 38], 240, -0.45);
fillEllipse(165, 240, 70, 50, [248, 113, 113], 240, -0.45);
fillEllipse(170, 235, 30, 20, [254, 240, 138], 220, -0.45); // yellow wing spot

// Lower Left Wing
fillEllipse(170, 325, 70, 50, [185, 28, 28], 230, -0.2);
fillEllipse(175, 320, 50, 35, [239, 68, 68], 230, -0.2);
fillEllipse(180, 320, 20, 14, [254, 240, 138], 200, -0.2);

// Upper Right Wing
fillEllipse(357, 245, 95, 75, [220, 38, 38], 240, 0.45);
fillEllipse(347, 240, 70, 50, [248, 113, 113], 240, 0.45);
fillEllipse(342, 235, 30, 20, [254, 240, 138], 220, 0.45); // yellow wing spot

// Lower Right Wing
fillEllipse(342, 325, 70, 50, [185, 28, 28], 230, 0.2);
fillEllipse(337, 320, 50, 35, [239, 68, 68], 230, 0.2);
fillEllipse(332, 320, 20, 14, [254, 240, 138], 200, 0.2);

// 3. Scout Hat Antennas (Bug antennas on explorer hat)
// Left antenna
for (let t = 0; t <= 45; t++) {
  const ax = 220 - t * 1.3 - Math.sin(t * 0.1) * 6;
  const ay = 135 - t * 1.5;
  fillCircle(ax, ay, 3.5, [180, 25, 25], 255);
}
fillCircle(160, 68, 10, [234, 179, 8], 255); // golden tip antenna
fillCircle(158, 65, 3, [255, 255, 255], 240); // highlight

// Right antenna
for (let t = 0; t <= 45; t++) {
  const ax = 292 + t * 1.3 + Math.sin(t * 0.1) * 6;
  const ay = 135 - t * 1.5;
  fillCircle(ax, ay, 3.5, [180, 25, 25], 255);
}
fillCircle(352, 68, 10, [234, 179, 8], 255); // golden tip antenna
fillCircle(350, 65, 3, [255, 255, 255], 240);

// 4. Scout Uniform Body (Coklat Muda Pramuka)
fillEllipse(256, 370, 75, 80, [214, 180, 140], 255); // shirt
fillEllipse(256, 440, 65, 45, [110, 75, 45], 255); // dark brown scout belt/shorts

// Scout Belt
fillRect(210, 415, 92, 14, [60, 40, 25]);
fillCircle(256, 422, 9, [234, 179, 8]); // brass scout buckle
fillCircle(256, 422, 6, [202, 138, 4]);

// Indonesian Flag Patch on right chest (left side for viewer)
fillRect(215, 360, 20, 6, [220, 38, 38]);
fillRect(215, 366, 20, 6, [255, 255, 255]);

// Pocket buttons
fillCircle(225, 385, 4, [140, 100, 65]);
fillCircle(287, 385, 4, [140, 100, 65]);

// 5. Scout Boy Head & Face
// Ears
fillCircle(188, 220, 20, [247, 198, 164], 255);
fillCircle(188, 220, 12, [235, 175, 140], 255);
fillCircle(324, 220, 20, [247, 198, 164], 255);
fillCircle(324, 220, 12, [235, 175, 140], 255);

// Face oval
fillEllipse(256, 222, 68, 64, [254, 215, 185], 255);
// Chubby cheeks glow
fillCircle(215, 240, 18, [244, 140, 140], 70);
fillCircle(297, 240, 18, [244, 140, 140], 70);

// Big Cute 3D Pixar Eyes
// Eye whites
fillEllipse(226, 210, 18, 22, [255, 255, 255], 255);
fillEllipse(286, 210, 18, 22, [255, 255, 255], 255);
// Big warm brown pupils
fillCircle(227, 210, 13, [50, 25, 12], 255);
fillCircle(285, 210, 13, [50, 25, 12], 255);
// Iris warm amber ring
fillCircle(228, 211, 8, [120, 60, 20], 255);
fillCircle(284, 211, 8, [120, 60, 20], 255);
// Eye sparkle highlights
fillCircle(223, 204, 5, [255, 255, 255], 255);
fillCircle(229, 215, 2.5, [255, 255, 255], 220);
fillCircle(281, 204, 5, [255, 255, 255], 255);
fillCircle(287, 215, 2.5, [255, 255, 255], 220);

// Cute Button Nose
fillEllipse(256, 230, 6, 4.5, [235, 160, 130], 255);

// Happy Smile
fillEllipse(256, 250, 20, 14, [160, 30, 40], 255);
fillEllipse(256, 246, 17, 7, [255, 255, 255], 255); // cute top teeth
fillEllipse(256, 254, 12, 6, [244, 114, 182], 255); // tongue

// Friendly Scout Eyebrows
fillEllipse(225, 183, 14, 4, [110, 60, 25], 255, -0.15);
fillEllipse(287, 183, 14, 4, [110, 60, 25], 255, 0.15);

// Brown boy hair fringe
fillEllipse(256, 168, 62, 22, [90, 50, 20], 255);
fillCircle(240, 175, 16, [90, 50, 20], 255);
fillCircle(272, 175, 16, [90, 50, 20], 255);

// 6. Scout Hat (Red / Coklat Pramuka Explorer Hat with Brim)
// Hat brim
fillEllipse(256, 150, 105, 30, [160, 30, 30], 255);
fillEllipse(256, 152, 98, 22, [190, 40, 40], 255);
// Hat crown
fillEllipse(256, 122, 62, 45, [185, 28, 28], 255);
// Hat band
fillRect(200, 138, 112, 10, [120, 80, 40]);
// Golden Pramuka Fleur-de-lis / Scout Emblem on hat
fillCircle(256, 132, 12, [245, 190, 30]);
fillCircle(256, 132, 8, [217, 119, 6]);

// 7. Red & White Neckerchief (Kacu / Hasduk Pramuka)
// White collar base
fillEllipse(256, 288, 45, 16, [255, 255, 255], 255);
// Red neckerchief folds
fillEllipse(236, 298, 26, 16, [220, 38, 38], 255, -0.3);
fillEllipse(276, 298, 26, 16, [220, 38, 38], 255, 0.3);
fillEllipse(236, 306, 18, 12, [255, 255, 255], 255, -0.3);
fillEllipse(276, 306, 18, 12, [255, 255, 255], 255, 0.3);
// Golden Hasduk Ring (Cincin Kacu Rotan/Logam)
fillCircle(256, 308, 12, [234, 179, 8]);
fillCircle(256, 308, 7, [180, 83, 9]);

// Neckerchief tails
for (let y = 315; y <= 355; y++) {
  const w = (355 - y) * 0.45;
  fillRect(Math.floor(256 - w), y, Math.ceil(w * 2), 1, [220, 38, 38]);
  fillRect(Math.floor(256 - w * 0.5), y, Math.ceil(w), 1, [255, 255, 255]);
}

// 8. Hands & Smartphone with "Si-EPANG"
// Right arm & hand holding phone
fillEllipse(318, 375, 22, 38, [214, 180, 140], 255, 0.35);
// Phone body
fillRect(315, 335, 46, 75, [30, 41, 59]);
// Phone screen (vibrant amber / red pramuka)
fillRect(318, 340, 40, 65, [185, 28, 28]);
fillRect(321, 345, 34, 18, [245, 190, 30]); // Header app screen
// Mini scout fleur-de-lis on screen
fillCircle(338, 354, 5, [185, 28, 28]);
// Screen QR code mini graphic
fillRect(326, 372, 24, 24, [255, 255, 255]);
fillRect(329, 375, 6, 6, [30, 41, 59]);
fillRect(341, 375, 6, 6, [30, 41, 59]);
fillRect(329, 387, 6, 6, [30, 41, 59]);
fillRect(337, 383, 4, 4, [30, 41, 59]);

// Chubby Scout Fingers holding phone
fillCircle(315, 370, 7, [254, 215, 185]);
fillCircle(315, 382, 7, [254, 215, 185]);
fillCircle(316, 394, 7, [254, 215, 185]);
fillCircle(348, 375, 6, [254, 215, 185]);

// Left hand giving friendly thumbs up / waving
fillEllipse(194, 375, 22, 38, [214, 180, 140], 255, -0.35);
fillCircle(182, 350, 14, [254, 215, 185]); // hand
fillEllipse(176, 338, 7, 12, [254, 215, 185], 255, -0.3); // thumb up

// 9. Floating spark / star accents
function drawSpark(cx, cy, r, color) {
  fillEllipse(cx, cy, r, r * 0.28, color);
  fillEllipse(cx, cy, r * 0.28, r, color);
}
drawSpark(135, 140, 14, [250, 204, 21]);
drawSpark(380, 150, 16, [250, 204, 21]);
drawSpark(395, 385, 12, [250, 204, 21]);
drawSpark(120, 360, 10, [250, 204, 21]);

// Write file
const buffer = PNG.sync.write(png);
fs.writeFileSync('public/Maskot.png', buffer);
fs.writeFileSync('public/MASKOT.png', buffer);
console.log('Mascot generated successfully to public/Maskot.png and public/MASKOT.png!');
