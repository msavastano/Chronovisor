import { TravelResult } from '../types';

export const generateSouvenir = async (result: TravelResult): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Set canvas dimensions (High quality)
    canvas.width = 1920;
    canvas.height = 1080;

    // Background (Black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // If we have a valid image URL
    if (result.imageUrl) {
        img.onload = () => {
            drawComposition(ctx, img, result);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            // If image fails, draw anyway (text only)
            drawComposition(ctx, null, result);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = result.imageUrl;
    } else {
        // No image provided
        drawComposition(ctx, null, result);
        resolve(canvas.toDataURL('image/png'));
    }
  });
};

const drawComposition = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, result: TravelResult) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // 1. Draw Main Image
    if (img) {
        // Calculate aspect ratio to cover
        const scale = Math.max(width / img.width, height / img.height);
        const x = (width / 2) - (img.width / 2) * scale;
        const y = (height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } else {
        // Fallback pattern if no image
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);
        ctx.font = 'bold 100px monospace';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.fillText('NO VISUAL FEED', width / 2, height / 2);
    }

    // 2. Add "Scanlines" effect (semi-transparent)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
    }

    // 3. Vignette / Darken edges
    const gradient = ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 4. Overlay UI (Bottom Bar)
    const bottomBarHeight = 280;
    const bottomY = height - bottomBarHeight;
    
    // Glass effect background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, bottomY, width, bottomBarHeight);
    
    // Top border of the bar
    ctx.fillStyle = '#06b6d4'; // Cyan
    ctx.fillRect(0, bottomY, width, 4);

    // 5. Text Content
    const pad = 60;
    const textStart = bottomY + pad;

    // Location Title
    let fontSize = 80;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'left';
    
    const titleText = result.locationName.toUpperCase();
    const maxTitleWidth = width - (pad * 2) - 300; // Avoid overlapping with logo area

    // Scale down font if too wide
    let textMetrics = ctx.measureText(titleText);
    while (textMetrics.width > maxTitleWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        textMetrics = ctx.measureText(titleText);
    }

    ctx.fillText(titleText, pad, textStart + 40);
    ctx.shadowBlur = 0; // Reset shadow

    // Date & Time
    const formatTime = (t: any) => {
        const p = (n: number) => n.toString().padStart(2, '0');
        const yearStr = t.year <= 0 ? `${Math.abs(t.year)} BC` : `AD ${t.year}`;
        return `${yearStr} - ${p(t.month)}/${p(t.day)} - ${p(t.hour)}:${p(t.minute)}`;
    };

    ctx.font = '50px "Courier New", monospace';
    ctx.fillStyle = '#06b6d4'; // Cyan text
    ctx.fillText(formatTime(result.time), pad, textStart + 120);

    // Description (Wrap text)
    ctx.font = '30px "Courier New", monospace';
    ctx.fillStyle = '#cbd5e1'; // Slate 300
    const maxTextWidth = width - (pad * 2) - 300; // Leave room for logo
    wrapText(ctx, result.description, pad, textStart + 180, maxTextWidth, 40);

    // 6. Branding / Logo area (Bottom Right)
    const logoSize = 100;
    const logoX = width - pad - 220;
    const logoY = bottomY + (bottomBarHeight - 100) / 2;

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.strokeRect(logoX, logoY, 200, 100);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#06b6d4';
    ctx.textAlign = 'center';
    ctx.fillText("CHRONOVISOR", logoX + 100, logoY + 45);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("OFFICIAL RECORD", logoX + 100, logoY + 75);
};

// Helper to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
}
