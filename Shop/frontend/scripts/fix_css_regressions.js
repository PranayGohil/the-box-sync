const fs = require('fs');

// Fix Nav.js premiumNavStyles
let navJsPath = 'c:/Projects/TheBoxSync/Shop/frontend/src/layout/nav/Nav.js';
let navJs = fs.readFileSync(navJsPath, 'utf8');
navJs = navJs.replace(/\.catalog/g, '.menu');
fs.writeFileSync(navJsPath, navJs, 'utf8');
console.log('Fixed Nav.js');

// Fix MainMenu.js
let mainMenuJsPath = 'c:/Projects/TheBoxSync/Shop/frontend/src/layout/nav/main-catalog/MainMenu.js';
let mainMenuJs = fs.readFileSync(mainMenuJsPath, 'utf8');
mainMenuJs = mainMenuJs.replace(/catalog-container/g, 'menu-container');
mainMenuJs = mainMenuJs.replace(/id="catalog"/g, 'id="menu"');
mainMenuJs = mainMenuJs.replace(/classNames\('catalog show'\)/g, "classNames('menu show')");
fs.writeFileSync(mainMenuJsPath, mainMenuJs, 'utf8');
console.log('Fixed MainMenu.js');

// Fix SidebarMenu.js
let sidebarMenuJsPath = 'c:/Projects/TheBoxSync/Shop/frontend/src/layout/nav/sidebar-catalog/SidebarMenu.js';
if (fs.existsSync(sidebarMenuJsPath)) {
  let sidebarMenuJs = fs.readFileSync(sidebarMenuJsPath, 'utf8');
  sidebarMenuJs = sidebarMenuJs.replace(/catalog-container/g, 'menu-container');
  sidebarMenuJs = sidebarMenuJs.replace(/id="catalog"/g, 'id="menu"');
  sidebarMenuJs = sidebarMenuJs.replace(/classNames\('catalog show'\)/g, "classNames('menu show')");
  fs.writeFileSync(sidebarMenuJsPath, sidebarMenuJs, 'utf8');
  console.log('Fixed SidebarMenu.js');
}

// Replace dish->item and menu->catalog in public/css/main.css
let mainCssPath = 'c:/Projects/TheBoxSync/Shop/frontend/public/css/main.css';
if (fs.existsSync(mainCssPath)) {
  let mainCss = fs.readFileSync(mainCssPath, 'utf8');
  mainCss = mainCss.replace(/pos-dish/g, 'pos-item');
  mainCss = mainCss.replace(/pos-menu/g, 'pos-catalog'); 
  fs.writeFileSync(mainCssPath, mainCss, 'utf8');
  console.log('Fixed main.css');
}
