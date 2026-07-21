// Centralized Header Script for TheBoxSync Landing Pages
(function() {
  const headerHtml = `
  <!-- Offcanvas Area Start -->
  <div class="fix-area">
    <div class="offcanvas__info">
      <div class="offcanvas__wrapper">
        <div class="offcanvas__content">
          <div class="offcanvas__top mb-5 d-flex justify-content-between align-items-center">
            <div class="offcanvas__logo">
              <a href="index.html"> <img src="assets/images/logo/logo-blue.svg" alt="logo-img" /> </a>
            </div>
            <div class="offcanvas__close">
              <button><i class="fas fa-times"></i></button>
            </div>
          </div>

          <div class="mobile-menu fix mb-3"></div>
          <div class="offcanvas__contact">
            <h4>Contact us</h4>
            <ul>
              <li class="d-flex align-items-center">
                <div class="offcanvas__contact-icon"><i class="fal fa-map-marker-alt"></i></div>
                <div class="offcanvas__contact-text">
                  <a target="_blank" href="#">4th cross Road, Jakkur Rd, Amrutahalli, Bengaluru, Karnataka 560064</a>
                </div>
              </li>
              <li class="d-flex align-items-center">
                <div class="offcanvas__contact-icon mr-15"><i class="fal fa-envelope"></i></div>
                <div class="offcanvas__contact-text">
                  <a href="mailto:support@theboxsync.com"><span class="mailto:support@theboxsync.com">support@theboxsync.com</span></a>
                </div>
              </li>
              <li class="d-flex align-items-center">
                <div class="offcanvas__contact-icon mr-15"><i class="far fa-phone"></i></div>
                <div class="offcanvas__contact-text"><a href="tel:9898869160">+91 9898869160</a></div>
              </li>
            </ul>
            <div class="header-button mt-4">
              <a href="contact.html" class="theme-btn text-center">
                <span>Get A Quote<i class="fa-solid fa-arrow-right-long"></i></span>
              </a>
            </div>
            <div class="social-icon d-flex align-items-center">
              <a href="#"><i class="fab fa-facebook-f"></i></a> <a href="#"><i class="fab fa-twitter"></i></a>
              <a href="#"><i class="fab fa-youtube"></i></a> <a href="#"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="offcanvas__overlay"></div>

  <!-- Header Section Start -->
  <header class="header-section-1">
    <div id="header-sticky" class="header-1">
      <div class="container">
        <div class="mega-menu-wrapper">
          <div class="header-main">
            <div class="header-left">
              <div class="logo">
                <a href="index.html" class="header-logo"> <img src="assets/images/logo/logo-blue.svg" alt="logo-img" />
                </a>
              </div>
            </div>
            <div class="header-middle">
              <div class="mean__menu-wrapper">
                <div class="main-menu">
                  <nav id="mobile-menu">
                    <ul>
                      <li class="has-dropdown menu-thumb"><a href="index.html"> Home </a></li>
                      <li class="has-dropdown d-xl-none"><a href="index.html" class="border-none"> Home </a></li>
                      <li class="has-dropdown">
                        <a href="#"> Our Products <i class="fas fa-angle-down"></i> </a>
                        <ul class="submenu">
                          <li><a href="restaurant-management.html">Restaurant Management</a></li>
                          <li><a href="street-food.html">Street Food Management</a></li>
                          <li><a href="hotel-management.html">Hotel Management</a></li>
                          <li><a href="payroll.html">Payroll Management</a></li>
                          <li><a href="safarplug.html">Safarplug</a></li>
                        </ul>
                      </li>
                      <li class="has-dropdown">
                        <a href="#"> Outlet types <i class="fas fa-angle-down"></i> </a>
                        <ul class="submenu">
                          <li class="has-dropdown"><a href="finedine.html"> Fine dine </a></li>
                          <li class="has-dropdown"><a href="qsr.html"> QSR </a></li>
                          <li><a href="cafe.html">Cafe</a></li>
                          <li><a href="food-court.html">Food court</a></li>
                          <li><a href="cloud-kitchen.html">Cloud kitchen</a></li>
                          <li><a href="icecream-dessert.html">Ice cream &amp; desserts</a></li>
                          <li><a href="bakery.html">Bakery</a></li>
                          <li><a href="brewery.html">brewery</a></li>
                          <li><a href="pizzeria.html">Pizzeria</a></li>
                        </ul>
                      </li>
                      <li class="has-dropdown">
                        <a href="#"> Pricing <i class="fas fa-angle-down"></i> </a>
                        <ul class="submenu">
                          <li><a href="pricing.html">Restaurant Pricing</a></li>
                          <li><a href="pricing-street-food.html">Street Food Pricing</a></li>
                          <li><a href="pricing-payroll.html">Payroll Pricing</a></li>
                        </ul>
                      </li>
                      <li class="has-dropdown">
                        <a href="#"> Resources <i class="fas fa-angle-down"></i> </a>
                        <ul class="submenu">
                          <li><a href="about.html">About us</a></li>
                          <li><a href="support.html">Support</a></li>
                        </ul>
                      </li>
                      <li><a href="contact.html">Contact Us</a></li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
            <div class="header-right d-flex justify-content-end align-items-center">
              <div class="header-button ms-4">
                <a href="contact.html" class="theme-btn">
                  <span> Book a Demo <i class="fa-solid fa-arrow-right-long"></i> </span>
                </a>
              </div>
              <div class="header__hamburger d-block d-xl-none my-auto">
                <div class="sidebar__toggle"><i class="fas fa-bars"></i></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
  `;

  document.write(headerHtml);

  // Set active class dynamically based on current page URL
  const currentUrl = window.location.pathname.split('/').pop() || 'index.html';
  
  document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('#mobile-menu a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentUrl) {
        link.classList.add('active');
        // Add active class to parent links in case of dropdown menus
        let parentLi = link.closest('.has-dropdown');
        while (parentLi) {
          const parentLink = parentLi.querySelector('a');
          if (parentLink && parentLink !== link) {
            parentLink.classList.add('active');
          }
          parentLi = parentLi.parentElement.closest('.has-dropdown');
        }
      }
    });
  });
})();
