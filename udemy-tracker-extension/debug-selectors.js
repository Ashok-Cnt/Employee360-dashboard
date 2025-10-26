// DEBUG SCRIPT - Run this in the browser console (F12) on Udemy course page
// This will help us find the correct selectors for sections

console.log('🔍 DEBUGGING UDEMY SECTION SELECTORS...\n');

// Test 1: Find section containers
console.log('=== TEST 1: Section Container Selectors ===');
const selectors = [
  'div[data-purpose="curriculum-section-container"]',
  'section[data-purpose="curriculum-section"]',
  '.curriculum-section',
  '[class*="accordion-panel-module--panel"]',
  'div[class*="accordion-panel"]',
  '[class*="curriculum-section"]'
];

selectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} found`);
  if (elements.length > 0) {
    console.log('  First element:', elements[0]);
  }
});

// Test 2: Find section headings
console.log('\n=== TEST 2: Section Heading Selectors ===');
const headingSelectors = [
  'h3.ud-accordion-panel-heading',
  'h3[class*="accordion-panel-heading"]',
  '[data-purpose="curriculum-section-title"]',
  '.ud-accordion-panel-heading',
  'button[class*="accordion-panel-title"]',
  '.section-title',
  'button[aria-expanded]'
];

headingSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} found`);
  if (elements.length > 0) {
    console.log('  First text:', elements[0].textContent.substring(0, 100));
  }
});

// Test 3: Show all section titles
console.log('\n=== TEST 3: All Section Titles ===');
const allHeadings = document.querySelectorAll('h3.ud-accordion-panel-heading, [data-purpose="curriculum-section-title"], button[class*="section"]');
console.log(`Total headings found: ${allHeadings.length}`);
Array.from(allHeadings).slice(0, 5).forEach((el, i) => {
  console.log(`${i + 1}. ${el.textContent.trim().substring(0, 80)}`);
});

// Test 4: Check DOM structure
console.log('\n=== TEST 4: DOM Structure Analysis ===');
const curriculum = document.querySelector('[data-purpose="course-curriculum"]') || 
                   document.querySelector('.curriculum') ||
                   document.querySelector('[class*="curriculum"]');
                   
if (curriculum) {
  console.log('Found curriculum container:', curriculum);
  console.log('Direct children:', curriculum.children.length);
  console.log('First child classes:', curriculum.children[0]?.className);
} else {
  console.log('❌ No curriculum container found!');
}

// Test 5: Find accordion panels
console.log('\n=== TEST 5: Accordion Panel Detection ===');
const accordions = document.querySelectorAll('[class*="accordion"]');
console.log(`Total accordion elements: ${accordions.length}`);

// Show unique class names
const classNames = new Set();
accordions.forEach(el => {
  el.className.split(' ').forEach(cls => {
    if (cls.includes('accordion')) {
      classNames.add(cls);
    }
  });
});
console.log('Unique accordion classes:', Array.from(classNames));

// Test 6: Find expanded/collapsed indicators
console.log('\n=== TEST 6: Expansion State Detection ===');
const expandButtons = document.querySelectorAll('button[aria-expanded]');
console.log(`Buttons with aria-expanded: ${expandButtons.length}`);
let expanded = 0, collapsed = 0;
expandButtons.forEach(btn => {
  if (btn.getAttribute('aria-expanded') === 'true') expanded++;
  else collapsed++;
});
console.log(`  Expanded: ${expanded}, Collapsed: ${collapsed}`);

console.log('\n✅ Debug complete! Share these results.');
