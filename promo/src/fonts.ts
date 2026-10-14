import { loadFont as loadOutfit } from '@remotion/google-fonts/Outfit'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'

// Loaded once at import time; Remotion waits for the fonts before rendering a frame.
loadOutfit('normal', { weights: ['600', '700', '800'], subsets: ['latin'] })
loadInter('normal', { weights: ['400', '500', '600'], subsets: ['latin'] })
loadMono('normal', { weights: ['500', '600'], subsets: ['latin'] })
