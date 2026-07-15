// Prevent flash of wrong theme by applying .dark class synchronously
try {
  if (JSON.parse(localStorage.getItem('eims_dark_mode'))) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}

// Prevent flash of wrong text size by applying the root font-size synchronously
// (keep these values in sync with TextSizeContext's FONT_SIZES)
try {
  var eimsTextSize = localStorage.getItem('eims_text_size');
  var eimsFontSizes = { medium: '112.5%', large: '125%' };
  if (eimsTextSize && eimsFontSizes[eimsTextSize]) {
    document.documentElement.style.fontSize = eimsFontSizes[eimsTextSize];
  }
} catch (e) {}
