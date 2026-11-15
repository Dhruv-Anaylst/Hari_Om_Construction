(function () {
  var page = document.body.getAttribute("data-page") || "home";
  var navigation = [
    ["Company", "about.html", "about"],
    ["Services", "services.html", "services"],
    ["Projects", "projects.html", "projects"],
    ["Quality & safety", "quality.html", "quality"],
    ["Gallery", "gallery.html", "gallery"],
    ["Careers", "careers.html", "careers"],
    ["Contact", "contact.html", "contact"]
  ];
  var mark = '<span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span class="brand-copy"><strong>HARI OM</strong><small>CONSTRUCTION</small></span>';
  var header = document.querySelector(".site-header");
  var footer = document.querySelector(".site-footer");

  if (header) {
    header.innerHTML = '<a class="brand" href="index.html" aria-label="Hari Om Construction home">' + mark + '</a>' +
      '<button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button>' +
      '<nav class="main-nav" aria-label="Main navigation">' + navigation.map(function (item) {
        return '<a href="' + item[1] + '"' + (page === item[2] ? ' aria-current="page"' : '') + '>' + item[0] + '</a>';
      }).join("") + '</nav><a class="nav-cta" href="contact.html">Discuss a project <span aria-hidden="true">↗</span></a>';
  }

  if (footer) {
    footer.innerHTML = '<div class="footer-main">' +
      '<div class="footer-brand-area"><a class="brand footer-brand" href="index.html" aria-label="Hari Om Construction home">' + mark + '</a>' +
      '<p>Pipeline infrastructure, City Gas Distribution, and dependable field teams for projects across India.</p>' +
      '<a class="footer-phone" href="tel:+919717022779">+91 97170 22779 ↗</a></div>' +
      '<nav class="footer-column" aria-label="Company links"><h2>Company</h2><a href="about.html">About us</a><a href="quality.html">Quality &amp; safety</a><a href="careers.html">Careers</a></nav>' +
      '<nav class="footer-column" aria-label="Services links"><h2>Services</h2><a href="services.html">Our services</a><a href="projects.html">Project scopes</a><a href="gallery.html">Project gallery</a></nav>' +
      '<div class="footer-column footer-contact-column"><h2>Contact</h2><a href="contact.html">Talk to our team</a><p>Shop No-17, Pocket-18,<br>Sector-24, Rohini,<br>Delhi-110085</p><a href="https://tools.hariomconstruction.in" target="_blank" rel="noopener">Office tools ↗</a></div>' +
      '</div><div class="footer-bottom"><span>© <span data-current-year></span> Hari Om Construction. All rights reserved.</span><span>Delhi · India</span></div>' +
      '<p class="footer-credit">Website developed and maintained by Hari Om Projects in collaboration with Dhruv Agnihotri.</p>';
  }

  var menuButton = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(function (node) {
    node.textContent = new Date().getFullYear();
  });

  document.querySelectorAll("form[data-wa-form], #enquiry-form").forEach(function (formElement) {
    formElement.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = new FormData(formElement);
      var lines = ["Hari Om Construction enquiry"];
      form.forEach(function (value, key) {
        if (String(value).trim()) lines.push(key.replace(/[_-]/g, " ").replace(/^./, function (letter) { return letter.toUpperCase(); }) + ": " + value);
      });
      window.open("https://wa.me/919717022779?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
    });
  });
})();
