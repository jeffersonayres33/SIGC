import sigconLogoImg from '../assets/logo.jpeg';

/**
 * Robust logo asset URL resolution for Vite, AI Studio Preview, and GitHub Pages.
 * Importing the asset directly guarantees Vite will hash it, bundle it into the dist/assets folder,
 * and prefix the exact base URL (relative './' or subpath '/<repo>/') configured in vite.config.ts.
 */
export const SIGCON_LOGO = sigconLogoImg;
