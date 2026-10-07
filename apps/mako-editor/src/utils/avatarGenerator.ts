/**
 * Avatar Generator — Built-in SVG avatar overlays
 * Renders emoji-based avatar characters with optional text bubbles.
 * These are NOT AI-generated — they are pre-built character overlays.
 */
import type { AvatarConfig, AvatarStyle } from '../types';

const AVATAR_EMOJIS: Record<AvatarStyle, string> = {
  'cartoon-boy': '👦',
  'cartoon-girl': '👧',
  'cat': '🐱',
  'dog': '🐶',
  'robot': '🤖',
  'alien': '👽',
  'ninja': '🥷',
  'pirate': '🏴‍☠️',
  'wizard': '🧙',
  'superhero': '🦸',
};

/**
 * Render an avatar to a canvas context.
 */
export function renderAvatarToCanvas(
  ctx: CanvasRenderingContext2D,
  avatar: AvatarConfig,
  canvasWidth: number,
  canvasHeight: number,
  currentTime: number
): void {
  // Check if avatar is active at current time
  if (currentTime < avatar.startTime || currentTime > avatar.startTime + avatar.duration) return;

  const emoji = AVATAR_EMOJIS[avatar.style] || '🎭';
  const x = (avatar.position.x / 100) * canvasWidth;
  const y = (avatar.position.y / 100) * canvasHeight;
  const size = 64 * avatar.scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((avatar.rotation * Math.PI) / 180);

  // Draw avatar emoji
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);

  // Draw text bubble if present
  if (avatar.text) {
    const bubbleY = -size * 0.7;
    ctx.font = `bold ${Math.max(12, size * 0.25)}px Inter, sans-serif`;
    const metrics = ctx.measureText(avatar.text);
    const padding = 8;
    const bw = metrics.width + padding * 2;
    const bh = size * 0.35;

    // Bubble background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    const radius = 8;
    ctx.moveTo(-bw / 2 + radius, bubbleY - bh / 2);
    ctx.lineTo(bw / 2 - radius, bubbleY - bh / 2);
    ctx.quadraticCurveTo(bw / 2, bubbleY - bh / 2, bw / 2, bubbleY - bh / 2 + radius);
    ctx.lineTo(bw / 2, bubbleY + bh / 2 - radius);
    ctx.quadraticCurveTo(bw / 2, bubbleY + bh / 2, bw / 2 - radius, bubbleY + bh / 2);
    // Pointer
    ctx.lineTo(4, bubbleY + bh / 2);
    ctx.lineTo(0, bubbleY + bh / 2 + 8);
    ctx.lineTo(-4, bubbleY + bh / 2);
    ctx.lineTo(-bw / 2 + radius, bubbleY + bh / 2);
    ctx.quadraticCurveTo(-bw / 2, bubbleY + bh / 2, -bw / 2, bubbleY + bh / 2 - radius);
    ctx.lineTo(-bw / 2, bubbleY - bh / 2 + radius);
    ctx.quadraticCurveTo(-bw / 2, bubbleY - bh / 2, -bw / 2 + radius, bubbleY - bh / 2);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(avatar.text, 0, bubbleY);
  }

  ctx.restore();
}

/**
 * Get the emoji for an avatar style.
 */
export function getAvatarEmoji(style: AvatarStyle): string {
  return AVATAR_EMOJIS[style] || '🎭';
}
